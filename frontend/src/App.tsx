import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { useHabits } from './context/HabitContext'
import HabitGrid from './components/HabitGrid'
import StartSprintScreen from './components/StartSprintScreen'
import { Loader2, Zap } from 'lucide-react'

// Import Auth Components
import Login from './components/auth/Login'
import Register from './components/auth/Register'
import ProtectedRoute from './components/auth/ProtectedRoute'
import { useAuthStore } from './store/authStore'

// The main application content has been extracted into a separate component
function HabitTrackerView() {
  const { activeCycle, loading, error, refreshCycle } = useHabits();
  const logout = useAuthStore((state) => state.logout);

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
      {/* Logout button at the top right */}
      <div className="max-w-7xl mx-auto flex justify-end mb-4">
        <button 
          onClick={logout}
          className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-[#1f2128] hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 hover:border-red-300 dark:hover:border-red-900/50 transition-all duration-200"
        >
          Logout
        </button>
      </div>

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

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Protected Dashboard Route */}
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <HabitTrackerView />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </Router>
  )
}

export default App
