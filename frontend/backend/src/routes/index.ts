import { Router } from 'express';
import authRoutes from './authRoutes';
import questionnaireRoutes from './questionnaireRoutes';
import encounterRoutes from './encounterRoutes';
import doctorRoutes from './doctorRoutes';
import technologistRoutes from './technologistRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/questionnaires', questionnaireRoutes);
router.use('/encounters', encounterRoutes);
router.use('/doctor', doctorRoutes);
router.use('/technologist', technologistRoutes);

export default router;
