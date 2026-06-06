import { Router } from 'express';
import { getCoreHabits } from '../controllers/habit.controller';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();

// Route to get all habits
router.get( '/', authMiddleware, getCoreHabits );

export default router;
