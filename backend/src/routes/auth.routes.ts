import { Router } from 'express';
import { register, login, forgotPassword, resetPassword } from '../controllers/auth.controller';
import {
  validate,
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../middlewares/validate';

const router = Router();

// Route to register an user
router.post( '/register', validate(registerSchema), register );

// Route to login an user
router.post( '/login', validate(loginSchema), login );

// Public routes for forgot / reset password
router.post( '/forgot-password', validate(forgotPasswordSchema), forgotPassword );
router.post( '/reset-password', validate(resetPasswordSchema), resetPassword );

export default router;