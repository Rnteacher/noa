'use client';

import { useId, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Loader2 } from 'lucide-react';
import { updateStudentGoalStatus } from '@/features/students/actions';
import type { GoalStatus } from '@/features/students/types';
import { t } from '@/lib/i18n';

type GoalStatusFormProps = {
  studentId: string;
  goalId: string;
  currentStatus: GoalStatus;
};

const GOAL_STATUSES = ['active', 'completed', 'paused', 'archived'] as const;

export function GoalStatusForm({ studentId, goalId, currentStatus }: GoalStatusFormProps) {
  const selectId = useId();
  const router = useRouter();
  const [selectedStatus, setSelectedStatus] = useState<GoalStatus>(currentStatus);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  const hasChanged = selectedStatus !== currentStatus;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!hasChanged) {
      return;
    }

    setError(null);
    setSuccess(false);

    startTransition(async () => {
      const result = await updateStudentGoalStatus(studentId, goalId, selectedStatus);

      if (!result.success) {
        setError(result.error ? t(result.error) : t('students.goals.updateFailed'));
        return;
      }

      setSuccess(true);
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor={selectId} className="sr-only">
          {t('students.goals.statusLabel')}
        </label>
        <select
          id={selectId}
          value={selectedStatus}
          onChange={(event) => {
            setSelectedStatus(event.target.value as GoalStatus);
            setSuccess(false);
            setError(null);
          }}
          disabled={isPending}
          className="h-9 min-w-0 flex-1 rounded-lg border border-line bg-surface-sunken px-2 text-sm text-ink outline-none transition-all focus:border-accent focus:ring-1 focus:ring-accent disabled:opacity-50"
        >
          {GOAL_STATUSES.map((status) => (
            <option key={status} value={status}>
              {t(`students.goals.status.${status}`)}
            </option>
          ))}
        </select>
        <button
          type="submit"
          disabled={isPending || !hasChanged}
          className="flex h-9 shrink-0 items-center justify-center gap-1 rounded-lg bg-accent px-3 text-xs font-bold text-on-accent transition-all hover:bg-accent/90 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
        >
          {isPending ? (
            <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
          ) : (
            <Check aria-hidden="true" className="h-4 w-4" />
          )}
          <span>{t('students.goals.updateButton')}</span>
        </button>
      </div>

      {error ? (
        <p className="text-sm font-semibold text-status-critical" role="alert">
          {error}
        </p>
      ) : null}

      {success ? (
        <p className="text-sm font-semibold text-status-positive" role="status">
          {t('students.goals.updateSuccess')}
        </p>
      ) : null}
    </form>
  );
}
