import { Loader2, RefreshCw, Zap } from 'lucide-react';
import { useHabits } from '../context/useHabits';
import StartSprintScreen from '../components/StartSprintScreen';
import HabitGrid from '../components/HabitGrid';
import { Button } from '../components/ui/button';

export default function Tracker() {
  const { activeCycle, loading, error, refreshAll } = useHabits();

  if (loading) {
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center gap-3">
        <Loader2 className="h-10 w-10 animate-spin text-[#8B5CF6]" />
        <p className="text-sm text-[#94A3B8]">Syncing your 31-day sprint...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center rounded-2xl border border-[#1E2330] bg-[#11131C] p-8 text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#EF4444]/15 text-[#EF4444]">
          <Zap className="h-6 w-6" />
        </div>
        <h2 className="text-lg font-semibold text-[#F8FAFC]">Unable to load Command Center</h2>
        <p className="mt-1 max-w-md text-sm text-[#94A3B8]">{error}</p>
        <Button type="button" onClick={refreshAll} className="mt-5">
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
