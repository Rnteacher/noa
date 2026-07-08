'use client';

import { useId, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Loader2 } from 'lucide-react';
import { updateEmotionalStatus } from '@/features/students/actions';
import type { TrafficLightStatus } from '@/features/students/types';
import { t } from '@/lib/i18n';

type EmotionalStatusFormProps = {
  studentId: string;
  currentStatus: TrafficLightStatus | null;
};

const EMOTIONAL_STATUSES = ['green', 'yellow', 'red'] as const;

function statusLabel(status: TrafficLightStatus) {
  if (status === 'green') {
    return t('status.positive');
  }

  if (status === 'yellow') {
    return t('status.caution');
  }

  return t('status.critical');
}

export function EmotionalStatusForm({
  studentId,
  currentStatus,
}: EmotionalStatusFormProps) {
  const selectId = useId();
  const router = useRouter();
  const [selectedStatus, setSelectedStatus] = useState<TrafficLightStatus>(
    currentStatus ?? 'green'
  );
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
      const result = await updateEmotionalStatus(studentId, selectedStatus);

      if (!result.success) {
        setError(result.error ? t(result.error) : t('students.emotionalStatus.updateFailed'));
        return;
      }

      setSuccess(true);
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-lg border border-line p-3">
      <div className="space-y-1">
        <label htmlFor={selectId} className="block text-xs font-semibold text-ink-secondary">
          {t('students.emotionalStatus.selectLabel')}
        </label>
        <select
          id={selectId}
          value={selectedStatus}
          onChange={(event) => {
            setSelectedStatus(event.target.value as TrafficLightStatus);
            setSuccess(false);
            setError(null);
          }}
          disabled={isPending}
          className="h-10 w-full rounded-lg border border-line bg-surface-sunken px-3 text-sm text-ink outline-none transition-all focus:border-accent focus:ring-1 focus:ring-accent disabled:opacity-50"
        >
          {EMOTIONAL_STATUSES.map((status) => (
            <option key={status} value={status}>
              {statusLabel(status)}
            </option>
          ))}
        </select>
      </div>

      {error ? (
        <p className="text-sm font-semibold text-status-critical" role="alert">
          {error}
        </p>
      ) : null}

      {success ? (
        <p className="text-sm font-semibold text-status-positive" role="status">
          {t('students.emotionalStatus.updateSuccess')}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending || !hasChanged}
        className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-accent px-3 text-sm font-bold text-on-accent transition-all hover:bg-accent/90 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        {isPending ? (
          <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
        ) : (
          <Check aria-hidden="true" className="h-4 w-4" />
        )}
        <span>{t('students.emotionalStatus.submitButton')}</span>
      </button>
    </form>
  );
}
