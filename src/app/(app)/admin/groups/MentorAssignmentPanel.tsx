'use client';

import { useState, useTransition } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { AlertTriangle, Loader2, UserMinus, UserPlus, X } from 'lucide-react';
import { assignMentor, removeMentor } from '@/features/groups/admin-actions';
import { EXPECTED_ACTIVE_MENTOR_COUNT, type AdminGroup, type AdminMentorOption } from '@/features/groups/types';
import { t } from '@/lib/i18n';

type MentorAssignmentPanelProps = {
  group: AdminGroup;
  mentorOptions: AdminMentorOption[];
  onClose: () => void;
};

export function MentorAssignmentPanel({ group, mentorOptions, onClose }: MentorAssignmentPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedMentorId, setSelectedMentorId] = useState('');
  const [error, setError] = useState<string | null>(null);

  const activeMentors = group.mentors.filter((mentor) => mentor.activeUntil === null);
  const assignedMentorIds = new Set(activeMentors.map((mentor) => mentor.mentorId));
  const availableMentors = mentorOptions.filter((mentor) => !assignedMentorIds.has(mentor.id));
  const mentorCountMismatch = activeMentors.length !== EXPECTED_ACTIVE_MENTOR_COUNT;

  function handleAssign() {
    if (!selectedMentorId) {
      setError(t('admin.groups.errorSelectMentor'));
      return;
    }
    setError(null);

    startTransition(async () => {
      const result = await assignMentor(group.id, selectedMentorId);
      if (!result.success) {
        setError(result.error ? t(result.error) : t('admin.groups.errorAssignMentorFailed'));
        return;
      }
      setSelectedMentorId('');
      router.refresh();
    });
  }

  function handleRemove(groupMentorId: string) {
    setError(null);
    startTransition(async () => {
      const result = await removeMentor(groupMentorId);
      if (!result.success) {
        setError(result.error ? t(result.error) : t('admin.groups.errorRemoveMentorFailed'));
        return;
      }
      router.refresh();
    });
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/40 backdrop-blur-xs p-4"
      role="dialog"
      aria-modal="true"
      aria-label={t('admin.groups.mentorsTitle')}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-xl animate-in fade-in zoom-in-95 duration-150"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-base font-black text-zinc-950 dark:text-zinc-50">
            {t('admin.groups.mentorsTitle')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('admin.calendar.cancelButton')}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="mb-4 text-xs font-semibold text-zinc-500 dark:text-zinc-400">{group.name}</p>

        {mentorCountMismatch ? (
          <div
            className="mb-4 flex items-start gap-2 rounded-xl border border-amber-300/50 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800/50 px-3 py-2 text-xs font-semibold text-amber-700 dark:text-amber-400"
            role="status"
          >
            <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            <span>
              {t('admin.groups.mentorCountWarning', { count: String(activeMentors.length) })}
            </span>
          </div>
        ) : null}

        <div className="space-y-2 mb-4">
          {activeMentors.length > 0 ? (
            activeMentors.map((mentor) => (
              <div
                key={mentor.id}
                className="flex items-center justify-between gap-2 rounded-xl border border-zinc-200 dark:border-zinc-750 bg-zinc-50 dark:bg-zinc-950/50 px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                    {mentor.mentorName}
                  </p>
                  {mentor.isPrimary ? (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                      {t('admin.groups.primaryMentorBadge')}
                    </span>
                  ) : null}
                </div>
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => handleRemove(mentor.id)}
                  title={t('admin.groups.removeMentorButton')}
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-zinc-400 hover:text-status-critical hover:bg-white dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
                >
                  <UserMinus className="h-4 w-4" />
                </button>
              </div>
            ))
          ) : (
            <p className="text-xs text-zinc-450 dark:text-zinc-600">{t('admin.groups.noMentorsAssigned')}</p>
          )}
        </div>

        <div className="flex items-end gap-2 border-t border-zinc-100 dark:border-zinc-800 pt-4">
          <label className="block flex-1">
            <span className="mb-1 block text-xs font-bold text-zinc-700 dark:text-zinc-300">
              {t('admin.groups.addMentorLabel')}
            </span>
            <select
              disabled={isPending || availableMentors.length === 0}
              value={selectedMentorId}
              onChange={(event) => setSelectedMentorId(event.target.value)}
              className="h-11 w-full rounded-xl border border-zinc-200 dark:border-zinc-750 bg-white dark:bg-zinc-950 px-3 text-sm text-zinc-950 dark:text-zinc-50 outline-none focus:border-emerald-600"
            >
              <option value="">
                {availableMentors.length === 0
                  ? t('admin.groups.noAvailableMentors')
                  : t('admin.groups.selectMentorPlaceholder')}
              </option>
              {availableMentors.map((mentor) => (
                <option key={mentor.id} value={mentor.id}>
                  {mentor.fullName}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            disabled={isPending || !selectedMentorId}
            onClick={handleAssign}
            className="flex h-11 shrink-0 items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 text-xs font-bold text-white transition-colors disabled:opacity-50"
          >
            {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserPlus className="h-3.5 w-3.5" />}
            <span>{t('admin.groups.assignButton')}</span>
          </button>
        </div>

        {error ? (
          <p className="mt-3 text-xs font-semibold text-status-critical" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </div>,
    document.body
  );
}
