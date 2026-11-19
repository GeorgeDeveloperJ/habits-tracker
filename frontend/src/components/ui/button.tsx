import * as React from 'react';
import { Link, type LinkProps } from 'react-router-dom';
import { cn } from '../../lib/utils';

const buttonVariantClasses: Record<
  'default' | 'secondary' | 'outline' | 'ghost' | 'emerald' | 'lime' | 'danger',
  string
> = {
  default:
    'bg-[#121212] text-[#F4F4F2] hover:bg-[#262624] dark:bg-orchid dark:text-[#0D0914] dark:hover:bg-orchid-hover',
  secondary:
    'bg-[var(--bg-sand)] text-[var(--text-primary)] border border-[var(--border-hairline)] hover:border-[var(--border-strong)]',
  outline:
    'border border-[var(--border-strong)] bg-transparent text-[var(--text-primary)] hover:bg-[var(--bg-sand)]',
  ghost:
    'bg-transparent text-[var(--text-secondary)] hover:bg-[var(--bg-sand)] hover:text-[var(--text-primary)]',
  emerald:
    'bg-complete text-[#121212] font-semibold hover:bg-complete-hover dark:text-[#0D0914]',
  lime:
    'bg-[#E6FA72] text-[#121212] font-semibold hover:bg-[#DDF553] dark:bg-amber dark:text-[#0D0914]',
  danger:
    'bg-[#DC2626]/10 text-[#DC2626] border border-[#DC2626]/25 hover:bg-[#DC2626]/20 dark:bg-[#F87171]/15 dark:text-[#F87171] dark:border-[#F87171]/30',
};

const buttonSizeClasses: Record<'default' | 'sm' | 'lg' | 'icon', string> = {
  default: 'min-h-10 px-4 sm:px-5 py-2 text-sm',
  sm: 'min-h-8 px-3.5 py-1.5 text-xs',
  lg: 'min-h-12 px-5 sm:px-7 py-2.5 text-sm',
  icon: 'h-9 w-9 p-0',
};

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof buttonVariantClasses;
  size?: keyof typeof buttonSizeClasses;
}

export interface ButtonLinkProps extends LinkProps {
  variant?: keyof typeof buttonVariantClasses;
  size?: keyof typeof buttonSizeClasses;
}

function buttonVariants({
  variant = 'default',
  size = 'default',
  className,
}: {
  variant?: keyof typeof buttonVariantClasses;
  size?: keyof typeof buttonSizeClasses;
  className?: string;
} = {}) {
  return cn(
    'inline-flex items-center justify-center gap-2 rounded-full text-center font-semibold leading-snug transition-colors [&_svg]:shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#121212] dark:focus-visible:ring-orchid disabled:pointer-events-none disabled:opacity-45 cursor-pointer',
    buttonVariantClasses[variant],
    buttonSizeClasses[size],
    className
  );
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={buttonVariants({ variant, size, className })}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export const ButtonLink = React.forwardRef<HTMLAnchorElement, ButtonLinkProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <Link
        ref={ref}
        className={buttonVariants({ variant, size, className })}
        {...props}
      />
    );
  }
);
ButtonLink.displayName = 'ButtonLink';
