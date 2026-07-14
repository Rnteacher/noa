'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { rescheduleLearningGroup } from '@/features/learning-groups/admin-actions';
import { LEARNING_GROUP_WEEKDAYS } from '@/features/learning-groups/types';
import type { AdminLearningGroup, LearningGroupWeekday } from '@/features/learning-groups/types';
import { t } from '@/lib/i18n';

type LearningGroupRescheduleModalProps = {
  group: AdminLearningGroup;
  onClose: () => void;
};

function timeStringToMinutes(timeStr: string): number {
  const parts = timeStr.split(':').map(Number);
  return (parts[0] ?? 0) * 60 + (parts[1] ?? 0);
}

function minutesToTimeString(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(hours)}:${pad(mins)}`;
}

export function LearningGroupRescheduleModal({ group, onClose }: LearningGroupRescheduleModalProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [weekday, setWeekday] = useState<LearningGroupWeekday>(group.weekday);
  const [startsAt, setStartsAt] = useState<string>(group.startsAt.slice(0, 5));
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const startMinutes = timeStringToMinutes(group.startsAt);
  const endMinutes = timeStringToMinutes(group.endsAt);
  const durationMinutes = endMinutes - startMinutes;

  let endsAt = '';
  if (startsAt) {
    const targetStartMinutes = timeStringToMinutes(startsAt);
    const targetEndMinutes = targetStartMinutes + durationMinutes;
    endsAt = minutesToTimeString(targetEndMinutes);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!startsAt) {
      setError(t('admin.learningGroups.errorInvalidTime'));
      return;
    }

    startTransition(async () => {
      const result = await rescheduleLearningGroup(group.id, weekday, startsAt);

      if (!result.success) {
        setError(result.error ? t(result.error) : t('admin.learningGroups.errorUpdateFailed'));
        return;
      }

      setSuccess(t('admin.learningGroups.rescheduleSuccess'));
      router.refresh();
      setTimeout(() => {
        onClose();
      }, 800);
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-xs p-4" role="dialog" aria-modal="true">
      <div 
        className="w-full max-w-md rounded-2xl border border-line dark:border-ink-secondary bg-white dark:bg-ink p-6 shadow-xl animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-base font-black text-ink dark:text-ink-muted mb-2">
          {t('admin.learningGroups.rescheduleTitle')}
        </h2>
        <p className="text-xs text-ink-muted dark:text-ink-muted mb-4 font-semibold">
          {group.title}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="mb-1 block text-xs font-bold text-ink-secondary dark:text-line">
              {t('admin.learningGroups.weekdayLabel')}
            </span>
            <select
              disabled={isPending}
              value={weekday}
              onChange={(e) => setWeekday(e.target.value as LearningGroupWeekday)}
              className="h-10 w-full rounded-xl border border-line dark:border-ink-secondary bg-white dark:bg-ink px-3 text-xs text-ink dark:text-ink-muted outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
            >
              {LEARNING_GROUP_WEEKDAYS.map((day) => (
                <option key={day} value={day}>
                  {t(`admin.learningGroups.weekday_${day}`)}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-bold text-ink-secondary dark:text-line">
              {t('admin.learningGroups.newStartsAtLabel')}
            </span>
            <input
              type="time"
              required
              disabled={isPending}
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
              className="h-10 w-full rounded-xl border border-line dark:border-ink-secondary bg-white dark:bg-ink px-3 text-xs text-ink dark:text-surface outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
            />
          </label>

          <div className="rounded-xl bg-surface dark:bg-ink/60 border border-line dark:border-ink-secondary p-3 text-xs text-ink-secondary dark:text-ink-muted font-mono">
            <div className="font-semibold mb-1 text-[10px] uppercase text-ink-muted dark:text-ink-muted tracking-wider">
              {t('admin.learningGroups.startsAtLabel')} &rarr; {t('admin.learningGroups.endsAtLabel')}
            </div>
            <div>
              {t('admin.learningGroups.timeRangePreview').replace('{range}', `${startsAt} - ${endsAt}`)}
            </div>
          </div>

          {error && (
            <p className="text-xs font-semibold text-status-critical" role="alert">
              {error}
            </p>
          )}

          {success && (
            <p className="text-xs font-semibold text-status-positive" role="status">
              {success}
            </p>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              disabled={isPending}
              onClick={onClose}
              className="h-9 px-4 rounded-xl text-xs font-bold bg-surface-sunken hover:bg-line/80 text-ink-secondary dark:bg-ink-secondary dark:hover:bg-ink-secondary dark:text-line transition-colors"
            >
              {t('admin.learningGroups.cancelButton')}
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="h-9 px-4 rounded-xl text-xs font-bold bg-accent hover:bg-accent-strong text-white flex items-center justify-center gap-1.5 transition-colors"
            >
              {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>{t('admin.learningGroups.updateButton')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
