import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { z } from 'zod';
import { prisma } from '../db/client';

// pdf-parse will be loaded dynamically when needed to avoid issues with CommonJS/ESM

// Vacancies
export async function listVacancies(_req: Request, res: Response) {
  const items = await prisma.vacancy.findMany({ include: { department: true, position: true } });
  res.json(items);
}

const vacancySchema = z.object({ title: z.string().min(1), description: z.string().optional(), skills: z.array(z.string()).optional(), departmentId: z.string().optional(), positionId: z.string().optional(), status: z.enum(['OPEN','ON_HOLD','CLOSED']).optional() });
export async function createVacancy(req: Request, res: Response) {
  const p = vacancySchema.safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: p.error.flatten() });
  const created = await prisma.vacancy.create({ data: p.data });
  res.status(201).json(created);
}
export async function updateVacancy(req: Request, res: Response) {
  const p = vacancySchema.partial().safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: p.error.flatten() });
  const updated = await prisma.vacancy.update({ where: { id: req.params.id }, data: p.data });
  res.json(updated);
}
export async function deleteVacancy(req: Request, res: Response) {
  const force = String(req.query.force || '').toLowerCase() === 'true';
  try {
    if (force) {
      await prisma.$transaction(async (tx) => {
        const candidates = await tx.candidate.findMany({ where: { vacancyId: req.params.id }, select: { id: true } });
        const candidateIds = candidates.map((c) => c.id);
        if (candidateIds.length) {
          await tx.interview.deleteMany({ where: { candidateId: { in: candidateIds } } });
          await tx.candidate.deleteMany({ where: { id: { in: candidateIds } } });
        }
        await tx.vacancy.delete({ where: { id: req.params.id } });
      });
      return res.status(204).send();
    }
    await prisma.vacancy.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch (e: any) {
    if (e?.code === 'P2003') {
      return res.status(409).json({ error: 'Cannot delete vacancy with related candidates or interviews. Remove related records or close the vacancy.' });
    }
    return res.status(500).json({ error: 'Failed to delete vacancy' });
  }
}

// Candidates
export async function listCandidates(_req: Request, res: Response) {
  const items = await prisma.candidate.findMany({ include: { vacancy: true, interviews: true } });
  res.json(items);
}
const candidateSchema = z.object({ vacancyId: z.string(), firstName: z.string(), lastName: z.string(), email: z.string().email(), tags: z.array(z.string()).optional(), skills: z.array(z.string()).optional(), status: z.enum(['APPLIED','SCREENING','INTERVIEW','OFFER','HIRED','REJECTED']).optional() });
export async function createCandidate(req: Request, res: Response) {
  const p = candidateSchema.safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: p.error.flatten() });
  const created = await prisma.candidate.create({ data: p.data });
  res.status(201).json(created);
}
export async function updateCandidate(req: Request, res: Response) {
  const p = candidateSchema.partial().safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: p.error.flatten() });
  const updated = await prisma.candidate.update({ where: { id: req.params.id }, data: p.data });
  res.json(updated);
}
export async function deleteCandidate(req: Request, res: Response) {
  await prisma.candidate.delete({ where: { id: req.params.id } });
  res.status(204).send();
}

// Interviews
export async function listInterviews(_req: Request, res: Response) {
  const items = await prisma.interview.findMany({ include: { candidate: true } });
  res.json(items);
}
const interviewSchema = z.object({ candidateId: z.string(), scheduledAt: z.string(), result: z.enum(['PASS','FAIL','PENDING']).optional(), notes: z.string().optional(), feedback: z.string().optional() });
export async function scheduleInterview(req: Request, res: Response) {
  const p = interviewSchema.safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: p.error.flatten() });
  const created = await prisma.interview.create({ data: { candidateId: p.data.candidateId, scheduledAt: new Date(p.data.scheduledAt), result: p.data.result, notes: p.data.notes } });
  res.status(201).json(created);
}
export async function updateInterview(req: Request, res: Response) {
  const p = interviewSchema.partial().safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: p.error.flatten() });
  const updated = await prisma.interview.update({ where: { id: req.params.id }, data: { ...p.data, scheduledAt: p.data.scheduledAt ? new Date(p.data.scheduledAt) : undefined } });
  res.json(updated);
}

// Hire a candidate -> create user+employee minimal
export async function hireCandidate(req: Request, res: Response) {
  const { id } = req.params;
  const candidate = await prisma.candidate.findUnique({ where: { id }, include: { vacancy: true } });
  if (!candidate) return res.status(404).json({ error: 'Candidate not found' });
  const existing = await prisma.user.findUnique({ where: { email: candidate.email } });
  if (existing) return res.status(409).json({ error: 'User already exists' });
  const user = await prisma.user.create({ data: { email: candidate.email, password: '', firstName: candidate.firstName, lastName: candidate.lastName, role: 'EMPLOYEE' } });
  const employee = await prisma.employee.create({ data: { userId: user.id, departmentId: candidate.vacancy?.departmentId || undefined, positionId: candidate.vacancy?.positionId || undefined } });
  await prisma.candidate.update({ where: { id }, data: { status: 'HIRED' } });
  res.json({ userId: user.id, employeeId: employee.id });
}

// Extract text from PDF file
async function extractTextFromPDF(filePath: string): Promise<string> {
  try {
    // Load pdf-parse dynamically (version 1.1.1 exports function directly)
    const pdfParse = require('pdf-parse');
    const dataBuffer = fs.readFileSync(filePath);
    
    // pdf-parse v1.1.1 exports a function directly
    const data = await pdfParse(dataBuffer);
    
    const text = data?.text || '';
    console.log(`[extractTextFromPDF] Extracted ${text.length} characters from PDF`);
    if (text.length > 0) {
      console.log(`[extractTextFromPDF] First 200 chars: ${text.substring(0, 200)}`);
    }
    return text;
  } catch (error) {
    console.error(`[extractTextFromPDF] Error parsing PDF: ${error}`);
    return '';
  }
}

// Extract text from TXT file
function extractTextFromTXT(filePath: string): string {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    console.error(`[extractTextFromTXT] Error reading TXT: ${error}`);
    return '';
  }
}

// Find skills section in resume text
function findSkillsSection(text: string): string {
  // Common section headers for skills (more flexible patterns)
  const skillSectionPatterns = [
    /(?:^|\n)\s*(?:tech\s+)?skills?\s*:?\s*\n/i,
    /(?:^|\n)\s*technical\s+skills?\s*:?\s*\n/i,
    /(?:^|\n)\s*technologies?\s*:?\s*\n/i,
    /(?:^|\n)\s*programming\s+languages?\s*:?\s*\n/i,
    /(?:^|\n)\s*tools?\s+and\s+technologies?\s*:?\s*\n/i,
    /(?:^|\n)\s*competencies?\s*:?\s*\n/i,
    /(?:^|\n)\s*expertise\s*:?\s*\n/i,
    // More flexible patterns for PDF parsing (may have extra spaces or formatting)
    /(?:^|\n)\s*TECH\s+SKILLS?\s*:?\s*\n/i,
    /(?:^|\n)\s*SKILLS?\s*:?\s*\n/i,
    /(?:^|\n)\s*TECHNICAL\s+SKILLS?\s*:?\s*\n/i,
    /(?:^|\n)\s*TECHNOLOGIES?\s*:?\s*\n/i,
  ];

  // Find the first skills section
  for (const pattern of skillSectionPatterns) {
    const match = text.match(pattern);
    if (match) {
      const startIndex = match.index! + match[0].length;
      // Extract text until next major section (usually 2+ newlines or next uppercase header)
      const remainingText = text.substring(startIndex);
      const nextSectionMatch = remainingText.match(/\n\s*[A-Z][A-Z\s]{3,}:\s*\n/);
      const endIndex = nextSectionMatch ? startIndex + nextSectionMatch.index! : text.length;
      return text.substring(startIndex, endIndex);
    }
  }

  // If no specific section found, return the whole text but prioritize certain areas
  // Look for common skill keywords and extract surrounding context
  const skillKeywords = ['java', 'python', 'javascript', 'typescript', 'react', 'node', 'sql', 'postgresql', 'mongodb', 'docker', 'kubernetes', 'aws', 'azure', 'git', 'selenium', 'playwright', 'jest', 'maven', 'gradle'];
  const lines = text.split('\n');
  const skillLines: string[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();
    if (skillKeywords.some(keyword => line.includes(keyword))) {
      // Include current line and nearby lines
      const start = Math.max(0, i - 2);
      const end = Math.min(lines.length, i + 5);
      skillLines.push(...lines.slice(start, end));
    }
  }
  
  return skillLines.length > 0 ? skillLines.join('\n') : text;
}

// Enhanced tokenization that extracts technical skills
function extractSkills(text: string): string[] {
  console.log(`[extractSkills] Processing text of length: ${text.length}`);
  
  // First, try to find and extract the skills section
  const skillsSection = findSkillsSection(text);
  console.log(`[extractSkills] Skills section length: ${skillsSection.length}`);
  if (skillsSection.length < text.length) {
    console.log(`[extractSkills] Found dedicated skills section. First 300 chars: ${skillsSection.substring(0, 300)}`);
  }
  
  // Common technical terms and technologies
  const techPatterns = [
    // Programming languages
    /\b(java|python|javascript|typescript|go|rust|c\+\+|c#|php|ruby|swift|kotlin|scala|r|matlab|perl|bash|shell|powershell)\b/gi,
    // Frameworks and libraries
    /\b(react|vue|angular|svelte|next\.js|nuxt|express|nest|fastapi|django|flask|spring|hibernate|laravel|symfony|rails|asp\.net)\b/gi,
    // Databases
    /\b(postgresql|mysql|mongodb|redis|cassandra|elasticsearch|dynamodb|oracle|sql\s+server|sqlite|neo4j)\b/gi,
    // Cloud and DevOps
    /\b(aws|azure|gcp|docker|kubernetes|jenkins|gitlab|github|ci\/cd|terraform|ansible|chef|puppet)\b/gi,
    // Testing tools
    /\b(selenium|playwright|cypress|jest|mocha|junit|testng|pytest|rspec|allure|postman|soapui)\b/gi,
    // Build tools
    /\b(maven|gradle|npm|yarn|webpack|vite|gulp|grunt)\b/gi,
    // Version control
    /\b(git|svn|mercurial|perforce)\b/gi,
    // Other common tech terms
    /\b(rest|graphql|grpc|microservices|api|http|https|tcp|udp|websocket)\b/gi,
    /\b(linux|unix|windows|macos|ios|android)\b/gi,
    /\b(html|css|sass|less|bootstrap|tailwind|material-ui)\b/gi,
  ];

  const foundSkills = new Set<string>();
  
  // Extract from skills section first
  for (const pattern of techPatterns) {
    const matches = skillsSection.matchAll(pattern);
    for (const match of matches) {
      foundSkills.add(match[0].toLowerCase());
    }
  }

  // Also extract from full text (but with lower priority)
  // This helps catch skills mentioned in experience section
  for (const pattern of techPatterns) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      foundSkills.add(match[0].toLowerCase());
    }
  }

  // Extract individual words that look like technologies (capitalized, common tech terms)
  const words = skillsSection
    .replace(/[\w.+-]+@\w+\.[\w.-]+/g, ' ') // Remove emails
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2);

  // Common technology keywords (single words)
  const techKeywords = [
    'java', 'python', 'javascript', 'typescript', 'react', 'node', 'sql', 'git',
    'docker', 'kubernetes', 'aws', 'azure', 'selenium', 'playwright', 'jest',
    'maven', 'gradle', 'npm', 'yarn', 'postgresql', 'mongodb', 'redis',
    'express', 'django', 'flask', 'spring', 'laravel', 'rails', 'vue', 'angular'
  ];

  for (const word of words) {
    if (techKeywords.includes(word)) {
      foundSkills.add(word);
    }
  }

  const result = Array.from(foundSkills);
  console.log(`[extractSkills] Extracted ${result.length} skills: ${result.join(', ')}`);
  return result;
}

// Fallback extraction: look for any capitalized tech-like words
function extractSkillsFallback(text: string): string[] {
  const foundSkills = new Set<string>();
  
  // Look for common tech terms in any case
  const techTerms = [
    'java', 'python', 'javascript', 'typescript', 'react', 'vue', 'angular', 'node',
    'express', 'django', 'flask', 'spring', 'laravel', 'rails', 'kotlin', 'swift',
    'postgresql', 'mysql', 'mongodb', 'redis', 'sql', 'nosql',
    'docker', 'kubernetes', 'aws', 'azure', 'gcp', 'jenkins', 'gitlab', 'github',
    'selenium', 'playwright', 'cypress', 'jest', 'mocha', 'junit', 'testng', 'pytest',
    'maven', 'gradle', 'npm', 'yarn', 'webpack', 'vite',
    'git', 'html', 'css', 'sass', 'less', 'bootstrap', 'tailwind',
    'rest', 'graphql', 'grpc', 'api', 'http', 'https',
    'linux', 'unix', 'windows', 'macos', 'ios', 'android',
    'allure', 'postman', 'soapui', 'charles', 'testflight'
  ];
  
  const lowerText = text.toLowerCase();
  for (const term of techTerms) {
    if (lowerText.includes(term)) {
      foundSkills.add(term);
    }
  }
  
  // Also look for capitalized words that might be technologies
  const words = text.split(/\s+/);
  for (const word of words) {
    const cleanWord = word.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    if (cleanWord.length > 2 && techTerms.includes(cleanWord)) {
      foundSkills.add(cleanWord);
    }
  }
  
  return Array.from(foundSkills);
}

// Legacy tokenize function for backward compatibility
function tokenize(text: string): string[] {
  // strip emails to avoid tokens like gmail/com/user
  const withoutEmails = text.replace(/[\w.+-]+@\w+\.[\w.-]+/g, ' ');
  return withoutEmails
    .toLowerCase()
    .replace(/[^a-z0-9,\s]/g, ' ')
    .split(/[,\s]+/)
    .filter(Boolean);
}

function embedding(text: string): Record<string, number> {
  const tokens = tokenize(text);
  const vec: Record<string, number> = {};
  for (const t of tokens) vec[t] = (vec[t] || 0) + 1;
  return vec;
}

function cosineSim(a: Record<string, number>, b: Record<string, number>): number {
  let dot = 0,
    na = 0,
    nb = 0;
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  for (const k of keys) {
    const va = a[k] || 0;
    const vb = b[k] || 0;
    dot += va * vb;
    na += va * va;
    nb += vb * vb;
  }
  if (!na || !nb) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

export async function vacancyDetails(req: Request, res: Response) {
  const { id } = req.params;
  const vacancy = await prisma.vacancy.findUnique({ where: { id } });
  if (!vacancy) return res.status(404).json({ error: 'Vacancy not found' });
  const role = (req as any).user?.role as string | undefined;
  console.log(`[vacancyDetails] Request for vacancy ${id}, role: ${role || 'unauthenticated'}`);
  // Unauthenticated users and candidates can only see vacancy meta, not candidates/ranking
  if (!role || role === 'CANDIDATE') {
    console.log(`[vacancyDetails] Returning vacancy only (role: ${role || 'unauthenticated'})`);
    return res.json({ vacancy });
  }
  // For ADMIN/HR: fetch all candidates with all fields including resumePath and coverLetter
  const candidates = await prisma.candidate.findMany({ 
    where: { vacancyId: id }
  });
  console.log(`[vacancyDetails] Found ${candidates.length} candidates for vacancy ${id}`);
  // Build vacancy vector STRICTLY from HR-provided skills list
  const vSkills = (vacancy.skills || []).map((s) => s.toLowerCase());
  const vVec = vSkills.reduce<Record<string, number>>((acc, s) => { acc[s] = (acc[s] || 0) + 1; return acc; }, {});
  const vTokens = Object.keys(vVec);
  // Preload other applications by same email to detect resume/skills inconsistencies
  const emails = Array.from(new Set(candidates.map((c) => c.email.toLowerCase())));
  const othersByEmail: Record<string, string[]> = {};
  if (emails.length) {
    const others = await prisma.candidate.findMany({ where: { email: { in: emails }, vacancyId: { not: id } }, select: { email: true, parsedWords: true } });
    for (const o of others) {
      const key = o.email.toLowerCase();
      const prev = othersByEmail[key] || [];
      const words = (o.parsedWords || []).map((w) => w.toLowerCase());
      othersByEmail[key] = Array.from(new Set([...prev, ...words]));
    }
  }
  const ranked = candidates
    .map((c) => {
      // Candidate vector strictly from parsed resume words only
      const tokens = Array.isArray(c.parsedWords) ? c.parsedWords : [];
      const cVec = tokens.reduce<Record<string, number>>((acc, s) => { const t = s.toLowerCase(); acc[t] = (acc[t] || 0) + 1; return acc; }, {});
      const score = cosineSim(vVec, cVec);
      // explanation: overlapping tokens and their weighted contribution (term freq product)
      const overlap = Array.from(new Set(Object.keys(cVec).filter((t) => vVec[t])));
      const contributions = overlap
        .map((t) => ({ token: t, vacancyWeight: vVec[t], candidateWeight: cVec[t], product: (vVec[t] || 0) * (cVec[t] || 0) }))
        .sort((a, b) => b.product - a.product)
        .slice(0, 15);
      // Inconsistency detection: compare current tokens with union of tokens from other applications with same email
      const emailKey = c.email.toLowerCase();
      const baseline = new Set((othersByEmail[emailKey] || []).map((w) => w.toLowerCase()));
      const current = new Set(tokens.map((w) => w.toLowerCase()));
      const added: string[] = [];
      const missing: string[] = [];
      for (const t of current) if (!baseline.has(t)) added.push(t);
      for (const t of baseline) if (!current.has(t)) missing.push(t);
      const inconsistent = baseline.size > 0 && (added.length > 0 || missing.length > 0);
      return { ...c, score, explanation: { overlap, contributions, vacancyTokens: vTokens.length, candidateTokens: Object.keys(cVec).length }, inconsistent, diffs: inconsistent ? { added: added.slice(0, 10), missing: missing.slice(0, 10) } : undefined };
    })
    .sort((x, y) => (y.score || 0) - (x.score || 0));
  console.log(`[vacancyDetails] Returning ${ranked.length} ranked candidates`);
  res.json({ vacancy, candidates: ranked, stats: { totalCandidates: candidates.length }, model: 'bag-of-words tf + cosine' });
}

export async function applyToVacancy(req: Request, res: Response) {
  const { id } = req.params;
  const vacancy = await prisma.vacancy.findUnique({ where: { id } });
  if (!vacancy) return res.status(404).json({ error: 'Vacancy not found' });
  // Email must be provided explicitly by the applicant; used for duplicate checks and ranking
  const rawEmail = (req.body?.email as string | undefined)?.trim();
  if (!rawEmail) return res.status(400).json({ error: 'Email is required' });
  const email = rawEmail.toLowerCase();
  // Optional names can be provided by applicant; fallback to logged-user names or empty
  const bodyFirstName = (req.body?.firstName as string | undefined)?.trim();
  const bodyLastName = (req.body?.lastName as string | undefined)?.trim();
  const userId = (req as any).user?.userId as string | undefined;
  const user = userId ? await prisma.user.findUnique({ where: { id: userId } }) : null;
  // If already applied to this vacancy, update the existing record instead of erroring
  const existing = await prisma.candidate.findFirst({ where: { vacancyId: id, email } });
  const file = (req as any).file as Express.Multer.File | undefined;
  const coverLetter = (req.body?.coverLetter as string) || undefined;
  const resumePath = file?.filename;
  // Parse resume content - extract skills from PDF or TXT files
  let words: string[] = [];
  if (resumePath) {
    const abs = path.resolve(process.env.UPLOAD_DIR || './uploads', resumePath);
    if (fs.existsSync(abs)) {
      try {
        let text = '';
        if (abs.toLowerCase().endsWith('.pdf')) {
          text = await extractTextFromPDF(abs);
        } else if (abs.toLowerCase().endsWith('.txt')) {
          text = extractTextFromTXT(abs);
        }
        
        if (text && text.trim().length > 0) {
          // Use enhanced skills extraction
          const skills = extractSkills(text);
          words = words.concat(skills);
          console.log(`[applyToVacancy] Extracted ${skills.length} skills from resume: ${skills.slice(0, 10).join(', ')}...`);
          
          // If no skills found, try fallback: extract all capitalized words that might be technologies
          if (skills.length === 0) {
            console.log(`[applyToVacancy] No skills found with patterns, trying fallback extraction...`);
            const fallbackSkills = extractSkillsFallback(text);
            words = words.concat(fallbackSkills);
            console.log(`[applyToVacancy] Fallback extracted ${fallbackSkills.length} skills: ${fallbackSkills.slice(0, 10).join(', ')}...`);
          }
        } else {
          console.warn(`[applyToVacancy] No text extracted from resume file: ${resumePath}`);
        }
      } catch (error) {
        console.error(`[applyToVacancy] Error parsing resume: ${error}`);
      }
    }
  }
  const parsedWords = Array.from(new Set(words));
  // mark duplicate if email exists in any candidate for any vacancy
  const anyExisting = await prisma.candidate.findFirst({ where: { email } });
  if (existing) {
    const updated = await prisma.candidate.update({ where: { id: existing.id }, data: { firstName: bodyFirstName || existing.firstName, lastName: bodyLastName || existing.lastName, coverLetter, resumePath: resumePath || existing.resumePath, parsedWords: parsedWords.length ? parsedWords : existing.parsedWords, status: existing.status || 'APPLIED' } });
    return res.json(updated);
  }
  const created = await prisma.candidate.create({ data: { vacancyId: id, firstName: bodyFirstName || user?.firstName || '', lastName: bodyLastName || user?.lastName || '', email, status: 'APPLIED', coverLetter, resumePath, parsedWords, duplicate: Boolean(anyExisting) } });
  res.status(201).json(created);
}

export async function downloadCandidateResume(req: Request, res: Response) {
  const { id } = req.params;
  const candidate = await prisma.candidate.findUnique({ where: { id } });
  if (!candidate) return res.status(404).json({ error: 'Candidate not found' });
  if (!candidate.resumePath) return res.status(404).json({ error: 'Resume not found' });
  const filepath = path.resolve(process.env.UPLOAD_DIR || './uploads', candidate.resumePath);
  if (!fs.existsSync(filepath)) return res.status(404).json({ error: 'File missing' });
  res.download(filepath, candidate.resumePath);
}


