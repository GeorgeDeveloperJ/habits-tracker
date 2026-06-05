import { useHabits } from './context/HabitContext'
import HabitGrid from './components/HabitGrid'
import StartSprintScreen from './components/StartSprintScreen'
import { Loader2, Zap } from 'lucide-react'

function App() {
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
    <div className="min-h-screen bg-gray-50 dark:bg-[#16171d] py-12 px-4 sm:px-6 lg:px-8">
      <header className="max-w-7xl mx-auto mb-12 text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-5xl md:text-6xl">
          <span className="block">31-Day Habit Tracker</span>
          <span className="block text-purple-600 dark:text-purple-400">Master Your Routine</span>
        </h1>
        <p className="mt-3 max-w-md mx-auto text-base text-gray-500 dark:text-gray-400 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
          Focus on 8 key habit categories. Set daily goals and track your progress through the cycle.
        </p>
      </header>

      <main className="max-w-7xl mx-auto">
        {content}
      </main>

      <footer className="mt-20 border-t border-gray-200 dark:border-gray-800 pt-8 text-center text-gray-400">
        <p>© 2026 Habit Tracker MVP - Built with React & Tailwind</p>
      </footer>
    </div>
  )
}

export default App
