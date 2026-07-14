'use client';

import { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { GroupForm } from './GroupForm';
import { GroupRow } from './GroupRow';
import type { AdminGroup, AdminGroupSchoolYearOption, AdminMentorOption, GroupStateFilter } from '@/features/groups/types';
import { t } from '@/lib/i18n';

type GroupsWorkspaceProps = {
  groups: AdminGroup[];
  mentorOptions: AdminMentorOption[];
  schoolYearOptions: AdminGroupSchoolYearOption[];
  stateFilter: GroupStateFilter;
};

const STATE_TABS: GroupStateFilter[] = ['active', 'inactive', 'all'];

export function GroupsWorkspace({ groups, mentorOptions, schoolYearOptions, stateFilter }: GroupsWorkspaceProps) {
  const [isCreating, setIsCreating] = useState(false);

  return (
    <section className="space-y-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-4">
        <div className="flex gap-1 bg-zinc-100 dark:bg-zinc-850 p-0.5 rounded-lg text-[10px]">
          {STATE_TABS.map((tab) => (
            <a
              key={tab}
              href={tab === 'active' ? '/admin/groups' : `/admin/groups?state=${tab}`}
              className={`px-2.5 py-1 rounded-md font-bold transition-all ${
                stateFilter === tab
                  ? 'bg-white dark:bg-zinc-950 text-emerald-600 dark:text-emerald-450 shadow-sm'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
              }`}
            >
              {t(`admin.groups.state_${tab}`)}
            </a>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setIsCreating(true)}
          className="flex h-9 items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-3.5 text-xs font-bold text-white transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>{t('admin.groups.createTitle')}</span>
        </button>
      </div>

      {groups.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs border-collapse">
            <thead>
              <tr className="border-b border-zinc-100 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 font-semibold">
                <th className="py-2.5 px-2 text-start">{t('admin.groups.colName')}</th>
                <th className="py-2.5 px-2 text-start">{t('admin.groups.colSchoolYear')}</th>
                <th className="py-2.5 px-2 text-center">{t('admin.groups.colStudents')}</th>
                <th className="py-2.5 px-2 text-start">{t('admin.groups.colMentors')}</th>
                <th className="py-2.5 px-2 text-center">{t('admin.groups.colStatus')}</th>
                <th className="py-2.5 px-2 text-center w-20"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
              {groups.map((group) => (
                <GroupRow
                  key={group.id}
                  group={group}
                  schoolYearOptions={schoolYearOptions}
                  mentorOptions={mentorOptions}
                />
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-zinc-200 dark:border-zinc-850 py-10 text-center text-zinc-500 dark:text-zinc-450">
          {t('admin.groups.emptyList')}
        </div>
      )}

      {isCreating ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/40 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
          aria-label={t('admin.groups.createTitle')}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-xl animate-in fade-in zoom-in-95 duration-150"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-black text-zinc-950 dark:text-zinc-50">
                {t('admin.groups.createTitle')}
              </h2>
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                aria-label={t('admin.calendar.cancelButton')}
                className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <GroupForm
              mode="create"
              schoolYearOptions={schoolYearOptions}
              onSaved={() => setIsCreating(false)}
              onCancel={() => setIsCreating(false)}
            />
          </div>
        </div>
      ) : null}
    </section>
  );
}
