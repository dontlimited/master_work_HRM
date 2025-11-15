import request from 'supertest';
import app from '../../app';
import { factory } from '../factories';
import { testPrisma } from '../setupTestEnv';
import { Role } from '@prisma/client';
import { getAdminToken, getHRToken, getEmployeeToken } from '../helpers/auth';

describe('Users API', () => {
  let adminUser: any;
  let hrUser: any;
  let employeeUser: any;
  let adminToken: string;
  let hrToken: string;
  let employeeToken: string;

  beforeAll(async () => {
    // Create test users for auth
    adminUser = await factory.user({ role: Role.ADMIN });
    hrUser = await factory.user({ role: Role.HR });
    employeeUser = await factory.user({ role: Role.EMPLOYEE });
    adminToken = getAdminToken(adminUser.id);
    hrToken = getHRToken(hrUser.id);
    employeeToken = getEmployeeToken(employeeUser.id);
  });

  describe('POST /api/v1/users/login', () => {
    it('should login with valid credentials', async () => {
      const user = await factory.user({ 
        email: 'login@test.com',
        password: await require('bcrypt').hash('Password123!', 10)
      });
      
      // Note: We need to use actual password that was hashed
      // In real scenario, we'd seed with known password
      // For now, we'll create user and test with known password
      const password = 'TestPassword123!';
      const hashedPassword = await require('bcrypt').hash(password, 10);
      const testUser = await testPrisma.user.create({
        data: {
          email: 'logintest@test.com',
          password: hashedPassword,
          firstName: 'Test',
          lastName: 'User',
          role: Role.EMPLOYEE
        }
      });

      const res = await request(app)
        .post('/api/v1/users/login')
        .send({ email: 'logintest@test.com', password });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('user');
      expect(res.body.user.email).toBe('logintest@test.com');
    });

    it('should return 401 with invalid email', async () => {
      const res = await request(app)
        .post('/api/v1/users/login')
        .send({ email: 'nonexistent@test.com', password: 'Password123!' });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Invalid credentials');
    });

    it('should return 401 with invalid password', async () => {
      const user = await factory.user({ email: 'passwordtest@test.com' });
      
      const res = await request(app)
        .post('/api/v1/users/login')
        .send({ email: 'passwordtest@test.com', password: 'WrongPassword' });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Invalid credentials');
    });

    it('should return 400 with invalid email format', async () => {
      const res = await request(app)
        .post('/api/v1/users/login')
        .send({ email: 'invalid-email', password: 'Password123!' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    it('should return 400 with missing fields', async () => {
      const res = await request(app)
        .post('/api/v1/users/login')
        .send({ email: 'test@test.com' });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/v1/users/register', () => {
    it('should register user as ADMIN', async () => {
      const res = await request(app)
        .post('/api/v1/users/register')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: `register-${Date.now()}@test.com`,
          password: 'Password123!',
          firstName: 'New',
          lastName: 'User',
          role: 'EMPLOYEE'
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('email');
    });

    it('should register user as HR', async () => {
      const res = await request(app)
        .post('/api/v1/users/register')
        .set('Authorization', `Bearer ${hrToken}`)
        .send({
          email: `register-hr-${Date.now()}@test.com`,
          password: 'Password123!',
          firstName: 'HR',
          lastName: 'User'
        });

      expect(res.status).toBe(201);
    });

    it('should return 403 when EMPLOYEE tries to register', async () => {
      const res = await request(app)
        .post('/api/v1/users/register')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          email: 'employee-register@test.com',
          password: 'Password123!',
          firstName: 'Test',
          lastName: 'User'
        });

      expect(res.status).toBe(403);
    });

    it('should return 401 without token', async () => {
      const res = await request(app)
        .post('/api/v1/users/register')
        .send({
          email: 'no-auth@test.com',
          password: 'Password123!',
          firstName: 'Test',
          lastName: 'User'
        });

      expect(res.status).toBe(401);
    });

    it('should return 409 with duplicate email', async () => {
      const email = `duplicate-${Date.now()}@test.com`;
      await factory.user({ email });

      const res = await request(app)
        .post('/api/v1/users/register')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email,
          password: 'Password123!',
          firstName: 'Test',
          lastName: 'User'
        });

      expect(res.status).toBe(409);
    });

    it('should return 400 with invalid data', async () => {
      const res = await request(app)
        .post('/api/v1/users/register')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'invalid-email',
          password: '123', // too short
          firstName: '',
          lastName: ''
        });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/v1/users/me', () => {
    it('should return current user with valid token', async () => {
      const res = await request(app)
        .get('/api/v1/users/me')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('email');
      expect(res.body).toHaveProperty('role');
      expect(res.body.id).toBe(adminUser.id);
    });

    it('should return 401 without token', async () => {
      const res = await request(app)
        .get('/api/v1/users/me');

      expect(res.status).toBe(401);
    });

    it('should return 401 with invalid token', async () => {
      const res = await request(app)
        .get('/api/v1/users/me')
        .set('Authorization', 'Bearer invalid-token');

      expect(res.status).toBe(401);
    });
  });
});

