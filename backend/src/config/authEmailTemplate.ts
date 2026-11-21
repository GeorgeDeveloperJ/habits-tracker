export type EmailLanguage = 'en' | 'es';
type EmailKind = 'reset' | 'verification';

const copy = {
    en: {
        reset: {
            title: 'Reset your password',
            subject: 'Reset your Kraken Habits password',
            instructions: 'Use the link below to choose a new password for your Kraken Habits account.',
            ignore: 'If you did not request a password reset, you can ignore this email.'
        },
        verification: {
            title: 'Verify your email',
            subject: 'Your Kraken Habits verification code',
            instructions: 'Enter this code in Kraken Habits to verify your email address.',
            ignore: 'If you did not request this code, you can ignore this email.'
        },
        expiry: 'Expires',
        fallback: 'If the button does not open, copy this link into your browser.'
    },
    es: {
        reset: {
            title: 'Restablece tu contraseña',
            subject: 'Restablece tu contraseña de Kraken Habits',
            instructions: 'Usa este enlace para elegir una nueva contraseña para tu cuenta de Kraken Habits.',
            ignore: 'Si no solicitaste restablecer tu contraseña, puedes ignorar este correo.'
        },
        verification: {
            title: 'Verifica tu correo',
            subject: 'Tu código de verificación de Kraken Habits',
            instructions: 'Ingresa este código en Kraken Habits para verificar tu dirección de correo.',
            ignore: 'Si no solicitaste este código, puedes ignorar este correo.'
        },
        expiry: 'Vence',
        fallback: 'Si el botón no funciona, copia este enlace en tu navegador.'
    }
};

function escapeHtml(value: string): string {
    return value.replaceAll('&', '&amp;').replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}

export function renderAuthEmail(kind: EmailKind, appUrl: URL, credential: string, expiresAt: Date, language: EmailLanguage) {
    const locale = copy[language];
    const { title, subject, instructions, ignore } = locale[kind];
    const expiration = new Intl.DateTimeFormat(language === 'es' ? 'es-DO' : 'en-US', {
        dateStyle: 'medium', timeStyle: 'short', timeZone: 'UTC'
    }).format(expiresAt);
    const expiry = `${locale.expiry}: ${expiration} UTC`;
    const logo = escapeHtml(new URL('/apple-touch-icon.png', appUrl).href);
    const resetUrl = new URL('/reset-password', appUrl);
    resetUrl.hash = new URLSearchParams({ token: credential }).toString();
    const isReset = kind === 'reset';
    const value = isReset ? resetUrl.href : credential;
    const safeValue = escapeHtml(value);
    const action = isReset
        ? `<a href="${safeValue}" style="display:inline-block;background:#E6FA72;color:#121212;padding:14px 22px;border-radius:24px;font-weight:bold;text-decoration:none">${title}</a>`
        : `<span style="display:inline-block;background:#E6FA72;color:#121212;padding:14px 20px;border-radius:14px;font:bold 30px/1.2 monospace;letter-spacing:4px">${safeValue}</span>`;
    const fallback = isReset
        ? `<p style="font-size:12px;margin:18px 0 0">${locale.fallback}<br><a href="${safeValue}" style="color:#3B4028;word-break:break-all">${safeValue}</a></p>`
        : '';

    return {
        subject,
        text: [title, instructions, value, expiry, ignore].join('\n\n'),
        html: `<!doctype html>
<html lang="${language}">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;background:#EBE6DC;color:#121212;font:16px/1.55 Arial,sans-serif">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#EBE6DC">
<tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;background:#FFFFFF;border:1px solid #DBD6CB;border-radius:24px">
<tr><td style="padding:28px">
<p style="margin:0 0 22px;font-weight:bold"><img src="${logo}" alt="" width="28" height="28" style="vertical-align:middle;border-radius:7px;margin-right:8px">Kraken Habits</p>
<h1 style="font-size:26px;line-height:1.2;margin:0 0 12px">${title}</h1>
<p style="margin:0 0 22px;color:#5A5850">${instructions}</p>
${action}
<p style="margin:16px 0 0;color:#5A5850;font-size:14px">${expiry}</p>
${fallback}
<p style="border-top:1px solid #EBE6DC;margin:24px 0 0;padding-top:14px;font-size:13px;color:#5A5850">${ignore}</p>
</td></tr></table></td></tr></table>
</body></html>`
    };
}
