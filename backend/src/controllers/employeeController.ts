import { Request, Response } from 'express';
import { prisma } from '../db/client';
import { z } from 'zod';

export async function getEmployees(req: Request, res: Response) {
  const { id, userId: userIdFilter, search, departmentId, positionId, page = '1', pageSize = '20', sort = 'user.lastName:asc', includeArchived = 'false' } = req.query as Record<string, string>;
  const skip = (Number(page) - 1) * Number(pageSize);
  const [sortField, sortDir] = sort.split(':');

  const where: any = {
    archived: includeArchived === 'true' ? undefined : false,
    departmentId: departmentId || undefined,
    positionId: positionId || undefined,
    id: id || undefined,
    userId: userIdFilter || undefined,
    ...(search
      ? {
          OR: [
            { user: { firstName: { contains: search, mode: 'insensitive' } } },
            { user: { lastName: { contains: search, mode: 'insensitive' } } },
            { user: { email: { contains: search, mode: 'insensitive' } } }
          ]
        }
      : {})
  };

  const orderBy: any = sortField?.startsWith('user.')
    ? { user: { [sortField.replace('user.', '')]: sortDir === 'desc' ? 'desc' : 'asc' } }
    : { [sortField || 'id']: sortDir === 'desc' ? 'desc' : 'asc' };

  const [items, total] = await Promise.all([
    prisma.employee.findMany({ where, skip, take: Number(pageSize), orderBy, include: { user: true, department: true, position: true } }),
    prisma.employee.count({ where })
  ]);
  res.json({ items, total, page: Number(page), pageSize: Number(pageSize) });
}

const employeeSchema = z.object({
  userId: z.string(),
  departmentId: z.string().optional(),
  positionId: z.string().optional(),
  managerId: z.string().optional()
});

export async function createEmployee(req: Request, res: Response) {
  const parsed = employeeSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const employee = await prisma.employee.create({ data: parsed.data });
  res.status(201).json(employee);
}

export async function updateEmployee(req: Request, res: Response) {
  const parsed = employeeSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { id } = req.params;
  const employee = await prisma.employee.update({ where: { id }, data: parsed.data });
  res.json(employee);
}

export async function deleteEmployee(req: Request, res: Response) {
  const { id } = req.params;
  await prisma.employee.delete({ where: { id } });
  res.status(204).send();
}

export async function archiveEmployee(req: Request, res: Response) {
  const { id } = req.params;
  const updated = await prisma.employee.update({ where: { id }, data: { archived: true } });
  res.json(updated);
}


