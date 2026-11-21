import { Request, Response, NextFunction } from 'express';
import { z, ZodType } from 'zod';

export const validate = (schema: ZodType) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body ?? {});
    if (!result.success) {
      const firstIssue = result.error.issues[0];
      return res.status(400).json({
        success: false,
        message: firstIssue?.message || 'Validation failed',
        errors: result.error.issues,
      });
    }
    req.body = result.data;
    return next();
  };
};

const emailLanguage = z.enum(['en', 'es']).default('en');
const verificationChallengeId = z.string().uuid('Invalid verification challenge.');

export const verifyEmailSchema = z.object({
  challengeId: verificationChallengeId,
  code: z.string().trim().regex(/^\d{6}$/, 'Enter the six-digit verification code.'),
});

export const resendVerificationSchema = z.object({
  challengeId: verificationChallengeId,
  language: emailLanguage,
});

export const registerSchema = z.object({
  language: emailLanguage,
  email: z
    .string({ error: issue => issue.input === undefined ? 'Email and password are required.' : undefined })
    .trim()
    .min(1, 'Email and password are required.')
    .email('Invalid email address.'),
  password: z
    .string({ error: issue => issue.input === undefined ? 'Email and password are required.' : undefined })
    .min(6, 'Password must be at least 6 characters long.'),
});

export const loginSchema = z.object({
  language: emailLanguage,
  email: z
    .string({ error: issue => issue.input === undefined ? 'Email and password are required.' : undefined })
    .trim()
    .min(1, 'Email and password are required.')
    .email('Invalid email address.'),
  password: z
    .string({ error: issue => issue.input === undefined ? 'Email and password are required.' : undefined })
    .min(1, 'Email and password are required.'),
});

export const forgotPasswordSchema = z.object({
  language: emailLanguage,
  email: z
    .string({ error: issue => issue.input === undefined ? 'Email is required.' : undefined })
    .trim()
    .min(1, 'Email is required.')
    .email('Invalid email address.'),
});

export const resetPasswordSchema = z.object({
  token: z
    .string({ error: issue => issue.input === undefined ? 'Reset token is required.' : undefined })
    .trim()
    .min(1, 'Reset token is required.'),
  password: z
    .string({ error: issue => issue.input === undefined ? 'Password is required.' : undefined })
    .min(6, 'Password must be at least 6 characters long.'),
});

export const startCycleSchema = z
  .object({
    initialGoals: z
      .array(
        z.object({
          categoryId: z.string().trim().min(1, 'categoryId is required'),
          description: z.string().trim().min(1, 'Goal description cannot be empty').max(500),
        })
      )
      .optional(),
  })
  .optional();

export const createDaySchema = z.object({
  cycleId: z.string().uuid('Invalid cycleId format').optional(),
  targetDate: z.enum(['today', 'tomorrow']).optional(),
});

export const updateDaySchema = z.object({
  isClosed: z.boolean({
    error: issue => issue.input === undefined ? 'isClosed boolean is required' : 'isClosed must be a boolean',
  }),
  forceClose: z.boolean().optional(),
});

export const createActionSchema = z.object({
  categoryId: z
    .string({ error: issue => issue.input === undefined ? 'categoryId is required' : undefined })
    .trim()
    .min(1, 'categoryId is required'),
  description: z
    .string({ error: issue => issue.input === undefined ? 'description is required' : undefined })
    .trim()
    .min(1, 'Description cannot be empty')
    .max(500, 'Description must be 500 characters or fewer'),
  targetDate: z.enum(['today', 'tomorrow']).optional(),
  logId: z.string().uuid('Invalid logId format').optional(),
});

export const updateActionSchema = z
  .object({
    description: z
      .string()
      .trim()
      .min(1, 'Description cannot be empty')
      .max(500, 'Description must be 500 characters or fewer')
      .optional(),
    isCompleted: z
      .boolean({ error: 'isCompleted must be a boolean' })
      .optional(),
  })
  .refine((data) => data.description !== undefined || data.isCompleted !== undefined, {
    message: 'At least one of description or isCompleted must be provided',
  });
