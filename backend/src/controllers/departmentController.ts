import { Request, Response } from 'express';
import { prisma } from '../db/client';
import { z } from 'zod';

export async function listDepartments(_req: Request, res: Response) {
  const items = await prisma.department.findMany({ include: { children: true } });
  res.json(items);
}

// Recursive function to count all employees in a department including all children
async function countEmployeesRecursive(departmentId: string): Promise<number> {
  const directCount = await prisma.employee.count({
    where: { departmentId }
  });
  
  const children = await prisma.department.findMany({
    where: { parentId: departmentId },
    select: { id: true }
  });
  
  let childrenCount = 0;
  for (const child of children) {
    childrenCount += await countEmployeesRecursive(child.id);
  }
  
  return directCount + childrenCount;
}

export async function orgTree(_req: Request, res: Response) {
  const items = await prisma.department.findMany({
    include: {
      children: true,
      _count: {
        select: { employees: true }
      }
    }
  });
  
  // Calculate total employees including children for each department
  // Store direct count before replacing with total
  const itemsWithTotalCount = await Promise.all(
    items.map(async (dept) => {
      const directCount = dept._count.employees; // Direct employees count from Prisma
      const totalEmployees = await countEmployeesRecursive(dept.id);
      return {
        ...dept,
        _count: {
          employees: totalEmployees, // Total including children
          directEmployees: directCount // Also include direct count for frontend calculation
        }
      };
    })
  );
  
  res.json(itemsWithTotalCount);
}

const deptSchema = z.object({ name: z.string().min(1), parentId: z.string().optional() });
export async function createDepartment(req: Request, res: Response) {
  const p = deptSchema.safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: p.error.flatten() });
  const created = await prisma.department.create({ data: p.data });
  res.status(201).json(created);
}

export async function updateDepartment(req: Request, res: Response) {
  const p = deptSchema.partial().safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: p.error.flatten() });
  const updated = await prisma.department.update({ where: { id: req.params.id }, data: p.data });
  res.json(updated);
}

export async function deleteDepartment(req: Request, res: Response) {
  await prisma.department.delete({ where: { id: req.params.id } });
  res.status(204).send();
}


