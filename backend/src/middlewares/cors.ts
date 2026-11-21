import cors from 'cors';

const DEFAULT_CORS_ORIGINS = [
    'http://localhost:5173',
    'https://tauri.localhost',
    'tauri://localhost',
    'https://habits.krakenserv.dev',
    'https://habits-tracker-flame.vercel.app',
    'https://habitstracker-web.vercel.app',
    'https://habits-tracker-git-dev-george-santana-s-projects.vercel.app'
];

/**
 * Resolves allowed CORS origins from `CORS_ORIGINS` (comma-separated) or falls
 * back to the repository's default local, custom-domain, and Vercel origins.
 */
export function resolveCorsOrigins(env: NodeJS.ProcessEnv = process.env): string[] {
    const configured = env.CORS_ORIGINS
        ?.split(',')
        .map((origin) => origin.trim().replace(/\/+$/, ''))
        .filter(Boolean);

    if (configured && configured.length > 0) {
        return Array.from(new Set(configured));
    }

    return [...DEFAULT_CORS_ORIGINS];
}

export const createCorsMiddleware = (env: NodeJS.ProcessEnv = process.env) =>
    cors({
        origin: resolveCorsOrigins(env),
        methods: 'GET,POST,PUT,PATCH,DELETE',
        credentials: true
    });

export const corsMiddleware = createCorsMiddleware();
