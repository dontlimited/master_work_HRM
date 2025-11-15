import request from 'supertest';
import app from '../../app';
import { factory } from '../factories';
import { Role, LeaveStatus } from '@prisma/client';
import { getAdminToken, getHRToken, getEmployeeToken } from '../helpers/auth';

describe('Time Tracking API', () => {
  let adminToken: string;
  let hrToken: string;
  let employeeToken: string;
  let testEmployee: any;

  beforeAll(async () => {
    const adminUser = await factory.user({ role: Role.ADMIN });
    const hrUser = await factory.user({ role: Role.HR });
    const employeeUser = await factory.user({ role: Role.EMPLOYEE });
    adminToken = getAdminToken(adminUser.id);
    hrToken = getHRToken(hrUser.id);
    employeeToken = getEmployeeToken(employeeUser.id);
    testEmployee = await factory.employee({ userId: employeeUser.id });
  });

  describe('POST /api/v1/time/attendance', () => {
    it('should mark attendance', async () => {
      const res = await request(app)
        .post('/api/v1/time/attendance')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          employeeId: testEmployee.id,
          date: new Date().toISOString(),
          status: 'PRESENT'
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
    });

    it('should return 400 with invalid status', async () => {
      const res = await request(app)
        .post('/api/v1/time/attendance')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          employeeId: testEmployee.id,
          date: new Date().toISOString(),
          status: 'INVALID'
        });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/v1/time/attendance', () => {
    it('should list attendance records', async () => {
      await factory.attendance({ employeeId: testEmployee.id });

      const res = await request(app)
        .get('/api/v1/time/attendance')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('POST /api/v1/time/leave', () => {
    it('should create leave request', async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 1);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 5);

      const res = await request(app)
        .post('/api/v1/time/leave')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          employeeId: testEmployee.id,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          reason: 'Vacation'
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.status).toBe(LeaveStatus.PENDING);
    });
  });

  describe('POST /api/v1/time/leave/:id/approve', () => {
    it('should approve leave request as ADMIN', async () => {
      const leaveRequest = await factory.leaveRequest({ employeeId: testEmployee.id });

      const res = await request(app)
        .post(`/api/v1/time/leave/${leaveRequest.id}/approve`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.status).toBe(LeaveStatus.APPROVED);
    });

    it('should return 403 when EMPLOYEE tries to approve', async () => {
      const leaveRequest = await factory.leaveRequest({ employeeId: testEmployee.id });

      const res = await request(app)
        .post(`/api/v1/time/leave/${leaveRequest.id}/approve`)
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('POST /api/v1/time/entries', () => {
    it('should create time entry', async () => {
      const date = new Date();
      const startTime = new Date(date);
      startTime.setHours(9, 0, 0, 0);
      const endTime = new Date(date);
      endTime.setHours(18, 0, 0, 0);

      const res = await request(app)
        .post('/api/v1/time/entries')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          employeeId: testEmployee.id,
          date: date.toISOString(),
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString()
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
    });
  });

  describe('GET /api/v1/time/entries', () => {
    it('should list time entries', async () => {
      await factory.timeEntry({ employeeId: testEmployee.id });

      const res = await request(app)
        .get('/api/v1/time/entries')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });
});

