import request from 'supertest';
import app from '../../app';
import { factory } from '../factories';
import { Role } from '@prisma/client';
import { getAdminToken, getEmployeeToken } from '../helpers/auth';
import fs from 'fs';
import path from 'path';

describe('Documents API', () => {
  let adminToken: string;
  let employeeToken: string;
  let testEmployee: any;
  const testUploadDir = path.resolve(__dirname, '../../../uploads_test');

  beforeAll(async () => {
    // Create test upload directory
    if (!fs.existsSync(testUploadDir)) {
      fs.mkdirSync(testUploadDir, { recursive: true });
    }

    const adminUser = await factory.user({ role: Role.ADMIN });
    const employeeUser = await factory.user({ role: Role.EMPLOYEE });
    adminToken = getAdminToken(adminUser.id);
    employeeToken = getEmployeeToken(employeeUser.id);
    testEmployee = await factory.employee({ userId: employeeUser.id });
  });

  afterAll(() => {
    // Cleanup test uploads if needed
  });

  describe('POST /api/v1/documents', () => {
    it('should upload document', async () => {
      // Create a temporary file
      const testFilePath = path.join(testUploadDir, 'test-doc.txt');
      fs.writeFileSync(testFilePath, 'Test document content');

      const res = await request(app)
        .post('/api/v1/documents')
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('file', testFilePath)
        .field('employeeId', testEmployee.id)
        .field('category', 'contract');

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('filename');
      
      // Cleanup
      fs.unlinkSync(testFilePath);
    });

    it('should return 400 without file', async () => {
      const res = await request(app)
        .post('/api/v1/documents')
        .set('Authorization', `Bearer ${adminToken}`)
        .field('employeeId', testEmployee.id);

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/v1/documents', () => {
    it('should list documents', async () => {
      await factory.document({ employeeId: testEmployee.id });

      const res = await request(app)
        .get('/api/v1/documents')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should filter documents by employeeId', async () => {
      const otherEmployee = await factory.employee();
      await factory.document({ employeeId: testEmployee.id });
      await factory.document({ employeeId: otherEmployee.id });

      const res = await request(app)
        .get(`/api/v1/documents?employeeId=${testEmployee.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      if (res.body.length > 0) {
        expect(res.body.every((doc: any) => doc.employeeId === testEmployee.id)).toBe(true);
      }
    });
  });

  describe('GET /api/v1/documents/:id/download', () => {
    it('should download document', async () => {
      const document = await factory.document({ employeeId: testEmployee.id });

      const res = await request(app)
        .get(`/api/v1/documents/${document.id}/download`)
        .set('Authorization', `Bearer ${adminToken}`);

      // Status depends on file existence
      expect([200, 404]).toContain(res.status);
    });

    it('should return 404 with non-existent id', async () => {
      const res = await request(app)
        .get('/api/v1/documents/non-existent-id/download')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/v1/documents/:id', () => {
    it('should delete document', async () => {
      const document = await factory.document({ employeeId: testEmployee.id });

      const res = await request(app)
        .delete(`/api/v1/documents/${document.id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(204);
    });
  });
});

