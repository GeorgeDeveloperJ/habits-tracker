import { Router } from 'express';
import { createDay, getDays, updateDay } from '../controllers/day.controller';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();

// Route to create a day
router.post( '/', authMiddleware, createDay );

// Route to get all days
router.get( '/', authMiddleware, getDays );

// Route to update a day
router.patch( '/:id', authMiddleware, updateDay );

export default router;