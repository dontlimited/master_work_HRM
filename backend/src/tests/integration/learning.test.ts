import request from 'supertest';
import app from '../../app';
import { factory } from '../factories';
import { Role } from '@prisma/client';
import { getAdminToken, getEmployeeToken } from '../helpers/auth';

describe('Learning API', () => {
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

  describe('GET /api/v1/learning/courses', () => {
    it('should list courses', async () => {
      await factory.course();

      const res = await request(app)
        .get('/api/v1/learning/courses')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('POST /api/v1/learning/courses', () => {
    it('should create course as ADMIN', async () => {
      const res = await request(app)
        .post('/api/v1/learning/courses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: `Course-${Date.now()}`,
          description: 'Test course'
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
    });
  });

  describe('POST /api/v1/learning/enrollments', () => {
    it('should enroll employee in course', async () => {
      const course = await factory.course();

      const res = await request(app)
        .post('/api/v1/learning/enrollments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          courseId: course.id,
          employeeId: testEmployee.id
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
    });
  });

  describe('GET /api/v1/learning/certifications', () => {
    it('should list certifications', async () => {
      await factory.certification({ employeeId: testEmployee.id });

      const res = await request(app)
        .get('/api/v1/learning/certifications')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });
});

