import React from 'react';
import { cn } from '../lib/utils';

interface HabitCardProps {
  name: string;
  description: string;
  icon?: React.ReactNode;
  badge?: string;
  onClick?: () => void;
  className?: string;
}

const HabitCard: React.FC<HabitCardProps> = ({
  name,
  description,
  icon,
  badge,
  onClick,
  className,
}) => {
  return (
    <div
      onClick={onClick}
      className={cn(
        'group relative overflow-hidden rounded-[24px] border border-[var(--border-hairline)] bg-[var(--bg-card)] p-5 transition-colors hover:border-[var(--border-strong)] hover:bg-[var(--bg-sand)]/40',
        onClick ? 'cursor-pointer' : '',
        className
      )}
    >
      <div className="mb-3.5 flex items-center justify-between gap-2">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--border-hairline)] bg-[var(--bg-sand)] text-[var(--text-primary)] transition-colors group-hover:bg-[#121212] group-hover:text-[#E6FA72] dark:group-hover:bg-[#D96BFF] dark:group-hover:text-[#0D0914]">
          {icon}
        </div>
        {badge && (
          <span className="rounded-full border border-[var(--border-hairline)] bg-[var(--bg-canvas-warm)] px-3 py-0.5 font-mono-tabular text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--text-secondary)] dark:bg-[#120D1D]">
            {badge}
          </span>
        )}
      </div>

      <h3 className="text-[15px] font-semibold tracking-[-0.015em] text-[var(--text-primary)]">
        {name}
      </h3>
      <p className="mt-1 text-xs leading-relaxed text-[var(--text-secondary)]">
        {description}
      </p>
    </div>
  );
};

export default HabitCard;
