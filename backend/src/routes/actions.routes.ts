import { Router } from 'express';
import { createAction, updateAction, deleteAction } from '../controllers/actions.controller';
import { authMiddleware } from '../middlewares/authMiddleware';
import { validate, createActionSchema, updateActionSchema } from '../middlewares/validate';

const router = Router();

// Route to create a new action
router.post( '/', authMiddleware, validate(createActionSchema), createAction );

// Route to update/toggle an action
router.patch( '/:id', authMiddleware, validate(updateActionSchema), updateAction );

// Route to delete an action
router.delete( '/:id', authMiddleware, deleteAction );

export default router;