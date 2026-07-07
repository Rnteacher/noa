import { CircleAlert, CircleCheck, Info, TriangleAlert } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export type AlertVariant = 'info' | 'success' | 'warning' | 'danger';

type AlertProps = {
  variant?: AlertVariant;
  title?: ReactNode;
  children?: ReactNode;
  className?: string;
};

/*
 * Feedback tokens share hues with the accent/status tokens by design
 * (doc 05): same colors, different usage context (inline feedback banners
 * rather than student-state badges). Icons keep each variant readable
 * without color.
 */
const VARIANT_STYLES: Record<
  AlertVariant,
  { icon: typeof Info; classes: string }
> = {
  info: {
    icon: Info,
    classes: 'border-accent/30 bg-accent-soft/40 text-accent',
  },
  success: {
    icon: CircleCheck,
    classes:
      'border-status-positive/30 bg-status-positive-soft/60 text-status-positive',
  },
  warning: {
    icon: TriangleAlert,
    classes:
      'border-status-caution/30 bg-status-caution-soft/60 text-status-caution',
  },
  danger: {
    icon: CircleAlert,
    classes:
      'border-status-critical/30 bg-status-critical-soft/60 text-status-critical',
  },
};

/**
 * Inline alert for section-level feedback. A transient toast system is
 * deferred; blocking errors get inline placement at the point of failure.
 */
export function Alert({
  variant = 'info',
  title,
  children,
  className,
}: AlertProps) {
  const { icon: Icon, classes } = VARIANT_STYLES[variant];
  const isBlocking = variant === 'danger' || variant === 'warning';

  return (
    <div
      role={isBlocking ? 'alert' : 'status'}
      className={cn(
        'flex items-start gap-3 rounded-xl border p-3',
        classes,
        className
      )}
    >
      <Icon aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="min-w-0 flex-1 text-sm">
        {title ? <p className="font-semibold">{title}</p> : null}
        {children ? (
          <div
            className={cn(
              'leading-5 text-ink-secondary',
              title ? 'mt-1' : undefined
            )}
          >
            {children}
          </div>
        ) : null}
      </div>
    </div>
  );
}
