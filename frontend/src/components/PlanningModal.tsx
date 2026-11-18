import React, { useState } from 'react';
import { X } from 'lucide-react';
import type { HabitCategory } from '../services/api';
import { createAction } from '../services/api';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#090A0F]/80 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-[#1E2330] bg-[#11131C] p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-[#F8FAFC]">
            {targetDate === 'today' ? "Set Today's Goal" : 'Plan Tomorrow'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#94A3B8] hover:bg-[#171A26] hover:text-[#F8FAFC] cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mb-4">
          <span className="inline-flex items-center rounded-full border border-[#8B5CF6]/40 bg-[#7C3AED]/15 px-3 py-1 text-xs font-semibold text-[#8B5CF6]">
            {category.name}
          </span>
          <p className="mt-2 text-xs text-[#94A3B8]">{category.description}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea
            id="modal-goal-textarea"
            disabled={isSubmitting}
            rows={3}
            className="w-full rounded-xl border border-[#1E2330] bg-[#171A26] p-3.5 text-sm text-[#F8FAFC] placeholder:text-[#64748B] focus:border-[#8B5CF6] focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]/25"
            placeholder={`Enter a concrete ${targetDate} action...`}
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
          />

          {error && <p className="text-xs text-[#EF4444]">{error}</p>}

          <div className="flex gap-3">
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
