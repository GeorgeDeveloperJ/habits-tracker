import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import type {
  Cycle,
  CycleProgressResponse,
  DailyLog,
  HabitCategory,
  InitialGoalInput,
} from '../services/api';
import {
  closeDailyLog,
  createAction,
  createDailyLog,
  deleteAction,
  fetchActiveCycle,
  fetchCycleProgress,
  fetchHabitCategories,
  startNewCycle,
  updateAction,
} from '../services/api';
import { useAuthStore } from '../store/authStore';
import { HabitContext, type HabitContextType } from './useHabits';

const findLogForUtcOffset = (logs: DailyLog[] | undefined, offsetDays = 0): DailyLog | null => {
  if (!logs?.length) return null;
  const target = new Date(Date.now() + offsetDays * 86_400_000);
  const targetYear = target.getUTCFullYear();
  const targetMonth = target.getUTCMonth();
  const targetDate = target.getUTCDate();
  return (
    logs.find((log) => {
      const d = new Date(log.date);
      return (
        d.getUTCFullYear() === targetYear &&
        d.getUTCMonth() === targetMonth &&
        d.getUTCDate() === targetDate
      );
    }) ?? null
  );
};

async function fetchAllHabitState(cachedCategories?: HabitCategory[]) {
  const [categoriesData, cycleData, initialProgressData] = await Promise.all([
    cachedCategories?.length ? Promise.resolve(cachedCategories) : fetchHabitCategories(),
    fetchActiveCycle(),
    fetchCycleProgress('current'),
  ]);

  let progressData = cycleData ? initialProgressData : null;

  if (cycleData && !progressData?.todayLog) {
    try {
      await createDailyLog(cycleData.id, 'today');
      progressData = await fetchCycleProgress('current');
    } catch (initErr) {
      console.warn('Today log initialization skipped:', initErr);
    }
  }

  return { categoriesData, cycleData, progressData };
}

export const HabitProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const token = useAuthStore((state) => state.token);

  const [categories, setCategories] = useState<HabitCategory[]>([]);
  const [activeCycle, setActiveCycle] = useState<Cycle | null>(null);
  const [progress, setProgress] = useState<CycleProgressResponse | null>(null);
  const [selectedDayNumber, setSelectedDayNumber] = useState<number | null>(null);
  const [loadedToken, setLoadedToken] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const categoriesRef = useRef<HabitCategory[]>([]);

  useEffect(() => {
    categoriesRef.current = token ? categories : [];
  }, [token, categories]);

  const applyAllData = useCallback(async (activeToken: string, cachedCategories?: HabitCategory[]) => {
    const { categoriesData, cycleData, progressData } = await fetchAllHabitState(cachedCategories);
    setCategories(categoriesData);
    setActiveCycle(cycleData);
    setProgress(progressData);
    setSelectedDayNumber(null);
    setError(null);
    setLoadedToken(activeToken);
  }, []);

  useEffect(() => {
    if (!token) {
      return;
    }

    let cancelled = false;

    const syncFromServer = async () => {
      try {
        const { categoriesData, cycleData, progressData } = await fetchAllHabitState();
        if (cancelled) return;
        setCategories(categoriesData);
        setActiveCycle(cycleData);
        setProgress(progressData);
        setSelectedDayNumber(null);
        setError(null);
        setLoadedToken(token);
      } catch (err) {
        if (cancelled) return;
        console.error('Failed to load habit tracker data:', err);
        setError('Failed to connect to the Habit Tracker API. Please verify the backend is running.');
        setLoadedToken(token);
      }
    };

    void syncFromServer();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const loadAllData = useCallback(async () => {
    if (!token) return;
    try {
      setRefreshing(true);
      setError(null);
      await applyAllData(token);
    } catch (err) {
      console.error('Failed to refresh habit tracker data:', err);
      setError('Failed to connect to the Habit Tracker API. Please verify the backend is running.');
    } finally {
      setRefreshing(false);
    }
  }, [token, applyAllData]);

  const refreshCycle = useCallback(async () => {
    await loadAllData();
  }, [loadAllData]);

  const progressRequest = useRef(0);
  const refreshProgress = useCallback(async () => {
    if (!token) return null;
    const request = ++progressRequest.current;
    const result = await fetchCycleProgress('current');
    if (request === progressRequest.current && useAuthStore.getState().token === token) {
      setProgress(result);
    }
    return result;
  }, [token]);

  useEffect(() => {
    if (!token) return;
    const refreshOnResume = async () => {
      if (document.visibilityState !== 'visible') return;
      const request = ++progressRequest.current;
      try {
        const { categoriesData, cycleData, progressData } = await fetchAllHabitState(categoriesRef.current);
        if (request !== progressRequest.current || useAuthStore.getState().token !== token) return;
        setCategories(categoriesData);
        setActiveCycle(cycleData);
        setProgress(progressData);
      } catch {
        // Keep the current screen and drafts if the connection is still unavailable.
      }
    };
    document.addEventListener('visibilitychange', refreshOnResume);
    return () => document.removeEventListener('visibilitychange', refreshOnResume);
  }, [token]);

  const startSprint = useCallback(
    async (initialGoals?: InitialGoalInput[]) => {
      const cycle = await startNewCycle(initialGoals);
      if (token) {
        await applyAllData(token, categoriesRef.current);
      }
      return cycle;
    },
    [token, applyAllData]
  );

  const saveGoal = useCallback(
    async (
      categoryId: string,
      description: string,
      targetDate: 'today' | 'tomorrow' = 'tomorrow',
      logId?: string
    ) => {
      await createAction({ categoryId, description, targetDate, logId });
    },
    []
  );

  const editGoal = useCallback(
    async (
      actionId: string,
      payload: { description?: string; isCompleted?: boolean }
    ) => {
      await updateAction(actionId, payload);
    },
    []
  );

  const removeGoal = useCallback(
    async (actionId: string) => {
      await deleteAction(actionId);
    },
    []
  );

  const effectiveCategories = useMemo(() => (token ? categories : []), [token, categories]);
  const effectiveActiveCycle = useMemo(() => (token ? activeCycle : null), [token, activeCycle]);
  const effectiveProgress = useMemo(() => (token ? progress : null), [token, progress]);
  const effectiveSelectedDay = token ? selectedDayNumber : null;
  const effectiveError = token ? error : null;
  const loading = Boolean(token) && (refreshing || loadedToken !== token);

  const todayLog = useMemo(() => {
    if (!effectiveProgress) return null;
    if (effectiveProgress.todayLog) return effectiveProgress.todayLog;
    return findLogForUtcOffset(effectiveProgress.logs, 0);
  }, [effectiveProgress]);

  const tomorrowLog = useMemo(() => {
    if (!effectiveProgress) return null;
    if (effectiveProgress.tomorrowLog) return effectiveProgress.tomorrowLog;
    return findLogForUtcOffset(effectiveProgress.logs, 1);
  }, [effectiveProgress]);

  const selectedDayLog = useMemo(() => {
    if (effectiveSelectedDay === null) {
      return todayLog;
    }
    const matchingSeries = effectiveProgress?.dailySeries?.find(
      (entry) => entry.dayNumber === effectiveSelectedDay
    );
    if (!matchingSeries) return null;
    return effectiveProgress?.logs?.find((log) => log.id === matchingSeries.logId) ?? null;
  }, [effectiveProgress, effectiveSelectedDay, todayLog]);

  const closeToday = useCallback(
    async (forceClose = false) => {
      if (!todayLog) {
        throw new Error('No active log found for today.');
      }
      await closeDailyLog(todayLog.id, true, forceClose);
    },
    [todayLog]
  );

  const value = useMemo<HabitContextType>(
    () => ({
      categories: effectiveCategories,
      activeCycle: effectiveActiveCycle,
      progress: effectiveProgress,
      todayLog,
      tomorrowLog,
      selectedDayNumber: effectiveSelectedDay,
      selectedDayLog,
      setSelectedDayNumber,
      loading,
      error: effectiveError,
      refreshCycle,
      refreshProgress,
      refreshAll: loadAllData,
      startSprint,
      saveGoal,
      editGoal,
      removeGoal,
      closeToday,
    }),
    [
      effectiveCategories,
      effectiveActiveCycle,
      effectiveProgress,
      todayLog,
      tomorrowLog,
      effectiveSelectedDay,
      selectedDayLog,
      loading,
      effectiveError,
      refreshCycle,
      refreshProgress,
      loadAllData,
      startSprint,
      saveGoal,
      editGoal,
      removeGoal,
      closeToday,
    ]
  );

  return <HabitContext.Provider value={value}>{children}</HabitContext.Provider>;
};
