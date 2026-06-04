import React from 'react';

interface HabitCardProps {
  name: string;
  description: string;
  icon?: React.ReactNode;
  onClick?: () => void;
}

/**
 * HabitCard Component
 * A minimalist card for displaying habit categories.
 */
const HabitCard: React.FC<HabitCardProps> = ({ name, description, icon, onClick }) => {
  return (
    <div 
      onClick={onClick}
      className="group relative overflow-hidden rounded-xl border border-gray-200 bg-white p-6 transition-all hover:shadow-lg dark:border-gray-800 dark:bg-gray-900 dark:hover:border-purple-500/50 cursor-pointer"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400">
          {icon || (
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
          )}
        </div>
      </div>
      
      <h3 className="mb-2 text-lg font-semibold text-gray-900 dark:text-gray-100 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
        {name}
      </h3>
      
      <p className="text-sm leading-relaxed text-gray-600 dark:text-gray-400">
        {description}
      </p>

      {/* Subtle bottom accent line */}
      <div className="absolute bottom-0 left-0 h-1 w-0 bg-purple-600 transition-all duration-300 group-hover:w-full" />
    </div>
  );
};

export default HabitCard;
