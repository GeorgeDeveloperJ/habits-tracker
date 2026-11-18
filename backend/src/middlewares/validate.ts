import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';

export const validate = (schema: ZodSchema) => {
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

export const registerSchema = z.object({
  email: z
    .string({ required_error: 'Email and password are required.' })
    .trim()
    .min(1, 'Email and password are required.')
    .email('Invalid email address.'),
  password: z
    .string({ required_error: 'Email and password are required.' })
    .min(6, 'Password must be at least 6 characters long.'),
});

export const loginSchema = z.object({
  email: z
    .string({ required_error: 'Email and password are required.' })
    .trim()
    .min(1, 'Email and password are required.')
    .email('Invalid email address.'),
  password: z
    .string({ required_error: 'Email and password are required.' })
    .min(1, 'Email and password are required.'),
});

export const forgotPasswordSchema = z.object({
  email: z
    .string({ required_error: 'Email is required.' })
    .trim()
    .min(1, 'Email is required.')
    .email('Invalid email address.'),
});

export const resetPasswordSchema = z.object({
  token: z
    .string({ required_error: 'Reset token is required.' })
    .trim()
    .min(1, 'Reset token is required.'),
  password: z
    .string({ required_error: 'Password is required.' })
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
    required_error: 'isClosed boolean is required',
    invalid_type_error: 'isClosed must be a boolean',
  }),
  forceClose: z.boolean().optional(),
});

export const createActionSchema = z.object({
  categoryId: z
    .string({ required_error: 'categoryId is required' })
    .trim()
    .min(1, 'categoryId is required'),
  description: z
    .string({ required_error: 'description is required' })
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
      .boolean({ invalid_type_error: 'isCompleted must be a boolean' })
      .optional(),
  })
  .refine((data) => data.description !== undefined || data.isCompleted !== undefined, {
    message: 'At least one of description or isCompleted must be provided',
  });
