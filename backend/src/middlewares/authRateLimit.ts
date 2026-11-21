import { createHmac } from 'node:crypto';
import { Prisma } from '@prisma/client';
import type { RequestHandler } from 'express';
import { prisma } from '../config/db';
import logger from '../config/logger';

interface Rule {
    maxAttempts: number;
    windowSeconds: number;
}

const minute = 60;
const loginAccount = { maxAttempts: 10, windowSeconds: 15 * minute };
const recoveryAccount = { maxAttempts: 1, windowSeconds: minute };

export const authRateLimit = (
    action: 'register' | 'login' | 'recover' | 'reset' | 'verify-email' | 'resend-verification',
    maxSourceAttempts: number
): RequestHandler => async (req, res, next) => {
    try {
        const consume = async (kind: string, identifier: string, rule: Rule) => {
            const key = createHmac('sha256', process.env.JWT_SECRET as string)
                .update(JSON.stringify([action, kind, identifier])).digest('hex');
            const [bucket] = await prisma.$queryRaw<{ count: number; retryAfter: number }[]>`
                INSERT INTO "AuthRateBucket" ("key", "count", "expiresAt")
                VALUES (${key}, 1, statement_timestamp() + make_interval(secs => ${rule.windowSeconds}::int))
                ON CONFLICT ("key") DO UPDATE SET
                    "count" = CASE WHEN "AuthRateBucket"."expiresAt" <= statement_timestamp() THEN 1
                        ELSE LEAST("AuthRateBucket"."count" + 1, ${rule.maxAttempts + 1}::int) END,
                    "expiresAt" = CASE WHEN "AuthRateBucket"."expiresAt" <= statement_timestamp()
                        THEN EXCLUDED."expiresAt" ELSE "AuthRateBucket"."expiresAt" END
                RETURNING "count", ceil(EXTRACT(EPOCH FROM ("expiresAt" - statement_timestamp())))::int AS "retryAfter"
            `;
            return bucket.count > rule.maxAttempts ? Math.max(bucket.retryAfter, 1) : 0;
        };

        const source = (req.ip ?? 'unknown').replace(/^::ffff:(?=\d+\.)/, '');
        let retryAfter = await consume('source', source, { maxAttempts: maxSourceAttempts, windowSeconds: minute });
        const accountRule = action === 'login' ? loginAccount : action === 'recover' ? recoveryAccount : undefined;
        if (!retryAfter && accountRule && typeof req.body?.email === 'string') {
            retryAfter = await consume('email', req.body.email.trim().toLowerCase(), accountRule);
        }
        if (!retryAfter) return next();

        res.set('Retry-After', String(retryAfter));
        return res.status(429).json({ success: false, message: 'Too many attempts. Try again later.' });
    } catch (error) {
        const prismaCode = error instanceof Prisma.PrismaClientKnownRequestError ? error.code : 'unknown';
        const sqlState = error instanceof Prisma.PrismaClientKnownRequestError ? error.meta?.code : undefined;
        const code = typeof sqlState === 'string' && /^[0-9A-Z]{5}$/.test(sqlState)
            ? `${prismaCode}/${sqlState}`
            : prismaCode;
        logger.error(`Authentication rate limit check failed (${code})`);
        return res.status(503).json({ success: false, message: 'Authentication is temporarily unavailable.' });
    }
};
