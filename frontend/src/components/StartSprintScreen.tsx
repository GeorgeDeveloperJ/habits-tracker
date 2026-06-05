import React, { useState } from 'react';
import { Rocket, AlertTriangle, Loader2 } from 'lucide-react';
import { startNewCycle } from '../services/api';
import { useHabits } from '../context/HabitContext';

const StartSprintScreen: React.FC = () => {
  const { refreshCycle } = useHabits();
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStartSprint = async () => {
    try {
      setIsStarting(true);
      setError(null);
      // Attempt to start a new cycle
      await startNewCycle();
      
      // Artificial delay might be needed here if the backend race condition is severe, 
      // but let's try to immediately refresh the cycle state first.
      await refreshCycle();
    } catch (err: any) {
      console.error('Failed to start sprint:', err);
      // Handling race condition or timeout here
      setError(err.message || 'An error occurred while starting your sprint. Please try again.');
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <div className="mb-8 p-6 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
        <Rocket className="w-16 h-16" />
      </div>
      
      <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white sm:text-4xl">
        Ready for your next 31-Day Sprint?
      </h2>
      
      <p className="mt-4 text-lg text-gray-500 dark:text-gray-400 max-w-2xl">
        Commit to mastering your routine. Focus on the 8 key pillars of your life for the next 31 days to build lasting, positive habits.
      </p>

      {error && (
        <div className="mt-6 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-center gap-3 text-red-700 dark:text-red-400 max-w-md w-full text-left">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}

      <button
        onClick={handleStartSprint}
        disabled={isStarting}
        className="mt-10 inline-flex items-center gap-2 px-8 py-4 border border-transparent text-lg font-bold rounded-xl shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-70 disabled:cursor-not-allowed transition-all"
      >
        {isStarting ? (
          <>
            <Loader2 className="w-6 h-6 animate-spin" />
            Initializing Sprint...
          </>
        ) : (
          <>
            <Rocket className="w-6 h-6" />
            Start Sprint Now
          </>
        )}
      </button>
    </div>
  );
};

export default StartSprintScreen;
