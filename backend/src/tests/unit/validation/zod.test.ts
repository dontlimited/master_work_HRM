import { z } from 'zod';

describe('Zod Validation Schemas', () => {
  describe('User Registration Schema', () => {
    const registerSchema = z.object({
      email: z.string().email(),
      password: z.string().min(8),
      firstName: z.string().min(1),
      lastName: z.string().min(1),
      role: z.enum(['ADMIN', 'HR', 'EMPLOYEE']).optional()
    });

    it('should validate valid registration data', () => {
      const valid = {
        email: 'test@example.com',
        password: 'Password123!',
        firstName: 'John',
        lastName: 'Doe'
      };

      expect(() => registerSchema.parse(valid)).not.toThrow();
    });

    it('should reject invalid email', () => {
      const invalid = {
        email: 'invalid-email',
        password: 'Password123!',
        firstName: 'John',
        lastName: 'Doe'
      };

      expect(() => registerSchema.parse(invalid)).toThrow();
    });

    it('should reject short password', () => {
      const invalid = {
        email: 'test@example.com',
        password: '123',
        firstName: 'John',
        lastName: 'Doe'
      };

      expect(() => registerSchema.parse(invalid)).toThrow();
    });

    it('should reject empty firstName', () => {
      const invalid = {
        email: 'test@example.com',
        password: 'Password123!',
        firstName: '',
        lastName: 'Doe'
      };

      expect(() => registerSchema.parse(invalid)).toThrow();
    });

    it('should accept valid role', () => {
      const valid = {
        email: 'test@example.com',
        password: 'Password123!',
        firstName: 'John',
        lastName: 'Doe',
        role: 'ADMIN' as const
      };

      expect(() => registerSchema.parse(valid)).not.toThrow();
    });

    it('should reject invalid role', () => {
      const invalid = {
        email: 'test@example.com',
        password: 'Password123!',
        firstName: 'John',
        lastName: 'Doe',
        role: 'INVALID' as any
      };

      expect(() => registerSchema.parse(invalid)).toThrow();
    });
  });

  describe('Employee Schema', () => {
    const employeeSchema = z.object({
      userId: z.string(),
      departmentId: z.string().optional(),
      positionId: z.string().optional(),
      managerId: z.string().optional()
    });

    it('should validate valid employee data', () => {
      const valid = {
        userId: 'user-id-123',
        departmentId: 'dept-id-123',
        positionId: 'pos-id-123'
      };

      expect(() => employeeSchema.parse(valid)).not.toThrow();
    });

    it('should require userId', () => {
      const invalid = {
        departmentId: 'dept-id-123'
      };

      expect(() => employeeSchema.parse(invalid)).toThrow();
    });

    it('should allow optional fields', () => {
      const valid = {
        userId: 'user-id-123'
      };

      expect(() => employeeSchema.parse(valid)).not.toThrow();
    });
  });

  describe('Department Schema', () => {
    const deptSchema = z.object({
      name: z.string().min(1),
      parentId: z.string().optional()
    });

    it('should validate valid department data', () => {
      const valid = {
        name: 'Engineering'
      };

      expect(() => deptSchema.parse(valid)).not.toThrow();
    });

    it('should reject empty name', () => {
      const invalid = {
        name: ''
      };

      expect(() => deptSchema.parse(invalid)).toThrow();
    });

    it('should allow parentId', () => {
      const valid = {
        name: 'Sub Department',
        parentId: 'parent-id-123'
      };

      expect(() => deptSchema.parse(valid)).not.toThrow();
    });
  });

  describe('Login Schema', () => {
    const loginSchema = z.object({
      email: z.string().email(),
      password: z.string().min(1)
    });

    it('should validate valid login data', () => {
      const valid = {
        email: 'test@example.com',
        password: 'anypassword'
      };

      expect(() => loginSchema.parse(valid)).not.toThrow();
    });

    it('should reject invalid email', () => {
      const invalid = {
        email: 'invalid',
        password: 'password'
      };

      expect(() => loginSchema.parse(invalid)).toThrow();
    });

    it('should reject empty password', () => {
      const invalid = {
        email: 'test@example.com',
        password: ''
      };

      expect(() => loginSchema.parse(invalid)).toThrow();
    });
  });
});

