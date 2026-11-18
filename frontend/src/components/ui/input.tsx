import * as React from 'react';
import { cn } from '../../lib/utils';

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        className={cn(
          'flex h-11 w-full rounded-full border border-[var(--border-hairline)] bg-[var(--bg-canvas-warm)] px-4 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] transition-colors focus-visible:outline-none focus-visible:border-[#121212] focus-visible:bg-[var(--bg-card)] dark:bg-[#120D1D] dark:focus-visible:border-orchid dark:focus-visible:bg-[#1E1730] disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';
