import jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';

const JWT_SECRET = process.env.JWT_SECRET || 'test-secret';

export interface TestUserPayload {
  userId: string;
  role: Role;
}

export function generateTestToken(payload: TestUserPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
}

export function getAuthHeader(token: string): { Authorization: string } {
  return { Authorization: `Bearer ${token}` };
}

export function getAdminToken(userId: string): string {
  return generateTestToken({ userId, role: Role.ADMIN });
}

export function getHRToken(userId: string): string {
  return generateTestToken({ userId, role: Role.HR });
}

export function getEmployeeToken(userId: string): string {
  return generateTestToken({ userId, role: Role.EMPLOYEE });
}

export function getCandidateToken(userId: string): string {
  return generateTestToken({ userId, role: Role.CANDIDATE });
}

