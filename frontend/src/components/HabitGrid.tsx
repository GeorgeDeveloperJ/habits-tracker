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
  Zap 
} from 'lucide-react';
import HabitCard from './HabitCard';
import PlanningModal from './PlanningModal';
import { fetchHabitCategories } from '../services/api';
import type { HabitCategory } from '../services/api';

/**
 * Dictionary mapping category names to their respective Lucide icons.
 */
const categoryIcons: Record<string, JSX.Element> = {
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
 * Fetches and displays the 8 habit categories and handles planning logic.
 */
const HabitGrid: React.FC = () => {
  const [categories, setCategories] = useState<HabitCategory[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Selection state for planning
  const [selectedCategory, setSelectedCategory] = useState<HabitCategory | null>(null);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoading(true);
        const data = await fetchHabitCategories();
        setCategories(data);
        setError(null);
      } catch (err) {
        setError('Failed to load habit categories. Please ensure the backend is running.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadCategories();
  }, []);

  const handlePlanningSuccess = () => {
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 3000);
  };

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-purple-500 border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center p-6 text-center">
        <div className="mb-4 rounded-full bg-red-100 p-3 text-red-600 dark:bg-red-900/20 dark:text-red-400">
          <Zap className="h-8 w-8" />
        </div>
        <p className="text-gray-900 dark:text-gray-100 font-medium">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-4 rounded-lg bg-purple-600 px-4 py-2 text-white hover:bg-purple-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
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
