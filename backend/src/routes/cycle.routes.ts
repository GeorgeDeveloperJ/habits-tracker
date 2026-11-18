import { Router } from 'express';
import { startCycle, getCurrentCycle, getCycleHistory } from '../controllers/cycle.controller';
import { authMiddleware } from '../middlewares/authMiddleware';
import { validate, startCycleSchema } from '../middlewares/validate';

const router = Router();

// Route to start a cycle (supports both / and /start)
router.post( '/', authMiddleware, validate(startCycleSchema), startCycle );
router.post( '/start', authMiddleware, validate(startCycleSchema), startCycle );

// Route to get cycle history
router.get( '/history', authMiddleware, getCycleHistory );

// Route to get current cycle (supports both / and /current)
router.get( '/', authMiddleware, getCurrentCycle );
router.get( '/current', authMiddleware, getCurrentCycle );

export default router;
