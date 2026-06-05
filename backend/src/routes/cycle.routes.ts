import { Router } from 'express';
import { startCycle, getCurrentCycle } from '../controllers/cycle.controller';

const router = Router();

// Route to start a cycle
router.post( '/', startCycle );

// Route to get current cycle
router.get( '/', getCurrentCycle );

export default router;
