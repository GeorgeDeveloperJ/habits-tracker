import * as React from 'react';
import { cn } from '../../lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'sand' | 'contrast' | 'accent' | 'emerald';
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    const variants: Record<NonNullable<CardProps['variant']>, string> = {
      default:
        'bg-[var(--bg-card)] text-[var(--text-primary)] border border-[var(--border-hairline)]',
      sand:
        'bg-[var(--bg-sand)] text-[var(--text-primary)] border border-[var(--border-hairline)]',
      contrast:
        'bg-[var(--bg-contrast)] text-[var(--text-contrast)] border border-white/[0.06]',
      accent:
        'bg-[#E6FA72] text-[#121212] border border-[#121212]/10 dark:bg-[#D96BFF] dark:text-[#0D0914] dark:border-white/10',
      emerald:
        'bg-[#5CE68A] text-[#121212] border border-[#121212]/10 dark:bg-[#1E1730] dark:text-[#F7F5FF] dark:border-[#5CE68A]/25',
    };

    return (
      <div
        ref={ref}
        className={cn('rounded-[28px] transition-colors', variants[variant], className)}
        {...props}
      />
    );
  }
);
Card.displayName = 'Card';

export const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-1.5 p-6', className)}
    {...props}
  />
));
CardHeader.displayName = 'CardHeader';

export const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      'text-base font-semibold leading-snug tracking-[-0.015em] text-inherit',
      className
    )}
    {...props}
  />
));
CardTitle.displayName = 'CardTitle';

export const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-xs text-inherit opacity-75', className)}
    {...props}
  />
));
CardDescription.displayName = 'CardDescription';

export const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
));
CardContent.displayName = 'CardContent';

export const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center p-6 pt-0', className)}
    {...props}
  />
));
CardFooter.displayName = 'CardFooter';
