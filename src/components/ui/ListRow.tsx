import Link from 'next/link';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

type ListRowProps = {
  title: ReactNode;
  subtitle?: ReactNode;
  /** Slot at the start edge of the row (avatar, time block, icon). */
  leading?: ReactNode;
  /** Slot at the end edge of the row (status badges, chevron, count). */
  trailing?: ReactNode;
  /** When set, the whole row becomes a single accessible link target. */
  href?: string;
  className?: string;
};

/**
 * One row = one tappable idea. Whole-row tap target when href is given;
 * inner interactive elements belong in separate rows or dedicated hit areas.
 */
export function ListRow({
  title,
  subtitle,
  leading,
  trailing,
  href,
  className,
}: ListRowProps) {
  const content = (
    <>
      {leading ? <div className="shrink-0">{leading}</div> : null}
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold text-ink">{title}</div>
        {subtitle ? (
          <div className="mt-0.5 truncate text-xs text-ink-secondary">
            {subtitle}
          </div>
        ) : null}
      </div>
      {trailing ? <div className="shrink-0">{trailing}</div> : null}
    </>
  );

  const baseClasses = cn(
    'flex min-h-14 w-full items-center gap-3 px-4 py-3 text-start',
    className
  );

  if (href) {
    return (
      <Link
        href={href}
        className={cn(
          baseClasses,
          'transition-colors hover:bg-surface-sunken focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset'
        )}
      >
        {content}
      </Link>
    );
  }

  return <div className={baseClasses}>{content}</div>;
}
