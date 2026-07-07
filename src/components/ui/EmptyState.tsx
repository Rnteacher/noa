import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

type EmptyStateProps = {
  /** Small quiet icon rendered above the headline. */
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  /** Single optional action (link or button) offered to the viewer. */
  action?: ReactNode;
  className?: string;
};

/**
 * Shared empty-state vocabulary: icon, one-line headline, optional hint,
 * optional single action. Warm and informative, never blaming.
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center gap-2 rounded-2xl border border-dashed border-line px-6 py-8 text-center',
        className
      )}
    >
      {icon ? <div className="mb-1 text-ink-muted">{icon}</div> : null}
      <p className="text-sm font-semibold text-ink">{title}</p>
      {description ? (
        <p className="text-xs leading-5 text-ink-secondary">{description}</p>
      ) : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
