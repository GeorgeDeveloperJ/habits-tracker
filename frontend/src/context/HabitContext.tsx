import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type {
  Cycle,
  CycleProgressResponse,
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

const isSameUtcDay = (dateIso: string, offsetDays = 0): boolean => {
  const target = new Date(Date.now() + offsetDays * 24 * 60 * 60 * 1000);
  const d = new Date(dateIso);
  return (
    d.getUTCFullYear() === target.getUTCFullYear() &&
    d.getUTCMonth() === target.getUTCMonth() &&
    d.getUTCDate() === target.getUTCDate()
  );
};

async function fetchAllHabitState() {
  const [categoriesData, cycleData] = await Promise.all([
    fetchHabitCategories(),
    fetchActiveCycle(),
  ]);

  let progressData = cycleData ? await fetchCycleProgress('current') : null;

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

  const applyAllData = useCallback(async (activeToken: string) => {
    const { categoriesData, cycleData, progressData } = await fetchAllHabitState();
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

  const refreshProgress = useCallback(async () => {
    if (!token) return;
    setProgress(await fetchCycleProgress('current'));
  }, [token]);

  const startSprint = useCallback(
    async (initialGoals?: InitialGoalInput[]) => {
      const cycle = await startNewCycle(initialGoals);
      if (token) {
        await applyAllData(token);
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
      await refreshProgress();
    },
    [refreshProgress]
  );

  const editGoal = useCallback(
    async (
      actionId: string,
      payload: { description?: string; isCompleted?: boolean }
    ) => {
      await updateAction(actionId, payload);
      await refreshProgress();
    },
    [refreshProgress]
  );

  const removeGoal = useCallback(
    async (actionId: string) => {
      await deleteAction(actionId);
      await refreshProgress();
    },
    [refreshProgress]
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
    if (!effectiveProgress.logs?.length) return null;
    return effectiveProgress.logs.find((log) => isSameUtcDay(log.date, 0)) ?? null;
  }, [effectiveProgress]);

  const tomorrowLog = useMemo(() => {
    if (!effectiveProgress) return null;
    if (effectiveProgress.tomorrowLog) return effectiveProgress.tomorrowLog;
    if (!effectiveProgress.logs?.length) return null;
    return effectiveProgress.logs.find((log) => isSameUtcDay(log.date, 1)) ?? null;
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
      await refreshProgress();
    },
    [todayLog, refreshProgress]
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
