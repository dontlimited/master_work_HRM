import request from 'supertest';
import app from '../../app';
import { factory } from '../factories';
import { Role } from '@prisma/client';
import { getAdminToken, getHRToken, getEmployeeToken } from '../helpers/auth';

describe('Departments API', () => {
  let adminToken: string;
  let hrToken: string;
  let employeeToken: string;

  beforeAll(async () => {
    const adminUser = await factory.user({ role: Role.ADMIN });
    const hrUser = await factory.user({ role: Role.HR });
    const employeeUser = await factory.user({ role: Role.EMPLOYEE });
    adminToken = getAdminToken(adminUser.id);
    hrToken = getHRToken(hrUser.id);
    employeeToken = getEmployeeToken(employeeUser.id);
  });

  describe('GET /api/v1/departments', () => {
    it('should get departments list', async () => {
      await factory.department();
      await factory.department();

      const res = await request(app)
        .get('/api/v1/departments')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    it('should return 401 without token', async () => {
      const res = await request(app)
        .get('/api/v1/departments');

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/v1/departments/org', () => {
    it('should get organizational tree', async () => {
      const parent = await factory.department({ name: 'Parent Dept' });
      const child = await factory.department({ name: 'Child Dept', parentId: parent.id });

      const res = await request(app)
        .get('/api/v1/departments/org')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('POST /api/v1/departments', () => {
    it('should create department as ADMIN', async () => {
      const res = await request(app)
        .post('/api/v1/departments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: `Dept-${Date.now()}` });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('name');
    });

    it('should create department with parent', async () => {
      const parent = await factory.department();

      const res = await request(app)
        .post('/api/v1/departments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: `Child-${Date.now()}`, parentId: parent.id });

      expect(res.status).toBe(201);
      expect(res.body.parentId).toBe(parent.id);
    });

    it('should return 400 with invalid data', async () => {
      const res = await request(app)
        .post('/api/v1/departments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: '' });

      expect(res.status).toBe(400);
    });

    it('should return 403 when EMPLOYEE tries to create', async () => {
      const res = await request(app)
        .post('/api/v1/departments')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({ name: 'Test Dept' });

      expect(res.status).toBe(403);
    });
  });

  describe('PUT /api/v1/departments/:id', () => {
    it('should update department', async () => {
      const dept = await factory.department();
      const newName = `Updated-${Date.now()}`;

      const res = await request(app)
        .put(`/api/v1/departments/${dept.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: newName });

      expect(res.status).toBe(200);
      expect(res.body.name).toBe(newName);
    });

    it('should return 404 with non-existent id', async () => {
      const res = await request(app)
        .put('/api/v1/departments/non-existent-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Updated' });

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/v1/departments/:id', () => {
    it('should delete department', async () => {
      const dept = await factory.department();

      const res = await request(app)
        .delete(`/api/v1/departments/${dept.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(204);
    });
  });
});

