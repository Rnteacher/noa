'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/cn';
import { t } from '@/lib/i18n';

type LearningGroupsViewSwitcherProps = {
  currentView: string;
};

const VIEWS = ['timetable', 'list'] as const;

export function LearningGroupsViewSwitcher({ currentView }: LearningGroupsViewSwitcherProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleViewChange(view: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('view', view);
    router.push(`/admin/learning-groups?${params.toString()}`);
  }

  return (
    <nav className="flex gap-1 rounded-xl bg-surface-sunken dark:bg-ink-secondary p-1" aria-label={t('admin.learningGroups.stateFilterLabel')}>
      {VIEWS.map((view) => (
        <button
          key={view}
          type="button"
          onClick={() => handleViewChange(view)}
          className={cn(
            'rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all',
            currentView === view
              ? 'bg-white dark:bg-ink text-accent dark:text-accent shadow-sm'
              : 'text-ink-muted dark:text-ink-muted hover:text-ink dark:hover:text-line'
          )}
        >
          {t(`admin.learningGroups.view_${view}`)}
        </button>
      ))}
    </nav>
  );
}
