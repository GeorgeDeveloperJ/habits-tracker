import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { 
  HabitCategory, 
  Cycle 
} from '../services/api';
import { 
  fetchHabitCategories, 
  fetchActiveCycle 
} from '../services/api';

interface HabitContextType {
  categories: HabitCategory[];
  activeCycle: Cycle | null;
  loading: boolean;
  error: string | null;
  refreshCycle: () => Promise<void>;
}

const HabitContext = createContext<HabitContextType | undefined>(undefined);

export const HabitProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [categories, setCategories] = useState<HabitCategory[]>([]);
  const [activeCycle, setActiveCycle] = useState<Cycle | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [categoriesData, cycleData] = await Promise.all([
        fetchHabitCategories(),
        fetchActiveCycle()
      ]);
      setCategories(categoriesData);
      setActiveCycle(cycleData);
    } catch (err) {
      console.error('Failed to initialize app data:', err);
      setError('Failed to load application data. Please make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const refreshCycle = async () => {
    try {
      const cycleData = await fetchActiveCycle();
      setActiveCycle(cycleData);
    } catch (err) {
      console.error('Failed to refresh cycle:', err);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  return (
    <HabitContext.Provider value={{ categories, activeCycle, loading, error, refreshCycle }}>
      {children}
    </HabitContext.Provider>
  );
};

export const useHabits = (): HabitContextType => {
  const context = useContext(HabitContext);
  if (context === undefined) {
    throw new Error('useHabits must be used within a HabitProvider');
  }
  return context;
};
