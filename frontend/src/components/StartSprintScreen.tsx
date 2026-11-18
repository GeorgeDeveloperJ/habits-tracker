import React, { useMemo, useState } from 'react';
import { AlertTriangle, Calendar, Loader2, Rocket, Sparkles, Wand2 } from 'lucide-react';
import { useHabits } from '../context/useHabits';
import { getPillarMeta } from '../lib/pillars';
import type { InitialGoalInput } from '../services/api';
import { Button } from './ui/button';
import { Input } from './ui/input';

const StartSprintScreen: React.FC = () => {
  const { categories, startSprint } = useHabits();
  const [goalInputs, setGoalInputs] = useState<Record<string, string>>({});
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dateWindow = useMemo(() => {
    const start = new Date();
    const end = new Date(start.getTime() + 31 * 24 * 60 * 60 * 1000);
    const fmt = (d: Date) =>
      d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return { startLabel: fmt(start), endLabel: fmt(end) };
  }, []);

  const plannedCount = useMemo(
    () =>
      categories.filter((c) => (goalInputs[c.id] ?? '').trim().length > 0).length,
    [categories, goalInputs]
  );

  const handleChipClick = (categoryId: string, suggestion: string) => {
    setGoalInputs((prev) => ({ ...prev, [categoryId]: suggestion }));
  };

  const handlePrefillAll = () => {
    const filled: Record<string, string> = {};
    categories.forEach((cat) => {
      const meta = getPillarMeta(cat.name);
      filled[cat.id] = meta.suggestions[0] ?? `Complete ${cat.name} habit`;
    });
    setGoalInputs(filled);
  };

  const handleStartSprint = async () => {
    try {
      setIsStarting(true);
      setError(null);
      const initialGoals: InitialGoalInput[] = categories
        .map((cat) => ({
          categoryId: cat.id,
          description: (goalInputs[cat.id] ?? '').trim(),
        }))
        .filter((g) => g.description.length > 0);

      await startSprint(initialGoals);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } }; message?: string })
        ?.response?.data?.message;
      setError(msg || 'Failed to launch sprint. Please try again.');
    } finally {
      setIsStarting(false);
    }
  };

  const sprintNodes = Array.from({ length: 31 }, (_, i) => i + 1);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Top 31-Node Calendar Preview */}
      <div className="rounded-2xl border border-[#1E2330] bg-[#11131C] p-6 sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#1E2330] bg-[#171A26] px-3 py-1 text-xs font-semibold text-[#8B5CF6]">
              <Sparkles className="h-3.5 w-3.5" />
              31-Day Sprint Launchpad
            </div>
            <h1 className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight text-[#F8FAFC]">
              Commit to Your Next 31-Day Sprint
            </h1>
            <p className="mt-2 text-sm text-[#94A3B8] leading-relaxed">
              Every sprint spans 31 consecutive days across your 8 Core Pillars. Set your Day 1 execution targets below—or launch right away and plan inline.
            </p>
          </div>

          <div className="flex shrink-0 flex-col gap-2 rounded-xl border border-[#1E2330] bg-[#12151E] px-4 py-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">
              <Calendar className="h-3.5 w-3.5 text-[#8B5CF6]" />
              Sprint Window
            </div>
            <p className="font-mono-tabular text-sm font-semibold text-[#F8FAFC]">
              {dateWindow.startLabel} → {dateWindow.endLabel}
            </p>
            <p className="font-mono-tabular text-xs text-[#10B981]">
              {plannedCount} / {categories.length || 8} Day 1 Pillars Queued
            </p>
          </div>
        </div>

        {/* 31-Node Preview Strip */}
        <div className="mt-6 grid grid-cols-8 sm:grid-cols-16 lg:grid-cols-31 gap-1.5">
          {sprintNodes.map((day) => (
            <div
              key={day}
              className={`flex h-8 items-center justify-center rounded-lg font-mono-tabular text-xs font-semibold ${
                day === 1
                  ? 'bg-[#7C3AED] text-[#F8FAFC] ring-2 ring-[#8B5CF6]/40'
                  : 'border border-[#1E2330] bg-[#171A26] text-[#64748B]'
              }`}
              title={`Day ${day}`}
            >
              {String(day).padStart(2, '0')}
            </div>
          ))}
        </div>
      </div>

      {/* Day 1 Pillar Kickoff Wizard */}
      <div className="rounded-2xl border border-[#1E2330] bg-[#11131C] p-6 sm:p-8">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[#F8FAFC]">
              Day 1 Pillar Kickoff Wizard (Optional)
            </h2>
            <p className="text-xs text-[#94A3B8] mt-0.5">
              Click a suggestion chip or type a concrete Day 1 action for each pillar.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handlePrefillAll}
            className="w-fit"
          >
            <Wand2 className="h-3.5 w-3.5 text-[#8B5CF6]" />
            Fill Recommended Day 1 Kit
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {categories.map((category) => {
            const meta = getPillarMeta(category.name);
            const Icon = meta.icon;
            const currentVal = goalInputs[category.id] ?? '';

            return (
              <div
                key={category.id}
                className="rounded-xl border border-[#1E2330] bg-[#12151E] p-4 transition-colors hover:border-[#8B5CF6]/40"
              >
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#171A26] text-[#8B5CF6]">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-[#F8FAFC]">{category.name}</h3>
                      <p className="text-xs text-[#64748B]">{category.description}</p>
                    </div>
                  </div>
                  {currentVal.trim() && (
                    <span className="rounded-full bg-[#10B981]/15 px-2 py-0.5 font-mono-tabular text-[11px] font-semibold text-[#10B981]">
                      Ready
                    </span>
                  )}
                </div>

                <Input
                  id={`kickoff-input-${category.id}`}
                  value={currentVal}
                  onChange={(e) =>
                    setGoalInputs((prev) => ({ ...prev, [category.id]: e.target.value }))
                  }
                  placeholder={`Set Day 1 goal for ${category.name}...`}
                />

                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {meta.suggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => handleChipClick(category.id, suggestion)}
                      className={`rounded-lg border px-2.5 py-1 text-[11px] font-medium transition-colors cursor-pointer ${
                        currentVal === suggestion
                          ? 'border-[#8B5CF6] bg-[#7C3AED]/20 text-[#F8FAFC]'
                          : 'border-[#1E2330] bg-[#171A26] text-[#94A3B8] hover:border-[#8B5CF6]/50 hover:text-[#F8FAFC]'
                      }`}
                    >
                      + {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {error && (
          <div className="mt-6 flex items-center gap-3 rounded-xl border border-[#EF4444]/30 bg-[#EF4444]/10 p-4 text-sm text-[#EF4444]">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-[#1E2330] pt-6">
          <p className="text-xs text-[#94A3B8]">
            You can add, edit, or delete goals inline at any time during Day 1.
          </p>
          <Button
            id="launch-sprint-btn"
            onClick={handleStartSprint}
            disabled={isStarting}
            size="lg"
            className="w-full sm:w-auto font-semibold"
          >
            {isStarting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Initializing 31-Day Sprint...
              </>
            ) : (
              <>
                <Rocket className="h-5 w-5" />
                {plannedCount > 0
                  ? `Launch Sprint with ${plannedCount} Day-1 Goal${plannedCount === 1 ? '' : 's'}`
                  : 'Launch 31-Day Sprint'}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default StartSprintScreen;
