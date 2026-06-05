import { Router } from 'express';
import { createAction, toggleActionStatus } from '../controllers/actions.controller';

const router = Router();

// Route to create a new action
router.post( '/', createAction );

// Route to toggle action status
router.patch( '/:id', toggleActionStatus );

export default router;