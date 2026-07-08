'use client';

import { useState } from 'react';
import { Pencil, X } from 'lucide-react';
import { ArchiveLearningGroupButton } from './ArchiveLearningGroupButton';
import { LearningGroupForm } from './LearningGroupForm';
import type {
  AdminLearningGroup,
  AdminLearningGroupLeaderOption,
  AdminLearningGroupOption,
} from '@/features/learning-groups/types';
import { t } from '@/lib/i18n';

type LearningGroupRowProps = {
  learningGroup: AdminLearningGroup;
  groups: AdminLearningGroupOption[];
  leaders: AdminLearningGroupLeaderOption[];
};

function formatDate(value: string | null) {
  if (!value) {
    return '';
  }

  return new Intl.DateTimeFormat('he-IL', { dateStyle: 'short' }).format(
    new Date(`${value}T00:00:00`)
  );
}

function formatTime(value: string) {
  return value.slice(0, 5);
}

export function LearningGroupRow({ learningGroup, groups, leaders }: LearningGroupRowProps) {
  const [isEditing, setIsEditing] = useState(false);

  if (isEditing) {
    return (
      <tr className="bg-zinc-50/60 dark:bg-zinc-900/40">
        <td colSpan={8} className="p-3">
          <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-750 dark:bg-zinc-950">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold text-zinc-950 dark:text-zinc-50">
                {t('admin.learningGroups.editTitle')}
              </h3>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <LearningGroupForm
              groups={groups}
              leaders={leaders}
              mode="edit"
              learningGroupId={learningGroup.id}
              initialValues={{
                title: learningGroup.title,
                description: learningGroup.description ?? '',
                weekday: learningGroup.weekday,
                startsAt: learningGroup.startsAt,
                endsAt: learningGroup.endsAt,
                leaderId: learningGroup.leaderId ?? '',
                room: learningGroup.room ?? '',
                activeFrom: learningGroup.activeFrom,
                activeUntil: learningGroup.activeUntil ?? '',
                isActive: learningGroup.isActive,
                groupIds: learningGroup.targetGroupIds,
              }}
              onSaved={() => setIsEditing(false)}
            />
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr className="hover:bg-zinc-50/50 dark:hover:bg-zinc-850/30">
      <td className="max-w-[180px] px-2 py-3 font-medium text-zinc-900 dark:text-zinc-100 sm:max-w-[260px]">
        <div className="truncate">{learningGroup.title}</div>
        {learningGroup.description ? (
          <div className="mt-0.5 truncate text-[10px] text-zinc-400 dark:text-zinc-550">
            {learningGroup.description}
          </div>
        ) : null}
      </td>
      <td className="whitespace-nowrap px-2 py-3 text-zinc-600 dark:text-zinc-450">
        {t(`admin.learningGroups.weekday_${learningGroup.weekday}`)}
      </td>
      <td className="whitespace-nowrap px-2 py-3 font-mono text-[11px] text-zinc-600 dark:text-zinc-450">
        {formatTime(learningGroup.startsAt)}-{formatTime(learningGroup.endsAt)}
      </td>
      <td className="max-w-[140px] px-2 py-3 text-zinc-600 dark:text-zinc-450">
        <div className="truncate">
          {learningGroup.leaderName ?? t('admin.learningGroups.noLeader')}
        </div>
      </td>
      <td className="max-w-[120px] px-2 py-3 text-zinc-600 dark:text-zinc-450">
        <div className="truncate">{learningGroup.room ?? '-'}</div>
      </td>
      <td className="max-w-[180px] px-2 py-3 text-zinc-600 dark:text-zinc-450">
        <div className="truncate">
          {learningGroup.targetGroupNames.length > 0
            ? learningGroup.targetGroupNames.join(', ')
            : '-'}
        </div>
        <div className="mt-0.5 truncate text-[10px] text-zinc-400 dark:text-zinc-550">
          {formatDate(learningGroup.activeFrom)}
          {learningGroup.activeUntil ? ` - ${formatDate(learningGroup.activeUntil)}` : ''}
        </div>
      </td>
      <td className="px-2 py-3 text-center">
        <span
          className={
            learningGroup.isActive
              ? 'rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-bold text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300'
              : 'rounded-full bg-zinc-100 px-2 py-1 text-[10px] font-bold text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'
          }
        >
          {learningGroup.isActive
            ? t('admin.learningGroups.stateActive')
            : t('admin.learningGroups.stateInactive')}
        </span>
      </td>
      <td className="px-1 py-2 text-center">
        <div className="flex items-center justify-center gap-1">
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            title={t('admin.learningGroups.editButton')}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-50 hover:text-emerald-600 dark:hover:bg-zinc-800"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <ArchiveLearningGroupButton
            learningGroupId={learningGroup.id}
            title={learningGroup.title}
            isActive={learningGroup.isActive}
          />
        </div>
      </td>
    </tr>
  );
}
