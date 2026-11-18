import React, { useState } from 'react';
import { Sparkles, X } from 'lucide-react';
import type { HabitCategory } from '../services/api';
import { createAction } from '../services/api';
import { getPillarMeta } from '../lib/pillars';
import { Button } from './ui/button';

interface PlanningModalProps {
  category: HabitCategory;
  targetDate?: 'today' | 'tomorrow';
  onClose: () => void;
  onSuccess: () => void;
}

const PlanningModal: React.FC<PlanningModalProps> = ({
  category,
  targetDate = 'tomorrow',
  onClose,
  onSuccess,
}) => {
  const [goal, setGoal] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const meta = getPillarMeta(category.name);
  const Icon = meta.icon;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = goal.trim();
    if (!trimmed || isSubmitting) return;

    try {
      setIsSubmitting(true);
      setError(null);
      await createAction({
        categoryId: category.id,
        description: trimmed,
        targetDate,
      });
      setGoal('');
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      setError(msg || 'Failed to save goal.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm dark:bg-[#0D0914]/75">
      <div className="w-full max-w-md rounded-[32px] border border-[var(--border-hairline)] bg-[var(--bg-card)] p-6 sm:p-7">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="font-mono-tabular text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
              {targetDate === 'today' ? 'Daily Execution' : 'Proactive Planning'}
            </p>
            <h2 className="mt-1 text-xl font-semibold tracking-[-0.02em] text-[var(--text-primary)]">
              {targetDate === 'today' ? "Set Today's Goal" : 'Plan Tomorrow'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border-hairline)] bg-[var(--bg-sand)] text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mb-4 rounded-[20px] border border-[var(--border-hairline)] bg-[var(--bg-sand)]/55 p-3.5 dark:bg-[#120D1D]">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#121212] text-[#E6FA72] dark:bg-[#D96BFF] dark:text-[#0D0914]">
              <Icon className="h-4 w-4" />
            </span>
            <span className="rounded-full bg-[var(--bg-card)] px-3 py-0.5 text-xs font-semibold text-[var(--text-primary)] border border-[var(--border-hairline)]">
              {category.name}
            </span>
          </div>
          <p className="mt-2 text-xs text-[var(--text-secondary)]">{category.description}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea
            id="modal-goal-textarea"
            disabled={isSubmitting}
            rows={3}
            className="w-full rounded-[20px] border border-[var(--border-hairline)] bg-[var(--bg-canvas-warm)] p-4 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-[#121212] focus:bg-[var(--bg-card)] focus:outline-none dark:bg-[#120D1D] dark:focus:border-[#D96BFF] dark:focus:bg-[#1E1730]"
            placeholder={`Enter a concrete ${targetDate} action...`}
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
          />

          {meta.suggestions.length > 0 && (
            <div className="space-y-1.5">
              <span className="inline-flex items-center gap-1 font-mono-tabular text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
                <Sparkles className="h-3 w-3" />
                Quick Picks
              </span>
              <div className="flex flex-wrap gap-1.5">
                {meta.suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => setGoal(suggestion)}
                    className={`rounded-full border px-3 py-1 text-[11px] font-medium transition-colors cursor-pointer ${
                      goal === suggestion
                        ? 'border-[#121212] bg-[#121212] text-[#E6FA72] dark:border-[#D96BFF] dark:bg-[#D96BFF] dark:text-[#0D0914]'
                        : 'border-[var(--border-hairline)] bg-[var(--bg-sand)]/60 text-[var(--text-secondary)] hover:border-[var(--border-strong)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    + {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && (
            <p className="rounded-full border border-[#DC2626]/25 bg-[#DC2626]/10 px-3.5 py-1.5 text-xs text-[#DC2626] dark:border-[#F87171]/30 dark:bg-[#F87171]/15 dark:text-[#F87171]">
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!goal.trim() || isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? 'Saving...' : 'Save Goal'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PlanningModal;
