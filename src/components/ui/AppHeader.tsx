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
  /** Secondary line under the title. Only used by the "large" variant. */
  subtitle?: ReactNode;
  /**
   * "compact" (default): sticky, small bold title — used on sub-pages
   * (detail screens, back-button flows). "large": big 30px/800 title with
   * an optional subtitle, non-sticky — used on the 4 tab-root screens.
   */
  variant?: 'compact' | 'large';
  className?: string;
};

/**
 * Header for protected app screens. Compact mode is a sticky bar with an
 * optional back affordance; large mode matches the tab-root screens in the
 * Staff App Redesign mockup (big bold title, optional date subtitle).
 */
export function AppHeader({
  title,
  backHref,
  trailing,
  subtitle,
  variant = 'compact',
  className,
}: AppHeaderProps) {
  if (variant === 'large') {
    return (
      <header
        className={cn(
          'flex items-start justify-between gap-2 bg-surface px-[22px] pb-3.5 pt-2.5',
          className
        )}
      >
        <div className="min-w-0">
          <h1 className="truncate text-[30px] font-extrabold tracking-tight text-ink">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-0.5 text-[13px] font-medium text-ink-secondary">
              {subtitle}
            </p>
          ) : null}
        </div>
        {trailing ? (
          <div className="mt-1 flex shrink-0 items-center gap-1">
            {trailing}
          </div>
        ) : null}
      </header>
    );
  }

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
