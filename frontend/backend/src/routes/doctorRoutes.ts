import { Router } from 'express';
import { DoctorController } from '../controllers/DoctorController';
import { authMiddleware, requireRole } from '../middleware/auth';
import { UserRole } from '../entities/User';

const router = Router();

router.get('/encounters', authMiddleware, requireRole([UserRole.DOCTOR]), DoctorController.getEncounters);
router.post('/encounters/:id/clinical-notes', authMiddleware, requireRole([UserRole.DOCTOR]), DoctorController.addClinicalNote);
router.post('/encounters/:id/files', authMiddleware, requireRole([UserRole.DOCTOR]), DoctorController.uploadFile);

export default router;
