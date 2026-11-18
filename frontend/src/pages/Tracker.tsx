import { Loader2, RefreshCw, Zap } from 'lucide-react';
import { useHabits } from '../context/useHabits';
import StartSprintScreen from '../components/StartSprintScreen';
import HabitGrid from '../components/HabitGrid';
import { Button } from '../components/ui/button';

export default function Tracker() {
  const { activeCycle, loading, error, refreshAll } = useHabits();

  if (loading) {
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center rounded-[32px] border border-[var(--border-hairline)] bg-[var(--bg-card)] p-8 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#121212] text-[#E6FA72] dark:bg-[#D96BFF] dark:text-[#0D0914]">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
        <p className="mt-4 font-mono-tabular text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
          Syncing 31-Day Telemetry
        </p>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Loading your active sprint and 8 Core Pillars...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center rounded-[32px] border border-[var(--border-hairline)] bg-[var(--bg-card)] p-8 text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-[#DC2626]/25 bg-[#DC2626]/10 text-[#DC2626] dark:border-[#F87171]/30 dark:bg-[#F87171]/15 dark:text-[#F87171]">
          <Zap className="h-6 w-6" />
        </div>
        <p className="font-mono-tabular text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
          Telemetry Sync Interrupted
        </p>
        <h2 className="mt-2 text-2xl font-semibold tracking-[-0.02em] text-[var(--text-primary)]">
          Unable to load Command Center
        </h2>
        <p className="mt-2 max-w-md text-sm text-[var(--text-secondary)]">{error}</p>
        <Button type="button" onClick={refreshAll} className="mt-6">
          <RefreshCw className="h-4 w-4" />
          Retry Connection
        </Button>
      </div>
    );
  }

  if (!activeCycle) {
    return <StartSprintScreen />;
  }

  return <HabitGrid />;
}
