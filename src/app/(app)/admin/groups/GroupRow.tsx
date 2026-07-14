'use client';

import { useState } from 'react';
import { AlertTriangle, Pencil, Users, X } from 'lucide-react';
import { GroupForm } from './GroupForm';
import { MentorAssignmentPanel } from './MentorAssignmentPanel';
import { ArchiveGroupButton } from './ArchiveGroupButton';
import { EXPECTED_ACTIVE_MENTOR_COUNT, type AdminGroup, type AdminGroupSchoolYearOption, type AdminMentorOption } from '@/features/groups/types';
import { t } from '@/lib/i18n';

type GroupRowProps = {
  group: AdminGroup;
  schoolYearOptions: AdminGroupSchoolYearOption[];
  mentorOptions: AdminMentorOption[];
};

export function GroupRow({ group, schoolYearOptions, mentorOptions }: GroupRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isManagingMentors, setIsManagingMentors] = useState(false);

  const activeMentors = group.mentors.filter((mentor) => mentor.activeUntil === null);
  const mentorCountMismatch = activeMentors.length !== EXPECTED_ACTIVE_MENTOR_COUNT;

  if (isEditing) {
    return (
      <tr className="bg-surface/60 dark:bg-ink/40">
        <td colSpan={6} className="p-3">
          <div className="rounded-xl border border-line dark:border-ink-secondary bg-white dark:bg-ink p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold text-ink dark:text-surface">
                {t('admin.groups.editTitle')}
              </h3>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-muted hover:bg-surface-sunken dark:hover:bg-ink-secondary"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <GroupForm
              mode="edit"
              group={group}
              schoolYearOptions={schoolYearOptions}
              onSaved={() => setIsEditing(false)}
              onCancel={() => setIsEditing(false)}
            />
          </div>
        </td>
      </tr>
    );
  }

  return (
    <>
      <tr className="hover:bg-surface/50 dark:hover:bg-ink/30">
        <td className="py-3 px-2 font-medium text-ink dark:text-surface-sunken">
          <div className="truncate">{group.name}</div>
          {group.layer ? (
            <div className="text-[10px] text-ink-muted dark:text-ink-muted mt-0.5">{group.layer}</div>
          ) : null}
        </td>
        <td className="py-3 px-2 text-ink-secondary dark:text-ink-muted whitespace-nowrap">
          {group.schoolYearName}
        </td>
        <td className="py-3 px-2 text-center text-ink-secondary dark:text-ink-muted">{group.studentCount}</td>
        <td className="py-3 px-2">
          <button
            type="button"
            onClick={() => setIsManagingMentors(true)}
            title={t('admin.groups.mentorsTitle')}
            aria-label={
              mentorCountMismatch
                ? t('admin.groups.mentorCountWarning', { count: String(activeMentors.length) })
                : t('admin.groups.mentorsTitle')
            }
            className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold text-ink-secondary dark:text-line hover:bg-surface-sunken dark:hover:bg-ink-secondary"
          >
            <Users className="h-3.5 w-3.5 shrink-0 text-ink-muted" aria-hidden="true" />
            <span>{activeMentors.length}</span>
            {mentorCountMismatch ? (
              <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-status-caution" aria-hidden="true" />
            ) : null}
          </button>
        </td>
        <td className="py-3 px-2 text-center">
          {group.isActive ? (
            <span className="text-[10px] font-bold uppercase text-accent dark:text-accent">
              {t('admin.groups.statusActive')}
            </span>
          ) : (
            <span className="text-[10px] font-bold uppercase text-ink-muted dark:text-ink-muted">
              {t('admin.groups.statusInactive')}
            </span>
          )}
        </td>
        <td className="py-2 px-1 text-center">
          <div className="flex items-center justify-center gap-1">
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              title={t('admin.groups.editButton')}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-muted hover:text-accent hover:bg-surface dark:hover:bg-ink-secondary transition-colors"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <ArchiveGroupButton groupId={group.id} name={group.name} isActive={group.isActive} />
          </div>
        </td>
      </tr>
      {isManagingMentors ? (
        <MentorAssignmentPanel
          group={group}
          mentorOptions={mentorOptions}
          onClose={() => setIsManagingMentors(false)}
        />
      ) : null}
    </>
  );
}
