import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../db/client';

// Courses
export async function listCourses(_req: Request, res: Response) {
  const items = await prisma.course.findMany();
  res.json(items);
}

const courseSchema = z.object({ title: z.string().min(1), description: z.string().optional() });
export async function createCourse(req: Request, res: Response) {
  const p = courseSchema.safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: p.error.flatten() });
  const created = await prisma.course.create({ data: p.data });
  res.status(201).json(created);
}
export async function updateCourse(req: Request, res: Response) {
  const p = courseSchema.partial().safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: p.error.flatten() });
  const updated = await prisma.course.update({ where: { id: req.params.id }, data: p.data });
  res.json(updated);
}
export async function deleteCourse(req: Request, res: Response) {
  await prisma.course.delete({ where: { id: req.params.id } });
  res.status(204).send();
}

// Enrollments
export async function listMyEnrollments(req: Request, res: Response) {
  const userId = (req as any).user?.userId as string;
  const employeeId = req.query.employeeId as string | undefined;
  const role = (req as any).user?.role as string;
  
  let targetEmployeeId: string | undefined;
  
  // If employeeId is provided and user is ADMIN/HR, use it; otherwise use current user's employeeId
  if (employeeId && (role === 'ADMIN' || role === 'HR')) {
    targetEmployeeId = employeeId;
  } else {
    const employee = await prisma.employee.findFirst({ where: { userId } });
    targetEmployeeId = employee?.id;
  }
  
  if (!targetEmployeeId) return res.json([]);
  
  const items = await prisma.enrollment.findMany({ 
    where: { employeeId: targetEmployeeId }, 
    include: { course: true } 
  });
  res.json(items);
}

const enrollSchema = z.object({ 
  courseId: z.string(),
  employeeId: z.string().optional() // Optional: for admin/HR to enroll other employees
});
export async function createEnrollment(req: Request, res: Response) {
  const userId = (req as any).user?.userId as string;
  const role = (req as any).user?.role as string;
  const p = enrollSchema.safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: p.error.flatten() });
  
  let targetEmployeeId: string;
  
  // If employeeId is provided and user is ADMIN/HR, use it; otherwise use current user's employeeId
  if (p.data.employeeId && (role === 'ADMIN' || role === 'HR')) {
    targetEmployeeId = p.data.employeeId;
  } else {
    const employee = await prisma.employee.findFirst({ where: { userId } });
    if (!employee) return res.status(400).json({ error: 'Employee profile required' });
    targetEmployeeId = employee.id;
  }
  
  // Check if enrollment already exists
  const existing = await prisma.enrollment.findFirst({
    where: { courseId: p.data.courseId, employeeId: targetEmployeeId },
  });
  if (existing) {
    return res.status(400).json({ error: 'Employee is already enrolled in this course' });
  }
  
  const created = await prisma.enrollment.create({ 
    data: { courseId: p.data.courseId, employeeId: targetEmployeeId },
    include: { course: true },
  });
  res.status(201).json(created);
}

const enrollmentUpdateSchema = z.object({ progress: z.number().min(0).max(100).optional(), completed: z.boolean().optional() });
export async function updateEnrollment(req: Request, res: Response) {
  const userId = (req as any).user?.userId as string;
  const employee = await prisma.employee.findFirst({ where: { userId } });
  const p = enrollmentUpdateSchema.safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: p.error.flatten() });
  const updated = await prisma.enrollment.update({
    where: { id: req.params.id },
    data: p.data
  });
  // simple guard: ensure owner or HR/Admin should be added in routes if needed
  if (employee && updated.employeeId !== employee.id) return res.status(403).json({ error: 'Forbidden' });
  res.json(updated);
}

export async function deleteEnrollment(req: Request, res: Response) {
  const userId = (req as any).user?.userId as string;
  const employee = await prisma.employee.findFirst({ where: { userId } });
  const enrollment = await prisma.enrollment.findUnique({ where: { id: req.params.id } });
  
  if (!enrollment) return res.status(404).json({ error: 'Enrollment not found' });
  
  // Allow users to delete their own enrollments, or ADMIN/HR to delete any
  const role = (req as any).user?.role as string;
  if (role !== 'ADMIN' && role !== 'HR' && employee && enrollment.employeeId !== employee.id) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  
  await prisma.enrollment.delete({ where: { id: req.params.id } });
  res.status(204).send();
}

// Certifications
export async function listMyCerts(req: Request, res: Response) {
  const userId = (req as any).user?.userId as string;
  const employee = await prisma.employee.findFirst({ where: { userId } });
  const items = await prisma.certification.findMany({ where: { employeeId: employee?.id } });
  res.json(items);
}

const certSchema = z.object({ employeeId: z.string(), name: z.string().min(1) });
export async function createCertification(req: Request, res: Response) {
  const p = certSchema.safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: p.error.flatten() });
  const created = await prisma.certification.create({ data: p.data });
  res.status(201).json(created);
}
export async function deleteCertification(req: Request, res: Response) {
  await prisma.certification.delete({ where: { id: req.params.id } });
  res.status(204).send();
}


