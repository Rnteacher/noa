import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { t } from '@/lib/i18n';
import { cn } from '@/lib/cn';

type AppHeaderProps = {
  title: ReactNode;
  /** When set, a back affordance renders at the start edge of the header. */
  backHref?: string;
  /** Slot at the end edge (search icon, avatar, overflow actions). */
  trailing?: ReactNode;
  className?: string;
};

/**
 * Compact sticky header for protected app screens.
 */
export function AppHeader({
  title,
  backHref,
  trailing,
  className,
}: AppHeaderProps) {
  return (
    <header
      className={cn(
        'sticky top-0 z-10 flex min-h-14 items-center gap-2 border-b border-line bg-surface-raised/95 px-3 backdrop-blur-sm',
        className
      )}
    >
      {backHref ? (
        <Link
          href={backHref}
          aria-label={t('common.back')}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-ink-secondary transition-colors hover:bg-surface-sunken focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          {/* Directional icon flips with reading direction */}
          <ArrowLeft aria-hidden="true" className="h-5 w-5 rtl:-scale-x-100" />
        </Link>
      ) : null}
      <h1 className="min-w-0 flex-1 truncate text-base font-bold text-ink">
        {title}
      </h1>
      {trailing ? (
        <div className="flex shrink-0 items-center gap-1">{trailing}</div>
      ) : null}
    </header>
  );
}
