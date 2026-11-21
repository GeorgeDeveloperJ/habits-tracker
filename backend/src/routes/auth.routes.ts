import { Router } from 'express';
import { register, login, forgotPassword, resetPassword } from '../controllers/auth.controller';
import { resendVerification, verifyEmail } from '../controllers/emailVerification.controller';
import {
  validate,
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  resendVerificationSchema,
} from '../middlewares/validate';

import { authRateLimit } from '../middlewares/authRateLimit';

const router = Router();

// Route to register an user
router.post( '/register', authRateLimit('register', 60), validate(registerSchema), register );

// Route to login an user
router.post( '/login', authRateLimit('login', 60), validate(loginSchema), login );
router.post( '/verify-email', authRateLimit('verify-email', 120), validate(verifyEmailSchema), verifyEmail );
router.post( '/resend-verification', authRateLimit('resend-verification', 30), validate(resendVerificationSchema), resendVerification );

// Public routes for forgot / reset password
router.post( '/forgot-password', authRateLimit('recover', 30), validate(forgotPasswordSchema), forgotPassword );
router.post( '/reset-password', authRateLimit('reset', 30), validate(resetPasswordSchema), resetPassword );

export default router;
