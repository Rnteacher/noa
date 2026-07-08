'use client';

import { useId, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Loader2 } from 'lucide-react';
import { updateStudentGoalDetails } from '@/features/students/actions';
import { t } from '@/lib/i18n';

type GoalDetailsFormProps = {
  studentId: string;
  goalId: string;
  currentTitle: string;
  currentDescription: string | null;
};

export function GoalDetailsForm({
  studentId,
  goalId,
  currentTitle,
  currentDescription,
}: GoalDetailsFormProps) {
  const titleId = useId();
  const descriptionId = useId();
  const router = useRouter();
  const [title, setTitle] = useState(currentTitle);
  const [description, setDescription] = useState(currentDescription ?? '');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  const normalizedDescription = description.trim();
  const hasChanged =
    title.trim() !== currentTitle ||
    normalizedDescription !== (currentDescription ?? '');

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!title.trim()) {
      setError(t('students.goals.titleRequired'));
      return;
    }

    if (!hasChanged) {
      return;
    }

    setError(null);
    setSuccess(false);

    startTransition(async () => {
      const result = await updateStudentGoalDetails(studentId, goalId, title, description);

      if (!result.success) {
        setError(result.error ? t(result.error) : t('students.goals.detailsUpdateFailed'));
        return;
      }

      setSuccess(true);
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="space-y-1">
        <label htmlFor={titleId} className="block text-xs font-semibold text-ink-secondary">
          {t('students.goals.titleLabel')}
        </label>
        <input
          id={titleId}
          type="text"
          value={title}
          maxLength={120}
          onChange={(event) => {
            setTitle(event.target.value);
            setSuccess(false);
            setError(null);
          }}
          disabled={isPending}
          className="h-9 w-full rounded-lg border border-line bg-surface-sunken px-2 text-sm text-ink outline-none transition-all focus:border-accent focus:ring-1 focus:ring-accent disabled:opacity-50"
        />
      </div>

      <div className="space-y-1">
        <label
          htmlFor={descriptionId}
          className="block text-xs font-semibold text-ink-secondary"
        >
          {t('students.goals.descriptionLabel')}
        </label>
        <textarea
          id={descriptionId}
          value={description}
          maxLength={1000}
          rows={2}
          onChange={(event) => {
            setDescription(event.target.value);
            setSuccess(false);
            setError(null);
          }}
          disabled={isPending}
          className="w-full rounded-lg border border-line bg-surface-sunken px-2 py-2 text-sm text-ink outline-none transition-all focus:border-accent focus:ring-1 focus:ring-accent disabled:opacity-50"
        />
      </div>

      {error ? (
        <p className="text-sm font-semibold text-status-critical" role="alert">
          {error}
        </p>
      ) : null}

      {success ? (
        <p className="text-sm font-semibold text-status-positive" role="status">
          {t('students.goals.detailsUpdateSuccess')}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending || !title.trim() || !hasChanged}
        className="flex h-9 w-full items-center justify-center gap-2 rounded-lg bg-accent px-3 text-xs font-bold text-on-accent transition-all hover:bg-accent/90 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        {isPending ? (
          <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
        ) : (
          <Check aria-hidden="true" className="h-4 w-4" />
        )}
        <span>{t('students.goals.detailsUpdateButton')}</span>
      </button>
    </form>
  );
}
