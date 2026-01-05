import { Router } from 'express';
import { QuestionnaireController } from '../controllers/QuestionnaireController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.get('/:code', authMiddleware, QuestionnaireController.getByCode);

export default router;
