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
        'group relative overflow-hidden rounded-2xl border border-[#1E2330] bg-[#11131C] p-5 transition-all hover:border-[#8B5CF6]/50 hover:bg-[#171A26]/70',
        onClick ? 'cursor-pointer' : '',
        className
      )}
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#171A26] text-[#8B5CF6] border border-[#1E2330]">
          {icon}
        </div>
        {badge && (
          <span className="rounded-full bg-[#171A26] px-2.5 py-0.5 font-mono-tabular text-[11px] font-semibold text-[#94A3B8] border border-[#1E2330]">
            {badge}
          </span>
        )}
      </div>

      <h3 className="text-[15px] font-semibold text-[#F8FAFC] group-hover:text-[#8B5CF6] transition-colors">
        {name}
      </h3>
      <p className="mt-1 text-xs leading-relaxed text-[#94A3B8]">{description}</p>
    </div>
  );
};

export default HabitCard;
