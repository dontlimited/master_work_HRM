import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth';
import { listPositions, createPosition, updatePosition, deletePosition } from '../controllers/positionController';

const router = Router();

router.use(authenticate);
router.get('/', listPositions);
router.post('/', authorize(['ADMIN', 'HR']), createPosition);
router.put('/:id', authorize(['ADMIN', 'HR']), updatePosition);
router.delete('/:id', authorize(['ADMIN', 'HR']), deletePosition);

export default router;


