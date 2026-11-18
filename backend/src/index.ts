import express, { Request, Response } from 'express';
import { corsMiddleware } from './middlewares/cors';
import habitRoutes from './routes/habit.routes';
import cycleRoutes from './routes/cycle.routes';
import dayRoutes from './routes/day.routes';
import cycleProgressRoutes from './routes/cycleProgress.routes';
import actionRoutes from './routes/actions.routes';
import authRoutes from './routes/auth.routes';

import { prisma } from './config/db';
import { configurePasswordResetDelivery } from './config/passwordResetDelivery';

const app = express();
const trustedProxies = process.env.TRUSTED_PROXY_CIDRS?.split(',').map(value => value.trim()).filter(Boolean);
if (trustedProxies?.length) app.set('trust proxy', trustedProxies);
app.locals.passwordResetDelivery = configurePasswordResetDelivery(process.env);
const PORT = Number(process.env.PORT) || 3000;

if (process.env.NODE_ENV === 'production' && (process.env.JWT_SECRET?.length ?? 0) < 32) {
  throw new Error('JWT_SECRET must contain at least 32 characters in production');
}

// Global middlewares
app.use( corsMiddleware );
app.use( express.json() );

// Routes register
app.use( '/api/habits', habitRoutes );
app.use( '/api/cycles', cycleRoutes );
app.use( '/api/days', dayRoutes );
app.use( '/api/cycle-progress', cycleProgressRoutes );
app.use( '/api/actions', actionRoutes );
app.use( '/api/auth', authRoutes );
// Main route
app.get('/', ( req: Request, res: Response ) => {
  res.status(200).json({
    message: "Welcome to the Habit Tracker API! Use /api/habits to manage your habits."
  })
});

// Route to check server health
app.get('/api/health', ( req: Request, res: Response ) => {
  res.status(200).json({
    status: "success",
    message: "Habit tracker API is running"
  })
})

app.get('/api/ready', async (_req, res) => {
  try {
    const [database] = await prisma.$queryRaw<{ canWriteRateBuckets: boolean }[]>`
      SELECT has_table_privilege('"AuthRateBucket"', 'INSERT')
        AND has_table_privilege('"AuthRateBucket"', 'UPDATE') AS "canWriteRateBuckets",
        (SELECT "count" FROM "AuthRateBucket" LIMIT 0),
        (SELECT "sessionVersion" FROM "User" LIMIT 0)
    `;
    if (!database?.canWriteRateBuckets) {
      return res.status(503).json({ status: 'unavailable' });
    }
    res.status(200).json({ status: 'ready' });
  } catch {
    res.status(503).json({ status: 'unavailable' });
  }
});

if (process.env.NODE_ENV !== 'test') {
  app.listen( PORT, '0.0.0.0', () => {
    console.log(`Server is running url: http://localhost:${PORT}`)
  });
}

export { app };
export default app;
