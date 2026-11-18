import { Router } from 'express';
import { createDay, getDays, updateDay } from '../controllers/day.controller';
import { authMiddleware } from '../middlewares/authMiddleware';
import { validate, createDaySchema, updateDaySchema } from '../middlewares/validate';

const router = Router();

// Route to create a day
router.post( '/', authMiddleware, validate(createDaySchema), createDay );

// Route to get all days
router.get( '/', authMiddleware, getDays );

// Route to update a day
router.patch( '/:id', authMiddleware, validate(updateDaySchema), updateDay );

export default router;