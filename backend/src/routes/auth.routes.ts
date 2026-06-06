import { Router } from 'express';
import { register, login } from '../controllers/auth.controller';

const router = Router();

// Route to register an user
router.post( '/register', register );

// Route to login an user
router.post( '/login', login );

export default router;