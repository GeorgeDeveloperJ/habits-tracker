import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Activity,
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock,
  Flame,
  Loader2,
  Rocket,
  Target,
  TrendingUp,
} from 'lucide-react';
import { useHabits } from '../context/useHabits';
import { fetchCycleProgress, type CycleProgressResponse } from '../services/api';
import { getPillarMeta } from '../lib/pillars';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';

export default function AnalyticsDashboard() {
  const { activeCycle, cycleHistory, progress: currentProgress, loading } = useHabits();
  const [selectedCycleId, setSelectedCycleId] = useState<string>('current');
  const [historicalProgress, setHistoricalProgress] = useState<CycleProgressResponse | null>(null);
  const [loadingCycle, setLoadingCycle] = useState(false);
  const [balanceView, setBalanceView] = useState<'radar' | 'bar'>('radar');

  useEffect(() => {
    let cancelled = false;

    const loadSelected = async () => {
      if (selectedCycleId === 'current') {
        setHistoricalProgress(null);
        return;
      }
      try {
        setLoadingCycle(true);
        const data = await fetchCycleProgress(selectedCycleId);
        if (!cancelled) {
          setHistoricalProgress(data);
        }
      } catch (err) {
        console.error('Failed to load cycle analytics:', err);
      } finally {
        if (!cancelled) {
          setLoadingCycle(false);
        }
      }
    };

    void loadSelected();
    return () => {
      cancelled = true;
    };
  }, [selectedCycleId]);

  const displayedProgress =
    selectedCycleId === 'current' ? currentProgress : historicalProgress;

  if (loading) {
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center gap-3">
        <Loader2 className="h-10 w-10 animate-spin text-[#8B5CF6]" />
        <p className="text-sm text-[#94A3B8]">Aggregating 8-Pillar analytics...</p>
      </div>
    );
  }

  if (!displayedProgress && cycleHistory.length === 0 && !activeCycle) {
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center rounded-2xl border border-[#1E2330] bg-[#11131C] p-8 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#7C3AED]/15 text-[#8B5CF6] border border-[#8B5CF6]/30">
          <Rocket className="h-7 w-7" />
        </div>
        <h1 className="text-2xl font-bold text-[#F8FAFC]">No Sprint Analytics Yet</h1>
        <p className="mt-2 max-w-md text-sm text-[#94A3B8]">
          Launch your first 31-day sprint in the Command Center to start tracking 8-pillar balance and daily consistency.
        </p>
        <Link to="/" className="mt-6">
          <Button size="lg">
            Go to Sprint Launchpad
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>
    );
  }

  const stats = displayedProgress?.stats;
  const pillarStats = displayedProgress?.pillarStats ?? [];
  const dailySeries = displayedProgress?.dailySeries ?? [];
  const recentActivity = displayedProgress?.recentActivity ?? [];

  const radarData = pillarStats.map((p) => ({
    pillar: getPillarMeta(p.categoryName).shortName,
    fullName: p.categoryName,
    completionRate: p.completionRate,
    completedCount: p.completedCount,
    plannedCount: p.plannedCount,
  }));

  const trendData = dailySeries.map((d) => ({
    day: `D${String(d.dayNumber).padStart(2, '0')}`,
    Planned: d.planned,
    Completed: d.completed,
    Skipped: d.skipped,
    Rate: d.completionRate,
  }));

  const dateRangeLabel = stats
    ? `${new Date(stats.startDate).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })} – ${new Date(stats.endDate).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })}`
    : 'Active Sprint';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F8FAFC]">
            Analytics &amp; Pillar Balance
          </h1>
          <p className="mt-1 text-sm text-[#94A3B8]">
            Real-time consistency telemetry across your 8 Core Pillars and 31-day sprint cadence.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex items-center gap-2 rounded-xl border border-[#1E2330] bg-[#11131C] px-3.5 py-2 text-xs text-[#94A3B8]">
            <Calendar className="h-3.5 w-3.5 text-[#8B5CF6]" />
            <span className="font-mono-tabular">{dateRangeLabel}</span>
          </div>

          {cycleHistory.length > 0 && (
            <select
              aria-label="Select sprint cycle"
              value={selectedCycleId}
              onChange={(e) => setSelectedCycleId(e.target.value)}
              className="h-9 rounded-xl border border-[#1E2330] bg-[#11131C] px-3 text-xs font-medium text-[#F8FAFC] focus:border-[#8B5CF6] focus:outline-none"
            >
              {activeCycle && <option value="current">Current Active Sprint</option>}
              {cycleHistory.map((c, idx) => (
                <option key={c.id} value={c.id}>
                  Sprint #{cycleHistory.length - idx} ({new Date(c.startDate).toLocaleDateString()})
                  {c.isActive ? ' · Active' : ''}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {loadingCycle ? (
        <div className="flex min-h-[300px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[#8B5CF6]" />
        </div>
      ) : (
        <>
          {/* Row 1: 4 Live KPI Cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-5 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">
                    Overall Completion
                  </span>
                  <div className="rounded-lg bg-[#7C3AED]/15 p-2 text-[#8B5CF6]">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-4">
                  <p className="font-mono-tabular text-3xl font-bold text-[#F8FAFC]">
                    {stats?.overallCompletionRate ?? 0}%
                  </p>
                  <p className="mt-1 text-xs text-[#10B981]">
                    {stats?.closedDays ?? 0} day{(stats?.closedDays ?? 0) === 1 ? '' : 's'} closed
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">
                    Actions Completed
                  </span>
                  <div className="rounded-lg bg-[#10B981]/15 p-2 text-[#10B981]">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-4">
                  <p className="font-mono-tabular text-3xl font-bold text-[#F8FAFC]">
                    {stats?.completedActions ?? 0}
                    <span className="text-lg font-medium text-[#64748B]">
                      {' '}
                      / {stats?.totalActions ?? 0}
                    </span>
                  </p>
                  <p className="mt-1 text-xs text-[#94A3B8]">
                    {stats?.skippedActions ?? 0} pending or skipped
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">
                    Sprint &amp; Streak
                  </span>
                  <div className="rounded-lg bg-[#F59E0B]/15 p-2 text-[#F59E0B]">
                    <Flame className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-4">
                  <p className="font-mono-tabular text-3xl font-bold text-[#F8FAFC]">
                    Day {String(stats?.currentDayNumber ?? 1).padStart(2, '0')}
                    <span className="text-lg font-medium text-[#64748B]"> / 31</span>
                  </p>
                  <p className="mt-1 font-mono-tabular text-xs text-[#F59E0B]">
                    {stats?.currentStreak ?? 0}d current · {stats?.bestStreak ?? 0}d best streak
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#94A3B8]">
                    Tomorrow Readiness
                  </span>
                  <div className="rounded-lg bg-[#8B5CF6]/15 p-2 text-[#8B5CF6]">
                    <Target className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-4">
                  <p className="font-mono-tabular text-3xl font-bold text-[#F8FAFC]">
                    {stats?.tomorrowPlannedCount ?? 0}
                    <span className="text-lg font-medium text-[#64748B]"> / 8</span>
                  </p>
                  <p
                    className={`mt-1 text-xs ${
                      stats?.canCloseToday ? 'text-[#10B981]' : 'text-[#F59E0B]'
                    }`}
                  >
                    {stats?.canCloseToday
                      ? 'Ready to close today'
                      : 'Plan all 8 pillars to lock today'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Row 2: Recharts Visualizations */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* 8-Pillar Balance Chart */}
            <Card className="lg:col-span-5">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                  <CardTitle>8-Pillar Balance</CardTitle>
                  <CardDescription>Completion rate (%) across Core Pillars</CardDescription>
                </div>
                <div className="flex rounded-lg border border-[#1E2330] bg-[#171A26] p-0.5">
                  <button
                    type="button"
                    onClick={() => setBalanceView('radar')}
                    className={`rounded-md px-2.5 py-1 text-xs font-medium cursor-pointer ${
                      balanceView === 'radar'
                        ? 'bg-[#7C3AED] text-white'
                        : 'text-[#94A3B8] hover:text-[#F8FAFC]'
                    }`}
                  >
                    Radar
                  </button>
                  <button
                    type="button"
                    onClick={() => setBalanceView('bar')}
                    className={`rounded-md px-2.5 py-1 text-xs font-medium cursor-pointer ${
                      balanceView === 'bar'
                        ? 'bg-[#7C3AED] text-white'
                        : 'text-[#94A3B8] hover:text-[#F8FAFC]'
                    }`}
                  >
                    Bar
                  </button>
                </div>
              </CardHeader>
              <CardContent className="h-[320px] pt-4">
                {radarData.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-sm text-[#64748B]">
                    No pillar data available yet.
                  </div>
                ) : balanceView === 'radar' ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData} outerRadius="72%">
                      <PolarGrid stroke="#1E2330" />
                      <PolarAngleAxis
                        dataKey="pillar"
                        tick={{ fill: '#94A3B8', fontSize: 11 }}
                      />
                      <PolarRadiusAxis
                        angle={30}
                        domain={[0, 100]}
                        tick={{ fill: '#64748B', fontSize: 10 }}
                      />
                      <Radar
                        name="Completion %"
                        dataKey="completionRate"
                        stroke="#8B5CF6"
                        fill="#7C3AED"
                        fillOpacity={0.35}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#12151E',
                          borderColor: '#1E2330',
                          borderRadius: '12px',
                          color: '#F8FAFC',
                          fontSize: '12px',
                        }}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={radarData} layout="vertical" margin={{ left: 10, right: 16 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1E2330" />
                      <XAxis type="number" domain={[0, 100]} tick={{ fill: '#64748B', fontSize: 11 }} />
                      <YAxis
                        dataKey="pillar"
                        type="category"
                        width={76}
                        tick={{ fill: '#94A3B8', fontSize: 11 }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#12151E',
                          borderColor: '#1E2330',
                          borderRadius: '12px',
                          color: '#F8FAFC',
                          fontSize: '12px',
                        }}
                      />
                      <Bar dataKey="completionRate" name="Completion %" fill="#8B5CF6" radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* 31-Day Consistency Trend Chart */}
            <Card className="lg:col-span-7">
              <CardHeader>
                <CardTitle>31-Day Consistency Trend</CardTitle>
                <CardDescription>Daily planned vs. completed actions across logged days</CardDescription>
              </CardHeader>
              <CardContent className="h-[320px] pt-2">
                {trendData.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-sm text-[#64748B]">
                    Log your first goals to visualize daily consistency.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData} margin={{ top: 10, right: 16, left: -12, bottom: 0 }}>
                      <defs>
                        <linearGradient id="completedGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="plannedGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1E2330" />
                      <XAxis dataKey="day" tick={{ fill: '#94A3B8', fontSize: 11 }} />
                      <YAxis allowDecimals={false} tick={{ fill: '#64748B', fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#12151E',
                          borderColor: '#1E2330',
                          borderRadius: '12px',
                          color: '#F8FAFC',
                          fontSize: '12px',
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                      <Area
                        type="monotone"
                        dataKey="Planned"
                        stroke="#8B5CF6"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#plannedGrad)"
                      />
                      <Area
                        type="monotone"
                        dataKey="Completed"
                        stroke="#10B981"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#completedGrad)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Row 3: 8-Pillar Breakdown Table & Recent Activity Feed */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <Card className="lg:col-span-8">
              <CardHeader>
                <CardTitle>8-Pillar Breakdown</CardTitle>
                <CardDescription>Planned, completed, skipped, and active streak per pillar</CardDescription>
              </CardHeader>
              <CardContent className="px-0 pb-2">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Pillar</TableHead>
                      <TableHead className="text-right">Planned</TableHead>
                      <TableHead className="text-right">Done</TableHead>
                      <TableHead className="text-right">Skipped</TableHead>
                      <TableHead className="text-right">Streak</TableHead>
                      <TableHead className="text-right">Rate</TableHead>
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
                              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#171A26] text-[#8B5CF6]">
                                <Icon className="h-3.5 w-3.5" />
                              </div>
                              <span className="font-medium text-[#F8FAFC]">
                                {pillar.categoryName}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-mono-tabular text-[#94A3B8]">
                            {pillar.plannedCount}
                          </TableCell>
                          <TableCell className="text-right font-mono-tabular text-[#10B981]">
                            {pillar.completedCount}
                          </TableCell>
                          <TableCell className="text-right font-mono-tabular text-[#94A3B8]">
                            {pillar.skippedCount}
                          </TableCell>
                          <TableCell className="text-right font-mono-tabular text-[#F59E0B]">
                            {pillar.currentStreak}d
                          </TableCell>
                          <TableCell className="text-right font-mono-tabular font-semibold">
                            <span
                              className={`rounded-md px-2 py-0.5 text-xs ${
                                pillar.completionRate >= 75
                                  ? 'bg-[#10B981]/15 text-[#10B981]'
                                  : pillar.completionRate >= 40
                                  ? 'bg-[#8B5CF6]/15 text-[#A78BFA]'
                                  : 'bg-[#171A26] text-[#94A3B8]'
                              }`}
                            >
                              {pillar.completionRate}%
                            </span>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card className="lg:col-span-4">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Latest planned and completed pillar actions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentActivity.length === 0 ? (
                  <p className="text-sm text-[#64748B]">
                    No habit actions recorded yet in this sprint.
                  </p>
                ) : (
                  recentActivity.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start gap-3 rounded-xl border border-[#1E2330] bg-[#12151E] p-3"
                    >
                      <div
                        className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                          item.isCompleted
                            ? 'bg-[#10B981]/15 text-[#10B981]'
                            : 'bg-[#F59E0B]/15 text-[#F59E0B]'
                        }`}
                      >
                        {item.isCompleted ? (
                          <Activity className="h-3.5 w-3.5" />
                        ) : (
                          <Clock className="h-3.5 w-3.5" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-semibold text-[#F8FAFC]">
                          {item.description}
                        </p>
                        <div className="mt-1 flex items-center justify-between text-[11px] text-[#64748B]">
                          <span className="text-[#8B5CF6]">{item.categoryName}</span>
                          <span className="font-mono-tabular">
                            {new Date(item.timestamp).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
