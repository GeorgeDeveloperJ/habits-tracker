import { Router } from 'express';
import { createAction, toggleActionStatus } from '../controllers/actions.controller';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = Router();

// Route to create a new action
router.post( '/', authMiddleware, createAction );

// Route to toggle action status
router.patch( '/:id', authMiddleware, toggleActionStatus );

export default router;