import React, { useState } from 'react';
import { saveDailyGoal } from '../services/api';
import type { HabitCategory } from '../services/api';

interface PlanningModalProps {
  category: HabitCategory;
  onClose: () => void;
  onSuccess: () => void;
}

/**
 * PlanningModal Component
 * A modal form for inputting a specific goal for tomorrow.
 */
const PlanningModal: React.FC<PlanningModalProps> = ({ category, onClose, onSuccess }) => {
  const [goal, setGoal] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goal.trim()) return;

    try {
      setIsSubmitting(true);
      setError(null);
      await saveDailyGoal(category.id, goal);
      onSuccess();
      onClose();
    } catch (err) {
      setError('Failed to save your goal. Please try again.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-800 dark:bg-gray-900 animate-in fade-in zoom-in duration-200">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              Plan Tomorrow
            </h2>
            <button 
              onClick={onClose}
              className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="mb-6">
            <span className="inline-flex items-center rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
              {category.name}
            </span>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              {category.description}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="goal" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                What is your specific goal for tomorrow?
              </label>
              <textarea
                id="goal"
                autoFocus
                required
                rows={3}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 p-4 text-gray-900 placeholder-gray-400 focus:border-purple-500 focus:ring-purple-500 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-100 dark:placeholder-gray-600 outline-none transition-all"
                placeholder="e.g., Run 5km at 7:00 AM, Read 20 pages..."
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                {error}
              </p>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-xl border border-gray-200 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-800 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !goal.trim()}
                className="flex-1 rounded-xl bg-purple-600 py-3 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-purple-500/20"
              >
                {isSubmitting ? 'Saving...' : 'Set Goal'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PlanningModal;
