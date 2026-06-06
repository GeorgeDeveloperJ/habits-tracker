import { useHabits } from '../context/HabitContext'
import HabitGrid from '../components/HabitGrid'
import StartSprintScreen from '../components/StartSprintScreen'
import { Loader2, Zap } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui/button'

export default function Tracker() {
  const { activeCycle, loading, error, refreshCycle } = useHabits();

  let content;

  if (loading) {
    content = (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-purple-600 dark:text-purple-400" />
      </div>
    );
  } else if (error) {
    content = (
      <div className="flex min-h-[400px] flex-col items-center justify-center p-6 text-center">
        <div className="mb-4 rounded-full bg-red-100 p-3 text-red-600 dark:bg-red-900/20 dark:text-red-400">
          <Zap className="h-8 w-8" />
        </div>
        <p className="text-gray-900 dark:text-gray-100 font-medium">{error}</p>
        <button 
          onClick={refreshCycle}
          className="mt-4 rounded-lg bg-purple-600 px-4 py-2 text-white hover:bg-purple-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  } else if (!activeCycle) {
    content = <StartSprintScreen />;
  } else {
    content = <HabitGrid />;
  }

  return (
    <>
      <header className="mb-12 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            <span className="block">31-Day Habit Tracker</span>
            <span className="block text-purple-400">Master Your Routine</span>
          </h1>
          <p className="mt-2 max-w-md text-base text-slate-400 sm:text-lg">
            Focus on 8 key habit categories. Set daily goals and track your progress through the cycle.
          </p>
        </div>
        <div>
          <Link to="/">
            <Button variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white">
              View Analytics Dashboard
            </Button>
          </Link>
        </div>
      </header>

      {content}
    </>
  )
}
