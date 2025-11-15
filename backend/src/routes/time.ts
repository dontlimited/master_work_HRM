import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth';
import { listAttendance, markAttendance, listLeaves, requestLeave, approveLeave, listEmploymentHistory, clearAttendance, listTimeEntries, createTimeEntry } from '../controllers/timeController';

const router = Router();

router.use(authenticate);

router.get('/attendance', listAttendance);
router.post('/attendance', markAttendance);
router.get('/leave', listLeaves);
router.post('/leave', requestLeave);
router.post('/leave/:id/approve', authorize(['ADMIN', 'HR']), approveLeave);
router.get('/history', listEmploymentHistory);
router.delete('/attendance', authorize(['ADMIN', 'HR']), clearAttendance);
router.get('/entries', listTimeEntries);
router.post('/entries', createTimeEntry);

export default router;


