import React, { useEffect, useState } from 'react';
import { 
  BookOpen, 
  Activity, 
  Utensils, 
  Brain, 
  Target, 
  Wallet, 
  Layers, 
  Moon, 
  Zap,
  Calendar
} from 'lucide-react';
import HabitCard from './HabitCard';
import PlanningModal from './PlanningModal';
import { toggleActionStatus } from '../services/api';
import type { HabitCategory, PlannedAction } from '../services/api';
import { useHabits } from '../context/HabitContext';

/**
 * Dictionary mapping category names to their respective Lucide icons.
 */
const categoryIcons: Record<string, React.ReactElement> = {
  'Learning': <BookOpen className="h-6 w-6" />,
  'Physical Health': <Activity className="h-6 w-6" />,
  'Nutrition': <Utensils className="h-6 w-6" />,
  'Mindfulness': <Brain className="h-6 w-6" />,
  'Work / Focus': <Target className="h-6 w-6" />,
  'Finance': <Wallet className="h-6 w-6" />,
  'Organization': <Layers className="h-6 w-6" />,
  'Rest': <Moon className="h-6 w-6" />,
};

/**
 * HabitGrid Component
 * Displays the 8 habit categories and handles planning logic.
 */
const HabitGrid: React.FC = () => {
  const { categories, activeCycle, progress, todayLog, refreshProgress } = useHabits();
  
  // Selection state for planning
  const [selectedCategory, setSelectedCategory] = useState<HabitCategory | null>(null);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  // Optimistic UI state for plans
  const [optimisticPlans, setOptimisticPlans] = useState<PlannedAction[]>([]);
  
  useEffect(() => {
    if (todayLog?.plans) {
      setOptimisticPlans(todayLog.plans);
    }
  }, [todayLog?.plans]);

  const handleToggleAction = async (action: PlannedAction) => {
    const originalPlans = [...optimisticPlans];
    const newStatus = !action.isCompleted;
    
    // Optimistic update
    setOptimisticPlans(prev => prev.map(p => 
      p.id === action.id ? { ...p, isCompleted: newStatus } : p
    ));

    try {
      await toggleActionStatus(action.id, newStatus);
      await refreshProgress();
    } catch (error) {
      console.error('Failed to toggle action:', error);
      // Revert optimistic update
      setOptimisticPlans(originalPlans);
      alert('Failed to update task status.');
    }
  };

  const handlePlanningSuccess = async () => {
    await refreshProgress();
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 3000);
  };

  // Date Math logic: Calculate current sprint day locally
  let currentDayNumber = 1;
  if (activeCycle?.startDate) {
    const startDate = new Date(activeCycle.startDate).getTime();
    const today = Date.now();
    const diffTime = Math.abs(today - startDate);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    currentDayNumber = Math.max(1, Math.min(31, diffDays + 1));
  }

  // Fallback completion rate if progress API is slow
  const completionRate = progress?.stats?.overallCompletionRate || 0;

  return (
    <div className="relative space-y-8">
      {/* Cycle Progress Header */}
      <div className="mx-4 overflow-hidden rounded-2xl bg-white p-6 shadow-sm border border-gray-100 dark:bg-gray-900 dark:border-gray-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
              <Calendar className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Current Cycle</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Day {currentDayNumber} of 31</p>
            </div>
          </div>
          
          <div className="flex-1 max-w-md">
            <div className="flex justify-between mb-2 text-sm font-medium">
              <span className="text-gray-600 dark:text-gray-400">Overall Progress</span>
              <span className="text-purple-600 dark:text-purple-400">{completionRate}%</span>
            </div>
            <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden dark:bg-gray-800">
              <div 
                className="h-full bg-purple-600 transition-all duration-1000 ease-out"
                style={{ width: `${completionRate}%` }}
              />
            </div>
          </div>

          <div className="flex gap-8">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{progress?.stats?.daysLogged || 0}</p>
              <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Days Logged</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{progress?.stats?.completedActions || 0}</p>
              <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Actions Done</p>
            </div>
          </div>
        </div>
      </div>

      {/* Success Notification */}
      {showSuccessToast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[60] animate-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center gap-3 rounded-full bg-green-600 px-6 py-3 text-white shadow-xl">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="font-semibold text-sm">Goal saved for tomorrow!</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 p-4">
        {categories?.map((category) => (
          <HabitCard
            key={category.id}
            name={category.name}
            description={category.description}
            icon={categoryIcons[category.name] || <Zap className="h-6 w-6" />}
            onClick={() => setSelectedCategory(category)}
          />
        ))}
      </div>

      {/* Today's Actions Checklist */}
      <div className="mx-4 mb-8 overflow-hidden rounded-2xl bg-white p-6 shadow-sm border border-gray-100 dark:bg-gray-900 dark:border-gray-800 animate-in fade-in slide-in-from-bottom-4">
        <h3 className="mb-4 text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Target className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          Today's Specific Goals
        </h3>
        
        {optimisticPlans.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400 text-sm italic">
            You haven't set any specific goals for today. Click on a category above to plan for tomorrow!
          </p>
        ) : (
          <div className="space-y-3">
            {optimisticPlans.map((action) => {
              const category = categories.find(c => c.id === action.categoryId);
              return (
                <div 
                  key={action.id}
                  className="flex items-center gap-4 rounded-xl border border-gray-100 p-4 transition-all hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50"
                >
                  <button
                    onClick={() => handleToggleAction(action)}
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded border transition-colors ${
                      action.isCompleted 
                        ? 'border-purple-600 bg-purple-600 text-white' 
                        : 'border-gray-300 bg-white hover:border-purple-600 dark:border-gray-600 dark:bg-gray-900'
                    }`}
                  >
                    {action.isCompleted && (
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </button>
                  <div className="flex flex-col">
                    <span className={`text-sm font-medium ${action.isCompleted ? 'text-gray-400 line-through' : 'text-gray-900 dark:text-gray-100'}`}>
                      {action.description}
                    </span>
                    {category && (
                      <span className="text-xs text-purple-600 dark:text-purple-400 font-semibold mt-1">
                        {category.name}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Planning Form Modal */}
      {selectedCategory && (
        <PlanningModal
          category={selectedCategory}
          onClose={() => setSelectedCategory(null)}
          onSuccess={handlePlanningSuccess}
        />
      )}
    </div>
  );
};

export default HabitGrid;
