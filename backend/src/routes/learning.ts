import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth';
import {
  listCourses,
  createCourse,
  updateCourse,
  deleteCourse,
  listMyEnrollments,
  createEnrollment,
  updateEnrollment,
  deleteEnrollment,
  listMyCerts,
  createCertification,
  deleteCertification
} from '../controllers/learningController';

const router = Router();

router.use(authenticate);

// Courses (HR/Admin manage, all can list)
router.get('/courses', listCourses);
router.post('/courses', authorize(['ADMIN', 'HR']), createCourse);
router.put('/courses/:id', authorize(['ADMIN', 'HR']), updateCourse);
router.delete('/courses/:id', authorize(['ADMIN', 'HR']), deleteCourse);

// Enrollments (employees manage their own; HR/Admin can also manage)
router.get('/enrollments/my', listMyEnrollments);
router.post('/enrollments', createEnrollment);
router.put('/enrollments/:id', updateEnrollment);
router.delete('/enrollments/:id', deleteEnrollment);

// Certifications (HR/Admin issue; employees view their own)
router.get('/certifications/my', listMyCerts);
router.post('/certifications', authorize(['ADMIN', 'HR']), createCertification);
router.delete('/certifications/:id', authorize(['ADMIN', 'HR']), deleteCertification);

export default router;


