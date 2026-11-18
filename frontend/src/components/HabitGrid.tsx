import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  Award,
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
  Zap,
} from 'lucide-react';
import { useHabits } from '../context/useHabits';
import { getPillarMeta } from '../lib/pillars';
import type { PlannedAction } from '../services/api';
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
  } = useHabits();

  const [todayDrafts, setTodayDrafts] = useState<Record<string, string>>({});
  const [tomorrowDrafts, setTomorrowDrafts] = useState<Record<string, string>>({});
  const [editingActionId, setEditingActionId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [busyActionKey, setBusyActionKey] = useState<string | null>(null);
  const [isClosingDay, setIsClosingDay] = useState(false);
  const [isRollingOver, setIsRollingOver] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );

  const stats = progress?.stats;
  const currentDayNumber = stats?.currentDayNumber ?? 1;
  const effectiveSelectedDay = selectedDayNumber ?? currentDayNumber;
  const isInspectingHistory =
    selectedDayNumber !== null && selectedDayNumber !== currentDayNumber;

  const displayedLog = isInspectingHistory ? selectedDayLog : todayLog;
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

  const showToast = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => {
      setFeedback((prev) => (prev?.message === message ? null : prev));
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

  const handleSaveInline = async (
    categoryId: string,
    targetDate: 'today' | 'tomorrow'
  ) => {
    const drafts = targetDate === 'today' ? todayDrafts : tomorrowDrafts;
    const text = (drafts[categoryId] ?? '').trim();
    if (!text) return;

    const key = `${targetDate}-${categoryId}`;
    try {
      setBusyActionKey(key);
      await saveGoal(categoryId, text, targetDate);
      if (targetDate === 'today') {
        setTodayDrafts((prev) => ({ ...prev, [categoryId]: '' }));
      } else {
        setTomorrowDrafts((prev) => ({ ...prev, [categoryId]: '' }));
      }
      showToast(
        'success',
        targetDate === 'today' ? "Today's goal added." : "Tomorrow's pillar planned."
      );
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      showToast('error', msg || 'Unable to save goal.');
    } finally {
      setBusyActionKey(null);
    }
  };

  const handleToggle = async (action: PlannedAction) => {
    if (!canMutateDisplayedDay) return;
    try {
      setBusyActionKey(`toggle-${action.id}`);
      await editGoal(action.id, { isCompleted: !action.isCompleted });
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      showToast('error', msg || 'Failed to update status.');
    } finally {
      setBusyActionKey(null);
    }
  };

  const beginEdit = (action: PlannedAction) => {
    setEditingActionId(action.id);
    setEditingText(action.description);
  };

  const commitEdit = async (action: PlannedAction) => {
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
      setBusyActionKey(`edit-${action.id}`);
      await editGoal(action.id, { description: trimmed });
      setEditingActionId(null);
      showToast('success', 'Goal updated.');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      showToast('error', msg || 'Failed to edit goal.');
    } finally {
      setBusyActionKey(null);
    }
  };

  const handleDelete = async (actionId: string) => {
    try {
      setBusyActionKey(`delete-${actionId}`);
      await removeGoal(actionId);
      showToast('success', 'Goal removed.');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      showToast('error', msg || 'Failed to remove goal.');
    } finally {
      setBusyActionKey(null);
    }
  };

  const handleCloseDay = async () => {
    try {
      setIsClosingDay(true);
      await closeToday(false);
      showToast(
        'success',
        `Day ${String(currentDayNumber).padStart(2, '0')} closed & tomorrow locked!`
      );
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      showToast(
        'error',
        msg || 'Cannot close today until all 8 pillars are planned for tomorrow.'
      );
    } finally {
      setIsClosingDay(false);
    }
  };

  const handleStartNextSprint = async () => {
    try {
      setIsRollingOver(true);
      await startSprint();
      showToast('success', 'New 31-Day Sprint initialized!');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      showToast('error', msg || 'Failed to roll over sprint.');
    } finally {
      setIsRollingOver(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Editorial Command Center Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono-tabular text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
            31-Day Proactive Discipline · 8 Core Pillars
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="text-4xl sm:text-[44px] font-semibold tracking-[-0.03em] leading-[1.06] text-[var(--text-primary)]">
              Daily{' '}
              <span className="inline-flex align-middle items-center justify-center rounded-full bg-[#E6FA72] px-3.5 py-1 text-[#121212] dark:bg-[#D96BFF] dark:text-[#0D0914]">
                <Zap className="h-5 w-5 stroke-[2.3]" />
              </span>{' '}
              Command
            </h1>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#121212] px-3.5 py-1 font-mono-tabular text-xs font-semibold text-[#E6FA72] dark:border dark:border-white/10 dark:bg-[#231B38] dark:text-[#D96BFF]">
              DAY {String(currentDayNumber).padStart(2, '0')} / 31
            </span>
          </div>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            Execute today&apos;s commitments on the left and lock tomorrow&apos;s 8-pillar plan on the right.
          </p>
        </div>

        {activeCycle && (
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[var(--border-hairline)] bg-[var(--bg-card)] px-4 py-2 font-mono-tabular text-[11px] font-medium text-[var(--text-secondary)]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#5CE68A]" />
            Started {new Date(activeCycle.startDate).toLocaleDateString()}
          </div>
        )}
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          role="status"
          className={`flex items-center justify-between gap-3 rounded-[24px] border px-4 py-3 text-sm font-medium ${
            feedback.type === 'success'
              ? 'border-[#5CE68A]/50 bg-[#5CE68A]/15 text-[#121212] dark:border-[#5CE68A]/35 dark:bg-[#5CE68A]/15 dark:text-[#5CE68A]'
              : 'border-[#DC2626]/35 bg-[#DC2626]/10 text-[#DC2626] dark:border-[#F87171]/35 dark:bg-[#F87171]/15 dark:text-[#F87171]'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            aria-label="Dismiss notification"
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
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#121212] text-[#5CE68A] dark:bg-[#5CE68A] dark:text-[#0D0914]">
                <Award className="h-6 w-6" />
              </div>
              <div>
                <p className="font-mono-tabular text-[10px] font-semibold uppercase tracking-[0.14em] opacity-75">
                  Sprint Milestone Complete
                </p>
                <h2 className="mt-1 text-xl font-semibold tracking-[-0.02em]">
                  31-Day Sprint Completed!
                </h2>
                <p className="mt-1 text-sm opacity-85">
                  You finished with a{' '}
                  <span className="font-mono-tabular font-bold">
                    {overallRate}%
                  </span>{' '}
                  completion rate ({stats?.completedActions ?? 0}/{stats?.totalActions ?? 0} actions) and a best streak of{' '}
                  <span className="font-mono-tabular font-bold">
                    {stats?.bestStreak ?? 0}d
                  </span>
                  .
                </p>
              </div>
            </div>
            <Button
              type="button"
              size="lg"
              onClick={handleStartNextSprint}
              disabled={isRollingOver}
              className="bg-[#121212] text-[#F4F4F2] hover:bg-[#262624] dark:bg-[#5CE68A] dark:text-[#0D0914] dark:hover:bg-[#4AD879]"
            >
              {isRollingOver ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Starting Next Sprint...
                </>
              ) : (
                <>
                  <Rocket className="h-4 w-4" />
                  Start Next 31-Day Sprint
                </>
              )}
            </Button>
          </div>
        </Card>
      )}

      {/* Asymmetrical 12-Column Bento Telemetry Header */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* 1. 31-Day DotMatrixRibbon Day Inspector (lg:col-span-6) */}
        <div className="lg:col-span-6 flex flex-col justify-between rounded-[28px] border border-[var(--border-hairline)] bg-[var(--bg-card)] p-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-mono-tabular text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
                Sprint Cadence Inspector
              </p>
              <h2 className="mt-0.5 text-base font-semibold tracking-[-0.015em] text-[var(--text-primary)]">
                31-Day Capsule Ribbon
              </h2>
            </div>

            <div className="flex flex-wrap items-center gap-2 font-mono-tabular text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--text-secondary)]">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-hairline)] bg-[var(--bg-canvas-warm)] px-2.5 py-1 dark:bg-[#120D1D]">
                <span className="h-2 w-2 rounded-full bg-[#5CE68A]" /> Closed
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-hairline)] bg-[var(--bg-canvas-warm)] px-2.5 py-1 dark:bg-[#120D1D]">
                <span className="h-2 w-2 rounded-full bg-[#121212] dark:bg-[#D96BFF]" /> Today
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border-hairline)] bg-[var(--bg-canvas-warm)] px-2.5 py-1 dark:bg-[#120D1D]">
                <span className="h-2 w-2 rounded-full bg-[#D98200] dark:bg-[#F5B841]" /> Planned
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

        {/* 2. ConcentricRing Completion Telemetry (lg:col-span-2) */}
        <div className="lg:col-span-2 flex flex-col items-center justify-between rounded-[28px] border border-[var(--border-hairline)] bg-[var(--bg-sand)] p-5 text-center">
          <div className="w-full text-left">
            <p className="font-mono-tabular text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
              Adherence
            </p>
          </div>

          <div className="my-2">
            <ConcentricRing
              percentage={overallRate}
              secondaryPercentage={todayCompletionRate}
              size={108}
              strokeWidth={10}
              sublabel="CYCLE"
            />
          </div>

          <div className="grid w-full grid-cols-2 gap-2 border-t border-[var(--border-hairline)] pt-3">
            <div>
              <p className="font-mono-tabular text-sm font-bold text-[var(--text-primary)]">
                {stats?.daysLogged ?? 0}
              </p>
              <p className="font-mono-tabular text-[10px] uppercase tracking-[0.1em] text-[var(--text-muted)]">
                Logged
              </p>
            </div>
            <div>
              <p className="inline-flex items-center justify-center gap-0.5 font-mono-tabular text-sm font-bold text-[#D98200] dark:text-[#F5B841]">
                <Flame className="h-3.5 w-3.5" />
                {stats?.currentStreak ?? 0}d
              </p>
              <p className="font-mono-tabular text-[10px] uppercase tracking-[0.1em] text-[var(--text-muted)]">
                Streak
              </p>
            </div>
          </div>
        </div>

        {/* 3. High-Contrast Close Today Gatekeeper Card (lg:col-span-4) */}
        <div className="lg:col-span-4 flex flex-col justify-between rounded-[28px] bg-[#121212] p-6 text-[#F4F4F2] dark:border dark:border-white/[0.06] dark:bg-[#171224] dark:text-[#F7F5FF]">
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono-tabular text-[10px] font-semibold uppercase tracking-[0.14em] text-white/60">
                Close Day Gatekeeper
              </span>
              {todayLog?.isClosed ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-[#5CE68A] px-2.5 py-0.5 font-mono-tabular text-[10px] font-bold text-[#121212]">
                  <Lock className="h-3 w-3" /> CLOSED
                </span>
              ) : (
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-mono-tabular text-[10px] font-bold ${
                    canCloseToday
                      ? 'bg-[#5CE68A] text-[#121212]'
                      : 'bg-[#F5B841] text-[#121212]'
                  }`}
                >
                  {String(tomorrowPlannedCount).padStart(2, '0')} / {String(totalPillars).padStart(2, '0')}
                </span>
              )}
            </div>

            <p className="mt-3 text-base font-semibold tracking-[-0.015em]">
              {todayLog?.isClosed
                ? `Day ${String(currentDayNumber).padStart(2, '0')} is locked`
                : currentDayNumber >= 31
                ? 'Final Day 31 ready to close'
                : `${tomorrowPlannedCount} of ${totalPillars} Pillars Planned for Tomorrow`}
            </p>

            <div className="mt-4">
              <SegmentedBattery
                total={totalPillars}
                filled={
                  todayLog?.isClosed || currentDayNumber >= 31
                    ? totalPillars
                    : tomorrowPlannedCount
                }
                label="Tomorrow Lock"
                size="md"
                variant="contrast"
              />
            </div>
          </div>

          <Button
            id="close-today-btn"
            type="button"
            variant={canCloseToday ? 'emerald' : 'secondary'}
            disabled={!canCloseToday || isClosingDay}
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
                Closing Day...
              </>
            ) : todayLog?.isClosed ? (
              <>
                <Lock className="h-3.5 w-3.5" />
                Today Closed &amp; Tomorrow Locked
              </>
            ) : (
              <>
                <CheckCircle2 className="h-3.5 w-3.5" />
                Close Today &amp; Lock Tomorrow
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Sprint History Day Inspector Banner */}
      {isInspectingHistory && (
        <div className="flex flex-col justify-between gap-3 rounded-[24px] border border-[#121212]/15 bg-[var(--bg-sand)] px-5 py-4 sm:flex-row sm:items-center dark:border-[#D96BFF]/35 dark:bg-[#1E1730]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#121212] text-[#E6FA72] dark:bg-[#D96BFF] dark:text-[#0D0914]">
              <Clock className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--text-primary)]">
                Inspecting Day {String(selectedDayNumber).padStart(2, '0')} (Read-Only History)
              </p>
              <p className="font-mono-tabular text-xs text-[var(--text-secondary)]">
                {displayedLog
                  ? `${displayedLog.plans.filter((p) => p.isCompleted).length} / ${displayedLog.plans.length} actions completed${displayedLog.isClosed ? ' · Day Closed' : ''}`
                  : 'No actions were logged on this day.'}
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
            Return to Today (Day {String(currentDayNumber).padStart(2, '0')})
          </Button>
        </div>
      )}

      {/* Unified 8-Pillar Bento Matrix */}
      <div className="overflow-hidden rounded-[32px] border border-[var(--border-hairline)] bg-[var(--bg-card)]">
        {/* Matrix Column Headers (Desktop) */}
        <div className="hidden gap-4 border-b border-[var(--border-hairline)] bg-[var(--bg-sand)]/70 px-6 py-3.5 font-mono-tabular text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)] lg:grid lg:grid-cols-12">
          <div className="col-span-3">8 Core Pillars</div>
          <div className="col-span-5 flex items-center justify-between">
            <span>
              {isInspectingHistory
                ? `Day ${String(selectedDayNumber).padStart(2, '0')} Execution (Read-Only)`
                : "Today's Execution"}
            </span>
            {isDisplayedDayClosed && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#5CE68A] px-2.5 py-0.5 text-[10px] font-bold text-[#121212]">
                <Lock className="h-3 w-3" /> Locked
              </span>
            )}
          </div>
          <div className="col-span-4 flex items-center justify-between">
            <span>Tomorrow&apos;s Proactive Plan</span>
            <span className="rounded-full bg-[var(--bg-card)] px-2.5 py-0.5 text-[10px] font-semibold text-[var(--text-primary)] border border-[var(--border-hairline)]">
              {tomorrowPlannedCount}/{totalPillars} Planned
            </span>
          </div>
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
                        ? 'border-[#5CE68A] bg-[#5CE68A] text-[#121212]'
                        : 'border-[var(--border-hairline)] bg-[var(--bg-sand)] text-[var(--text-primary)]'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="truncate text-[15px] font-semibold tracking-[-0.015em] text-[var(--text-primary)]">
                      {category.name}
                    </h3>
                    <p className="truncate text-xs text-[var(--text-secondary)]">
                      {category.description}
                    </p>
                  </div>
                </div>

                {/* Zone 2: Today's Execution (or Inspected Day) */}
                <div className="lg:col-span-5">
                  <div className="mb-1.5 font-mono-tabular text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)] lg:hidden">
                    {isInspectingHistory
                      ? `Day ${String(selectedDayNumber).padStart(2, '0')} Log`
                      : "Today's Execution"}
                  </div>

                  {todayAction ? (
                    <div
                      className={`flex items-center justify-between gap-2 rounded-[20px] border px-3.5 py-2.5 transition-colors ${
                        todayAction.isCompleted
                          ? 'border-[#5CE68A]/50 bg-[#5CE68A]/15 dark:border-[#5CE68A]/35 dark:bg-[#5CE68A]/10'
                          : 'border-[var(--border-hairline)] bg-[var(--bg-canvas-warm)]/70 dark:bg-[#120D1D]'
                      }`}
                    >
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        <button
                          type="button"
                          disabled={
                            !canMutateDisplayedDay ||
                            busyActionKey === `toggle-${todayAction.id}`
                          }
                          onClick={() => handleToggle(todayAction)}
                          aria-label={`Toggle ${category.name} completion`}
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border transition-colors ${
                            todayAction.isCompleted
                              ? 'border-[#5CE68A] bg-[#5CE68A] text-[#121212]'
                              : 'border-[var(--border-strong)] bg-[var(--bg-card)] hover:border-[#121212] dark:hover:border-[#D96BFF]'
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
                            className="w-full rounded-full border border-[#121212] bg-[var(--bg-card)] px-3 py-1 text-sm text-[var(--text-primary)] focus:outline-none dark:border-[#D96BFF]"
                          />
                        ) : (
                          <button
                            type="button"
                            disabled={!canMutateDisplayedDay}
                            onClick={() => canMutateDisplayedDay && beginEdit(todayAction)}
                            className={`truncate text-left text-sm font-medium ${
                              todayAction.isCompleted
                                ? 'text-[var(--text-secondary)] line-through'
                                : 'text-[var(--text-primary)]'
                            } ${canMutateDisplayedDay ? 'cursor-text hover:opacity-80' : 'cursor-default'}`}
                            title={
                              canMutateDisplayedDay ? 'Click to edit' : todayAction.description
                            }
                          >
                            {todayAction.description}
                          </button>
                        )}
                      </div>

                      {canMutateDisplayedDay && !isEditingToday && (
                        <div className="flex shrink-0 items-center gap-1">
                          <button
                            type="button"
                            onClick={() => beginEdit(todayAction)}
                            aria-label={`Edit ${category.name} today goal`}
                            className="flex h-7 w-7 items-center justify-center rounded-full text-[var(--text-muted)] hover:bg-[var(--bg-card)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(todayAction.id)}
                            disabled={busyActionKey === `delete-${todayAction.id}`}
                            aria-label={`Delete ${category.name} today goal`}
                            className="flex h-7 w-7 items-center justify-center rounded-full text-[var(--text-muted)] hover:bg-[#DC2626]/10 hover:text-[#DC2626] dark:hover:bg-[#F87171]/15 dark:hover:text-[#F87171] transition-colors cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
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
                        placeholder="+ Set today's goal..."
                        className="h-10 text-xs"
                      />
                      {(todayDrafts[category.id] ?? '').trim() && (
                        <Button
                          type="submit"
                          size="sm"
                          disabled={busyActionKey === `today-${category.id}`}
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </form>
                  ) : (
                    <div className="rounded-full border border-dashed border-[var(--border-strong)] bg-hatch-fine px-4 py-2 text-xs italic text-[var(--text-muted)]">
                      {isInspectingHistory
                        ? 'No goal recorded for this pillar'
                        : 'Day is closed'}
                    </div>
                  )}
                </div>

                {/* Zone 3: Tomorrow's Proactive Plan */}
                <div className="lg:col-span-4">
                  <div className="mb-1.5 font-mono-tabular text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)] lg:hidden">
                    Tomorrow&apos;s Proactive Plan
                  </div>

                  {currentDayNumber >= 31 ? (
                    <div className="flex items-center gap-2 rounded-full border border-[var(--border-hairline)] bg-[var(--bg-sand)]/70 px-4 py-2 text-xs font-medium text-[var(--text-secondary)]">
                      <Sparkles className="h-3.5 w-3.5 text-[#5CE68A]" />
                      Final Sprint Day — ready to complete!
                    </div>
                  ) : tomorrowAction ? (
                    <div className="flex items-center justify-between gap-2 rounded-[20px] border border-[#D98200]/30 bg-[#F5B841]/15 px-3.5 py-2.5 dark:border-[#F5B841]/30 dark:bg-[#F5B841]/10">
                      <div className="flex min-w-0 flex-1 items-center gap-2.5">
                        <span className="h-2 w-2 shrink-0 rounded-full bg-[#D98200] dark:bg-[#F5B841]" />
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
                            className="w-full rounded-full border border-[#121212] bg-[var(--bg-card)] px-3 py-1 text-sm text-[var(--text-primary)] focus:outline-none dark:border-[#F5B841]"
                          />
                        ) : (
                          <button
                            type="button"
                            onClick={() => beginEdit(tomorrowAction)}
                            className="truncate text-left text-sm font-medium text-[var(--text-primary)] hover:opacity-80 cursor-text"
                            title="Click to edit tomorrow's plan"
                          >
                            {tomorrowAction.description}
                          </button>
                        )}
                      </div>

                      {!isEditingTomorrow && (
                        <div className="flex shrink-0 items-center gap-1">
                          <span className="hidden rounded-full bg-[#5CE68A] px-2 py-0.5 font-mono-tabular text-[9px] font-bold uppercase tracking-[0.08em] text-[#121212] sm:inline-flex">
                            Planned
                          </span>
                          <button
                            type="button"
                            onClick={() => beginEdit(tomorrowAction)}
                            aria-label={`Edit ${category.name} tomorrow goal`}
                            className="flex h-7 w-7 items-center justify-center rounded-full text-[var(--text-muted)] hover:bg-[var(--bg-card)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(tomorrowAction.id)}
                            disabled={busyActionKey === `delete-${tomorrowAction.id}`}
                            aria-label={`Delete ${category.name} tomorrow goal`}
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
                        placeholder="+ Plan tomorrow's action..."
                        className="h-10 border-dashed text-xs focus:border-solid"
                      />
                      {(tomorrowDrafts[category.id] ?? '').trim() && (
                        <Button
                          type="submit"
                          size="sm"
                          variant="secondary"
                          disabled={busyActionKey === `tomorrow-${category.id}`}
                        >
                          <Plus className="h-3.5 w-3.5 text-[#D98200] dark:text-[#F5B841]" />
                        </Button>
                      )}
                    </form>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default HabitGrid;
