import { Router } from 'express';
import { TechnologistController } from '../controllers/TechnologistController';
import { authMiddleware, requireRole } from '../middleware/auth';
import { UserRole } from '../entities/User';

const router = Router();

router.get('/imaging', authMiddleware, requireRole([UserRole.TECHNOLOGIST]), TechnologistController.getImagingStudies);
router.get('/imaging/:id', authMiddleware, requireRole([UserRole.TECHNOLOGIST]), TechnologistController.getStudyById);

export default router;
