'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { cn } from '@/lib/cn';
import { t } from '@/lib/i18n';
import { LEARNING_GROUP_WEEKDAYS } from '@/features/learning-groups/types';
import type {
  AdminLearningGroup,
  AdminLearningGroupLeaderOption,
  AdminLearningGroupOption,
  LearningGroupStateFilter,
  LearningGroupWeekday,
} from '@/features/learning-groups/types';
import { LearningGroupsViewSwitcher } from './LearningGroupsViewSwitcher';
import { LearningGroupsTimetable } from './LearningGroupsTimetable';
import { LearningGroupRow } from './LearningGroupRow';
import { LearningGroupForm } from './LearningGroupForm';
import { LearningGroupRescheduleModal } from './LearningGroupRescheduleModal';

type LearningGroupsWorkspaceProps = {
  view: string;
  learningGroups: AdminLearningGroup[];
  groups: AdminLearningGroupOption[];
  leaders: AdminLearningGroupLeaderOption[];
  defaultActiveFrom?: string;
  defaultActiveUntil?: string;
  weekdayFilter: string;
  stateFilter: string;
};

const STATE_OPTIONS: LearningGroupStateFilter[] = ['active', 'inactive', 'all'];

export function LearningGroupsWorkspace({
  view,
  learningGroups,
  groups,
  leaders,
  defaultActiveFrom,
  defaultActiveUntil,
  weekdayFilter,
  stateFilter,
}: LearningGroupsWorkspaceProps) {
  const [editingGroup, setEditingGroup] = useState<AdminLearningGroup | null>(null);
  const [reschedulingGroup, setReschedulingGroup] = useState<AdminLearningGroup | null>(null);
  const searchParams = useSearchParams();

  function buildFilterHref(weekday: LearningGroupWeekday | 'all', state: LearningGroupStateFilter) {
    const params = new URLSearchParams(searchParams.toString());
    if (weekday === 'all') {
      params.delete('weekday');
    } else {
      params.set('weekday', weekday);
    }
    if (state === 'active') {
      params.delete('state');
    } else {
      params.set('state', state);
    }
    const query = params.toString();
    return query ? `/admin/learning-groups?${query}` : '/admin/learning-groups';
  }

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[1fr_380px]">
      <section className="min-w-0 space-y-4 rounded-2xl border border-line bg-white p-4 shadow-sm dark:border-ink-secondary dark:bg-ink">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between border-b border-surface-sunken dark:border-ink-secondary pb-4">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-bold text-ink dark:text-surface leading-none">
              {t('admin.learningGroups.listTitle')}
            </h2>
            <LearningGroupsViewSwitcher currentView={view} />
          </div>

          <div className="flex flex-wrap gap-2">
            <nav
              className="flex gap-1 rounded-lg bg-surface-sunken p-1 dark:bg-ink"
              aria-label={t('admin.learningGroups.weekdayFilterLabel')}
            >
              {(['all', ...LEARNING_GROUP_WEEKDAYS] as Array<LearningGroupWeekday | 'all'>).map(
                (option) => (
                  <Link
                    key={option}
                    href={buildFilterHref(option, stateFilter as LearningGroupStateFilter)}
                    className={cn(
                      'rounded-md px-2.5 py-1 text-xs font-semibold transition-colors',
                      weekdayFilter === option
                        ? 'bg-white text-accent-strong shadow-sm dark:bg-ink dark:text-accent-strong'
                        : 'text-ink-muted hover:text-ink-secondary dark:text-ink-muted dark:hover:text-line'
                    )}
                  >
                    {option === 'all'
                      ? t('admin.learningGroups.weekday_all')
                      : t(`admin.learningGroups.weekday_${option}`)}
                  </Link>
                )
              )}
            </nav>
            <nav
              className="flex gap-1 rounded-lg bg-surface-sunken p-1 dark:bg-ink"
              aria-label={t('admin.learningGroups.stateFilterLabel')}
            >
              {STATE_OPTIONS.map((option) => (
                <Link
                  key={option}
                  href={buildFilterHref(weekdayFilter as LearningGroupWeekday | 'all', option)}
                  className={cn(
                    'rounded-md px-2.5 py-1 text-xs font-semibold transition-colors',
                    stateFilter === option
                      ? 'bg-white text-accent-strong shadow-sm dark:bg-ink dark:text-accent-strong'
                      : 'text-ink-muted hover:text-ink-secondary dark:text-ink-muted dark:hover:text-line'
                  )}
                >
                  {t(`admin.learningGroups.state_${option}`)}
                </Link>
              ))}
            </nav>
          </div>
        </div>

        {view === 'list' ? (
          learningGroups.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-start text-xs">
                <thead>
                  <tr className="border-b border-surface-sunken font-semibold text-ink-muted dark:border-ink-secondary dark:text-ink-muted">
                    <th className="px-2 py-2.5 text-start">{t('admin.learningGroups.colTitle')}</th>
                    <th className="px-2 py-2.5 text-start">{t('admin.learningGroups.colWeekday')}</th>
                    <th className="px-2 py-2.5 text-start">{t('admin.learningGroups.colTime')}</th>
                    <th className="px-2 py-2.5 text-start">{t('admin.learningGroups.colLeader')}</th>
                    <th className="px-2 py-2.5 text-start">{t('admin.learningGroups.colRoom')}</th>
                    <th className="px-2 py-2.5 text-start">{t('admin.learningGroups.colGroups')}</th>
                    <th className="w-20 px-2 py-2.5 text-center">{t('admin.learningGroups.colState')}</th>
                    <th className="w-20 px-2 py-2.5 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-sunken dark:divide-ink-secondary/50">
                  {learningGroups.map((learningGroup) => (
                    <LearningGroupRow
                      key={learningGroup.id}
                      learningGroup={learningGroup}
                      groups={groups}
                      leaders={leaders}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-line py-10 text-center text-ink-muted dark:border-ink dark:text-ink-muted">
              {t('admin.learningGroups.emptyList')}
            </div>
          )
        ) : (
          <div>
            {learningGroups.length > 0 ? (
              <LearningGroupsTimetable
                learningGroups={learningGroups}
                weekdayFilter={weekdayFilter}
                onEditGroup={(group) => setEditingGroup(group)}
                onRescheduleGroup={(group) => setReschedulingGroup(group)}
              />
            ) : (
              <div className="rounded-xl border border-dashed border-line py-10 text-center text-ink-muted dark:border-ink dark:text-ink-muted">
                {t('admin.learningGroups.emptyList')}
              </div>
            )}
          </div>
        )}
      </section>

      <aside className="sticky top-6">
        <section className="rounded-2xl border border-line bg-white p-5 shadow-sm dark:border-ink-secondary dark:bg-ink">
          {editingGroup ? (
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold text-ink dark:text-surface">
                  {t('admin.learningGroups.editTitle')}
                </h2>
                <button
                  type="button"
                  onClick={() => setEditingGroup(null)}
                  className="text-xs text-accent hover:text-accent-strong font-bold"
                >
                  {t('admin.learningGroups.cancelButton')}
                </button>
              </div>
              <LearningGroupForm
                key={`edit-${editingGroup.id}`}
                groups={groups}
                leaders={leaders}
                mode="edit"
                learningGroupId={editingGroup.id}
                initialValues={{
                  title: editingGroup.title,
                  description: editingGroup.description ?? '',
                  weekday: editingGroup.weekday,
                  startsAt: editingGroup.startsAt,
                  endsAt: editingGroup.endsAt,
                  leaderId: editingGroup.leaderId ?? '',
                  room: editingGroup.room ?? '',
                  activeFrom: editingGroup.activeFrom,
                  activeUntil: editingGroup.activeUntil ?? '',
                  isActive: editingGroup.isActive,
                  groupIds: editingGroup.targetGroupIds,
                }}
                onSaved={() => setEditingGroup(null)}
              />
            </div>
          ) : (
            <div>
              <h2 className="mb-4 text-lg font-bold text-ink dark:text-surface">
                {t('admin.learningGroups.createTitle')}
              </h2>
              <LearningGroupForm
                groups={groups}
                leaders={leaders}
                mode="create"
                defaultActiveFrom={defaultActiveFrom}
                defaultActiveUntil={defaultActiveUntil}
              />
            </div>
          )}
        </section>
      </aside>

      {reschedulingGroup && (
        <LearningGroupRescheduleModal
          group={reschedulingGroup}
          onClose={() => setReschedulingGroup(null)}
        />
      )}
    </div>
  );
}
