'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Trash2 } from 'lucide-react';
import { deleteStudentGoal } from '@/features/students/actions';
import { t } from '@/lib/i18n';

type DeleteGoalButtonProps = {
  studentId: string;
  goalId: string;
  goalTitle: string;
};

export function DeleteGoalButton({ studentId, goalId, goalTitle }: DeleteGoalButtonProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    const confirmed = window.confirm(
      t('students.goals.deleteConfirm', { title: goalTitle })
    );

    if (!confirmed) {
      return;
    }

    setError(null);

    startTransition(async () => {
      const result = await deleteStudentGoal(studentId, goalId);

      if (!result.success) {
        setError(result.error ? t(result.error) : t('students.goals.deleteFailed'));
        return;
      }

      router.refresh();
    });
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={isPending}
        className="flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-status-critical/30 bg-surface px-3 text-xs font-bold text-status-critical transition-all hover:bg-status-critical/10 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-status-critical"
      >
        {isPending ? (
          <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
        ) : (
          <Trash2 aria-hidden="true" className="h-4 w-4" />
        )}
        <span>{t('students.goals.deleteButton')}</span>
      </button>

      {error ? (
        <p className="text-sm font-semibold text-status-critical" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
