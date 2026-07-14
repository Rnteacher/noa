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
        <div className="mt-1 flex shrink-0 items-center gap-2">
          {trailing}
          <svg
            width="28"
            height="28"
            viewBox="0 0 787.9 800.51"
            aria-hidden="true"
            className="shrink-0 text-ink opacity-80"
          >
            <path
              fill="currentColor"
              d="M520.71,202.98c-33.42-34.1-75.7-51.83-126.85-53.2h0s0,0,0,0,0,0,0,0h0c-51.15,1.37-93.43,19.1-126.85,53.2-34.1,33.42-51.83,75.7-53.2,126.86.68,38.88,11.25,72.98,31.71,102.3,5.46,7.5,16.37,22.51,16.37,22.51,12.96,17.05,24.55,34.44,34.78,52.17,6.14,11.59,10.23,23.53,12.28,35.81h50.13c-2.73-19.78-9.21-39.56-19.44-59.34-12.28-21.82-25.58-41.94-39.9-60.36-5.46-6.82-9.89-12.96-13.3-18.41-15-21.82-22.85-46.72-23.53-74.68.68-36.83,13.3-67.86,37.85-93.1,25.23-24.55,56.27-37.17,93.09-37.85,36.83.68,67.86,13.3,93.09,37.85,24.55,25.23,37.17,56.27,37.85,93.1-.68,27.96-8.53,52.86-23.53,74.68-3.41,5.46-7.84,11.59-13.3,18.41-14.32,18.41-27.62,38.53-39.9,60.36-10.23,19.78-16.71,39.56-19.44,59.34h50.13c2.05-12.28,6.14-24.21,12.28-35.81,10.23-17.73,21.82-35.12,34.78-52.17,0,0,10.91-15,16.37-22.51,20.46-29.33,31.03-63.43,31.71-102.3-1.36-51.15-19.1-93.44-53.2-126.86Z"
            />
            <circle fill="currentColor" cx="393.84" cy="616.48" r="38.37" />
          </svg>
        </div>
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
