import { Request, Response } from 'express';
import crypto from 'node:crypto';
import { prisma } from '../config/db';
import { hash, compare } from 'bcrypt';
import logger from '../config/logger';
import { smtpErrorCode, type AuthEmailDelivery } from '../config/authEmailDelivery';
import { sendSession, startEmailVerification } from './emailVerification.controller';

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

        const email = rawEmail.toLowerCase();
        const checkEmail = await prisma.user.findUnique({ where: { email } });
        if ( checkEmail ) {
            return res.status( 400 ).json({
                success: false,
                message: 'User already exists.'
            });
        }

        const hashedPassword = await hash(password, 10);
        return await startEmailVerification(req, res, { email, hashedPassword });
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

        const email = rawEmail.toLowerCase();
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

        if (!user.emailVerifiedAt) {
            return await startEmailVerification(req, res, { email, userId: user.id, sessionVersion: user.sessionVersion });
        }
        return sendSession(res, 200, 'Login successful', user);
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
        const deliver = req.app.locals.passwordResetDelivery as AuthEmailDelivery | undefined;
        if (!deliver) {
            return res.status(503).json({ success: false, message: 'Password recovery is temporarily unavailable.' });
        }

        const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
        if ( !email ) {
            return res.status( 400 ).json({
                success: false,
                message: 'Email is required.'
            });
        }

        const message = 'If an account with that email exists, password reset instructions have been generated.';
        const user = await prisma.user.findUnique({ where: { email } });

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

        res.status(200).json({ success: true, message, data: null });
        void deliver(user.email, rawToken, expiresAt, req.body.language).catch(async (error: unknown) => {
            logger.error(`Password reset email delivery failed (${smtpErrorCode(error)})`);
            await prisma.passwordResetToken.updateMany({
                where: { tokenHash, usedAt: null },
                data: { usedAt: new Date() }
            }).catch(() => logger.error('Failed to invalidate undelivered password reset token'));
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
                data: { hashedPassword, sessionVersion: { increment: 1 } }
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
