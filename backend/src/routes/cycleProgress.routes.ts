import { Router } from 'express';
import { getCycleProgress } from '../controllers/cycleProgress.controller';

const router = Router();

// Route to get cycle progress
router.get( '/:cycleId', getCycleProgress );

export default router;