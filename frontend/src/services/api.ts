/**
 * Service layer for Habit Tracker API communication.
 * Adheres to the 31-Day Cycle data model.
 */

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
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
  const response = await fetch(`${API_URL}/habits`, {
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch habits: ${response.statusText}`);
  }

  const json = await response.json();
  return json.data || [];
};

// ==========================================
// CycleService
// ==========================================

export const fetchActiveCycle = async (): Promise<Cycle | null> => {
  const response = await fetch(`${API_URL}/cycles`);
  if (!response.ok) return null;
  
  const jsonResponse = await response.json();
  
  // El backend ya buscó el ciclo activo, solo lo retornamos
  return jsonResponse.data || null; 
};

export const startNewCycle = async (): Promise<Cycle> => {
  const response = await fetch(`${API_URL}/cycles`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`Failed to start cycle: ${response.statusText}`);
  }

  const json = await response.json();
  return json.data;
};

// ==========================================
// DailyLogService
// ==========================================

export const createDailyLog = async (cycleId: string): Promise<DailyLog> => {
  const response = await fetch(`${API_URL}/days`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cycleId }),
  });

  if (!response.ok) {
    throw new Error(`Failed to create daily log: ${response.statusText}`);
  }

  const json = await response.json();
  return json.data;
};

export const toggleDailyLogStatus = async (dayId: string, isClosed: boolean): Promise<DailyLog> => {
  const response = await fetch(`${API_URL}/days/${dayId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ isClosed }),
  });

  if (!response.ok) {
    throw new Error(`Failed to toggle daily log: ${response.statusText}`);
  }

  const json = await response.json();
  return json.data;
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
    const response = await fetch(`${API_URL}/cycle-progress/current`, {
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) return null;
    const json = await response.json();
    return { stats: json.stats, logs: json.logs || [] };
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
    const response = await fetch(`${API_URL}/goals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ categoryId, goal, date: 'tomorrow' }),
    });

    if (!response.ok) {
      throw new Error(`Failed to save goal: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error saving daily goal:', error);
    throw error;
  }
};

export const createAction = async (categoryId: string, description: string): Promise<PlannedAction> => {
  const response = await fetch(`${API_URL}/actions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ categoryId, description }),
  });

  if (!response.ok) {
    throw new Error(`Failed to create action: ${response.statusText}`);
  }

  const json = await response.json();
  return json.data;
};

export const toggleActionStatus = async (actionId: string, isCompleted: boolean): Promise<PlannedAction> => {
  const response = await fetch(`${API_URL}/actions/${actionId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ isCompleted }),
  });

  if (!response.ok) {
    throw new Error(`Failed to toggle action status: ${response.statusText}`);
  }

  const json = await response.json();
  return json.data;
};
