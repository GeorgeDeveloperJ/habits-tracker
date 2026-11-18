import nodemailer from 'nodemailer';

export type PasswordResetDelivery = (email: string, token: string, expiresAt: Date) => Promise<void>;

const smtpErrorCodes = new Set([
    'EAUTH', 'ECONNECTION', 'ECONNREFUSED', 'ECONNRESET', 'EDNS', 'EENVELOPE',
    'EMESSAGE', 'EPROTOCOL', 'ESOCKET', 'ETIMEDOUT', 'ETLS', 'EURL'
]);

export function passwordResetDeliveryErrorCode(error: unknown): string {
    if (!(error instanceof Error)) return 'unknown';
    const { code, responseCode } = error as Error & { code?: unknown; responseCode?: unknown };
    const safeCode = typeof code === 'string' && smtpErrorCodes.has(code) ? code : 'unknown';
    return typeof responseCode === 'number' && Number.isInteger(responseCode) && responseCode >= 400 && responseCode <= 599
        ? `${safeCode}, SMTP ${responseCode}`
        : safeCode;
}

export function configurePasswordResetDelivery(env: NodeJS.ProcessEnv): PasswordResetDelivery | undefined {
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
        throw new Error('Invalid password recovery URL configuration');
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

    return async (email, token, expiresAt) => {
        const link = new URL('/reset-password', appUrl);
        link.hash = new URLSearchParams({ token }).toString();

        await transport.sendMail({
            from: PASSWORD_RESET_FROM,
            to: { address: email, name: '' },
            subject: 'Reset your Proactive31 password',
            text: [
                'Open this link to reset your Proactive31 password:',
                link.toString(),
                '',
                `This link expires at ${expiresAt.toISOString()}.`,
                'If you did not request a password reset, you can ignore this email.'
            ].join('\n')
        });
    };
}
