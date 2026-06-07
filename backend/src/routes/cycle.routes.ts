import { Router } from 'express';
import { startCycle, getCurrentCycle } from '../controllers/cycle.controller';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();

// Route to start a cycle
router.post( '/', authMiddleware, startCycle );

// Route to get current cycle
router.get( '/', authMiddleware, getCurrentCycle );

export default router;
