import { translatePillarText } from '../i18n/messages';
import { useLanguage } from '../i18n/useLanguage';
import { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  ArrowRight,
  BarChart3,
  Calendar,
  CheckCircle2,
  Clock,
  Flame,
  Loader2,
  Rocket,
} from 'lucide-react';
import { useHabits } from '../context/useHabits';
import { fetchCycleHistory, fetchCycleProgress, type CycleHistoryPage, type CycleProgressResponse } from '../services/api';
import { getPillarMeta } from '../lib/pillars';
import {
  CapsuleBarChart,
  ConcentricRing,
  SegmentedBattery,
  type CapsuleBarDatum,
} from '../components/charts/HardwareViz';
import { SprintMilestonesCard } from '../components/icons/MilestoneBadges';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button, ButtonLink } from '../components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';

export default function AnalyticsDashboard() {
  const { language, locale, t, formatPercent } = useLanguage();
  const { activeCycle, progress: currentProgress, loading, categories } = useHabits();
  const [selectedCycleId, setSelectedCycleId] = useState<string>('current');
  const [historicalState, setHistoricalState] = useState<{
    cycleId: string;
    data: CycleProgressResponse | null;
  } | null>(null);
  const [balanceView, setBalanceView] = useState<'capsules' | 'matrix'>('capsules');

  const [history, setHistory] = useState<CycleHistoryPage | null>(null);
  const [historyRequest, setHistoryRequest] = useState<{ cursor?: string } | null>({});
  const [historyError, setHistoryError] = useState(false);
  const cycleHistory = history?.data ?? [];

  useEffect(() => {
    if (!historyRequest) return;
    const controller = new AbortController();
    fetchCycleHistory(historyRequest.cursor, controller.signal)
      .then((page) => {
        if (controller.signal.aborted) return;
        setHistory(previous => historyRequest.cursor && previous
          ? { ...page, data: [...previous.data, ...page.data] }
          : page);
        setHistoryError(false);
        setHistoryRequest(null);
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setHistoryError(true);
        setHistoryRequest(null);
      });
    return () => controller.abort();
  }, [historyRequest]);

  useEffect(() => {
    if (selectedCycleId === 'current') return;
    let cancelled = false;

    fetchCycleProgress(selectedCycleId)
      .then((data) => {
        if (!cancelled) {
          setHistoricalState({ cycleId: selectedCycleId, data });
        }
      })
      .catch((err) => {
        console.error('Failed to load cycle analytics:', err);
        if (!cancelled) {
          setHistoricalState({ cycleId: selectedCycleId, data: null });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [selectedCycleId]);

  const loadingCycle =
    selectedCycleId !== 'current' && historicalState?.cycleId !== selectedCycleId;

  const displayedProgress =
    selectedCycleId === 'current'
      ? currentProgress
      : historicalState?.cycleId === selectedCycleId
      ? historicalState.data
      : null;

  const stats = displayedProgress?.stats;
  const pillarStats = useMemo(
    () => displayedProgress?.pillarStats ?? [],
    [displayedProgress]
  );
  const dailySeries = useMemo(
    () => displayedProgress?.dailySeries ?? [],
    [displayedProgress]
  );
  const recentActivity = displayedProgress?.recentActivity ?? [];

  const totalPillars = categories.length || 8;
  const overallRate = stats?.overallCompletionRate ?? 0;
  const todayPlannedCount = stats?.todayPlannedCount ?? 0;
  const todayCompletedCount = stats?.todayCompletedCount ?? 0;
  const todayRate =
    todayPlannedCount > 0 ? Math.round((todayCompletedCount / todayPlannedCount) * 100) : 0;
  const tomorrowPlannedCount = stats?.tomorrowPlannedCount ?? 0;

  const pillarCapsuleData: CapsuleBarDatum[] = useMemo(
    () =>
      pillarStats.map((p) => {
        const meta = getPillarMeta(p.categoryName);
        return {
          id: p.categoryId,
          label: translatePillarText(language, meta.shortName),
          value: p.completionRate,
          max: 100,
          state:
            p.plannedCount === 0
              ? 'hatched'
              : p.completionRate >= 75
              ? 'closed'
              : 'active',
          meta: t("{0}/{1} · {2}d streak", p.completedCount, p.plannedCount, p.currentStreak),
        };
      }),
    [pillarStats, language, t]
  );

  const trendCapsuleData: CapsuleBarDatum[] = useMemo(() => {
    const byDay = new Map(dailySeries.map((d) => [d.dayNumber, d]));
    return Array.from({ length: 31 }, (_, idx) => {
      const dayNumber = idx + 1;
      const point = byDay.get(dayNumber);
      const label = String(dayNumber).padStart(2, '0');
      if (!point) {
        return {
          id: dayNumber,
          label,
          value: 0,
          max: 100,
          state: 'projected',
          meta: t("Projected"),
        };
      }
      const state: CapsuleBarDatum['state'] = point.isClosed
        ? 'closed'
        : point.isToday
        ? 'today'
        : point.isTomorrow
        ? 'tomorrow'
        : point.planned === 0
        ? 'hatched'
        : 'active';
      return {
        id: dayNumber,
        label,
        value: point.completionRate,
        max: 100,
        state,
        meta: t("{0}/{1} done", point.completed, point.planned),
      };
    });
  }, [dailySeries, t]);

  if (loading || (!activeCycle && !history && historyRequest)) {
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center rounded-[32px] border border-[var(--border-hairline)] bg-[var(--bg-card)] p-8 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#121212] text-[#E6FA72] dark:bg-orchid dark:text-[#0D0914]">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
        <p className="mt-4 font-mono-tabular text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
          {t("Aggregating Hardware Telemetry")}
        </p>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          {t("Computing 8-Pillar balance and 31-day sprint cadence...")}
        </p>
      </div>
    );
  }

  if (!displayedProgress && history && cycleHistory.length === 0 && !activeCycle) {
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center rounded-[32px] border border-[var(--border-hairline)] bg-[var(--bg-card)] p-8 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#E6FA72] text-[#121212] dark:bg-orchid dark:text-[#0D0914]">
          <Rocket className="h-6 w-6" />
        </div>
        <p className="font-mono-tabular text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
          {t("Telemetry Standby")}
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-[var(--text-primary)]">
          {t("No Sprint Analytics Yet")}
        </h1>
        <p className="mt-2 max-w-md text-sm text-[var(--text-secondary)]">
          {t("Launch your first 31-day sprint in the Command Center to unlock 8-pillar balance and daily hardware telemetry.")}
        </p>
        <ButtonLink to="/" size="lg" className="mt-6">
          {t("Go to Sprint Launchpad")}
          <ArrowRight className="h-4 w-4" />
        </ButtonLink>
      </div>
    );
  }

  const dateRangeLabel = stats
    ? `${new Date(stats.startDate).toLocaleDateString(locale, {
        month: 'short',
        day: 'numeric',
      })} – ${new Date(stats.endDate).toLocaleDateString(locale, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })}`
    : t("Active Sprint");

  return (
    <div className="space-y-4">
      {/* Editorial Telemetry Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="font-mono-tabular text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
            {t("31-Day Sprint Diagnostics · Live Pillar Readout")}
          </p>
          <h1 className="mt-2 text-4xl sm:text-[44px] font-semibold tracking-[-0.03em] leading-[1.06] text-[var(--text-primary)]">
            {t("Hardware")}{' '}
            <span className="inline-flex align-middle items-center justify-center rounded-full bg-[#E6FA72] px-3.5 py-1 text-[#121212] dark:bg-orchid dark:text-[#0D0914]">
              <BarChart3 className="h-5 w-5 stroke-[2.3]" />
            </span>{' '}
            {t("Telemetry")}
          </h1>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            {t("Real-time consistency across your 8 Core Pillars and 31-day sprint cadence.")}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border-hairline)] bg-[var(--bg-card)] px-4 py-2 text-xs text-[var(--text-secondary)]">
            <Calendar className="h-3.5 w-3.5 text-[var(--text-primary)]" />
            <span className="font-mono-tabular font-medium">{dateRangeLabel}</span>
          </div>

          {cycleHistory.length > 0 && (
            <select
              aria-label={t("Select sprint cycle")}
              value={selectedCycleId}
              onChange={(e) => setSelectedCycleId(e.target.value)}
              className="h-9 rounded-full border border-[var(--border-hairline)] bg-[var(--bg-card)] px-4 font-mono-tabular text-xs font-semibold text-[var(--text-primary)] focus:border-[#121212] focus:outline-none dark:focus:border-orchid"
            >
              {activeCycle && <option value="current">{t("Current Active Sprint")}</option>}
              {cycleHistory.map((c) => (
                <option key={c.id} value={c.id}>
                  {t('Sprint starting {0}', new Date(c.startDate).toLocaleDateString(locale))}
                  {c.isActive ? t(" · Active") : ''}
                </option>
              ))}
            </select>
          )}
          {(historyError || history?.nextCursor) && (
            <Button
              variant="outline"
              disabled={Boolean(historyRequest)}
              onClick={() => {
                setHistoryError(false);
                setHistoryRequest({ cursor: history?.nextCursor ?? undefined });
              }}
            >
              {historyError ? t('Retry loading sprint history') : t('Load older sprints')}
            </Button>
          )}
        </div>
      </div>

      {loadingCycle ? (
        <div className="flex min-h-[320px] flex-col items-center justify-center rounded-[32px] border border-[var(--border-hairline)] bg-[var(--bg-card)] p-8">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--text-primary)]" />
          <p className="mt-3 font-mono-tabular text-[11px] uppercase tracking-[0.14em] text-[var(--text-muted)]">
            {t("Loading Historical Cycle")}
          </p>
        </div>
      ) : (
        <>
          {/* Row 1: Asymmetrical Bento KPI Cluster */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            {/* Hero Accent Completion Card (lg:col-span-5) */}
            <Card variant="accent" className="flex flex-col justify-between p-6 sm:p-7 lg:col-span-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="font-mono-tabular text-[10px] font-bold uppercase tracking-[0.14em] opacity-75">
                    {t("Overall Completion")}
                  </span>
                  <p className="mt-3 font-mono-tabular text-[48px] font-semibold leading-none tracking-[-0.04em]">
                    {formatPercent(overallRate)}
                  </p>
                  <p className="mt-2 font-mono-tabular text-xs font-semibold opacity-80">
                    {t((stats?.closedDays ?? 0) === 1 ? '{0} day closed · {1} logged' : '{0} days closed · {1} logged', stats?.closedDays ?? 0, stats?.daysLogged ?? 0)}
                  </p>
                </div>

                <ConcentricRing
                  percentage={overallRate}
                  secondaryPercentage={todayRate}
                  size={116}
                  strokeWidth={11}
                  variant="accent"
                  sublabel={t("RATE")}
                />
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-black/10 pt-4 font-mono-tabular text-[11px] font-semibold">
                <span>{t("TODAY COMPLETION:")} {formatPercent(todayRate)}</span>
                <span>{t("BEST STREAK:")} {stats?.bestStreak ?? 0}D</span>
              </div>
            </Card>

            {/* Right Asymmetrical 2+1 KPI Cluster (lg:col-span-7) */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-7">
              <Card variant="default" className="flex flex-col justify-between p-6">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono-tabular text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
                    {t("Actions Completed")}
                  </span>
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-complete text-[#121212]">
                    <CheckCircle2 className="h-4 w-4" />
                  </span>
                </div>
                <div className="mt-4">
                  <p className="font-mono-tabular text-4xl font-semibold tracking-[-0.04em] text-[var(--text-primary)]">
                    {stats?.completedActions ?? 0}
                    <span className="text-lg font-medium text-[var(--text-muted)]">
                      {' '}
                      / {stats?.totalActions ?? 0}
                    </span>
                  </p>
                  <p className="mt-1.5 font-mono-tabular text-xs text-[var(--text-secondary)]">
                    {stats?.skippedActions ?? 0} {t("pending or skipped")}
                  </p>
                </div>
              </Card>

              <Card variant="sand" className="flex flex-col justify-between p-6">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono-tabular text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
                    {t("Sprint & Streak")}
                  </span>
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#121212] text-amber dark:bg-[#0D0914]">
                    <Flame className="h-4 w-4" />
                  </span>
                </div>
                <div className="mt-4">
                  <p className="font-mono-tabular text-4xl font-semibold tracking-[-0.04em] text-[var(--text-primary)]">
                    {t("Day")} {String(stats?.currentDayNumber ?? 1).padStart(2, '0')}
                    <span className="text-lg font-medium text-[var(--text-muted)]"> / 31</span>
                  </p>
                  <p className="mt-1.5 font-mono-tabular text-xs font-semibold text-[#D98200] dark:text-amber">
                    {t('{0}d current · {1}d best', stats?.currentStreak ?? 0, stats?.bestStreak ?? 0)}
                  </p>
                </div>
              </Card>

              <Card
                variant="contrast"
                className="flex flex-col justify-between gap-4 p-6 sm:col-span-2 sm:flex-row sm:items-center"
              >
                <div>
                  <span className="font-mono-tabular text-[10px] font-semibold uppercase tracking-[0.14em] opacity-65">
                    {t("Tomorrow Gatekeeper Readiness")}
                  </span>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="font-mono-tabular text-3xl font-semibold tracking-[-0.03em]">
                      {String(tomorrowPlannedCount).padStart(2, '0')}
                    </span>
                    <span className="font-mono-tabular text-sm opacity-60">
                      / {String(totalPillars).padStart(2, '0')} {t("PILLARS")}
                    </span>
                  </div>
                  <p
                    className={`mt-1 font-mono-tabular text-xs font-medium ${
                      stats?.canCloseToday ? 'text-complete' : 'text-amber'
                    }`}
                  >
                    {stats?.canCloseToday
                      ? t("Ready to close today & lock tomorrow")
                      : t("Plan all 8 pillars to unlock day close")}
                  </p>
                </div>

                <SegmentedBattery
                  total={totalPillars}
                  filled={tomorrowPlannedCount}
                  label={t("Lock Matrix")}
                  size="lg"
                  variant="contrast"
                />
              </Card>
            </div>
          </div>

          {/* Row 2: Hardware Telemetry Visualizations (NO Recharts) */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            {/* 8-Pillar Balance (lg:col-span-5) */}
            <Card className="lg:col-span-5 flex flex-col">
              <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0 pb-3">
                <div>
                  <CardTitle>{t("8-Pillar Balance")}</CardTitle>
                  <CardDescription>{t("Completion rate across Core Pillars")}</CardDescription>
                </div>

                <div className="inline-flex rounded-full border border-[var(--border-hairline)] bg-[var(--bg-recessed)] p-1">
                  <button
                    type="button"
                    onClick={() => setBalanceView('capsules')}
                    className={`rounded-full px-3 py-1 font-mono-tabular text-[11px] font-semibold transition-colors cursor-pointer ${
                      balanceView === 'capsules'
                        ? 'bg-[#121212] text-[#E6FA72] dark:bg-orchid dark:text-[#0D0914]'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {t("Capsules")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setBalanceView('matrix')}
                    className={`rounded-full px-3 py-1 font-mono-tabular text-[11px] font-semibold transition-colors cursor-pointer ${
                      balanceView === 'matrix'
                        ? 'bg-[#121212] text-[#E6FA72] dark:bg-orchid dark:text-[#0D0914]'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {t("Matrix")}
                  </button>
                </div>
              </CardHeader>

              <CardContent className="flex-1 pt-2">
                {pillarStats.length === 0 ? (
                  <div className="flex h-[240px] items-center justify-center rounded-[20px] border border-dashed border-[var(--border-strong)] bg-hatch-fine text-sm text-[var(--text-muted)]">
                    {t("No pillar data available yet.")}
                  </div>
                ) : balanceView === 'capsules' ? (
                  <CapsuleBarChart data={pillarCapsuleData} height={224} />
                ) : (
                  <div className="space-y-2.5">
                    {pillarStats.map((p) => {
                      const meta = getPillarMeta(p.categoryName);
                      const Icon = meta.icon;
                      const filledSegments =
                        p.plannedCount === 0
                          ? 0
                          : Math.round((p.completionRate / 100) * 8);
                      return (
                        <div
                          key={p.categoryId}
                          className="flex items-center justify-between gap-3 rounded-[18px] border border-[var(--border-hairline)] bg-[var(--bg-sand)]/45 px-3.5 py-2"
                        >
                          <div className="flex min-w-0 items-center gap-2.5">
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--bg-card)] border border-[var(--border-hairline)] text-[var(--text-primary)]">
                              <Icon className="h-3.5 w-3.5" />
                            </span>
                            <span className="truncate text-xs font-semibold text-[var(--text-primary)]">
                              {translatePillarText(language, meta.shortName)}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <SegmentedBattery
                              total={8}
                              filled={filledSegments}
                              showCount={false}
                              size="sm"
                            />
                            <span className="w-10 text-right font-mono-tabular text-xs font-semibold text-[var(--text-primary)]">
                              {formatPercent(p.completionRate)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 31-Day Consistency Trend (lg:col-span-7) */}
            <Card className="lg:col-span-7 flex flex-col">
              <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between space-y-0 pb-3">
                <div>
                  <CardTitle>{t("31-Day Consistency Trend")}</CardTitle>
                  <CardDescription>
                    {t("Capsule telemetry across logged and projected sprint days")}
                  </CardDescription>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 font-mono-tabular text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--text-secondary)]">
                  <span className="inline-flex items-center gap-1 rounded-full border border-[var(--border-hairline)] bg-[var(--bg-canvas-warm)] px-2.5 py-1 dark:bg-[#120D1D]">
                    <span className="h-2 w-2 rounded-full bg-complete" /> {t("Closed")}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full border border-[var(--border-hairline)] bg-[var(--bg-canvas-warm)] px-2.5 py-1 dark:bg-[#120D1D]">
                    <span className="h-2 w-2 rounded-full bg-[#E6FA72] dark:bg-orchid" /> {t("Today")}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full border border-[var(--border-hairline)] bg-[var(--bg-canvas-warm)] px-2.5 py-1 dark:bg-[#120D1D]">
                    <span className="h-2 w-2 rounded-full bg-amber" /> {t("Tomorrow")}
                  </span>
                </div>
              </CardHeader>

              <CardContent className="flex-1 pt-2">
                <div className="overflow-x-auto pb-1">
                  <div className="min-w-[660px]">
                    <CapsuleBarChart data={trendCapsuleData} height={224} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Row 3: 8-Pillar Breakdown Table & Recent Activity Feed */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
            <Card className="lg:col-span-8">
              <CardHeader>
                <CardTitle>{t("8-Pillar Breakdown")}</CardTitle>
                <CardDescription>
                  {t("Planned, completed, skipped, and active streak per pillar")}
                </CardDescription>
              </CardHeader>
              <CardContent className="px-0 pb-2">
                {pillarStats.length === 0 ? (
                  <p className="px-6 py-8 text-sm text-[var(--text-muted)]">
                    {t("No pillar breakdown available for this sprint yet.")}
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("Pillar")}</TableHead>
                        <TableHead className="text-right">{t("Planned")}</TableHead>
                        <TableHead className="text-right">{t("Done")}</TableHead>
                        <TableHead className="text-right">{t("Skipped")}</TableHead>
                        <TableHead className="text-right">{t("Streak")}</TableHead>
                        <TableHead className="text-right">{t("Rate")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pillarStats.map((pillar) => {
                        const meta = getPillarMeta(pillar.categoryName);
                        const Icon = meta.icon;
                        return (
                          <TableRow key={pillar.categoryId}>
                            <TableCell>
                              <div className="flex items-center gap-2.5">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[var(--border-hairline)] bg-[var(--bg-sand)] text-[var(--text-primary)]">
                                  <Icon className="h-3.5 w-3.5" />
                                </div>
                                <span className="font-semibold text-[var(--text-primary)]">
                                  {translatePillarText(language, pillar.categoryName)}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right font-mono-tabular text-[var(--text-secondary)]">
                              {pillar.plannedCount}
                            </TableCell>
                            <TableCell className="text-right font-mono-tabular font-semibold text-[#15803D] dark:text-complete">
                              {pillar.completedCount}
                            </TableCell>
                            <TableCell className="text-right font-mono-tabular text-[var(--text-secondary)]">
                              {pillar.skippedCount}
                            </TableCell>
                            <TableCell className="text-right font-mono-tabular font-semibold text-[#D98200] dark:text-amber">
                              {pillar.currentStreak}d
                            </TableCell>
                            <TableCell className="text-right font-mono-tabular font-semibold">
                              <span
                                className={`inline-flex rounded-full px-2.5 py-0.5 text-xs ${
                                  pillar.completionRate >= 75
                                    ? 'bg-complete text-[#121212]'
                                    : pillar.completionRate >= 40
                                    ? 'bg-[#E6FA72] text-[#121212] dark:bg-orchid dark:text-[#0D0914]'
                                    : 'bg-[var(--bg-sand)] text-[var(--text-secondary)]'
                                }`}
                              >
                                {formatPercent(pillar.completionRate)}
                              </span>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            <Card className="lg:col-span-4">
              <CardHeader>
                <CardTitle>{t("Recent Activity")}</CardTitle>
                <CardDescription>{t("Latest planned and completed pillar actions")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2.5">
                {recentActivity.length === 0 ? (
                  <div className="rounded-[20px] border border-dashed border-[var(--border-strong)] bg-hatch-fine p-5 text-center text-sm text-[var(--text-muted)]">
                    {t("No habit actions recorded yet in this sprint.")}
                  </div>
                ) : (
                  recentActivity.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start gap-3 rounded-[20px] border border-[var(--border-hairline)] bg-[var(--bg-sand)]/55 p-3.5 dark:bg-[#120D1D]"
                    >
                      <div
                        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                          item.isCompleted
                            ? 'bg-complete text-[#121212]'
                            : 'bg-amber/25 text-[#9A5B00] dark:text-amber'
                        }`}
                      >
                        {item.isCompleted ? (
                          <Activity className="h-3.5 w-3.5" />
                        ) : (
                          <Clock className="h-3.5 w-3.5" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold text-[var(--text-primary)]">
                          {item.description}
                        </p>
                        <div className="mt-1.5 flex items-center justify-between gap-2 text-[11px]">
                          <span className="rounded-full border border-[var(--border-hairline)] bg-[var(--bg-card)] px-2 py-0.5 font-medium text-[var(--text-primary)]">
                            {translatePillarText(language, item.categoryName)}
                          </span>
                          <span className="font-mono-tabular text-[var(--text-muted)]">
                            {new Date(item.timestamp).toLocaleDateString(locale)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* Row 4: Hardware Telemetry Milestone Stamps */}
          <SprintMilestonesCard
            metrics={{
              closedDays: stats?.closedDays ?? 0,
              daysLogged: stats?.daysLogged ?? 0,
              bestStreak: stats?.bestStreak ?? 0,
              overallRate,
              hasPerfectGatekeeper:
                tomorrowPlannedCount >= totalPillars || (stats?.closedDays ?? 0) >= 1,
              completedCyclesCount: cycleHistory.filter((c) => !c.isActive).length,
            }}
          />
        </>
      )}
    </div>
  );
}
