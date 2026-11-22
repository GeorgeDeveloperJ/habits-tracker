import nodemailer from 'nodemailer';

import { renderAuthEmail, type EmailLanguage } from './authEmailTemplate';

export type AuthEmailDelivery = (email: string, credential: string, expiresAt: Date, language?: EmailLanguage) => Promise<void>;

const smtpErrorCodes = new Set([
    'EAUTH', 'ECONNECTION', 'ECONNREFUSED', 'ECONNRESET', 'EDNS', 'EENVELOPE',
    'EMESSAGE', 'EPROTOCOL', 'ESOCKET', 'ETIMEDOUT', 'ETLS', 'EURL'
]);

export function smtpErrorCode(error: unknown): string {
    if (!(error instanceof Error)) return 'unknown';
    const { code, responseCode } = error as Error & { code?: unknown; responseCode?: unknown };
    const safeCode = typeof code === 'string' && smtpErrorCodes.has(code) ? code : 'unknown';
    return typeof responseCode === 'number' && Number.isInteger(responseCode) && responseCode >= 400 && responseCode <= 599
        ? `${safeCode}, SMTP ${responseCode}`
        : safeCode;
}

export function configureAuthEmail(env: NodeJS.ProcessEnv): {
    passwordReset: AuthEmailDelivery;
    verification: AuthEmailDelivery;
} | undefined {
    const { SMTP_URL, PASSWORD_RESET_FROM, PUBLIC_APP_URL } = env;
    if (!SMTP_URL && !PASSWORD_RESET_FROM && !PUBLIC_APP_URL) return undefined;
    if (!SMTP_URL || !PASSWORD_RESET_FROM || !PUBLIC_APP_URL) {
        throw new Error('SMTP_URL, PASSWORD_RESET_FROM and PUBLIC_APP_URL must be configured together');
    }

    let smtpUrl: URL;
    let appUrl: URL;
    try {
        smtpUrl = new URL(SMTP_URL);
        appUrl = new URL(PUBLIC_APP_URL);
    } catch {
        throw new Error('Invalid authentication email URL configuration');
    }

    if (!['smtp:', 'smtps:'].includes(smtpUrl.protocol) || !smtpUrl.username || !smtpUrl.password) {
        throw new Error('SMTP_URL must specify an authenticated SMTP server');
    }
    if (!['http:', 'https:'].includes(appUrl.protocol) || appUrl.username || appUrl.password ||
        appUrl.pathname !== '/' || appUrl.search || appUrl.hash ||
        (env.NODE_ENV === 'production' && appUrl.protocol !== 'https:')) {
        throw new Error('PUBLIC_APP_URL must be an origin using HTTPS in production');
    }

    const transport = nodemailer.createTransport({
        host: smtpUrl.hostname,
        port: smtpUrl.port ? Number(smtpUrl.port) : undefined,
        secure: smtpUrl.protocol === 'smtps:',
        requireTLS: true,
        auth: {
            user: decodeURIComponent(smtpUrl.username),
            pass: decodeURIComponent(smtpUrl.password)
        },
        connectionTimeout: 5000,
        greetingTimeout: 5000,
        socketTimeout: 10000
    });

    const send = (kind: 'reset' | 'verification'): AuthEmailDelivery =>
        async (email, credential, expiresAt, language = 'en') => {
            await transport.sendMail({
                from: PASSWORD_RESET_FROM,
                to: { address: email, name: '' },
                ...renderAuthEmail(kind, appUrl, credential, expiresAt, language)
            });
        };

    return { passwordReset: send('reset'), verification: send('verification') };
}
