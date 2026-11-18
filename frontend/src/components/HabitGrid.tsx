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
} from 'lucide-react';
import { useHabits } from '../context/useHabits';
import { getPillarMeta } from '../lib/pillars';
import type { PlannedAction } from '../services/api';
import { Button } from './ui/button';
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
      showToast('success', `Day ${String(currentDayNumber).padStart(2, '0')} closed & tomorrow locked!`);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      showToast(
        'error',
        msg || "Cannot close today until all 8 pillars are planned for tomorrow."
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

  // SVG Ring math
  const radius = 34;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (overallRate / 100) * circumference;

  const ribbonDays = Array.from({ length: 31 }, (_, idx) => idx + 1);

  return (
    <div className="space-y-6">
      {/* Page Title Row */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F8FAFC]">
              Command Center
            </h1>
            <span className="rounded-lg border border-[#8B5CF6]/40 bg-[#7C3AED]/15 px-2.5 py-0.5 font-mono-tabular text-xs font-semibold text-[#8B5CF6]">
              Day {String(currentDayNumber).padStart(2, '0')} / 31
            </span>
          </div>
          <p className="mt-1 text-sm text-[#94A3B8]">
            Execute today&apos;s 8 pillars on the left, lock tomorrow&apos;s plan on the right.
          </p>
        </div>

        {activeCycle && (
          <div className="font-mono-tabular text-xs text-[#64748B]">
            Sprint started {new Date(activeCycle.startDate).toLocaleDateString()}
          </div>
        )}
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          role="status"
          className={`flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm ${
            feedback.type === 'success'
              ? 'border-[#10B981]/40 bg-[#10B981]/10 text-[#10B981]'
              : 'border-[#EF4444]/40 bg-[#EF4444]/10 text-[#EF4444]'
          }`}
        >
          <div className="flex items-center gap-2">
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
            className="opacity-70 hover:opacity-100 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Day 31 Completion Celebration Banner */}
      {isDay31Completed && (
        <div className="rounded-2xl border border-[#10B981]/40 bg-[#11131C] p-6 shadow-lg">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30">
                <Award className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-[#F8FAFC]">
                  31-Day Sprint Completed!
                </h2>
                <p className="mt-1 text-sm text-[#94A3B8]">
                  You finished with a{' '}
                  <span className="font-mono-tabular font-semibold text-[#10B981]">
                    {overallRate}%
                  </span>{' '}
                  completion rate ({stats?.completedActions ?? 0}/{stats?.totalActions ?? 0} actions) and a best streak of{' '}
                  <span className="font-mono-tabular font-semibold text-[#F8FAFC]">
                    {stats?.bestStreak ?? 0}d
                  </span>
                  .
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="emerald"
              size="lg"
              onClick={handleStartNextSprint}
              disabled={isRollingOver}
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
        </div>
      )}

      {/* Top 12-Column Bento Header */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* 1. 31-Day Interactive Progress Ribbon (lg:col-span-7) */}
        <div className="lg:col-span-7 rounded-2xl border border-[#1E2330] bg-[#11131C] p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-semibold text-[#F8FAFC]">
                31-Day Sprint Progress Ribbon
              </h2>
              <p className="text-xs text-[#64748B]">
                Click any day pill to inspect its execution log
              </p>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-[#94A3B8]">
              <span className="inline-flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-[#10B981]" /> Closed
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-[#8B5CF6]" /> Today
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-[#F59E0B]" /> Tomorrow
              </span>
            </div>
          </div>

          <div className="grid grid-cols-8 sm:grid-cols-11 gap-1.5">
            {ribbonDays.map((day) => {
              const info = daySeriesMap.get(day);
              const isToday = day === currentDayNumber;
              const isTomorrow = day === currentDayNumber + 1;
              const isSelected = day === effectiveSelectedDay;
              const isClosed = Boolean(info?.isClosed);
              const isLogged = Boolean(info);

              let pillClass =
                'border-[#1E2330] bg-[#181C28] text-[#64748B] hover:border-[#8B5CF6]/40 hover:text-[#F8FAFC]';

              if (isClosed) {
                pillClass =
                  'border-[#10B981]/40 bg-[#10B981]/15 text-[#10B981] hover:bg-[#10B981]/25';
              } else if (isToday) {
                pillClass =
                  'border-[#8B5CF6] bg-[#7C3AED] text-[#F8FAFC] ring-2 ring-[#8B5CF6]/35';
              } else if (isTomorrow && (info?.planned ?? 0) > 0) {
                pillClass =
                  'border-dashed border-[#F59E0B]/70 bg-[#F59E0B]/10 text-[#F59E0B]';
              } else if (isLogged) {
                pillClass =
                  'border-[#8B5CF6]/40 bg-[#8B5CF6]/15 text-[#A78BFA]';
              }

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() =>
                    setSelectedDayNumber(day === currentDayNumber ? null : day)
                  }
                  className={`relative flex h-8 items-center justify-center rounded-lg border font-mono-tabular text-xs font-semibold transition-all cursor-pointer ${pillClass} ${
                    isSelected && !isToday ? 'ring-2 ring-[#F8FAFC]/60' : ''
                  }`}
                  title={`Day ${day}${isToday ? ' (Today)' : ''}${isClosed ? ' · Closed' : ''}`}
                >
                  {String(day).padStart(2, '0')}
                  {isToday && (
                    <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-[#10B981] ring-2 ring-[#11131C]" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Circular Completion Ring & Telemetry (lg:col-span-2) */}
        <div className="lg:col-span-2 rounded-2xl border border-[#1E2330] bg-[#11131C] p-5 flex flex-col items-center justify-center text-center">
          <div className="relative flex h-22 w-22 items-center justify-center">
            <svg className="h-22 w-22 -rotate-90" viewBox="0 0 80 80">
              <circle
                cx="40"
                cy="40"
                r={radius}
                stroke="#1E2330"
                strokeWidth="7"
                fill="none"
              />
              <circle
                cx="40"
                cy="40"
                r={radius}
                stroke={overallRate >= 75 ? '#10B981' : '#8B5CF6'}
                strokeWidth="7"
                strokeLinecap="round"
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-500"
              />
            </svg>
            <span className="absolute font-mono-tabular text-base font-bold text-[#F8FAFC]">
              {overallRate}%
            </span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3 w-full border-t border-[#1E2330] pt-3">
            <div>
              <p className="font-mono-tabular text-sm font-bold text-[#F8FAFC]">
                {stats?.daysLogged ?? 0}
              </p>
              <p className="text-[10px] uppercase tracking-wider text-[#64748B]">Logged</p>
            </div>
            <div>
              <p className="inline-flex items-center gap-0.5 font-mono-tabular text-sm font-bold text-[#F59E0B]">
                <Flame className="h-3.5 w-3.5" />
                {stats?.currentStreak ?? 0}d
              </p>
              <p className="text-[10px] uppercase tracking-wider text-[#64748B]">Streak</p>
            </div>
          </div>
        </div>

        {/* 3. "Close Today" Gatekeeper Card (lg:col-span-3) */}
        <div className="lg:col-span-3 rounded-2xl border border-[#1E2330] bg-[#11131C] p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">
                Close Day Gatekeeper
              </span>
              {todayLog?.isClosed ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-[#10B981]/15 px-2 py-0.5 text-[11px] font-semibold text-[#10B981]">
                  <Lock className="h-3 w-3" /> Closed
                </span>
              ) : (
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono-tabular text-[11px] font-semibold ${
                    canCloseToday
                      ? 'bg-[#10B981]/15 text-[#10B981]'
                      : 'bg-[#F59E0B]/15 text-[#F59E0B]'
                  }`}
                >
                  {tomorrowPlannedCount} / {totalPillars}
                </span>
              )}
            </div>

            <p className="mt-2 font-mono-tabular text-sm font-semibold text-[#F8FAFC]">
              {todayLog?.isClosed
                ? `Day ${String(currentDayNumber).padStart(2, '0')} is locked`
                : currentDayNumber >= 31
                ? 'Final Day 31 ready to close'
                : `${tomorrowPlannedCount} / ${totalPillars} Pillars Planned for Tomorrow`}
            </p>

            {/* Progress bar */}
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[#171A26]">
              <div
                className={`h-full transition-all duration-300 ${
                  canCloseToday || todayLog?.isClosed ? 'bg-[#10B981]' : 'bg-[#F59E0B]'
                }`}
                style={{
                  width: `${
                    todayLog?.isClosed || currentDayNumber >= 31
                      ? 100
                      : Math.min(100, Math.round((tomorrowPlannedCount / totalPillars) * 100))
                  }%`,
                }}
              />
            </div>
          </div>

          <Button
            id="close-today-btn"
            type="button"
            variant={canCloseToday ? 'emerald' : 'secondary'}
            disabled={!canCloseToday || isClosingDay}
            onClick={handleCloseDay}
            className="mt-4 w-full text-xs"
          >
            {isClosingDay ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Closing Day...
              </>
            ) : todayLog?.isClosed ? (
              <>
                <Lock className="h-3.5 w-3.5" />
                Today Closed & Tomorrow Locked
              </>
            ) : (
              <>
                <CheckCircle2 className="h-3.5 w-3.5" />
                Close Today & Lock Tomorrow
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Sprint History Day Inspector Banner */}
      {isInspectingHistory && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-[#8B5CF6]/40 bg-[#7C3AED]/10 px-5 py-3.5">
          <div className="flex items-center gap-3">
            <Clock className="h-4 w-4 text-[#8B5CF6]" />
            <div>
              <p className="text-sm font-semibold text-[#F8FAFC]">
                Inspecting Day {String(selectedDayNumber).padStart(2, '0')} (Read-Only History)
              </p>
              <p className="text-xs text-[#94A3B8]">
                {displayedLog
                  ? `${displayedLog.plans.filter((p) => p.isCompleted).length} / ${displayedLog.plans.length} actions completed${displayedLog.isClosed ? ' · Day Closed' : ''}`
                  : 'No actions were logged on this day.'}
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setSelectedDayNumber(null)}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Return to Today (Day {String(currentDayNumber).padStart(2, '0')})
          </Button>
        </div>
      )}

      {/* Unified 8-Pillar Matrix */}
      <div className="overflow-hidden rounded-2xl border border-[#1E2330] bg-[#11131C]">
        {/* Matrix Column Headers (Desktop) */}
        <div className="hidden lg:grid lg:grid-cols-12 gap-4 border-b border-[#1E2330] bg-[#12151E] px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">
          <div className="col-span-3">8 Core Pillars</div>
          <div className="col-span-5 flex items-center justify-between">
            <span>
              {isInspectingHistory
                ? `Day ${String(selectedDayNumber).padStart(2, '0')} Execution (Read-Only)`
                : "Today's Execution"}
            </span>
            {isDisplayedDayClosed && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[#10B981]/15 px-2 py-0.5 text-[10px] text-[#10B981]">
                <Lock className="h-3 w-3" /> Locked
              </span>
            )}
          </div>
          <div className="col-span-4 flex items-center justify-between">
            <span>Tomorrow&apos;s Proactive Plan</span>
            <span className="font-mono-tabular text-[11px] text-[#F59E0B]">
              {tomorrowPlannedCount}/{totalPillars} Planned
            </span>
          </div>
        </div>

        <div className="divide-y divide-[#1E2330]">
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
                className="grid grid-cols-1 gap-4 px-4 py-4 sm:px-6 lg:grid-cols-12 lg:items-center hover:bg-[#171A26]/35 transition-colors"
              >
                {/* Zone 1: Pillar Identity */}
                <div className="lg:col-span-3 flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#1E2330] bg-[#171A26] text-[#8B5CF6]">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="truncate text-[15px] font-semibold text-[#F8FAFC]">
                      {category.name}
                    </h3>
                    <p className="truncate text-xs text-[#64748B]">
                      {category.description}
                    </p>
                  </div>
                </div>

                {/* Zone 2: Today's Execution (or Inspected Day) */}
                <div className="lg:col-span-5">
                  <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-[#64748B] lg:hidden">
                    {isInspectingHistory
                      ? `Day ${String(selectedDayNumber).padStart(2, '0')} Log`
                      : "Today's Execution"}
                  </div>

                  {todayAction ? (
                    <div
                      className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-2.5 transition-all ${
                        todayAction.isCompleted
                          ? 'border-[#10B981]/30 bg-[#10B981]/5'
                          : 'border-[#1E2330] bg-[#12151E]'
                      }`}
                    >
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        <button
                          type="button"
                          disabled={!canMutateDisplayedDay || busyActionKey === `toggle-${todayAction.id}`}
                          onClick={() => handleToggle(todayAction)}
                          aria-label={`Toggle ${category.name} completion`}
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors ${
                            todayAction.isCompleted
                              ? 'border-[#10B981] bg-[#10B981] text-[#090A0F]'
                              : 'border-[#64748B] bg-[#171A26] hover:border-[#8B5CF6]'
                          } ${!canMutateDisplayedDay ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'}`}
                        >
                          {todayAction.isCompleted && <Check className="h-3.5 w-3.5 stroke-[3]" />}
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
                            className="w-full rounded-lg border border-[#8B5CF6] bg-[#171A26] px-2.5 py-1 text-sm text-[#F8FAFC] focus:outline-none"
                          />
                        ) : (
                          <button
                            type="button"
                            disabled={!canMutateDisplayedDay}
                            onClick={() => canMutateDisplayedDay && beginEdit(todayAction)}
                            className={`truncate text-left text-sm ${
                              todayAction.isCompleted
                                ? 'text-[#94A3B8] line-through'
                                : 'text-[#F8FAFC]'
                            } ${canMutateDisplayedDay ? 'cursor-text hover:text-[#8B5CF6]' : 'cursor-default'}`}
                            title={canMutateDisplayedDay ? 'Click to edit' : todayAction.description}
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
                            className="rounded-lg p-1.5 text-[#64748B] hover:bg-[#171A26] hover:text-[#F8FAFC] cursor-pointer"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(todayAction.id)}
                            disabled={busyActionKey === `delete-${todayAction.id}`}
                            aria-label={`Delete ${category.name} today goal`}
                            className="rounded-lg p-1.5 text-[#64748B] hover:bg-[#EF4444]/15 hover:text-[#EF4444] cursor-pointer"
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
                        className="h-9 text-xs"
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
                    <div className="rounded-xl border border-dashed border-[#1E2330] bg-[#12151E]/50 px-3 py-2 text-xs italic text-[#64748B]">
                      {isInspectingHistory
                        ? 'No goal recorded for this pillar'
                        : 'Day is closed'}
                    </div>
                  )}
                </div>

                {/* Zone 3: Tomorrow's Proactive Plan */}
                <div className="lg:col-span-4">
                  <div className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-[#64748B] lg:hidden">
                    Tomorrow&apos;s Proactive Plan
                  </div>

                  {currentDayNumber >= 31 ? (
                    <div className="flex items-center gap-2 rounded-xl border border-[#1E2330] bg-[#12151E] px-3 py-2 text-xs text-[#94A3B8]">
                      <Sparkles className="h-3.5 w-3.5 text-[#10B981]" />
                      Final Sprint Day — ready to complete!
                    </div>
                  ) : tomorrowAction ? (
                    <div className="flex items-center justify-between gap-2 rounded-xl border border-[#F59E0B]/30 bg-[#F59E0B]/5 px-3 py-2.5">
                      <div className="flex min-w-0 flex-1 items-center gap-2">
                        <span className="h-2 w-2 shrink-0 rounded-full bg-[#F59E0B]" />
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
                            className="w-full rounded-lg border border-[#8B5CF6] bg-[#171A26] px-2.5 py-1 text-sm text-[#F8FAFC] focus:outline-none"
                          />
                        ) : (
                          <button
                            type="button"
                            onClick={() => beginEdit(tomorrowAction)}
                            className="truncate text-left text-sm text-[#F8FAFC] hover:text-[#F59E0B] cursor-text"
                            title="Click to edit tomorrow's plan"
                          >
                            {tomorrowAction.description}
                          </button>
                        )}
                      </div>

                      {!isEditingTomorrow && (
                        <div className="flex shrink-0 items-center gap-1">
                          <span className="hidden sm:inline-flex rounded-md bg-[#10B981]/15 px-1.5 py-0.5 text-[10px] font-semibold text-[#10B981]">
                            Planned
                          </span>
                          <button
                            type="button"
                            onClick={() => beginEdit(tomorrowAction)}
                            aria-label={`Edit ${category.name} tomorrow goal`}
                            className="rounded-lg p-1.5 text-[#64748B] hover:bg-[#171A26] hover:text-[#F8FAFC] cursor-pointer"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(tomorrowAction.id)}
                            disabled={busyActionKey === `delete-${tomorrowAction.id}`}
                            aria-label={`Delete ${category.name} tomorrow goal`}
                            className="rounded-lg p-1.5 text-[#64748B] hover:bg-[#EF4444]/15 hover:text-[#EF4444] cursor-pointer"
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
                        className="h-9 text-xs border-dashed focus:border-solid"
                      />
                      {(tomorrowDrafts[category.id] ?? '').trim() && (
                        <Button
                          type="submit"
                          size="sm"
                          variant="secondary"
                          disabled={busyActionKey === `tomorrow-${category.id}`}
                        >
                          <Plus className="h-3.5 w-3.5 text-[#F59E0B]" />
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
