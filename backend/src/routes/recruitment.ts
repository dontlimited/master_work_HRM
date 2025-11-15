import { Router } from 'express';
import { authenticate, authorize, optionalAuthenticate } from '../middlewares/auth';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import {
  listVacancies,
  createVacancy,
  updateVacancy,
  deleteVacancy,
  listCandidates,
  createCandidate,
  updateCandidate,
  deleteCandidate,
  listInterviews,
  scheduleInterview,
  updateInterview,
  hireCandidate,
  vacancyDetails as listVacancyDetails,
  applyToVacancy,
  downloadCandidateResume
} from '../controllers/recruitmentController';

const router = Router();

const uploadDir = process.env.UPLOAD_DIR || './uploads';
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
const storage = multer.diskStorage({ destination: (_req, _file, cb) => cb(null, uploadDir), filename: (_req, file, cb) => cb(null, `${Date.now()}_${file.originalname}`) });
const upload = multer({ storage });

// Public routes: Vacancies (accessible without authentication)
router.get('/vacancies', listVacancies);
// Optional auth: if user is authenticated, they see candidates; if not, only vacancy info
router.get('/vacancies/:id', optionalAuthenticate, listVacancyDetails);

// Candidate apply - public route (no authentication required)
router.post('/vacancies/:id/apply', upload.single('resume'), applyToVacancy);

// Protected routes require authentication
router.use(authenticate);

// Vacancies (protected routes)
router.post('/vacancies', authorize(['ADMIN', 'HR']), createVacancy);
router.put('/vacancies/:id', authorize(['ADMIN', 'HR']), updateVacancy);
router.delete('/vacancies/:id', authorize(['ADMIN', 'HR']), deleteVacancy);

// Candidates
router.get('/candidates', authorize(['ADMIN', 'HR']), listCandidates);
router.post('/candidates', authorize(['ADMIN', 'HR']), createCandidate);
router.put('/candidates/:id', authorize(['ADMIN', 'HR']), updateCandidate);
router.delete('/candidates/:id', authorize(['ADMIN', 'HR']), deleteCandidate);
router.post('/candidates/:id/hire', authorize(['ADMIN', 'HR']), hireCandidate);
router.get('/candidates/:id/resume', authorize(['ADMIN', 'HR']), downloadCandidateResume);

// Interviews
router.get('/interviews', authorize(['ADMIN', 'HR']), listInterviews);
router.post('/interviews', authorize(['ADMIN', 'HR']), scheduleInterview);
router.put('/interviews/:id', authorize(['ADMIN', 'HR']), updateInterview);

export default router;


