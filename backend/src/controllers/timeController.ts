import { Request, Response } from 'express';
import { prisma } from '../db/client';
import { z } from 'zod';
import { notify } from '../services/notificationService';

export async function listAttendance(req: Request, res: Response) {
  const requester = (req as any).user as { userId: string; role: string };
  const employeeIdParam = req.query.employeeId as string | undefined;
  const targetUserId = (req.query.userId as string | undefined) && (['ADMIN','HR'].includes(requester.role) ? (req.query.userId as string) : requester.userId);
  const userId = targetUserId || requester.userId;
  const employee = employeeIdParam && ['ADMIN','HR'].includes(requester.role)
    ? await prisma.employee.findUnique({ where: { id: employeeIdParam } })
    : await prisma.employee.findFirst({ where: { userId } });
  const { month, year } = req.query as { month?: string; year?: string };
  let where: any = { employeeId: employee?.id };
  if (month && year) {
    const m = Number(month) - 1;
    const y = Number(year);
    const start = new Date(y, m, 1);
    const end = new Date(y, m + 1, 0, 23, 59, 59, 999);
    where.date = { gte: start, lte: end };
  }
  const attendance = await prisma.attendance.findMany({ where });
  res.json(attendance);
}

const attendanceSchema = z.object({ date: z.string(), status: z.enum(['PRESENT', 'ABSENT', 'SICK', 'VACATION']) });
export async function markAttendance(req: Request, res: Response) {
  const requester = (req as any).user as { userId: string; role: string };
  // Allow HR/ADMIN to set for another target by passing userId or employeeId
  const bodyUserId = (req.body?.userId as string | undefined);
  const bodyEmployeeId = (req.body?.employeeId as string | undefined);
  const targetByEmployee = bodyEmployeeId && ['ADMIN','HR'].includes(requester.role);
  const targetUserId = bodyUserId && ['ADMIN','HR'].includes(requester.role) ? bodyUserId : requester.userId;
  let employee = targetByEmployee
    ? await prisma.employee.findUnique({ where: { id: bodyEmployeeId! } })
    : await prisma.employee.findFirst({ where: { userId: targetUserId } });
  // Auto-provision employee profile if missing (only when targeting by user)
  if (!employee && !targetByEmployee) {
    const user = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!user) return res.status(400).json({ error: 'User not found' });
    employee = await prisma.employee.create({ data: { userId: targetUserId } });
  }
  const parsed = attendanceSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const day = new Date(parsed.data.date);
  const normalized = new Date(day.getFullYear(), day.getMonth(), day.getDate());
  const upserted = await prisma.attendance.upsert({
    where: { employeeId_date: { employeeId: employee!.id, date: normalized } },
    update: { status: parsed.data.status },
    create: { employeeId: employee!.id, date: normalized, status: parsed.data.status }
  });
  res.status(201).json(upserted);
}

export async function listLeaves(req: Request, res: Response) {
  const requester = (req as any).user as { userId: string; role: string };
  const employeeIdParam = req.query.employeeId as string | undefined;
  const targetUserId = (req.query.userId as string | undefined) && (['ADMIN','HR'].includes(requester.role) ? (req.query.userId as string) : requester.userId);
  const userId = targetUserId || requester.userId;
  const employee = employeeIdParam && ['ADMIN','HR'].includes(requester.role)
    ? await prisma.employee.findUnique({ where: { id: employeeIdParam } })
    : await prisma.employee.findFirst({ where: { userId } });
  const leaves = await prisma.leaveRequest.findMany({ where: { employeeId: employee?.id }, orderBy: { startDate: 'desc' } });
  res.json(leaves);
}

const leaveSchema = z.object({ startDate: z.string(), endDate: z.string(), reason: z.string().optional() });
export async function requestLeave(req: Request, res: Response) {
  const userId = (req as any).user?.userId as string;
  const employee = await prisma.employee.findFirst({ where: { userId } });
  if (!employee) return res.status(400).json({ error: 'Employee profile required' });
  const parsed = leaveSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const start = new Date(parsed.data.startDate);
  const end = new Date(parsed.data.endDate);
  const created = await prisma.leaveRequest.create({ data: { employeeId: employee.id, startDate: start, endDate: end, reason: parsed.data.reason } });
  // Pre-fill attendance as SICK for each day in range (pending state reflected by leave status)
  const cur = new Date(start);
  while (cur <= end) {
    const normalized = new Date(cur.getFullYear(), cur.getMonth(), cur.getDate());
    await prisma.attendance.upsert({
      where: { employeeId_date: { employeeId: employee.id, date: normalized } },
      update: { status: 'SICK' },
      create: { employeeId: employee.id, date: normalized, status: 'SICK' }
    });
    cur.setDate(cur.getDate() + 1);
  }
  res.status(201).json(created);
}

export async function approveLeave(req: Request, res: Response) {
  const approverUserId = (req as any).user?.userId as string;
  const approver = await prisma.employee.findFirst({ where: { userId: approverUserId } });
  const { id } = req.params;
  const updated = await prisma.leaveRequest.update({ where: { id }, data: { status: 'APPROVED', approverId: approver?.id } });
  await notify({ type: 'LEAVE_APPROVED', payload: { leaveId: id } });
  res.json(updated);
}

export async function listEmploymentHistory(req: Request, res: Response) {
  const requester = (req as any).user as { userId: string; role: string };
  const employeeIdParam = req.query.employeeId as string | undefined;
  const targetUserId = (req.query.userId as string | undefined) && (['ADMIN','HR'].includes(requester.role) ? (req.query.userId as string) : requester.userId);
  const userId = targetUserId || requester.userId;
  const employee = employeeIdParam && ['ADMIN','HR'].includes(requester.role)
    ? await prisma.employee.findUnique({ where: { id: employeeIdParam } })
    : await prisma.employee.findFirst({ where: { userId } });
  const events = await prisma.employmentEvent.findMany({ where: { employeeId: employee?.id }, orderBy: { date: 'desc' } });
  res.json(events);
}

export async function clearAttendance(req: Request, res: Response) {
  const requester = (req as any).user as { userId: string; role: string };
  const employeeIdParam = req.query.employeeId as string | undefined;
  const targetUserId = (req.query.userId as string | undefined) && (['ADMIN','HR'].includes(requester.role) ? (req.query.userId as string) : requester.userId);
  const userId = targetUserId || requester.userId;
  const employee = employeeIdParam && ['ADMIN','HR'].includes(requester.role)
    ? await prisma.employee.findUnique({ where: { id: employeeIdParam } })
    : await prisma.employee.findFirst({ where: { userId } });
  if (!employee) return res.status(400).json({ error: 'Employee profile required' });
  await prisma.attendance.deleteMany({ where: { employeeId: employee.id } });
  res.status(204).send();
}

export async function listTimeEntries(req: Request, res: Response) {
  const requester = (req as any).user as { userId: string; role: string };
  const employeeIdParam = req.query.employeeId as string | undefined;
  const targetUserId = (req.query.userId as string | undefined) && (['ADMIN','HR'].includes(requester.role) ? (req.query.userId as string) : requester.userId);
  const userId = targetUserId || requester.userId;
  const employee = employeeIdParam && ['ADMIN','HR'].includes(requester.role)
    ? await prisma.employee.findUnique({ where: { id: employeeIdParam } })
    : await prisma.employee.findFirst({ where: { userId } });
  const entries = await prisma.timeEntry.findMany({ where: { employeeId: employee?.id }, orderBy: { date: 'desc' } });
  res.json(entries);
}

const timeEntrySchema = z.object({ date: z.string(), startTime: z.string(), endTime: z.string(), userId: z.string().optional(), employeeId: z.string().optional() });
export async function createTimeEntry(req: Request, res: Response) {
  const requester = (req as any).user as { userId: string; role: string };
  const data = timeEntrySchema.safeParse(req.body);
  if (!data.success) return res.status(400).json({ error: data.error.flatten() });
  const body = data.data;
  const targetByEmployee = body.employeeId && ['ADMIN','HR'].includes(requester.role);
  const targetUserId = body.userId && ['ADMIN','HR'].includes(requester.role) ? body.userId : requester.userId;
  let employee = targetByEmployee
    ? await prisma.employee.findUnique({ where: { id: body.employeeId! } })
    : await prisma.employee.findFirst({ where: { userId: targetUserId } });
  if (!employee && !targetByEmployee) {
    const user = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!user) return res.status(400).json({ error: 'User not found' });
    employee = await prisma.employee.create({ data: { userId: targetUserId } });
  }
  // Normalize day for uniqueness
  const dDay = new Date(body.date);
  const normalizedDay = new Date(dDay.getFullYear(), dDay.getMonth(), dDay.getDate());
  const exists = await prisma.timeEntry.findFirst({ where: { employeeId: employee!.id, date: normalizedDay } });
  if (exists) return res.status(409).json({ error: 'Time entry for this day already exists' });
  const created = await prisma.timeEntry.create({
    data: {
      employeeId: employee!.id,
      date: normalizedDay,
      startTime: new Date(body.startTime),
      endTime: new Date(body.endTime)
    }
  });
  // Also reflect PRESENT attendance for that date
  const normalized = normalizedDay;
  await prisma.attendance.upsert({
    where: { employeeId_date: { employeeId: employee!.id, date: normalized } },
    update: { status: 'PRESENT' },
    create: { employeeId: employee!.id, date: normalized, status: 'PRESENT' }
  });
  res.status(201).json(created);
}


