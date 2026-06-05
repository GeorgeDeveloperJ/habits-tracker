import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { 
  HabitCategory, 
  Cycle,
  CycleProgressResponse,
  DailyLog
} from '../services/api';
import { 
  fetchHabitCategories, 
  fetchActiveCycle,
  fetchCycleProgress,
  createDailyLog
} from '../services/api';

interface HabitContextType {
  categories: HabitCategory[];
  activeCycle: Cycle | null;
  progress: CycleProgressResponse | null;
  todayLog: DailyLog | null;
  loading: boolean;
  error: string | null;
  refreshCycle: () => Promise<void>;
  refreshProgress: () => Promise<void>;
}

const HabitContext = createContext<HabitContextType | undefined>(undefined);

export const HabitProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [categories, setCategories] = useState<HabitCategory[]>([]);
  const [activeCycle, setActiveCycle] = useState<Cycle | null>(null);
  const [progress, setProgress] = useState<CycleProgressResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const getTodayLogFromLogs = (logs: DailyLog[]) => {
    if (!logs || logs.length === 0) return null;
    const latestLog = logs[logs.length - 1];
    
    // Ensure the log is actually from today
    const logDate = new Date(latestLog.date).toDateString();
    const today = new Date().toDateString();
    
    if (logDate === today) {
      return latestLog;
    }
    
    return null;
  };

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);
      let [categoriesData, cycleData, progressData] = await Promise.all([
        fetchHabitCategories(),
        fetchActiveCycle(),
        fetchCycleProgress()
      ]);

      // Auto-initialize today's log if there's an active cycle but no log for today
      if (cycleData) {
        const todayLog = progressData ? getTodayLogFromLogs(progressData.logs) : null;
        if (!todayLog) {
          try {
            await createDailyLog(cycleData.id);
            // Refetch progress since we just created a new log
            progressData = await fetchCycleProgress();
          } catch (initErr) {
            console.warn('Daily log initialization skipped or failed:', initErr);
          }
        }
      }

      setCategories(categoriesData);
      setActiveCycle(cycleData);
      setProgress(progressData);
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

  const refreshProgress = async () => {
    try {
      const progressData = await fetchCycleProgress();
      setProgress(progressData);
    } catch (err) {
      console.error('Failed to refresh progress:', err);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const todayLog = progress ? getTodayLogFromLogs(progress.logs) : null;

  return (
    <HabitContext.Provider value={{ categories, activeCycle, progress, todayLog, loading, error, refreshCycle, refreshProgress }}>
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
