import { Router } from 'express';
import { getCoreHabits } from '../controllers/habit.controller';

const router = Router();

// Route to get all habits
router.get( '/', getCoreHabits );

export default router;
