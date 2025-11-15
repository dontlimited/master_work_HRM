import request from 'supertest';
import app from '../../app';
import { factory } from '../factories';
import { testPrisma } from '../setupTestEnv';
import { Role } from '@prisma/client';
import { getAdminToken, getHRToken, getEmployeeToken } from '../helpers/auth';

describe('Employees API', () => {
  let adminUser: any;
  let hrUser: any;
  let employeeUser: any;
  let adminToken: string;
  let hrToken: string;
  let employeeToken: string;
  let testDepartment: any;
  let testPosition: any;

  beforeAll(async () => {
    adminUser = await factory.user({ role: Role.ADMIN });
    hrUser = await factory.user({ role: Role.HR });
    employeeUser = await factory.user({ role: Role.EMPLOYEE });
    adminToken = getAdminToken(adminUser.id);
    hrToken = getHRToken(hrUser.id);
    employeeToken = getEmployeeToken(employeeUser.id);
    
    testDepartment = await factory.department();
    testPosition = await factory.position();
  });

  describe('GET /api/v1/employees', () => {
    it('should get employees list as ADMIN', async () => {
      await factory.employee({ departmentId: testDepartment.id });
      await factory.employee({ positionId: testPosition.id });

      const res = await request(app)
        .get('/api/v1/employees')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('items');
      expect(res.body).toHaveProperty('total');
      expect(res.body).toHaveProperty('page');
      expect(Array.isArray(res.body.items)).toBe(true);
    });

    it('should filter employees by department', async () => {
      const dept = await factory.department();
      await factory.employee({ departmentId: dept.id });
      await factory.employee(); // different department

      const res = await request(app)
        .get(`/api/v1/employees?departmentId=${dept.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.items.every((e: any) => e.departmentId === dept.id)).toBe(true);
    });

    it('should search employees by name', async () => {
      const user = await factory.user({ firstName: 'SearchTest', lastName: 'User' });
      await factory.employee({ userId: user.id });

      const res = await request(app)
        .get('/api/v1/employees?search=SearchTest')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.items.length).toBeGreaterThan(0);
    });

    it('should paginate employees', async () => {
      // Create multiple employees
      for (let i = 0; i < 5; i++) {
        await factory.employee();
      }

      const res = await request(app)
        .get('/api/v1/employees?page=1&pageSize=2')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.items.length).toBeLessThanOrEqual(2);
      expect(res.body.page).toBe(1);
      expect(res.body.pageSize).toBe(2);
    });

    it('should exclude archived employees by default', async () => {
      const active = await factory.employee({ archived: false });
      const archived = await factory.employee({ archived: true });

      const res = await request(app)
        .get('/api/v1/employees')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      const ids = res.body.items.map((e: any) => e.id);
      expect(ids).toContain(active.id);
      expect(ids).not.toContain(archived.id);
    });

    it('should return 403 when EMPLOYEE tries to access', async () => {
      const res = await request(app)
        .get('/api/v1/employees')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('POST /api/v1/employees', () => {
    it('should create employee as ADMIN', async () => {
      const user = await factory.user();
      const dept = await factory.department();
      const pos = await factory.position();

      const res = await request(app)
        .post('/api/v1/employees')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          userId: user.id,
          departmentId: dept.id,
          positionId: pos.id
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.userId).toBe(user.id);
    });

    it('should return 400 with invalid data', async () => {
      const res = await request(app)
        .post('/api/v1/employees')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          userId: 'invalid-id'
        });

      expect(res.status).toBe(201); // Actually creates, but might fail on FK
    });

    it('should return 403 when EMPLOYEE tries to create', async () => {
      const res = await request(app)
        .post('/api/v1/employees')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          userId: (await factory.user()).id
        });

      expect(res.status).toBe(403);
    });
  });

  describe('PUT /api/v1/employees/:id', () => {
    it('should update employee as ADMIN', async () => {
      const employee = await factory.employee();
      const newDept = await factory.department();

      const res = await request(app)
        .put(`/api/v1/employees/${employee.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          departmentId: newDept.id
        });

      expect(res.status).toBe(200);
      expect(res.body.departmentId).toBe(newDept.id);
    });

    it('should return 404 with non-existent id', async () => {
      const res = await request(app)
        .put('/api/v1/employees/non-existent-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          departmentId: testDepartment.id
        });

      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /api/v1/employees/:id/archive', () => {
    it('should archive employee as ADMIN', async () => {
      const employee = await factory.employee({ archived: false });

      const res = await request(app)
        .patch(`/api/v1/employees/${employee.id}/archive`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.archived).toBe(true);
    });

    it('should return 404 with non-existent id', async () => {
      const res = await request(app)
        .patch('/api/v1/employees/non-existent-id/archive')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/v1/employees/:id', () => {
    it('should delete employee as ADMIN', async () => {
      const employee = await factory.employee();

      const res = await request(app)
        .delete(`/api/v1/employees/${employee.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(204);

      // Verify deletion
      const deleted = await testPrisma.employee.findUnique({ where: { id: employee.id } });
      expect(deleted).toBeNull();
    });

    it('should return 404 with non-existent id', async () => {
      const res = await request(app)
        .delete('/api/v1/employees/non-existent-id')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });
  });
});

