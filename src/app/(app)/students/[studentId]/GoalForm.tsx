'use client';

import { useId, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Plus } from 'lucide-react';
import { createStudentGoal } from '@/features/students/actions';
import { t } from '@/lib/i18n';

type GoalFormProps = {
  studentId: string;
};

export function GoalForm({ studentId }: GoalFormProps) {
  const titleId = useId();
  const descriptionId = useId();
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!title.trim()) {
      setError(t('students.goals.titleRequired'));
      return;
    }

    setError(null);
    setSuccess(false);

    startTransition(async () => {
      const result = await createStudentGoal(studentId, title, description);

      if (!result.success) {
        setError(result.error ? t(result.error) : t('students.goals.createFailed'));
        return;
      }

      setTitle('');
      setDescription('');
      setSuccess(true);
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border border-line p-3">
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
          placeholder={t('students.goals.titlePlaceholder')}
          className="h-10 w-full rounded-lg border border-line bg-surface-sunken px-3 text-sm text-ink outline-none transition-all focus:border-accent focus:ring-1 focus:ring-accent disabled:opacity-50"
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
          className="w-full rounded-lg border border-line bg-surface-sunken px-3 py-2 text-sm text-ink outline-none transition-all focus:border-accent focus:ring-1 focus:ring-accent disabled:opacity-50"
        />
      </div>

      {error ? (
        <p className="text-sm font-semibold text-status-critical" role="alert">
          {error}
        </p>
      ) : null}

      {success ? (
        <p className="text-sm font-semibold text-status-positive" role="status">
          {t('students.goals.createSuccess')}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending || !title.trim()}
        className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-accent px-3 text-sm font-bold text-on-accent transition-all hover:bg-accent/90 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        {isPending ? (
          <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
        ) : (
          <Plus aria-hidden="true" className="h-4 w-4" />
        )}
        <span>{t('students.goals.createButton')}</span>
      </button>
    </form>
  );
}
