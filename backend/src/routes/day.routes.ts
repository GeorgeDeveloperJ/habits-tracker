import { Router } from 'express';
import { createDay, getDays, updateDay } from '../controllers/day.controller';

const router = Router();

// Route to create a day
router.post( '/', createDay );

// Route to get all days
router.get( '/', getDays );

// Route to update a day
router.patch( '/:id', updateDay );

export default router;