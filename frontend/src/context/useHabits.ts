import { createContext, useContext } from 'react';
import type {
  Cycle,
  CycleProgressResponse,
  DailyLog,
  HabitCategory,
  InitialGoalInput,
} from '../services/api';

export interface HabitContextType {
  categories: HabitCategory[];
  activeCycle: Cycle | null;
  progress: CycleProgressResponse | null;
  todayLog: DailyLog | null;
  tomorrowLog: DailyLog | null;
  selectedDayNumber: number | null;
  selectedDayLog: DailyLog | null;
  setSelectedDayNumber: (day: number | null) => void;
  loading: boolean;
  error: string | null;
  refreshCycle: () => Promise<void>;
  refreshProgress: () => Promise<void>;
  refreshAll: () => Promise<void>;
  startSprint: (initialGoals?: InitialGoalInput[]) => Promise<Cycle>;
  saveGoal: (
    categoryId: string,
    description: string,
    targetDate?: 'today' | 'tomorrow',
    logId?: string
  ) => Promise<void>;
  editGoal: (
    actionId: string,
    payload: { description?: string; isCompleted?: boolean }
  ) => Promise<void>;
  removeGoal: (actionId: string) => Promise<void>;
  closeToday: (forceClose?: boolean) => Promise<void>;
}

export const HabitContext = createContext<HabitContextType | undefined>(undefined);

export const useHabits = (): HabitContextType => {
  const context = useContext(HabitContext);
  if (context === undefined) {
    throw new Error('useHabits must be used within a HabitProvider');
  }
  return context;
};
