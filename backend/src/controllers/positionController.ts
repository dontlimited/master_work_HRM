import { Request, Response } from 'express';
import { prisma } from '../db/client';
import { z } from 'zod';

export async function listPositions(_req: Request, res: Response) {
  const items = await prisma.position.findMany();
  res.json(items);
}

const positionSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  grade: z.string().optional(),
  salaryMin: z.number().int().nonnegative().optional(),
  salaryMax: z.number().int().nonnegative().optional(),
  competencies: z.array(z.string()).optional()
});

export async function createPosition(req: Request, res: Response) {
  const p = positionSchema.safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: p.error.flatten() });
  const created = await prisma.position.create({ data: p.data as any });
  res.status(201).json(created);
}

export async function updatePosition(req: Request, res: Response) {
  const p = positionSchema.partial().safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: p.error.flatten() });
  const updated = await prisma.position.update({ where: { id: req.params.id }, data: p.data as any });
  res.json(updated);
}

export async function deletePosition(req: Request, res: Response) {
  await prisma.position.delete({ where: { id: req.params.id } });
  res.status(204).send();
}


