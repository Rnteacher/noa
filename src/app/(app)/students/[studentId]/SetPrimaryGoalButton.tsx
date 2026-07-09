'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Star } from 'lucide-react';
import { setPrimaryStudentGoal } from '@/features/students/actions';
import { t } from '@/lib/i18n';

type SetPrimaryGoalButtonProps = {
  studentId: string;
  goalId: string;
};

export function SetPrimaryGoalButton({ studentId, goalId }: SetPrimaryGoalButtonProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    setError(null);

    startTransition(async () => {
      const result = await setPrimaryStudentGoal(studentId, goalId);

      if (!result.success) {
        setError(result.error ? t(result.error) : t('students.goals.setPrimaryFailed'));
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
        className="flex h-9 w-full items-center justify-center gap-2 rounded-lg border border-line bg-surface px-3 text-xs font-bold text-ink-secondary transition-all hover:border-accent hover:text-accent active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        {isPending ? (
          <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
        ) : (
          <Star aria-hidden="true" className="h-4 w-4" />
        )}
        <span>{t('students.goals.setPrimaryButton')}</span>
      </button>

      {error ? (
        <p className="text-sm font-semibold text-status-critical" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
