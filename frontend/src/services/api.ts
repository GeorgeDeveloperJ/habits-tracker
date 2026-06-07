/**
 * Service layer for Habit Tracker API communication.
 * Adheres to the 31-Day Cycle data model.
 */

import apiClient from '../api/client';

/**
 * Interface representing a fixed habit category.
 */
export interface HabitCategory {
  id: string;
  name: string;
  description: string;
  icon?: string;
}

export interface Cycle {
  id: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

export interface PlannedAction {
  id: string;
  categoryId: string;
  description: string;
  isCompleted: boolean;
}

export interface DailyLog {
  id: string;
  date: string;
  isClosed: boolean;
  cycleId: string;
  plans: PlannedAction[];
}

/**
 * Interface for cycle progress statistics.
 */
export interface CycleStats {
  cycleId: string;
  currentDayNumber: number;
  daysLogged: number;
  completedActions: number;
  overallCompletionRate: number;
}

// ==========================================
// HabitService
// ==========================================

/**
 * Fetches the 8 fixed habit categories from the backend.
 * @returns A promise that resolves to an array of HabitCategory.
 */
export const fetchHabitCategories = async (): Promise<HabitCategory[]> => {
  const response = await apiClient.get('/habits');
  return response.data?.data || [];
};

// ==========================================
// CycleService
// ==========================================

export const fetchActiveCycle = async (): Promise<Cycle | null> => {
  try {
    const response = await apiClient.get('/cycles');
    return response.data?.data || null;
  } catch (error) {
    return null;
  }
};

export const startNewCycle = async (): Promise<Cycle> => {
  const response = await apiClient.post('/cycles');
  return response.data?.data;
};

// ==========================================
// DailyLogService
// ==========================================

export const createDailyLog = async (cycleId: string): Promise<DailyLog> => {
  const response = await apiClient.post('/days', { cycleId });
  return response.data?.data;
};

export const toggleDailyLogStatus = async (dayId: string, isClosed: boolean): Promise<DailyLog> => {
  const response = await apiClient.patch(`/days/${dayId}`, { isClosed });
  return response.data?.data;
};

// ==========================================
// ProgressService
// ==========================================

export interface CycleProgressResponse {
  stats: CycleStats;
  logs: DailyLog[];
}

/**
 * Fetches the progress of the current cycle.
 */
export const fetchCycleProgress = async (): Promise<CycleProgressResponse | null> => {
  try {
    const response = await apiClient.get('/cycle-progress/current');
    return {
      stats: response.data?.stats,
      logs: response.data?.logs || [],
    };
  } catch (error) {
    console.error('Error fetching cycle progress:', error);
    return null;
  }
};

/**
 * Saves a specific goal for a habit category.
 * Note: This currently targets /goals, which should map to PlannedActions on the backend.
 * @param categoryId - UUID of the habit category.
 * @param goal - The text description of the goal.
 */
export const saveDailyGoal = async (categoryId: string, goal: string): Promise<void> => {
  try {
    await apiClient.post('/goals', { categoryId, goal, date: 'tomorrow' });
  } catch (error) {
    console.error('Error saving daily goal:', error);
    throw error;
  }
};

export const createAction = async (categoryId: string, description: string): Promise<PlannedAction> => {
  const response = await apiClient.post('/actions', { categoryId, description });
  return response.data?.data;
};

export const toggleActionStatus = async (actionId: string, isCompleted: boolean): Promise<PlannedAction> => {
  const response = await apiClient.patch(`/actions/${actionId}`, { isCompleted });
  return response.data?.data;
};
