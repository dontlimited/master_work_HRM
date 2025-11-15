import request from 'supertest';
import app from '../../app';
import { factory } from '../factories';
import { Role } from '@prisma/client';
import { getAdminToken, getEmployeeToken } from '../helpers/auth';

describe('Performance API', () => {
  let adminToken: string;
  let employeeToken: string;
  let testEmployee: any;

  beforeAll(async () => {
    const adminUser = await factory.user({ role: Role.ADMIN });
    const employeeUser = await factory.user({ role: Role.EMPLOYEE });
    adminToken = getAdminToken(adminUser.id);
    employeeToken = getEmployeeToken(employeeUser.id);
    testEmployee = await factory.employee({ userId: employeeUser.id });
  });

  describe('GET /api/v1/performance/goals', () => {
    it('should list goals', async () => {
      await factory.goal({ employeeId: testEmployee.id });

      const res = await request(app)
        .get('/api/v1/performance/goals')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('POST /api/v1/performance/goals', () => {
    it('should create goal', async () => {
      const res = await request(app)
        .post('/api/v1/performance/goals')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          employeeId: testEmployee.id,
          title: `Goal-${Date.now()}`,
          description: 'Test goal',
          status: 'ACTIVE'
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
    });
  });

  describe('GET /api/v1/performance/feedback/cycles', () => {
    it('should list feedback cycles', async () => {
      await factory.feedbackCycle();

      const res = await request(app)
        .get('/api/v1/performance/feedback/cycles')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });
});

