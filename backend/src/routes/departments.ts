import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth';
import { listDepartments, orgTree, createDepartment, updateDepartment, deleteDepartment } from '../controllers/departmentController';

const router = Router();

router.use(authenticate);

router.get('/', authorize(['ADMIN', 'HR']), listDepartments);
router.get('/org', authorize(['ADMIN', 'HR']), orgTree);
router.post('/', authorize(['ADMIN', 'HR']), createDepartment);
router.put('/:id', authorize(['ADMIN', 'HR']), updateDepartment);
router.delete('/:id', authorize(['ADMIN', 'HR']), deleteDepartment);

export default router;


