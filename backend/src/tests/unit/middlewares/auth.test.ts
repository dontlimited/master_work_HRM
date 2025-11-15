import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { authenticate, authorize } from '../../../middlewares/auth';
import { Role } from '@prisma/client';

describe('Auth Middleware', () => {
  const JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    mockRequest = {
      headers: {}
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    nextFunction = jest.fn();
  });

  describe('authenticate', () => {
    it('should pass with valid token', () => {
      const token = jwt.sign({ userId: 'test-id', role: Role.ADMIN }, JWT_SECRET);
      mockRequest.headers = { authorization: `Bearer ${token}` };

      authenticate(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
      expect((mockRequest as any).user).toMatchObject({
        userId: 'test-id',
        role: Role.ADMIN
      });
    });

    it('should return 401 when token is missing', () => {
      mockRequest.headers = {};

      authenticate(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should return 401 when authorization header does not start with Bearer', () => {
      mockRequest.headers = { authorization: 'Token abc123' };

      authenticate(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should return 401 when token is invalid', () => {
      mockRequest.headers = { authorization: 'Bearer invalid-token' };

      authenticate(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Invalid token' });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should return 401 when token is expired', () => {
      const expiredToken = jwt.sign({ userId: 'test-id', role: Role.ADMIN }, JWT_SECRET, { expiresIn: '-1h' });
      mockRequest.headers = { authorization: `Bearer ${expiredToken}` };

      authenticate(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Invalid token' });
      expect(nextFunction).not.toHaveBeenCalled();
    });
  });

  describe('authorize', () => {
    it('should allow access when user has required role', () => {
      const authorizeAdmin = authorize([Role.ADMIN, Role.HR]);
      (mockRequest as any).user = { userId: 'test-id', role: Role.ADMIN };

      authorizeAdmin(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should deny access when user does not have required role', () => {
      const authorizeAdmin = authorize([Role.ADMIN]);
      (mockRequest as any).user = { userId: 'test-id', role: Role.EMPLOYEE };

      authorizeAdmin(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Forbidden' });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should deny access when user is not authenticated', () => {
      const authorizeAdmin = authorize([Role.ADMIN]);
      (mockRequest as any).user = undefined;

      authorizeAdmin(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Forbidden' });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should allow HR access when HR is in allowed roles', () => {
      const authorizeHR = authorize([Role.ADMIN, Role.HR]);
      (mockRequest as any).user = { userId: 'test-id', role: Role.HR };

      authorizeHR(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
    });
  });
});

