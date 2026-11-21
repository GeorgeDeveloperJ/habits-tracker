import { translateFeedback, translatePillarText } from '../i18n/messages';
import { useLanguage } from '../i18n/useLanguage';
import React, { useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  Check,
  CheckCircle2,
  Clock,
  Flame,
  Loader2,
  Lock,
  Pencil,
  Plus,
  Rocket,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { CommandDialGlyph } from './icons/BrandMark';
import { SprintFinisherSeal } from './icons/MilestoneBadges';
import { useHabits } from '../context/useHabits';
import { getPillarMeta } from '../lib/pillars';
import { runTrackerWrite } from '../context/trackerWrite';
import type { CycleProgressResponse, PlannedAction } from '../services/api';
import {
  ConcentricRing,
  DotMatrixRibbon,
  SegmentedBattery,
  type DotMatrixDay,
} from './charts/HardwareViz';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Input } from './ui/input';

const HabitGrid: React.FC = () => {
  const { language, locale, t } = useLanguage();
  const {
    categories,
    activeCycle,
    progress,
    todayLog,
    tomorrowLog,
    selectedDayNumber,
    selectedDayLog,
    setSelectedDayNumber,
    saveGoal,
    editGoal,
    removeGoal,
    closeToday,
    startSprint,
    refreshProgress,
  } = useHabits();

  const writing = useRef(false);
  const [pendingWrite, setPendingWrite] = useState<{
    confirmed: boolean;
    cycleId: string | undefined;
    matches: (snapshot: CycleProgressResponse) => boolean;
    onSaved?: () => void;
  } | null>(null);
  const [refreshingStatus, setRefreshingStatus] = useState(false);
  const [draftDay, setDraftDay] = useState(() => new Date().toISOString().slice(0, 10));
  const [rollover, setRollover] = useState<string | null>(null);
  const [todayDrafts, setTodayDrafts] = useState<Record<string, string>>({});
  const [tomorrowDrafts, setTomorrowDrafts] = useState<Record<string, string>>({});
  const [editingActionId, setEditingActionId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [isWritingAction, setIsWritingAction] = useState(false);
  const [isClosingDay, setIsClosingDay] = useState(false);
  const [isRollingOver, setIsRollingOver] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string; values: (string | number)[] } | null>(
    null
  );

  const writeControlsDisabled = Boolean(pendingWrite) || isWritingAction || isClosingDay || isRollingOver;
  const stats = progress?.stats;
  const currentDayNumber = stats?.currentDayNumber ?? 1;
  const effectiveSelectedDay = selectedDayNumber ?? currentDayNumber;
  const isInspectingHistory =
    selectedDayNumber !== null && selectedDayNumber !== currentDayNumber;
  const isInspectingTomorrow =
    selectedDayNumber !== null && selectedDayNumber === currentDayNumber + 1;
  const isInspectingFuture =
    selectedDayNumber !== null && selectedDayNumber > currentDayNumber;

  const displayedLog = isInspectingHistory
    ? (selectedDayLog ?? (isInspectingTomorrow ? tomorrowLog : null))
    : todayLog;
  const isDisplayedDayClosed = Boolean(displayedLog?.isClosed);
  const canMutateDisplayedDay = !isInspectingHistory && Boolean(todayLog) && !todayLog?.isClosed;

  const totalPillars = categories.length || 8;
  const tomorrowPlannedCount = stats?.tomorrowPlannedCount ?? 0;
  const canCloseToday = Boolean(stats?.canCloseToday) && !todayLog?.isClosed;
  const overallRate = stats?.overallCompletionRate ?? 0;
  const todayPlannedCount = stats?.todayPlannedCount ?? 0;
  const todayCompletedCount = stats?.todayCompletedCount ?? 0;
  const todayCompletionRate =
    todayPlannedCount > 0 ? Math.round((todayCompletedCount / todayPlannedCount) * 100) : 0;

  const isDay31Completed =
    currentDayNumber >= 31 && Boolean(todayLog?.isClosed);

  const showToast = (type: 'success' | 'error', message: string, ...values: (string | number)[]) => {
    const notification = { type, message, values };
    setFeedback(notification);
    setTimeout(() => {
      setFeedback((prev) => (prev === notification ? null : prev));
    }, 3500);
  };

  const daySeriesMap = useMemo(() => {
    const map = new Map<
      number,
      { isClosed: boolean; isToday: boolean; isTomorrow: boolean; planned: number; completed: number }
    >();
    progress?.dailySeries?.forEach((item) => {
      map.set(item.dayNumber, item);
    });
    return map;
  }, [progress]);

  const ribbonDays: DotMatrixDay[] = useMemo(
    () =>
      Array.from({ length: 31 }, (_, idx) => {
        const dayNumber = idx + 1;
        const info = daySeriesMap.get(dayNumber);
        return {
          dayNumber,
          isClosed: Boolean(info?.isClosed),
          isToday: dayNumber === currentDayNumber,
          isTomorrow: dayNumber === currentDayNumber + 1 && (info?.planned ?? 0) > 0,
          isLogged: Boolean(info),
          isSelected: dayNumber === effectiveSelectedDay,
          completionRate: info
            ? Math.round((info.completed / Math.max(1, info.planned)) * 100)
            : undefined,
        };
      }),
    [daySeriesMap, currentDayNumber, effectiveSelectedDay]
  );

  const displayedPlansByCategory = useMemo(() => {
    const map = new Map<string, PlannedAction>();
    displayedLog?.plans?.forEach((p) => {
      map.set(p.categoryId, p);
    });
    return map;
  }, [displayedLog]);

  const tomorrowPlansByCategory = useMemo(() => {
    const map = new Map<string, PlannedAction>();
    tomorrowLog?.plans?.forEach((p) => {
      map.set(p.categoryId, p);
    });
    return map;
  }, [tomorrowLog]);

  const writeAndRefresh = async (
    write: () => Promise<unknown>,
    matches: (snapshot: CycleProgressResponse) => boolean,
    onSaved?: () => void,
  ) => {
    const result = await runTrackerWrite(write, async () => {
      if (!(await refreshProgress())) throw new Error('Cycle unavailable');
    });
    if (result === 'saved') onSaved?.();
    else setPendingWrite({ confirmed: result === 'saved-stale', cycleId: activeCycle?.id, matches, onSaved });
  };

  const refreshWriteStatus = async () => {
    if (!pendingWrite || refreshingStatus) return;
    setRefreshingStatus(true);
    try {
      const snapshot = await refreshProgress();
      if (!snapshot) throw new Error('Cycle unavailable');
      if (pendingWrite.confirmed || (pendingWrite.cycleId === snapshot.stats.cycleId && pendingWrite.matches(snapshot))) {
        pendingWrite.onSaved?.();
      } else {
        showToast('error', 'The change is not in the latest server state. Review it before retrying.');
      }
      setPendingWrite(null);
    } catch {
      showToast('error', 'Unable to refresh status. Check your connection and try again.');
    } finally {
      setRefreshingStatus(false);
    }
  };

  const handleSaveInline = async (
    categoryId: string,
    targetDate: 'today' | 'tomorrow'
  ) => {
    const drafts = targetDate === 'today' ? todayDrafts : tomorrowDrafts;
    const text = (drafts[categoryId] ?? '').trim();
    if (!text || pendingWrite || writing.current) return;
    const utcNow = new Date();
    const currentUtcDay = utcNow.toISOString().slice(0, 10);
    if (draftDay !== currentUtcDay) {
      setRollover(currentUtcDay);
      return;
    }
    const targetLog = targetDate === 'today' ? todayLog : tomorrowLog;
    const intendedDay = new Date(utcNow.getTime() + (targetDate === 'tomorrow' ? 86_400_000 : 0))
      .toISOString().slice(0, 10);

    try {
      writing.current = true;
      setIsWritingAction(true);
      await writeAndRefresh(
        () => saveGoal(categoryId, text, targetDate, targetLog?.date.startsWith(intendedDay) ? targetLog.id : undefined),
        (snapshot) => snapshot.logs.some((log) => log.date.startsWith(intendedDay) &&
          log.plans.some((plan) => plan.categoryId === categoryId && plan.description === text)),
        () => {
          const clearDraft = (drafts: Record<string, string>) =>
            drafts[categoryId]?.trim() === text ? { ...drafts, [categoryId]: '' } : drafts;
          (targetDate === 'today' ? setTodayDrafts : setTomorrowDrafts)(clearDraft);
          showToast('success', targetDate === 'today' ? "Today's goal added." : "Tomorrow's pillar planned.");
        },
      );
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      showToast('error', msg || 'Unable to save goal.');
    } finally {
      writing.current = false;
      setIsWritingAction(false);
    }
  };

  const handleToggle = async (action: PlannedAction) => {
    if (!canMutateDisplayedDay || pendingWrite || writing.current) return;
    try {
      writing.current = true;
      setIsWritingAction(true);
      await writeAndRefresh(
        () => editGoal(action.id, { isCompleted: !action.isCompleted }),
        (snapshot) => snapshot.logs.some((log) => log.plans.some(
          (plan) => plan.id === action.id && plan.isCompleted === !action.isCompleted,
        )),
      );
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      showToast('error', msg || 'Failed to update status.');
    } finally {
      writing.current = false;
      setIsWritingAction(false);
    }
  };

  const beginEdit = (action: PlannedAction) => {
    setEditingActionId(action.id);
    setEditingText(action.description);
  };

  const commitEdit = async (action: PlannedAction) => {
    if (pendingWrite || writing.current) return;
    const trimmed = editingText.trim();
    if (!trimmed) {
      showToast('error', 'Goal description cannot be empty.');
      return;
    }
    if (trimmed === action.description) {
      setEditingActionId(null);
      return;
    }
    try {
      writing.current = true;
      setIsWritingAction(true);
      await writeAndRefresh(
        () => editGoal(action.id, { description: trimmed }),
        (snapshot) => snapshot.logs.some((log) => log.plans.some(
          (plan) => plan.id === action.id && plan.description === trimmed,
        )),
        () => {
          setEditingActionId(null);
          showToast('success', 'Goal updated.');
        },
      );
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      showToast('error', msg || 'Failed to edit goal.');
    } finally {
      writing.current = false;
      setIsWritingAction(false);
    }
  };

  const handleDelete = async (actionId: string) => {
    if (pendingWrite || writing.current) return;
    try {
      writing.current = true;
      setIsWritingAction(true);
      await writeAndRefresh(
        () => removeGoal(actionId),
        (snapshot) => !snapshot.logs.some((log) => log.plans.some((plan) => plan.id === actionId)),
        () => showToast('success', 'Goal removed.'),
      );
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      showToast('error', msg || 'Failed to remove goal.');
    } finally {
      writing.current = false;
      setIsWritingAction(false);
    }
  };

  const handleCloseDay = async () => {
    if (!todayLog || pendingWrite || writing.current) return;
    try {
      writing.current = true;
      setIsClosingDay(true);
      await writeAndRefresh(
        () => closeToday(false),
        (snapshot) => snapshot.logs.some((log) => log.id === todayLog.id && log.isClosed),
        () => showToast('success', 'Day {0} closed & tomorrow locked!', String(currentDayNumber).padStart(2, '0')),
      );
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      showToast(
        'error',
        msg || 'Unable to close the day.'
      );
    } finally {
      writing.current = false;
      setIsClosingDay(false);
    }
  };

  const handleStartNextSprint = async () => {
    if (pendingWrite || writing.current) return;
    try {
      writing.current = true;
      setIsRollingOver(true);
      await startSprint();
      showToast('success', 'New 31-Day Sprint initialized!');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      showToast('error', msg || 'Failed to roll over sprint.');
    } finally {
      writing.current = false;
      setIsRollingOver(false);
    }
  };

  return (
    <div className="space-y-4">
      {pendingWrite && (
        <div role="status" className="flex flex-wrap items-center gap-3 rounded-2xl border p-4">
          <p>{t(pendingWrite.confirmed
            ? 'Saved. Refresh to see the latest progress.'
            : 'Save status is unknown. Refresh before retrying.')}</p>
          <Button type="button" onClick={refreshWriteStatus} disabled={refreshingStatus}>{t('Refresh status')}</Button>
        </div>
      )}
      {rollover && (
        <div role="status" className="flex flex-wrap items-center gap-3 rounded-2xl border p-4">
          <p>{t('Your drafts were started on {0} UTC. Today is now {1} UTC.', draftDay, rollover)}</p>
          <Button type="button" onClick={() => {
            setDraftDay(rollover);
            setRollover(null);
          }}>{t('Use drafts for the new day')}</Button>
        </div>
      )}
      {/* Editorial Command Center Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono-tabular text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
            {t("31-Day Proactive Discipline · 8 Core Pillars")}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="text-4xl sm:text-[44px] font-semibold tracking-[-0.03em] leading-[1.06] text-[var(--text-primary)]">
              {t("Daily")}{' '}
              <span className="inline-flex align-middle items-center justify-center rounded-full bg-[#E6FA72] px-3.5 py-1 text-[#121212] dark:bg-orchid dark:text-[#0D0914]">
                <CommandDialGlyph className="h-5 w-5" />
              </span>{' '}
              {t("Command")}
            </h1>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#121212] px-3.5 py-1 font-mono-tabular text-xs font-semibold text-[#E6FA72] dark:border dark:border-white/10 dark:bg-[#231B38] dark:text-orchid">
              {t("DAY")} {String(currentDayNumber).padStart(2, '0')} / 31
            </span>
          </div>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            {t("Execute today's commitments on the left and lock tomorrow's 8-pillar plan on the right.")}
          </p>
        </div>

        {activeCycle && (
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[var(--border-hairline)] bg-[var(--bg-card)] px-4 py-2 font-mono-tabular text-[11px] font-medium text-[var(--text-secondary)]">
            <span className="h-1.5 w-1.5 rounded-full bg-complete" />
            {t("Started")} {new Date(activeCycle.startDate).toLocaleDateString(locale)}
          </div>
        )}
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          role="status"
          className={`flex items-center justify-between gap-3 rounded-[24px] border px-4 py-3 text-sm font-medium ${
            feedback.type === 'success'
              ? 'border-complete/50 bg-complete/15 text-[#121212] dark:border-complete/35 dark:bg-complete/15 dark:text-complete'
              : 'border-[#DC2626]/35 bg-[#DC2626]/10 text-[#DC2626] dark:border-[#F87171]/35 dark:bg-[#F87171]/15 dark:text-[#F87171]'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0" />
            )}
            <span>{translateFeedback(language, feedback.message, ...feedback.values)}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            aria-label={t("Dismiss notification")}
            className="flex h-7 w-7 items-center justify-center rounded-full opacity-75 hover:bg-black/5 hover:opacity-100 dark:hover:bg-white/10 cursor-pointer"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Day 31 Completion Celebration Bento Card */}
      {isDay31Completed && (
        <Card variant="emerald" className="p-6 sm:p-7">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <SprintFinisherSeal className="h-16 w-16 shrink-0" />
              <div>
                <p className="font-mono-tabular text-[10px] font-semibold uppercase tracking-[0.14em] opacity-75">
                  {t("Sprint Milestone Complete")}
                </p>
                <h2 className="mt-1 text-xl font-semibold tracking-[-0.02em]">
                  {t("31-Day Sprint Completed!")}
                </h2>
                <p className="mt-1 text-sm opacity-85">
                  {t('You finished with {0}% completion ({1}/{2} actions) and a best streak of {3}d.',
                    overallRate, stats?.completedActions ?? 0, stats?.totalActions ?? 0, stats?.bestStreak ?? 0)}
                </p>
              </div>
            </div>
            <Button
              type="button"
              size="lg"
              onClick={handleStartNextSprint}
              disabled={writeControlsDisabled}
              className="bg-[#121212] text-[#F4F4F2] hover:bg-[#262624] dark:bg-complete dark:text-[#0D0914] dark:hover:bg-complete-hover"
            >
              {isRollingOver ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t("Starting Next Sprint...")}
                </>
              ) : (
                <>
                  <Rocket className="h-4 w-4" />
                  {t("Start Next 31-Day Sprint")}
                </>
              )}
            </Button>
          </div>
        </Card>
      )}

      {/* Asymmetrical 12-Column Bento Telemetry Header */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-12">
        {/* 1. 31-Day DotMatrixRibbon Day Inspector (xl:col-span-5) */}
        <div className="min-w-0 md:col-span-2 xl:col-span-5 flex flex-col justify-between rounded-[28px] border border-[var(--border-hairline)] bg-[var(--bg-card)] p-5 sm:p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-mono-tabular text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
                {t("Sprint Cadence Inspector")}
              </p>
              <h2 className="mt-0.5 text-base font-semibold tracking-[-0.015em] text-[var(--text-primary)]">
                {t("31-Day Capsule Ribbon")}
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-2 font-mono-tabular text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--text-secondary)]">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-hairline)] bg-[var(--bg-canvas-warm)] px-2.5 py-1 dark:bg-[#120D1D]">
                <span className="h-2 w-2 rounded-full bg-complete" /> {t("Closed")}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-hairline)] bg-[var(--bg-canvas-warm)] px-2.5 py-1 dark:bg-[#120D1D]">
                <span className="h-2 w-2 rounded-full bg-[#121212] dark:bg-orchid" /> {t("Today")}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-hairline)] bg-[var(--bg-canvas-warm)] px-2.5 py-1 dark:bg-[#120D1D]">
                <span className="h-2 w-2 rounded-full bg-[#D98200] dark:bg-amber" /> {t("Planned")}
              </span>
            </div>
          </div>

          <DotMatrixRibbon
            days={ribbonDays}
            onSelectDay={(day) =>
              setSelectedDayNumber(day === currentDayNumber ? null : day)
            }
          />
        </div>

        {/* 2. ConcentricRing Completion Telemetry (xl:col-span-3) */}
        <div className="min-w-0 xl:col-span-3 flex flex-col items-center justify-between rounded-[28px] border border-[var(--border-hairline)] bg-[var(--bg-sand)] p-5 text-center">
          <div className="w-full text-left">
            <p className="font-mono-tabular text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
              {t("Adherence")}
            </p>
          </div>

          <div className="my-2">
            <ConcentricRing
              percentage={overallRate}
              secondaryPercentage={todayCompletionRate}
              size={108}
              strokeWidth={10}
              sublabel={t("CYCLE")}
            />
          </div>

          <div className="grid w-full grid-cols-2 gap-1.5 border-t border-[var(--border-hairline)] pt-3">
            <div className="min-w-0">
              <p className="font-mono-tabular text-sm font-bold text-[var(--text-primary)]">
                {stats?.daysLogged ?? 0}
              </p>
              <p className="truncate font-mono-tabular text-[9px] sm:text-[10px] uppercase tracking-[0.06em] text-[var(--text-muted)]">
                {t("Logged")}
              </p>
            </div>
            <div className="min-w-0">
              <p className="inline-flex items-center justify-center gap-0.5 font-mono-tabular text-sm font-bold text-[#D98200] dark:text-amber">
                <Flame className="h-3.5 w-3.5" />
                {stats?.currentStreak ?? 0}d
              </p>
              <p className="truncate font-mono-tabular text-[9px] sm:text-[10px] uppercase tracking-[0.06em] text-[var(--text-muted)]">
                {t("Streak")}
              </p>
            </div>
          </div>
        </div>

        {/* 3. High-Contrast Close Today Gatekeeper Card (xl:col-span-4) */}
        <div className="min-w-0 xl:col-span-4 flex flex-col justify-between rounded-[28px] bg-[#121212] p-5 sm:p-6 text-[#F4F4F2] dark:border dark:border-white/[0.06] dark:bg-[#171224] dark:text-[#F7F5FF]">
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono-tabular text-[10px] font-semibold uppercase tracking-[0.14em] text-white/60">
                {t("Close Day Gatekeeper")}
              </span>
              {todayLog?.isClosed ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-complete px-2.5 py-0.5 font-mono-tabular text-[10px] font-bold text-[#121212]">
                  <Lock className="h-3 w-3" /> {t("CLOSED")}
                </span>
              ) : (
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-mono-tabular text-[10px] font-bold ${
                    canCloseToday
                      ? 'bg-complete text-[#121212]'
                      : 'bg-amber text-[#121212]'
                  }`}
                >
                  {String(tomorrowPlannedCount).padStart(2, '0')} / {String(totalPillars).padStart(2, '0')}
                </span>
              )}
            </div>

            <p className="mt-3 text-base font-semibold tracking-[-0.015em]">
              {todayLog?.isClosed
                ? t("Day {0} is locked", String(currentDayNumber).padStart(2, '0'))
                : currentDayNumber >= 31
                ? t("Final Day 31 ready to close")
                : t("{0} of {1} Pillars Planned for Tomorrow", tomorrowPlannedCount, totalPillars)}
            </p>

            <div className="mt-4">
              <SegmentedBattery
                total={totalPillars}
                filled={
                  todayLog?.isClosed || currentDayNumber >= 31
                    ? totalPillars
                    : tomorrowPlannedCount
                }
                label={t("Tomorrow Lock")}
                size="md"
                variant="contrast"
              />
            </div>
          </div>

          <Button
            id="close-today-btn"
            type="button"
            variant={canCloseToday ? 'emerald' : 'secondary'}
            disabled={!canCloseToday || writeControlsDisabled}
            onClick={handleCloseDay}
            className={`mt-5 w-full text-xs ${
              !canCloseToday
                ? 'border border-white/15 bg-white/10 text-white/75 hover:bg-white/10'
                : ''
            }`}
          >
            {isClosingDay ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                {t("Closing Day...")}
              </>
            ) : todayLog?.isClosed ? (
              <>
                <Lock className="h-3.5 w-3.5" />
                {t("Today Closed & Tomorrow Locked")}
              </>
            ) : (
              <>
                <CheckCircle2 className="h-3.5 w-3.5" />
                {t("Close Today & Lock Tomorrow")}
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Sprint History Day Inspector Banner */}
      {isInspectingHistory && (
        <div className="flex flex-col justify-between gap-3 rounded-[24px] border border-[#121212]/15 bg-[var(--bg-sand)] px-5 py-4 sm:flex-row sm:items-center dark:border-orchid/35 dark:bg-[#1E1730]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#121212] text-[#E6FA72] dark:bg-orchid dark:text-[#0D0914]">
              <Clock className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--text-primary)]">
                {isInspectingTomorrow
                  ? t("Inspecting Day {0} (Tomorrow's Plan)", String(selectedDayNumber).padStart(2, '0'))
                  : isInspectingFuture
                  ? t("Inspecting Day {0} (Upcoming Day)", String(selectedDayNumber).padStart(2, '0'))
                  : t('Inspecting Day {0} (Read-Only History)', String(selectedDayNumber).padStart(2, '0'))}
              </p>
              <p className="font-mono-tabular text-xs text-[var(--text-secondary)]">
                {displayedLog
                  ? isInspectingFuture
                    ? t("{0} / {1} pillars planned", displayedLog.plans.length, totalPillars)
                    : `${t("{0} / {1} actions completed", displayedLog.plans.filter((p) => p.isCompleted).length, displayedLog.plans.length)}${displayedLog.isClosed ? t(" · Day Closed") : ''}`
                  : isInspectingFuture
                  ? t("No actions planned for this day yet.")
                  : t("No actions were logged on this day.")}
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={() => setSelectedDayNumber(null)}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {t('Return to Today (Day {0})', String(currentDayNumber).padStart(2, '0'))}
          </Button>
        </div>
      )}

      {/* Unified 8-Pillar Bento Matrix */}
      <div className="overflow-hidden rounded-[32px] border border-[var(--border-hairline)] bg-[var(--bg-card)]">
        {/* Matrix Column Headers (Desktop) */}
        <div className="hidden gap-4 border-b border-[var(--border-hairline)] bg-[var(--bg-sand)]/70 px-6 py-3.5 font-mono-tabular text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)] lg:grid lg:grid-cols-12">
          <div className="col-span-3">{t("8 Core Pillars")}</div>
          <div className={`${isInspectingHistory ? 'col-span-9' : 'col-span-5'} flex items-center justify-between gap-2`}>
            <span>
              {isInspectingTomorrow
                ? t("Day {0} Plan (Tomorrow · Read-Only)", String(selectedDayNumber).padStart(2, '0'))
                : isInspectingFuture
                ? t("Day {0} Schedule (Read-Only)", String(selectedDayNumber).padStart(2, '0'))
                : isInspectingHistory
                ? t("Day {0} Execution (Read-Only)", String(selectedDayNumber).padStart(2, '0'))
                : t("Today's Execution")}
            </span>
            {isDisplayedDayClosed ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-complete px-2.5 py-0.5 text-[10px] font-bold text-[#121212]">
                <Lock className="h-3 w-3" /> {t("Locked")}
              </span>
            ) : isInspectingHistory ? (
              <span className="rounded-full bg-[var(--bg-card)] px-2.5 py-0.5 text-[10px] font-semibold text-[var(--text-primary)] border border-[var(--border-hairline)]">
                {displayedLog?.plans.length ?? 0}/{totalPillars}{' '}
                {isInspectingFuture ? t("Planned") : t("Logged")}
              </span>
            ) : null}
          </div>
          {!isInspectingHistory && (
            <div className="col-span-4 flex items-center justify-between">
              <span>{t("Tomorrow's Proactive Plan")}</span>
              <span className="rounded-full bg-[var(--bg-card)] px-2.5 py-0.5 text-[10px] font-semibold text-[var(--text-primary)] border border-[var(--border-hairline)]">
                {tomorrowPlannedCount}/{totalPillars} {t("Planned")}
              </span>
            </div>
          )}
        </div>

        <div className="divide-y divide-[var(--border-hairline)]">
          {categories.map((category) => {
            const meta = getPillarMeta(category.name);
            const Icon = meta.icon;
            const todayAction = displayedPlansByCategory.get(category.id);
            const tomorrowAction = tomorrowPlansByCategory.get(category.id);

            const isEditingToday = todayAction && editingActionId === todayAction.id;
            const isEditingTomorrow = tomorrowAction && editingActionId === tomorrowAction.id;

            return (
              <div
                key={category.id}
                className="grid grid-cols-1 gap-4 px-4 py-4 transition-colors hover:bg-[var(--bg-sand)]/35 sm:px-6 lg:grid-cols-12 lg:items-center"
              >
                {/* Zone 1: Pillar Identity */}
                <div className="flex items-center gap-3 lg:col-span-3">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border transition-colors ${
                      todayAction?.isCompleted
                        ? 'border-complete bg-complete text-[#121212]'
                        : 'border-[var(--border-hairline)] bg-[var(--bg-sand)] text-[var(--text-primary)]'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="truncate text-[15px] font-semibold tracking-[-0.015em] text-[var(--text-primary)]">
                      {translatePillarText(language, category.name)}
                    </h3>
                    <p className="truncate text-xs text-[var(--text-secondary)]">
                      {translatePillarText(language, category.description)}
                    </p>
                  </div>
                </div>

                {/* Zone 2: Today's Execution (or Inspected Day) */}
                <div className={isInspectingHistory ? 'lg:col-span-9' : 'lg:col-span-5'}>
                  <div className="mb-1.5 font-mono-tabular text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)] lg:hidden">
                    {isInspectingTomorrow
                      ? t("Day {0} Plan (Tomorrow)", String(selectedDayNumber).padStart(2, '0'))
                      : isInspectingHistory
                      ? t("Day {0} Log", String(selectedDayNumber).padStart(2, '0'))
                      : t("Today's Execution")}
                  </div>

                  {todayAction ? (
                    <div
                      className={`flex items-center justify-between gap-2 rounded-[20px] border px-3.5 py-2.5 transition-colors ${
                        todayAction.isCompleted
                          ? 'border-complete/50 bg-complete/15 dark:border-complete/35 dark:bg-complete/10'
                          : 'border-[var(--border-hairline)] bg-[var(--bg-canvas-warm)]/70 dark:bg-[#120D1D]'
                      }`}
                    >
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        <button
                          type="button"
                          disabled={
                            !canMutateDisplayedDay ||
                            writeControlsDisabled
                          }
                          onClick={() => handleToggle(todayAction)}
                          aria-label={t("Toggle {0} completion", translatePillarText(language, category.name))}
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-colors ${
                            todayAction.isCompleted
                              ? 'border-complete bg-complete text-[#121212]'
                              : 'border-[var(--border-strong)] bg-[var(--bg-card)] hover:border-[#121212] dark:hover:border-orchid'
                          } ${!canMutateDisplayedDay ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}
                        >
                          {todayAction.isCompleted && (
                            <Check className="h-3.5 w-3.5 stroke-[3]" />
                          )}
                        </button>

                        {isEditingToday ? (
                          <input
                            autoFocus
                            value={editingText}
                            onChange={(e) => setEditingText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                void commitEdit(todayAction);
                              } else if (e.key === 'Escape') {
                                setEditingActionId(null);
                              }
                            }}
                            onBlur={() => void commitEdit(todayAction)}
                            className="w-full rounded-full border border-[#121212] bg-[var(--bg-card)] px-3 py-1 text-sm text-[var(--text-primary)] focus:outline-none dark:border-orchid"
                          />
                        ) : (
                          <button
                            type="button"
                            disabled={!canMutateDisplayedDay}
                            onClick={() => canMutateDisplayedDay && beginEdit(todayAction)}
                            className={`line-clamp-2 break-words text-left text-sm font-medium ${
                              todayAction.isCompleted
                                ? 'text-[var(--text-secondary)] line-through'
                                : 'text-[var(--text-primary)]'
                            } ${canMutateDisplayedDay ? 'cursor-text hover:opacity-80' : 'cursor-default'}`}
                            title={
                              canMutateDisplayedDay ? t("Click to edit") : todayAction.description
                            }
                          >
                            {todayAction.description}
                          </button>
                        )}
                      </div>

                      {isInspectingHistory ? (
                        <span
                          className={`shrink-0 rounded-full px-2.5 py-0.5 font-mono-tabular text-[9px] font-bold uppercase tracking-[0.08em] ${
                            todayAction.isCompleted
                              ? 'bg-complete text-[#121212]'
                              : isInspectingFuture
                              ? 'bg-amber/25 text-[#9A5B00] dark:bg-amber/20 dark:text-amber'
                              : 'border border-[var(--border-hairline)] bg-[var(--bg-card)] text-[var(--text-muted)]'
                          }`}
                        >
                          {todayAction.isCompleted
                            ? t("Done")
                            : isInspectingFuture
                            ? t("Planned")
                            : t("Skipped")}
                        </span>
                      ) : (
                        canMutateDisplayedDay && !isEditingToday && (
                          <div className="flex shrink-0 items-center gap-1">
                            <button
                              type="button"
                              onClick={() => beginEdit(todayAction)}
                              aria-label={t("Edit {0} today goal", translatePillarText(language, category.name))}
                              className="flex h-7 w-7 items-center justify-center rounded-full text-[var(--text-muted)] hover:bg-[var(--bg-card)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(todayAction.id)}
                              disabled={writeControlsDisabled}
                              aria-label={t("Delete {0} today goal", translatePillarText(language, category.name))}
                              className="flex h-7 w-7 items-center justify-center rounded-full text-[var(--text-muted)] hover:bg-[#DC2626]/10 hover:text-[#DC2626] dark:hover:bg-[#F87171]/15 dark:hover:text-[#F87171] transition-colors cursor-pointer"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )
                      )}
                    </div>
                  ) : canMutateDisplayedDay ? (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        void handleSaveInline(category.id, 'today');
                      }}
                      className="flex items-center gap-2"
                    >
                      <Input
                        id={`today-input-${category.id}`}
                        value={todayDrafts[category.id] ?? ''}
                        onChange={(e) =>
                          setTodayDrafts((prev) => ({
                            ...prev,
                            [category.id]: e.target.value,
                          }))
                        }
                        placeholder={t("+ Set today's goal...")}
                        className="h-10 text-xs"
                      />
                      {(todayDrafts[category.id] ?? '').trim() && (
                        <Button
                          type="submit"
                          size="sm"
                          disabled={writeControlsDisabled}
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </form>
                  ) : (
                    <div className="rounded-full border border-dashed border-[var(--border-strong)] bg-hatch-fine px-4 py-2 text-xs italic text-[var(--text-muted)]">
                      {isInspectingFuture
                        ? t("No goal planned for this pillar yet")
                        : isInspectingHistory
                        ? t("No goal recorded for this pillar")
                        : t("Day is closed")}
                    </div>
                  )}
                </div>

                {/* Zone 3: Tomorrow's Proactive Plan (Only shown when viewing Today) */}
                {!isInspectingHistory && (
                <div className="lg:col-span-4">
                  <div className="mb-1.5 font-mono-tabular text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)] lg:hidden">
                    {t("Tomorrow's Proactive Plan")}
                  </div>

                  {currentDayNumber >= 31 ? (
                    <div className="flex items-center gap-2 rounded-full border border-[var(--border-hairline)] bg-[var(--bg-sand)]/70 px-4 py-2 text-xs font-medium text-[var(--text-secondary)]">
                      <Sparkles className="h-3.5 w-3.5 text-complete" />
                      {t("Final Sprint Day — ready to complete!")}
                    </div>
                  ) : tomorrowAction ? (
                    <div className="flex items-center justify-between gap-2 rounded-[20px] border border-[#D98200]/30 bg-amber/15 px-3.5 py-2.5 dark:border-amber/30 dark:bg-amber/10">
                      <div className="flex min-w-0 flex-1 items-center gap-2.5">
                        <span className="h-2 w-2 shrink-0 rounded-full bg-[#D98200] dark:bg-amber" />
                        {isEditingTomorrow ? (
                          <input
                            autoFocus
                            value={editingText}
                            onChange={(e) => setEditingText(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                void commitEdit(tomorrowAction);
                              } else if (e.key === 'Escape') {
                                setEditingActionId(null);
                              }
                            }}
                            onBlur={() => void commitEdit(tomorrowAction)}
                            className="w-full rounded-full border border-[#121212] bg-[var(--bg-card)] px-3 py-1 text-sm text-[var(--text-primary)] focus:outline-none dark:border-amber"
                          />
                        ) : (
                          <button
                            type="button"
                            onClick={() => beginEdit(tomorrowAction)}
                            className="line-clamp-2 break-words text-left text-sm font-medium text-[var(--text-primary)] hover:opacity-80 cursor-text"
                            title={t("Click to edit tomorrow's plan")}
                          >
                            {tomorrowAction.description}
                          </button>
                        )}
                      </div>

                      {!isEditingTomorrow && (
                        <div className="flex shrink-0 items-center gap-1">
                          <span className="hidden rounded-full bg-complete px-2 py-0.5 font-mono-tabular text-[9px] font-bold uppercase tracking-[0.08em] text-[#121212] sm:inline-flex">
                            {t("Planned")}
                          </span>
                          <button
                            type="button"
                            onClick={() => beginEdit(tomorrowAction)}
                            aria-label={t("Edit {0} tomorrow goal", translatePillarText(language, category.name))}
                            className="flex h-7 w-7 items-center justify-center rounded-full text-[var(--text-muted)] hover:bg-[var(--bg-card)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(tomorrowAction.id)}
                            disabled={writeControlsDisabled}
                            aria-label={t("Delete {0} tomorrow goal", translatePillarText(language, category.name))}
                            className="flex h-7 w-7 items-center justify-center rounded-full text-[var(--text-muted)] hover:bg-[#DC2626]/10 hover:text-[#DC2626] dark:hover:bg-[#F87171]/15 dark:hover:text-[#F87171] transition-colors cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        void handleSaveInline(category.id, 'tomorrow');
                      }}
                      className="flex items-center gap-2"
                    >
                      <Input
                        id={`tomorrow-input-${category.id}`}
                        value={tomorrowDrafts[category.id] ?? ''}
                        onChange={(e) =>
                          setTomorrowDrafts((prev) => ({
                            ...prev,
                            [category.id]: e.target.value,
                          }))
                        }
                        placeholder={t("+ Plan tomorrow's action...")}
                        className="h-10 border-dashed text-xs focus:border-solid"
                      />
                      {(tomorrowDrafts[category.id] ?? '').trim() && (
                        <Button
                          type="submit"
                          size="sm"
                          variant="secondary"
                          disabled={writeControlsDisabled}
                        >
                          <Plus className="h-3.5 w-3.5 text-[#D98200] dark:text-amber" />
                        </Button>
                      )}
                    </form>
                  )}
                </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default HabitGrid;
