import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth';
import { summary } from '../controllers/analyticsController';

const router = Router();

router.use(authenticate);

router.get('/summary', authorize(['ADMIN', 'HR']), summary);

export default router;


