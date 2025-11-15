import request from 'supertest';
import app from '../../app';
import { factory } from '../factories';
import { Role } from '@prisma/client';
import { getAdminToken, getEmployeeToken } from '../helpers/auth';

describe('Analytics API', () => {
  let adminToken: string;
  let employeeToken: string;

  beforeAll(async () => {
    const adminUser = await factory.user({ role: Role.ADMIN });
    const employeeUser = await factory.user({ role: Role.EMPLOYEE });
    adminToken = getAdminToken(adminUser.id);
    employeeToken = getEmployeeToken(employeeUser.id);

    // Seed test data
    await factory.employee();
    await factory.employee();
    await factory.vacancy();
  });

  describe('GET /api/v1/analytics/summary', () => {
    it('should return summary statistics as ADMIN', async () => {
      const res = await request(app)
        .get('/api/v1/analytics/summary')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('employees');
      expect(res.body).toHaveProperty('openVacancies');
      expect(typeof res.body.employees).toBe('number');
      expect(typeof res.body.openVacancies).toBe('number');
    });

    it('should return 403 when EMPLOYEE tries to access', async () => {
      const res = await request(app)
        .get('/api/v1/analytics/summary')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.status).toBe(403);
    });

    it('should return 401 without token', async () => {
      const res = await request(app)
        .get('/api/v1/analytics/summary');

      expect(res.status).toBe(401);
    });
  });
});

