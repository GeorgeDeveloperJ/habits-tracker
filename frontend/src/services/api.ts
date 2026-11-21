/**
 * Typed service layer for Proactive 31-Day Habit Tracker API communication.
 */
import apiClient from '../api/client';
import type { Language } from '../i18n/messages';

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
  userId?: string;
}

export interface CycleSummary {
  daysLogged: number;
  closedDays: number;
  totalActions: number;
  completedActions: number;
  overallCompletionRate: number;
}

export interface CycleHistoryItem extends Cycle {
  summary: CycleSummary;
}

export interface PlannedAction {
  id: string;
  categoryId: string;
  description: string;
  isCompleted: boolean;
  logId: string;
  createdAt?: string;
  updatedAt?: string;
  category?: HabitCategory;
}

export interface DailyLog {
  id: string;
  date: string;
  isClosed: boolean;
  cycleId: string;
  plans: PlannedAction[];
}

export interface CycleStats {
  cycleId: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  currentDayNumber: number;
  totalDays: number;
  daysLogged: number;
  closedDays: number;
  totalActions: number;
  completedActions: number;
  skippedActions: number;
  overallCompletionRate: number;
  currentStreak: number;
  bestStreak: number;
  todayPlannedCount: number;
  todayCompletedCount: number;
  tomorrowPlannedCount: number;
  canCloseToday: boolean;
}

export interface PillarStat {
  categoryId: string;
  categoryName: string;
  description: string | null;
  plannedCount: number;
  completedCount: number;
  skippedCount: number;
  completionRate: number;
  currentStreak: number;
}

export interface DailySeriesPoint {
  dayNumber: number;
  date: string;
  logId: string;
  isClosed: boolean;
  isToday: boolean;
  isTomorrow: boolean;
  planned: number;
  completed: number;
  skipped: number;
  completionRate: number;
}

export interface RecentActivityItem {
  id: string;
  type: 'completed' | 'planned';
  description: string;
  categoryId: string;
  categoryName: string;
  isCompleted: boolean;
  logId: string;
  date: string;
  timestamp: string;
}

export interface CycleProgressResponse {
  stats: CycleStats;
  logs: DailyLog[];
  todayLog: DailyLog | null;
  tomorrowLog: DailyLog | null;
  pillarStats: PillarStat[];
  dailySeries: DailySeriesPoint[];
  recentActivity: RecentActivityItem[];
}

export interface InitialGoalInput {
  categoryId: string;
  description: string;
}

interface AuthSession {
  token: string;
  id: string;
  email: string;
}

export interface VerificationChallenge {
  challengeId: string;
  email: string;
  deliveryFailed: boolean;
}

type VerificationRequired = { code: 'verification_required'; data: VerificationChallenge };
type SignInResult = VerificationRequired | { code?: undefined; data: AuthSession };
interface AuthCredentials {
  email: string;
  password: string;
  language: Language;
}

export async function startRegistration(credentials: AuthCredentials): Promise<VerificationChallenge> {
  const { data } = await apiClient.post<VerificationRequired>('/auth/register', credentials);
  if (data.code !== 'verification_required' || !data.data?.challengeId) {
    throw new Error('Invalid registration response');
  }
  return data.data;
}

export async function signIn(credentials: AuthCredentials): Promise<SignInResult> {
  const { data } = await apiClient.post<SignInResult>('/auth/login', credentials);
  return data;
}

export async function verifyEmail(challengeId: string, code: string): Promise<AuthSession> {
  const response = await apiClient.post<{ data: AuthSession }>('/auth/verify-email', { challengeId, code });
  return response.data.data;
}

export async function resendEmailVerification(challengeId: string, language: Language): Promise<VerificationChallenge> {
  const response = await apiClient.post<VerificationRequired>('/auth/resend-verification', { challengeId, language });
  return response.data.data;
}

export const requestPasswordReset = async (email: string, language: Language): Promise<void> => {
  await apiClient.post('/auth/forgot-password', { email: email.trim(), language });
};

export const resetPassword = async (payload: {
  token: string;
  password: string;
}): Promise<{ message: string }> => {
  const response = await apiClient.post('/auth/reset-password', {
    token: payload.token.trim(),
    password: payload.password,
  });
  return {
    message:
      response.data?.message ||
      'Password has been reset successfully. You can now sign in.',
  };
};

// ==========================================
// Habit Categories
// ==========================================

export const fetchHabitCategories = async (): Promise<HabitCategory[]> => {
  const response = await apiClient.get('/habits');
  return response.data?.data ?? [];
};

// ==========================================
// Cycles
// ==========================================

export const fetchActiveCycle = async (): Promise<Cycle | null> => {
  const response = await apiClient.get('/cycles');
  return response.data?.data ?? null;
};

export interface CycleHistoryPage {
  data: CycleHistoryItem[];
  nextCursor: string | null;
}

export const fetchCycleHistory = async (cursor?: string, signal?: AbortSignal): Promise<CycleHistoryPage> => {
  const response = await apiClient.get<CycleHistoryPage>('/cycles/history', {
    params: cursor ? { cursor } : undefined,
    signal,
  });
  return response.data;
};

export const startNewCycle = async (
  initialGoals?: InitialGoalInput[]
): Promise<Cycle> => {
  const payload = initialGoals && initialGoals.length > 0 ? { initialGoals } : {};
  const response = await apiClient.post('/cycles', payload);
  return response.data?.data;
};

// ==========================================
// Daily Logs
// ==========================================

export const createDailyLog = async (
  cycleId?: string,
  targetDate: 'today' | 'tomorrow' = 'today'
): Promise<DailyLog> => {
  const response = await apiClient.post('/days', {
    ...(cycleId ? { cycleId } : {}),
    targetDate,
  });
  return response.data?.data;
};

export const fetchDays = async (cycleId?: string): Promise<DailyLog[]> => {
  const response = await apiClient.get('/days', {
    params: cycleId ? { cycleId } : undefined,
  });
  return response.data?.data ?? [];
};

export const closeDailyLog = async (
  dayId: string,
  isClosed = true,
  forceClose = false
): Promise<DailyLog> => {
  const response = await apiClient.patch(`/days/${dayId}`, {
    isClosed,
    ...(forceClose ? { forceClose: true } : {}),
  });
  return response.data?.data;
};

// ==========================================
// Cycle Progress & Analytics
// ==========================================

export const fetchCycleProgress = async (
  cycleId = 'current'
): Promise<CycleProgressResponse | null> => {
  try {
    const response = await apiClient.get(`/cycle-progress/${cycleId}`);
    const payload = response.data?.data ?? response.data;
    if (!payload?.stats) return null;
    return {
      stats: payload.stats,
      logs: payload.logs ?? [],
      todayLog: payload.todayLog ?? null,
      tomorrowLog: payload.tomorrowLog ?? null,
      pillarStats: payload.pillarStats ?? [],
      dailySeries: payload.dailySeries ?? [],
      recentActivity: payload.recentActivity ?? [],
    };
  } catch (err: unknown) {
    const status = (err as { response?: { status?: number } })?.response?.status;
    if (status === 400 || status === 404) {
      return null;
    }
    throw err;
  }
};

// ==========================================
// Planned Actions
// ==========================================

export interface CreateActionPayload {
  categoryId: string;
  description: string;
  targetDate?: 'today' | 'tomorrow';
  logId?: string;
}

export const createAction = async (
  payload: CreateActionPayload
): Promise<PlannedAction> => {
  const response = await apiClient.post('/actions', payload);
  return response.data?.data;
};

export const updateAction = async (
  actionId: string,
  payload: { description?: string; isCompleted?: boolean }
): Promise<PlannedAction> => {
  const response = await apiClient.patch(`/actions/${actionId}`, payload);
  return response.data?.data;
};

export const toggleActionStatus = async (
  actionId: string,
  isCompleted: boolean
): Promise<PlannedAction> => {
  return updateAction(actionId, { isCompleted });
};

export const deleteAction = async (actionId: string): Promise<{ id: string }> => {
  const response = await apiClient.delete(`/actions/${actionId}`);
  return response.data?.data;
};
