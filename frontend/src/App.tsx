import HabitGrid from './components/HabitGrid'
import './App.css'

function App() {
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
        <HabitGrid />
      </main>

      <footer className="mt-20 border-t border-gray-200 dark:border-gray-800 pt-8 text-center text-gray-400">
        <p>© 2026 Habit Tracker MVP - Built with React & Tailwind</p>
      </footer>
    </div>
  )
}

export default App
