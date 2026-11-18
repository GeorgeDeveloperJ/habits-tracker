import * as React from 'react';
import { cn } from '../../lib/utils';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'emerald' | 'danger';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    const variants: Record<NonNullable<ButtonProps['variant']>, string> = {
      default:
        'bg-[#7C3AED] text-[#F8FAFC] hover:bg-[#6D28D9] shadow-sm shadow-[#7C3AED]/20',
      secondary:
        'bg-[#171A26] text-[#F8FAFC] hover:bg-[#1E2330] border border-[#1E2330]',
      outline:
        'border border-[#1E2330] bg-transparent text-[#F8FAFC] hover:bg-[#171A26] hover:border-[#8B5CF6]/50',
      ghost:
        'bg-transparent text-[#94A3B8] hover:bg-[#171A26] hover:text-[#F8FAFC]',
      emerald:
        'bg-[#10B981] text-[#090A0F] font-semibold hover:bg-[#059669] shadow-sm shadow-[#10B981]/20',
      danger:
        'bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30 hover:bg-[#EF4444]/25',
    };

    const sizes: Record<NonNullable<ButtonProps['size']>, string> = {
      default: 'h-10 px-4 py-2 text-sm',
      sm: 'h-8 px-3 text-xs rounded-lg',
      lg: 'h-12 px-6 text-base rounded-xl',
      icon: 'h-9 w-9 p-0',
    };

    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8B5CF6] disabled:pointer-events-none disabled:opacity-50 cursor-pointer',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';
