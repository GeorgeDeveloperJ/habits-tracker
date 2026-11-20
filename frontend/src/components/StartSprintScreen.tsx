import { translateFeedback, translatePillarText } from '../i18n/messages';
import { useLanguage } from '../i18n/useLanguage';
import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Calendar,
  Check,
  Loader2,
  Rocket,
  Wand2,
} from 'lucide-react';
import { useHabits } from '../context/useHabits';
import { getPillarMeta } from '../lib/pillars';
import type { InitialGoalInput } from '../services/api';
import { DotMatrixRibbon, SegmentedBattery } from './charts/HardwareViz';
import { SprintLaunchGlyph } from './icons/BrandMark';
import { Button } from './ui/button';
import { Input } from './ui/input';

const StartSprintScreen: React.FC = () => {
  const { language, locale, t } = useLanguage();
  const { categories, startSprint } = useHabits();
  const [goalInputs, setGoalInputs] = useState<Record<string, string>>({});
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dateWindow = useMemo(() => {
    const start = new Date();
    const end = new Date(start.getTime() + 31 * 24 * 60 * 60 * 1000);
    const fmt = (d: Date) =>
      d.toLocaleDateString(locale, { month: 'short', day: 'numeric', year: 'numeric' });
    return { startLabel: fmt(start), endLabel: fmt(end) };
  }, [locale]);

  const totalPillars = categories.length || 8;

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
      filled[cat.id] = meta.suggestions[0]
        ? translatePillarText(language, meta.suggestions[0])
        : t('Complete {0} habit', translatePillarText(language, cat.name));
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

  const previewDays = useMemo(
    () =>
      Array.from({ length: 31 }, (_, i) => ({
        dayNumber: i + 1,
        isToday: i === 0,
      })),
    []
  );

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      {/* Asymmetrical Top Bento Header */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        {/* Left Hero Bento Card (xl:col-span-8) */}
        <div className="min-w-0 xl:col-span-8 flex flex-col justify-between rounded-[32px] border border-[var(--border-hairline)] bg-[var(--bg-card)] p-5 sm:p-8">
          <div>
            <p className="font-mono-tabular text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
              {t("31-Day Sprint Launchpad · 8 Core Pillars")}
            </p>
            <h1 className="mt-2.5 text-4xl sm:text-[44px] font-semibold tracking-[-0.03em] leading-[1.06] text-[var(--text-primary)]">
              {t("Commit to Your")}{' '}
              <span className="inline-flex align-middle items-center justify-center rounded-full bg-[#E6FA72] px-3.5 py-1 text-[#121212] dark:bg-orchid dark:text-[#0D0914]">
                <SprintLaunchGlyph className="h-5 w-5" />
              </span>{' '}
              {t("31-Day Sprint")}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--text-secondary)]">
              {t("Every sprint spans 31 consecutive days across your 8 Core Pillars. Set your Day 1 execution targets below—or launch immediately and plan inline.")}
            </p>
          </div>

          <div className="mt-6 border-t border-[var(--border-hairline)] pt-5">
            <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
              <span className="font-mono-tabular text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
                {t("31-Day Capsule Cadence Preview")}
              </span>
              <span className="shrink-0 whitespace-nowrap font-mono-tabular text-[11px] font-semibold text-[var(--text-primary)]">
                {t("DAY 01 ACTIVE")}
              </span>
            </div>
            <DotMatrixRibbon days={previewDays} interactive={false} />
          </div>
        </div>

        {/* Right High-Contrast Readiness Card (xl:col-span-4) */}
        <div className="min-w-0 xl:col-span-4 flex flex-col justify-between rounded-[32px] bg-[#121212] p-5 sm:p-7 text-[#F4F4F2] dark:border dark:border-white/[0.06] dark:bg-[#171224] dark:text-[#F7F5FF]">
          <div>
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 font-mono-tabular text-[10px] font-semibold uppercase tracking-[0.14em] text-white/60">
                <Calendar className="h-3.5 w-3.5 text-[#E6FA72] dark:text-orchid" />
                {t("Sprint Window")}
              </span>
              <span className="shrink-0 whitespace-nowrap rounded-full bg-complete px-2.5 py-0.5 font-mono-tabular text-[10px] font-bold text-[#121212]">
                {t("31 DAYS")}
              </span>
            </div>

            <p className="mt-3 font-mono-tabular text-sm font-semibold text-white/90">
              {dateWindow.startLabel} → {dateWindow.endLabel}
            </p>

            <div className="mt-6 flex items-baseline gap-2">
              <span className="font-mono-tabular text-[48px] font-semibold leading-none tracking-[-0.04em] text-[#E6FA72] dark:text-orchid">
                {String(plannedCount).padStart(2, '0')}
              </span>
              <span className="font-mono-tabular text-lg font-medium text-white/50">
                / {String(totalPillars).padStart(2, '0')} {t("PILLARS")}
              </span>
            </div>
            <p className="mt-1.5 text-xs text-white/65">
              {t("Day 1 targets queued before launch")}
            </p>
          </div>

          <div className="mt-6 border-t border-white/10 pt-5">
            <SegmentedBattery
              total={totalPillars}
              filled={plannedCount}
              label={t("Day 1 Readiness")}
              size="lg"
              variant="contrast"
            />
          </div>
        </div>
      </div>

      {/* Day 1 Pillar Kickoff Bento Grid */}
      <div className="rounded-[32px] border border-[var(--border-hairline)] bg-[var(--bg-card)] p-6 sm:p-8">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-mono-tabular text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
              {t("Optional Kickoff Configuration")}
            </p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight text-[var(--text-primary)]">
              {t("Day 1 Pillar Kickoff Wizard")}
            </h2>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handlePrefillAll}
            className="w-fit"
          >
            <Wand2 className="h-3.5 w-3.5" />
            {t("Fill Recommended Day 1 Kit")}
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {categories.map((category) => {
            const meta = getPillarMeta(category.name);
            const Icon = meta.icon;
            const currentVal = goalInputs[category.id] ?? '';
            const isQueued = currentVal.trim().length > 0;

            return (
              <div
                key={category.id}
                className={`rounded-[24px] border p-5 transition-colors ${
                  isQueued
                    ? 'border-[#121212]/25 bg-[#E6FA72]/20 dark:border-orchid/40 dark:bg-[#1E1730]'
                    : 'border-[var(--border-hairline)] bg-[var(--bg-sand)]/50 dark:bg-[#120D1D]'
                }`}
              >
                <div className="mb-3 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                        isQueued
                          ? 'bg-[#121212] text-[#E6FA72] dark:bg-orchid dark:text-[#0D0914]'
                          : 'bg-[var(--bg-card)] text-[var(--text-primary)] border border-[var(--border-hairline)]'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                        {translatePillarText(language, category.name)}
                      </h3>
                      <p className="text-xs text-[var(--text-secondary)]">
                        {translatePillarText(language, category.description)}
                      </p>
                    </div>
                  </div>
                  {isQueued && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-complete px-2.5 py-0.5 font-mono-tabular text-[10px] font-bold text-[#121212]">
                      <Check className="h-3 w-3 stroke-[2.5]" />
                      {t("READY")}
                    </span>
                  )}
                </div>

                <Input
                  id={`kickoff-input-${category.id}`}
                  value={currentVal}
                  onChange={(e) =>
                    setGoalInputs((prev) => ({ ...prev, [category.id]: e.target.value }))
                  }
                  placeholder={t("Set Day 1 goal for {0}...", translatePillarText(language, category.name))}
                />

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {meta.suggestions.map((suggestion) => {
                    const label = translatePillarText(language, suggestion);
                    const selected = currentVal === label;
                    return (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => handleChipClick(category.id, label)}
                        className={`rounded-full border px-3 py-1 text-[11px] font-medium transition-colors cursor-pointer ${
                          selected
                            ? 'border-[#121212] bg-[#121212] text-[#E6FA72] dark:border-orchid dark:bg-orchid dark:text-[#0D0914]'
                            : 'border-[var(--border-hairline)] bg-[var(--bg-card)] text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]'
                        }`}
                      >
                        + {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {error && (
          <div className="mt-6 flex items-center gap-3 rounded-[20px] border border-[#DC2626]/30 bg-[#DC2626]/10 p-4 text-sm text-[#DC2626] dark:border-[#F87171]/35 dark:bg-[#F87171]/15 dark:text-[#F87171]">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{translateFeedback(language, error)}</span>
          </div>
        )}

        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-[var(--border-hairline)] pt-6">
          <p className="text-xs text-[var(--text-secondary)]">
            {t("You can add, edit, or delete goals inline at any time during Day 1.")}
          </p>
          <Button
            id="launch-sprint-btn"
            onClick={handleStartSprint}
            disabled={isStarting}
            size="lg"
            className="w-full sm:w-auto"
          >
            {isStarting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                {t("Initializing 31-Day Sprint...")}
              </>
            ) : (
              <>
                <Rocket className="h-5 w-5" />
                {plannedCount > 0
                  ? t(plannedCount === 1 ? 'Launch Sprint with {0} Day-1 Goal' : 'Launch Sprint with {0} Day-1 Goals', plannedCount)
                  : t("Launch 31-Day Sprint")}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default StartSprintScreen;
