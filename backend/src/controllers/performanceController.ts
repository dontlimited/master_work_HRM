import { Request, Response } from 'express';
import { prisma } from '../db/client';

const ROLE_WEIGHTS: Record<string, number> = { SELF: 0.2, PEER: 0.4, MANAGER: 0.4 };

function simpleSentiment(text: string): number {
  const pos = ['great','excellent','good','helpful','positive','strong','effective','collaborative'];
  const neg = ['bad','poor','negative','weak','unhelpful','late','toxic','problem'];
  const t = text.toLowerCase();
  let s = 0;
  for (const w of pos) if (t.includes(w)) s += 1;
  for (const w of neg) if (t.includes(w)) s -= 1;
  return Math.max(-1, Math.min(1, s / 5));
}

export async function listQuestions(_req: Request, res: Response) {
  const cycle = await prisma.feedbackCycle.findFirst({ orderBy: { startsAt: 'desc' } });
  if (!cycle) return res.json({ cycle: null, questions: [] });
  const questions = await prisma.feedbackQuestion.findMany({ where: { cycleId: cycle.id }, orderBy: { id: 'asc' } });
  res.json({ cycle, questions });
}

export async function submitResponses(req: Request, res: Response) {
  const { cycleId, targetEmployeeId, reviewerRole, answers } = req.body as {
    cycleId: string; targetEmployeeId: string; reviewerRole: 'SELF'|'PEER'|'MANAGER'; answers: Array<{ questionId: string; rating?: number; comment?: string }>
  };
  const userId = (req as any).user?.userId as string | undefined;
  if (!userId) return res.status(400).json({ error: 'User ID required' });
  
  // Get employeeId from userId
  const reviewer = await prisma.employee.findFirst({ where: { userId } });
  if (!reviewer) return res.status(400).json({ error: 'Employee record not found for this user' });
  const reviewerEmpId = reviewer.id;
  
  const created = await prisma.$transaction(async (tx) => {
    // Delete existing responses for this combination to allow re-submission
    await tx.feedbackResponse.deleteMany({
      where: {
        cycleId,
        targetEmpId: targetEmployeeId,
        reviewerEmpId,
        reviewerRole,
      },
    });

    // Create new responses
    const writes = [] as any[];
    for (const a of answers) {
      const sentiment = a.comment ? simpleSentiment(a.comment) : null;
      writes.push(tx.feedbackResponse.create({ data: { cycleId, questionId: a.questionId, targetEmpId: targetEmployeeId, reviewerEmpId, reviewerRole, rating: a.rating ?? null, comment: a.comment ?? null, sentiment } }));
    }
    return Promise.all(writes);
  });
  res.status(201).json({ count: created.length });
}

export async function getAggregates(req: Request, res: Response) {
  const cycleId = (req.query.cycleId as string | undefined) || (await prisma.feedbackCycle.findFirst({ orderBy: { startsAt: 'desc' } }))?.id;
  if (!cycleId) return res.json({ items: [] });
  const role = (req as any).user?.role as string;
  const targetEmployeeId = (req.query.targetEmployeeId as string | undefined) || (req as any).user?.employeeId;
  const where: any = { cycleId, ...(role === 'ADMIN' ? {} : { targetEmpId: targetEmployeeId }) };
  const rows = await prisma.feedbackResponse.findMany({ where });
  // Aggregate weighted score per target employee
  const grouped: Record<string, { ratings: number[]; sentiments: number[]; byRole: Record<string, number[]>; weights: number[] }> = {};
  for (const r of rows) {
    const g = grouped[r.targetEmpId] || { ratings: [], sentiments: [], byRole: {}, weights: [] };
    if (r.rating != null) {
      const w = ROLE_WEIGHTS[r.reviewerRole] ?? 0.33;
      g.ratings.push(r.rating);
      g.weights.push(w);
      g.byRole[r.reviewerRole] = g.byRole[r.reviewerRole] || [];
      g.byRole[r.reviewerRole].push(r.rating);
    }
    if (r.sentiment != null) g.sentiments.push(r.sentiment);
    grouped[r.targetEmpId] = g;
  }
  const items = Object.entries(grouped).map(([empId, g]) => {
    // Calculate weighted average: sum(rating * weight) / sum(weights)
    let weightedScore: number | null = null;
    if (g.ratings.length > 0 && g.weights.length === g.ratings.length) {
      const weightedSum = g.ratings.reduce((sum, rating, i) => sum + rating * g.weights[i], 0);
      const totalWeight = g.weights.reduce((sum, w) => sum + w, 0);
      weightedScore = totalWeight > 0 ? Number((weightedSum / totalWeight).toFixed(2)) : null;
    }
    
    return {
      employeeId: empId,
      weightedScore,
      avgSentiment: g.sentiments.length ? Number((g.sentiments.reduce((a,b)=>a+b,0) / g.sentiments.length).toFixed(2)) : null,
      countsByRole: Object.fromEntries(Object.entries(g.byRole).map(([k,v]) => [k, v.length]))
    };
  });

  // Anonymize reviewer ids for non-admin: not returning raw responses
  if (role !== 'ADMIN') return res.json({ items });

  // Admin: include detailed rows with masked reviewer ids
  const detailed = rows.map((r) => ({ ...r, reviewerEmpId: 'anon' }));
  res.json({ items, detailed });
}


