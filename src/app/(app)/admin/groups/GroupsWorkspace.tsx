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
    <section className="space-y-4 rounded-2xl border border-line dark:border-ink-secondary bg-white dark:bg-ink p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-surface-sunken dark:border-ink-secondary pb-4">
        <div className="flex gap-1 bg-surface-sunken dark:bg-ink p-0.5 rounded-lg text-[10px]">
          {STATE_TABS.map((tab) => (
            <a
              key={tab}
              href={tab === 'active' ? '/admin/groups' : `/admin/groups?state=${tab}`}
              className={`px-2.5 py-1 rounded-md font-bold transition-all ${
                stateFilter === tab
                  ? 'bg-white dark:bg-ink text-accent dark:text-accent shadow-sm'
                  : 'text-ink-muted dark:text-ink-muted hover:text-ink-secondary dark:hover:text-line'
              }`}
            >
              {t(`admin.groups.state_${tab}`)}
            </a>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setIsCreating(true)}
          className="flex h-9 items-center gap-1.5 rounded-xl bg-accent hover:bg-accent-strong px-3.5 text-xs font-bold text-white transition-colors"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>{t('admin.groups.createTitle')}</span>
        </button>
      </div>

      {groups.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-start text-xs border-collapse">
            <thead>
              <tr className="border-b border-surface-sunken dark:border-ink-secondary text-ink-muted dark:text-ink-muted font-semibold">
                <th className="py-2.5 px-2 text-start">{t('admin.groups.colName')}</th>
                <th className="py-2.5 px-2 text-start">{t('admin.groups.colSchoolYear')}</th>
                <th className="py-2.5 px-2 text-center">{t('admin.groups.colStudents')}</th>
                <th className="py-2.5 px-2 text-start">{t('admin.groups.colMentors')}</th>
                <th className="py-2.5 px-2 text-center">{t('admin.groups.colStatus')}</th>
                <th className="py-2.5 px-2 text-center w-20"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-sunken dark:divide-ink-secondary/50">
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
        <div className="rounded-xl border border-dashed border-line dark:border-ink py-10 text-center text-ink-muted dark:text-ink-muted">
          {t('admin.groups.emptyList')}
        </div>
      )}

      {isCreating ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-xs p-4"
          role="dialog"
          aria-modal="true"
          aria-label={t('admin.groups.createTitle')}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-line dark:border-ink-secondary bg-white dark:bg-ink p-6 shadow-xl animate-in fade-in zoom-in-95 duration-150"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-black text-ink dark:text-surface">
                {t('admin.groups.createTitle')}
              </h2>
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                aria-label={t('admin.calendar.cancelButton')}
                className="rounded-lg p-1.5 text-ink-muted hover:bg-surface-sunken dark:hover:bg-ink-secondary"
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
