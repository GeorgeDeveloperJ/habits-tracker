import { Request, Response } from 'express';
import crypto from 'node:crypto';
import { prisma } from '../config/db';
import { hash, compare } from 'bcrypt';
import { sign } from 'jsonwebtoken';
import logger from '../config/logger';

const hashResetToken = (token: string): string => {
    return crypto.createHash('sha256').update(token).digest('hex');
};

export const register = async ( req: Request, res: Response ) => {
    try {
        const rawEmail = typeof req.body?.email === 'string' ? req.body.email.trim() : '';
        const password = typeof req.body?.password === 'string' ? req.body.password : '';
        if ( ! ( rawEmail && password ) ) {
            return res.status( 400 ).json({
                success: false,
                message: 'Email and password are required.'
            });
        }

        const email = rawEmail;
        const checkEmail = await prisma.user.findUnique({ where: { email } });
        if ( checkEmail ) {
            return res.status( 400 ).json({
                success: false,
                message: 'User already exists.'
            });
        }

        const hashedPassword = await hash(password, 10);
        const user = await prisma.user.create({ data: { email, hashedPassword } });
        const token = sign({ id: user.id }, process.env.JWT_SECRET as string, { expiresIn: '7d' });

        return res.status( 201 ).json({
            success: true,
            message: 'User created successfully',
            data: { token, id: user.id, email: user.email }
        });
    } catch ( error ) {
        logger.error( `Error registering user: ${(error as Error).message}` );
        return res.status( 500 ).json({
            success: false,
            message: 'Error registering'
        });
    }
};

export const login = async ( req: Request, res: Response ) => {
    try {
        const rawEmail = typeof req.body?.email === 'string' ? req.body.email.trim() : '';
        const password = typeof req.body?.password === 'string' ? req.body.password : '';
        if ( ! ( rawEmail && password ) ) {
            return res.status( 400 ).json({
                success: false,
                message: 'Email and password are required.'
            });
        }

        const email = rawEmail;
        const user = await prisma.user.findUnique({ where: { email } });
        if ( !user ) {
            return res.status( 401 ).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        const isMatch = await compare(password, user.hashedPassword);
        if ( !isMatch ) {
            return res.status( 401 ).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        const token = sign({ id: user.id }, process.env.JWT_SECRET as string, { expiresIn: '7d' });

        return res.status( 200 ).json({
            success: true,
            message: 'Login successful',
            data: { token, id: user.id, email: user.email }
        });

    } catch (error) {
        logger.error(`Error logging in user: ${(error as Error).message}`);
        return res.status(500).json({
            success: false,
            message: 'Error logging in'
        });
    }
};

export const forgotPassword = async ( req: Request, res: Response ) => {
    try {
        const email = typeof req.body?.email === 'string' ? req.body.email.trim() : '';
        if ( !email ) {
            return res.status( 400 ).json({
                success: false,
                message: 'Email is required.'
            });
        }

        const message = 'If an account with that email exists, password reset instructions have been generated.';
        const user = await prisma.user.findFirst({
            where: { email: { equals: email, mode: 'insensitive' } }
        });

        if ( !user ) {
            return res.status( 200 ).json({
                success: true,
                message,
                data: null
            });
        }

        const ttlMinutes = Number(process.env.PASSWORD_RESET_TTL_MINUTES) || 15;
        const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);
        const rawToken = crypto.randomBytes(32).toString('hex');
        const tokenHash = hashResetToken(rawToken);

        await prisma.$transaction(async (tx) => {
            const now = new Date();
            await tx.passwordResetToken.updateMany({
                where: { userId: user.id, usedAt: null },
                data: { usedAt: now }
            });
            await tx.passwordResetToken.create({
                data: {
                    userId: user.id,
                    tokenHash,
                    expiresAt
                }
            });
        });

        const shouldExposeToken =
            process.env.NODE_ENV !== 'production' || process.env.EXPOSE_RESET_TOKEN === 'true';

        if ( shouldExposeToken ) {
            logger.info(`Password reset link for ${user.email}: /reset-password?token=${rawToken}`);
            return res.status( 200 ).json({
                success: true,
                message,
                data: {
                    resetToken: rawToken,
                    expiresAt: expiresAt.toISOString()
                }
            });
        }

        return res.status( 200 ).json({
            success: true,
            message,
            data: null
        });
    } catch (error) {
        logger.error(`Error generating password reset: ${(error as Error).message}`);
        return res.status(500).json({
            success: false,
            message: 'Error processing password reset request'
        });
    }
};

export const resetPassword = async ( req: Request, res: Response ) => {
    try {
        const token = typeof req.body?.token === 'string' ? req.body.token.trim() : '';
        const password = typeof req.body?.password === 'string' ? req.body.password : '';
        if ( !token || password.length < 6 ) {
            return res.status( 400 ).json({
                success: false,
                message: 'Valid reset token and new password (at least 6 characters) are required.'
            });
        }

        const tokenHash = hashResetToken(token);

        const outcome = await prisma.$transaction(async (tx) => {
            const now = new Date();
            const record = await tx.passwordResetToken.findUnique({
                where: { tokenHash }
            });

            if ( !record || record.usedAt !== null || record.expiresAt <= now ) {
                return { valid: false as const };
            }

            const claimed = await tx.passwordResetToken.updateMany({
                where: {
                    id: record.id,
                    usedAt: null,
                    expiresAt: { gt: now }
                },
                data: { usedAt: now }
            });

            if ( claimed.count !== 1 ) {
                return { valid: false as const };
            }

            const hashedPassword = await hash(password, 10);
            await tx.user.update({
                where: { id: record.userId },
                data: { hashedPassword }
            });

            await tx.passwordResetToken.updateMany({
                where: { userId: record.userId, usedAt: null },
                data: { usedAt: now }
            });

            return { valid: true as const };
        });

        if ( !outcome.valid ) {
            return res.status( 400 ).json({
                success: false,
                message: 'Invalid or expired password reset token.'
            });
        }

        return res.status( 200 ).json({
            success: true,
            message: 'Password has been reset successfully. You can now sign in.',
            data: null
        });
    } catch (error) {
        logger.error(`Error resetting password: ${(error as Error).message}`);
        return res.status(500).json({
            success: false,
            message: 'Error resetting password'
        });
    }
};