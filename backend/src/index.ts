import express, { Request, Response } from 'express';
import { corsMiddleware } from './middlewares/cors';
import habitRoutes from './routes/habit.routes';
import cycleRoutes from './routes/cycle.routes';
import dayRoutes from './routes/day.routes';
import cycleProgressRoutes from './routes/cycleProgress.routes';
import actionRoutes from './routes/actions.routes';

const app = express();
const PORT = process.env.PORT || 3000;

// Global middlewares
app.use( corsMiddleware );
app.use( express.json() );

// Routes register
app.use( '/api/habits', habitRoutes );
app.use( '/api/cycles', cycleRoutes );
app.use( '/api/days', dayRoutes );
app.use( '/api/cycle-progress', cycleProgressRoutes );
app.use( '/api/actions', actionRoutes );

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

app.listen( PORT, () => {
  console.log(`Server is running url: http://localhost:${PORT}`)
})

export interface HabitCategory {
  id: string,
  name: string
}

export interface PlannedAction {
  id: string,
  habitCategoryId: string,
  specificGoal: string,
  isCompleted: boolean
}

export interface DailyLog {
  id: string,
  date: Date,
  actions: PlannedAction[],
  isPlannedForTomorrow: boolean
}