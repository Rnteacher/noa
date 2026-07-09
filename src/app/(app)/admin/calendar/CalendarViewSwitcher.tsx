'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/cn';
import { t } from '@/lib/i18n';

type CalendarViewSwitcherProps = {
  currentView: string;
};

const VIEWS = ['list', 'day', 'week', 'month'] as const;

export function CalendarViewSwitcher({ currentView }: CalendarViewSwitcherProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleViewChange(view: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('view', view);
    router.push(`/admin/calendar?${params.toString()}`);
  }

  return (
    <nav className="flex gap-1 rounded-xl bg-zinc-100 dark:bg-zinc-800 p-1" aria-label={t('admin.calendar.filterLabel')}>
      {VIEWS.map((view) => (
        <button
          key={view}
          type="button"
          onClick={() => handleViewChange(view)}
          className={cn(
            'rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all',
            currentView === view
              ? 'bg-white dark:bg-zinc-950 text-emerald-600 dark:text-emerald-400 shadow-sm'
              : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-850 dark:hover:text-zinc-200'
          )}
        >
          {t(`admin.calendar.view_${view}`)}
        </button>
      ))}
    </nav>
  );
}
