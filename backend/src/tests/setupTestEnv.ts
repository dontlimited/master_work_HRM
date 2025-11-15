import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';
import * as path from 'path';

// Load test environment variables
const envPath = path.resolve(__dirname, '../../.env.test');
config({ path: envPath });

// Also load .env if exists (fallback)
config({ path: path.resolve(__dirname, '../../.env') });

// Ensure test database URL is set
if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set in .env.test');
}

// Export test Prisma client
export const testPrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

// Helper to truncate all tables (faster than deleteMany)
async function truncateAllTables() {
  // Delete in reverse order of dependencies
  // Use deleteMany instead of truncate to avoid foreign key issues
  try {
    await testPrisma.feedbackResponse.deleteMany();
    await testPrisma.feedbackQuestion.deleteMany();
    await testPrisma.feedbackCycle.deleteMany();
    await testPrisma.review.deleteMany();
    await testPrisma.goal.deleteMany();
    await testPrisma.certification.deleteMany();
    await testPrisma.enrollment.deleteMany();
    await testPrisma.course.deleteMany();
    await testPrisma.interview.deleteMany();
    await testPrisma.candidate.deleteMany();
    await testPrisma.vacancy.deleteMany();
    await testPrisma.timeEntry.deleteMany();
    await testPrisma.document.deleteMany();
    await testPrisma.leaveRequest.deleteMany();
    await testPrisma.attendance.deleteMany();
    await testPrisma.employmentEvent.deleteMany();
    await testPrisma.employee.deleteMany();
    await testPrisma.position.deleteMany();
    await testPrisma.department.deleteMany();
    await testPrisma.user.deleteMany();
    await testPrisma.metricSnapshot.deleteMany();
  } catch (error) {
    // Ignore errors - tables might not exist
    console.warn('Error cleaning tables:', error);
  }
}

// Setup before all tests
beforeAll(async () => {
  // Ensure database is in sync (optional - use if needed)
  // await testPrisma.$executeRawUnsafe('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";');
});

// Clean up after all tests
afterAll(async () => {
  await testPrisma.$disconnect();
});

// Clean database before each test (isolation)
beforeEach(async () => {
  await truncateAllTables();
});

// Optional: clean up after each test (if needed)
afterEach(async () => {
  // Additional cleanup if needed
});
