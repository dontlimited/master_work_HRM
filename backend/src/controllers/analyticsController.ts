import { Request, Response } from 'express';
import { prisma } from '../db/client';

export async function summary(_req: Request, res: Response) {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);
  const [employees, openVacancies, pendingReviewsToday, leaveToday] = await Promise.all([
    prisma.employee.count(),
    prisma.vacancy.count({ where: { status: 'OPEN' } }),
    prisma.review.count({ where: { createdAt: { gte: new Date(new Date().toDateString()) } } }),
    // On Leave (Today): count attendance with status SICK for today
    prisma.attendance.count({ where: { status: 'SICK', date: { gte: todayStart, lte: todayEnd } } })
  ]);
  res.json({ employees, openVacancies, pendingReviewsToday, leaveToday });
}


