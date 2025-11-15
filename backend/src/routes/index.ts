import { Router } from 'express';
import authRoutes from './users';
import employeeRoutes from './employees';
import timeRoutes from './time';
import documentRoutes from './documents';
import recruitmentRoutes from './recruitment';
import learningRoutes from './learning';
import analyticsRoutes from './analytics';
import departmentRoutes from './departments';
import positionsRoutes from './positions';
import performanceRoutes from './performance';

const router = Router();

router.use('/users', authRoutes);
router.use('/employees', employeeRoutes);
router.use('/time', timeRoutes);
router.use('/documents', documentRoutes);
router.use('/recruitment', recruitmentRoutes);
router.use('/learning', learningRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/departments', departmentRoutes);
router.use('/positions', positionsRoutes);
router.use('/performance', performanceRoutes);

export default router;


