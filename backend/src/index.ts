import express, { Request, Response } from 'express';
import habitRoutes from './routes/habit.routes';

const app = express();
const PORT = process.env.PORT || 3000;


app.use( express.json() );

// Routes register
app.use( '/api/habits', habitRoutes );

// Route to check server health
app.get('/api/health', ( req, res ) => {
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