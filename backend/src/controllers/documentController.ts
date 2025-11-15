import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { prisma } from '../db/client';
import { notify } from '../services/notificationService';

export async function listDocuments(req: Request, res: Response) {
  const { employeeId } = req.query as { employeeId?: string };
  const docs = await prisma.document.findMany({ where: { employeeId: employeeId || undefined }, orderBy: { uploadedAt: 'desc' } });
  res.json(docs);
}

export async function uploadDocument(req: Request, res: Response) {
  const file = (req as any).file as Express.Multer.File | undefined;
  if (!file) return res.status(400).json({ error: 'File required' });
  const { employeeId, category, tags } = req.body as { employeeId?: string; category?: string; tags?: string };
  let version = 1;
  if (employeeId) {
    const last = await prisma.document.findFirst({ where: { employeeId, filename: file.originalname }, orderBy: { version: 'desc' } });
    version = (last?.version || 0) + 1;
  }
  const created = await prisma.document.create({
    data: { filename: file.originalname, path: file.filename, employeeId, category, tags: tags ? tags.split(',').map((t) => t.trim()).filter(Boolean) : [], version }
  });
  await notify({ type: 'DOCUMENT_UPLOADED', payload: { documentId: created.id, filename: created.filename } });
  res.status(201).json(created);
}

export async function downloadDocument(req: Request, res: Response) {
  const { id } = req.params;
  const doc = await prisma.document.findUnique({ where: { id } });
  if (!doc) return res.status(404).json({ error: 'Not found' });
  const filepath = path.resolve(process.env.UPLOAD_DIR || './uploads', doc.path);
  if (!fs.existsSync(filepath)) return res.status(404).json({ error: 'File missing' });
  res.download(filepath, doc.filename);
}

export async function deleteDocument(req: Request, res: Response) {
  const { id } = req.params;
  await prisma.document.delete({ where: { id } });
  res.status(204).send();
}


