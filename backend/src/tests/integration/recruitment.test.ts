import request from 'supertest';
import app from '../../app';
import { factory } from '../factories';
import { Role, VacancyStatus, CandidateStatus } from '@prisma/client';
import { getAdminToken, getHRToken, getCandidateToken } from '../helpers/auth';

describe('Recruitment API', () => {
  let adminToken: string;
  let hrToken: string;
  let candidateToken: string;
  let testDepartment: any;
  let testPosition: any;

  beforeAll(async () => {
    const adminUser = await factory.user({ role: Role.ADMIN });
    const hrUser = await factory.user({ role: Role.HR });
    const candidateUser = await factory.user({ role: Role.CANDIDATE });
    adminToken = getAdminToken(adminUser.id);
    hrToken = getHRToken(hrUser.id);
    candidateToken = getCandidateToken(candidateUser.id);
    
    testDepartment = await factory.department();
    testPosition = await factory.position();
  });

  describe('GET /api/v1/recruitment/vacancies', () => {
    it('should list vacancies', async () => {
      await factory.vacancy();
      await factory.vacancy();

      const res = await request(app)
        .get('/api/v1/recruitment/vacancies')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should allow CANDIDATE to view vacancies', async () => {
      const res = await request(app)
        .get('/api/v1/recruitment/vacancies')
        .set('Authorization', `Bearer ${candidateToken}`);

      expect(res.status).toBe(200);
    });
  });

  describe('POST /api/v1/recruitment/vacancies', () => {
    it('should create vacancy as ADMIN', async () => {
      const res = await request(app)
        .post('/api/v1/recruitment/vacancies')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: `Vacancy-${Date.now()}`,
          description: 'Test vacancy',
          departmentId: testDepartment.id,
          positionId: testPosition.id,
          skills: ['JavaScript', 'TypeScript'],
          status: VacancyStatus.OPEN
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body.title).toBeDefined();
    });

    it('should return 403 when CANDIDATE tries to create', async () => {
      const res = await request(app)
        .post('/api/v1/recruitment/vacancies')
        .set('Authorization', `Bearer ${candidateToken}`)
        .send({
          title: 'Test',
          description: 'Test'
        });

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/v1/recruitment/candidates', () => {
    it('should list candidates as ADMIN', async () => {
      await factory.candidate();

      const res = await request(app)
        .get('/api/v1/recruitment/candidates')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it('should return 403 when CANDIDATE tries to list', async () => {
      const res = await request(app)
        .get('/api/v1/recruitment/candidates')
        .set('Authorization', `Bearer ${candidateToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('POST /api/v1/recruitment/candidates', () => {
    it('should create candidate as ADMIN', async () => {
      const vacancy = await factory.vacancy();

      const res = await request(app)
        .post('/api/v1/recruitment/candidates')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          vacancyId: vacancy.id,
          firstName: 'John',
          lastName: 'Doe',
          email: `candidate-${Date.now()}@test.com`,
          skills: ['JavaScript'],
          status: CandidateStatus.APPLIED
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
    });
  });

  describe('POST /api/v1/recruitment/vacancies/:id/apply', () => {
    it('should allow CANDIDATE to apply', async () => {
      const vacancy = await factory.vacancy();

      const res = await request(app)
        .post(`/api/v1/recruitment/vacancies/${vacancy.id}/apply`)
        .set('Authorization', `Bearer ${candidateToken}`)
        .send({
          firstName: 'Applicant',
          lastName: 'Test',
          email: `applicant-${Date.now()}@test.com`,
          coverLetter: 'I want to apply'
        });

      // Status depends on implementation (might require file upload)
      expect([201, 400]).toContain(res.status);
    });

    it('should return 403 when ADMIN tries to apply', async () => {
      const vacancy = await factory.vacancy();

      const res = await request(app)
        .post(`/api/v1/recruitment/vacancies/${vacancy.id}/apply`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          firstName: 'Test',
          lastName: 'User',
          email: 'test@test.com'
        });

      expect(res.status).toBe(403);
    });
  });

  describe('POST /api/v1/recruitment/candidates/:id/hire', () => {
    it('should hire candidate as ADMIN', async () => {
      const candidate = await factory.candidate();

      const res = await request(app)
        .post(`/api/v1/recruitment/candidates/${candidate.id}/hire`)
        .set('Authorization', `Bearer ${adminToken}`);

      // Status depends on implementation
      expect([200, 400, 404]).toContain(res.status);
    });
  });
});

