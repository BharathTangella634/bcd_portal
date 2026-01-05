import { Router } from 'express';
import { EncounterController } from '../controllers/EncounterController';
import { authMiddleware, requireRole } from '../middleware/auth';
import { UserRole } from '../entities/User';

const router = Router();

router.post('/', authMiddleware, requireRole([UserRole.CLINIC]), EncounterController.create);
router.post('/:id/responses', authMiddleware, requireRole([UserRole.CLINIC]), EncounterController.upsertResponses);
router.get('/:id', authMiddleware, EncounterController.getById);

export default router;
