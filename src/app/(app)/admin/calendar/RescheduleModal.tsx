'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { rescheduleCalendarEvent } from '@/features/calendar/admin-actions';
import type { AdminCalendarEvent } from '@/features/calendar/admin-queries';
import { t } from '@/lib/i18n';

type RescheduleModalProps = {
  event: AdminCalendarEvent;
  onClose: () => void;
};

function toLocalDateString(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function toLocalTimeString(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function RescheduleModal({ event, onClose }: RescheduleModalProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [dateStr, setDateStr] = useState(toLocalDateString(event.startsAt));
  const [timeStr, setTimeStr] = useState(toLocalTimeString(event.startsAt));
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!dateStr) {
      setError(t('admin.calendar.errorInvalidDateTime'));
      return;
    }

    if (!event.isAllDay && !timeStr) {
      setError(t('admin.calendar.errorInvalidDateTime'));
      return;
    }

    const localDateTimeStr = event.isAllDay 
      ? `${dateStr}T00:00` 
      : `${dateStr}T${timeStr}`;

    const newStartsAtDate = new Date(localDateTimeStr);
    if (Number.isNaN(newStartsAtDate.getTime())) {
      setError(t('admin.calendar.errorInvalidDateTime'));
      return;
    }

    startTransition(async () => {
      const result = await rescheduleCalendarEvent(event.id, localDateTimeStr);

      if (!result.success) {
        setError(result.error ? t(result.error) : t('admin.calendar.errorUpdateFailed'));
        return;
      }

      setSuccess(t('admin.calendar.rescheduleSuccess'));
      router.refresh();
      setTimeout(() => {
        onClose();
      }, 800);
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/40 backdrop-blur-xs p-4" role="dialog" aria-modal="true">
      <div 
        className="w-full max-w-md rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 shadow-xl animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-base font-black text-zinc-950 dark:text-zinc-50 mb-2">
          {t('admin.calendar.rescheduleTitle')}
        </h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4 font-semibold">
          {event.title}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="mb-1 block text-xs font-bold text-zinc-700 dark:text-zinc-300">
              {event.isAllDay ? t('admin.calendar.newStartsAtDateLabel') : t('admin.calendar.newStartsAtLabel')}
            </span>
            <div className="flex gap-2">
              <input
                type="date"
                required
                disabled={isPending}
                value={dateStr}
                onChange={(e) => setDateStr(e.target.value)}
                className="h-10 flex-1 rounded-xl border border-zinc-200 dark:border-zinc-750 bg-white dark:bg-zinc-950 px-3 text-xs text-zinc-950 dark:text-zinc-50 outline-none transition-colors focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
              />
              {!event.isAllDay && (
                <input
                  type="time"
                  required
                  disabled={isPending}
                  value={timeStr}
                  onChange={(e) => setTimeStr(e.target.value)}
                  className="h-10 w-28 rounded-xl border border-zinc-200 dark:border-zinc-750 bg-white dark:bg-zinc-950 px-3 text-xs text-zinc-950 dark:text-zinc-50 outline-none transition-colors focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
                />
              )}
            </div>
          </label>

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
              className="h-9 px-4 rounded-xl text-xs font-bold bg-zinc-100 hover:bg-zinc-200/80 text-zinc-700 dark:bg-zinc-800 dark:hover:bg-zinc-750 dark:text-zinc-300 transition-colors"
            >
              {t('admin.calendar.cancelButton')}
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="h-9 px-4 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-1.5 transition-colors"
            >
              {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>{t('admin.calendar.updateButton')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
