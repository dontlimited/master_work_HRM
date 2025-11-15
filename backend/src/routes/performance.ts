import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth';
import { listQuestions, submitResponses, getAggregates } from '../controllers/performanceController';

const router = Router();
router.use(authenticate);

router.get('/360/questions', authorize(['ADMIN','HR','EMPLOYEE']), listQuestions);
router.post('/360/responses', authorize(['ADMIN','HR','EMPLOYEE']), submitResponses);
router.get('/360/aggregates', authorize(['ADMIN','HR','EMPLOYEE']), getAggregates);

export default router;


