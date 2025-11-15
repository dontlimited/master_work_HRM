import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth';
import { createEmployee, getEmployees, updateEmployee, deleteEmployee, archiveEmployee } from '../controllers/employeeController';

const router = Router();

router.use(authenticate);

router.get('/', authorize(['ADMIN', 'HR']), getEmployees);
router.post('/', authorize(['ADMIN', 'HR']), createEmployee);
router.put('/:id', authorize(['ADMIN', 'HR']), updateEmployee);
router.delete('/:id', authorize(['ADMIN', 'HR']), deleteEmployee);
router.patch('/:id/archive', authorize(['ADMIN', 'HR']), archiveEmployee);

export default router;


