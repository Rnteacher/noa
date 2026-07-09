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
      <section className="min-w-0 space-y-4 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between border-b border-zinc-100 dark:border-zinc-805 pb-4">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-bold text-zinc-950 dark:text-zinc-50 leading-none">
              {t('admin.learningGroups.listTitle')}
            </h2>
            <LearningGroupsViewSwitcher currentView={view} />
          </div>

          <div className="flex flex-wrap gap-2">
            <nav
              className="flex gap-1 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-850"
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
                        ? 'bg-white text-emerald-700 shadow-sm dark:bg-zinc-950 dark:text-emerald-400'
                        : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
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
              className="flex gap-1 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-850"
              aria-label={t('admin.learningGroups.stateFilterLabel')}
            >
              {STATE_OPTIONS.map((option) => (
                <Link
                  key={option}
                  href={buildFilterHref(weekdayFilter as LearningGroupWeekday | 'all', option)}
                  className={cn(
                    'rounded-md px-2.5 py-1 text-xs font-semibold transition-colors',
                    stateFilter === option
                      ? 'bg-white text-emerald-700 shadow-sm dark:bg-zinc-950 dark:text-emerald-400'
                      : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
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
                  <tr className="border-b border-zinc-100 font-semibold text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
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
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
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
            <div className="rounded-xl border border-dashed border-zinc-200 py-10 text-center text-zinc-500 dark:border-zinc-850 dark:text-zinc-450">
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
              />
            ) : (
              <div className="rounded-xl border border-dashed border-zinc-200 py-10 text-center text-zinc-500 dark:border-zinc-850 dark:text-zinc-450">
                {t('admin.learningGroups.emptyList')}
              </div>
            )}
          </div>
        )}
      </section>

      <aside className="sticky top-6">
        <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          {editingGroup ? (
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold text-zinc-950 dark:text-zinc-50">
                  {t('admin.learningGroups.editTitle')}
                </h2>
                <button
                  type="button"
                  onClick={() => setEditingGroup(null)}
                  className="text-xs text-emerald-600 hover:text-emerald-700 font-bold"
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
              <h2 className="mb-4 text-lg font-bold text-zinc-950 dark:text-zinc-50">
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
    </div>
  );
}
