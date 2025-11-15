import { Router } from 'express';
import { login, me, register } from '../controllers/userController';
import { authenticate, authorize } from '../middlewares/auth';

const router = Router();

// Only authenticated ADMIN/HR can register new users
router.post('/register', authenticate, authorize(['ADMIN', 'HR']), register);
router.post('/login', login);
router.get('/me', authenticate, me);

export default router;


