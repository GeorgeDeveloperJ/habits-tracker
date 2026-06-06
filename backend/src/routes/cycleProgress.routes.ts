import { Router } from 'express';
import { getCycleProgress } from '../controllers/cycleProgress.controller';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();

// Route to get cycle progress
router.get( '/:cycleId', authMiddleware, getCycleProgress );

export default router;