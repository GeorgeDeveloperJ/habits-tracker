import { Router } from 'express';
import { register, login } from '../controllers/auth.controller';
import { validate, registerSchema, loginSchema } from '../middlewares/validate';

const router = Router();

// Route to register an user
router.post( '/register', validate(registerSchema), register );

// Route to login an user
router.post( '/login', validate(loginSchema), login );

export default router;