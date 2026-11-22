import { createHmac, randomInt, randomUUID } from 'node:crypto';
import type { Request, Response } from 'express';
import { sign } from 'jsonwebtoken';
import { Prisma, type User } from '@prisma/client';
import { prisma } from '../config/db';
import logger from '../config/logger';
import { smtpErrorCode, type AuthEmailDelivery } from '../config/authEmailDelivery';

const codeLifetime = 10 * 60_000;
const resendCooldown = 60_000;
const challengeLifetime = 24 * 60 * 60_000;
const maxAttempts = 5;
const invalidCode = 'Invalid or expired verification code. Request a new code if needed.';

type Signup = { email: string; hashedPassword: string };
type SignIn = Pick<User, 'email' | 'sessionVersion'> & { userId: string };

export function sendSession(res: Response, status: number, message: string, user: Pick<User, 'id' | 'email' | 'sessionVersion'>) {
    const token = sign({ id: user.id, version: user.sessionVersion }, process.env.JWT_SECRET as string, { expiresIn: '7d' });
    return res.status(status).json({ success: true, message, data: { token, id: user.id, email: user.email } });
}

function codeDigest(challengeId: string, code: string) {
    return createHmac('sha256', process.env.JWT_SECRET as string)
        .update(`email-verification:${challengeId}:${code}`).digest('hex');
}

function generateCode(challengeId: string, previousDigest?: string): { code: string; digest: string } {
    const code = randomInt(1_000_000).toString().padStart(6, '0');
    const digest = codeDigest(challengeId, code);
    return digest === previousDigest ? generateCode(challengeId, previousDigest) : { code, digest };
}

async function deliverCode(
    req: Request, res: Response, deliver: AuthEmailDelivery, challengeId: string,
    email: string, code: string, digest: string, expiresAt: Date
) {
    let deliveryFailed = false;
    try {
        await deliver(email, code, expiresAt, req.body.language);
    } catch (error) {
        deliveryFailed = true;
        logger.error(`Verification email delivery failed (${smtpErrorCode(error)})`);
        await prisma.emailVerificationChallenge.updateMany({
            where: { id: challengeId, codeDigest: digest },
            data: { expiresAt: new Date() }
        });
    }

    return res.status(202).json({
        success: true,
        code: 'verification_required',
        data: { challengeId, email, deliveryFailed }
    });
}

function emailUnavailable(res: Response) {
    return res.status(503).json({ success: false, message: 'Email verification is temporarily unavailable.' });
}

function rateLimited(res: Response, retryAfter: number) {
    res.set('Retry-After', String(retryAfter));
    return res.status(429).json({ success: false, message: 'Too many attempts. Try again later.' });
}

export async function startEmailVerification(req: Request, res: Response, account: Signup | SignIn) {
    const deliver = req.app.locals.emailVerificationDelivery as AuthEmailDelivery | undefined;
    if (!deliver) return emailUnavailable(res);

    const { email } = account;
    const id = randomUUID();
    const { code, digest } = generateCode(id);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + codeLifetime);
    const retryUntil = new Date(now.getTime() + challengeLifetime);
    const lastSendCutoff = new Date(now.getTime() - resendCooldown);
    const hashedPassword = 'hashedPassword' in account ? account.hashedPassword : null;
    const userId = 'userId' in account ? account.userId : null;
    const sessionVersion = 'sessionVersion' in account ? account.sessionVersion : null;

    await prisma.emailVerificationChallenge.deleteMany({ where: { retryUntil: { lte: now } } });
    const [claimed] = await prisma.$queryRaw<{ id: string }[]>`
        INSERT INTO "EmailVerificationChallenge"
          ("id", "email", "hashedPassword", "userId", "sessionVersion", "codeDigest", "attemptsLeft", "sentAt", "expiresAt", "retryUntil")
        VALUES (
          ${id}, ${email}, ${hashedPassword}, ${userId}, ${sessionVersion}, ${digest}, ${maxAttempts},
          ${now}::timestamptz AT TIME ZONE 'UTC',
          ${expiresAt}::timestamptz AT TIME ZONE 'UTC',
          ${retryUntil}::timestamptz AT TIME ZONE 'UTC'
        )
        ON CONFLICT ("email") DO UPDATE SET
          "id" = EXCLUDED."id", "hashedPassword" = EXCLUDED."hashedPassword", "userId" = EXCLUDED."userId",
          "sessionVersion" = EXCLUDED."sessionVersion", "codeDigest" = EXCLUDED."codeDigest",
          "attemptsLeft" = EXCLUDED."attemptsLeft", "sentAt" = EXCLUDED."sentAt",
          "expiresAt" = EXCLUDED."expiresAt", "retryUntil" = EXCLUDED."retryUntil"
        WHERE "EmailVerificationChallenge"."sentAt" <= (${lastSendCutoff}::timestamptz AT TIME ZONE 'UTC')
        RETURNING "id"
    `;
    if (!claimed) return rateLimited(res, resendCooldown / 1000);

    return deliverCode(req, res, deliver, id, email, code, digest, expiresAt);
}

export async function resendVerification(req: Request, res: Response) {
    try {
        const deliver = req.app.locals.emailVerificationDelivery as AuthEmailDelivery | undefined;
        if (!deliver) return emailUnavailable(res);

        const id: string = req.body.challengeId;
        const previous = await prisma.emailVerificationChallenge.findUnique({ where: { id } });
        const now = new Date();
        if (!previous || previous.retryUntil <= now) {
            return res.status(400).json({ success: false, message: 'Verification expired. Start again to request a new code.' });
        }

        const wait = previous.sentAt.getTime() + resendCooldown - now.getTime();
        if (wait > 0) return rateLimited(res, Math.ceil(wait / 1000));

        const { code, digest } = generateCode(id, previous.codeDigest);
        const expiresAt = new Date(now.getTime() + codeLifetime);
        const claimed = await prisma.emailVerificationChallenge.updateMany({
            where: { id, codeDigest: previous.codeDigest },
            data: { codeDigest: digest, attemptsLeft: maxAttempts, sentAt: now, expiresAt }
        });
        if (claimed.count !== 1) return rateLimited(res, resendCooldown / 1000);

        return await deliverCode(req, res, deliver, id, previous.email, code, digest, expiresAt);
    } catch {
        logger.error('Could not resend verification email');
        return res.status(500).json({ success: false, message: 'Unable to resend verification code. Please try again.' });
    }
}

export async function verifyEmail(req: Request, res: Response) {
    const { challengeId: id, code } = req.body as { challengeId: string; code: string };
    const digest = codeDigest(id, code);
    try {
        const session = await prisma.$transaction(async (tx) => {
            const challenge = await tx.emailVerificationChallenge.findUnique({ where: { id } });
            if (!challenge) return null;

            const now = new Date();
            const available = { id, codeDigest: challenge.codeDigest, expiresAt: { gt: now }, attemptsLeft: { gt: 0 } };
            if (challenge.codeDigest !== digest) {
                await tx.emailVerificationChallenge.updateMany({
                    where: available,
                    data: { attemptsLeft: { decrement: 1 } }
                });
                return null;
            }

            const claimed = await tx.emailVerificationChallenge.deleteMany({ where: available });
            if (claimed.count !== 1) return null;

            if (challenge.hashedPassword !== null) {
                const user = await tx.user.create({
                    data: { email: challenge.email, hashedPassword: challenge.hashedPassword, emailVerifiedAt: now }
                });
                return { user, signup: true };
            }

            if (challenge.userId === null || challenge.sessionVersion === null) return null;
            const [user] = await tx.user.updateManyAndReturn({
                where: { id: challenge.userId, email: challenge.email, sessionVersion: challenge.sessionVersion, emailVerifiedAt: null },
                data: { emailVerifiedAt: now }
            });
            return user ? { user, signup: false } : null;
        });

        if (!session) return res.status(400).json({ success: false, message: invalidCode });
        return sendSession(res, session.signup ? 201 : 200, 'Email verified successfully.', session.user);
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
            return res.status(400).json({ success: false, message: 'User already exists.' });
        }
        logger.error('Could not verify email');
        return res.status(500).json({ success: false, message: 'Unable to verify email. Please try again.' });
    }
}
