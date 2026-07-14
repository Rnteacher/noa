'use client';

import { useState, useTransition } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { rescheduleCalendarEvent } from '@/features/calendar/admin-actions';
import type { AdminCalendarEvent } from '@/features/calendar/admin-queries';
import { ILDatePicker } from '@/components/date/ILDatePicker';
import { ILTimeInput } from '@/components/date/ILTimeInput';
import {
  type DateParts,
  type TimeParts,
  isoToDateParts,
  isoToTimeParts,
  combineDateAndTimeToIso,
  allDayStartIso,
} from '@/lib/date/il-date';
import { t } from '@/lib/i18n';

type RescheduleModalProps = {
  event: AdminCalendarEvent;
  onClose: () => void;
};

export function RescheduleModal({ event, onClose }: RescheduleModalProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [date, setDate] = useState<DateParts>(() => isoToDateParts(event.startsAt));
  const [time, setTime] = useState<TimeParts>(() => isoToTimeParts(event.startsAt));
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const newStartsAtIso = event.isAllDay ? allDayStartIso(date) : combineDateAndTimeToIso(date, time);

    startTransition(async () => {
      const result = await rescheduleCalendarEvent(event.id, newStartsAtIso);

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

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-xs p-4" role="dialog" aria-modal="true">
      <div
        className="w-full max-w-md rounded-2xl border border-line dark:border-ink-secondary bg-white dark:bg-ink p-6 shadow-xl animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-base font-black text-ink dark:text-surface mb-2">
          {t('admin.calendar.rescheduleTitle')}
        </h2>
        <p className="text-xs text-ink-muted dark:text-ink-muted mb-4 font-semibold">
          {event.title}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="mb-1 block text-xs font-bold text-ink-secondary dark:text-line">
              {event.isAllDay ? t('admin.calendar.newStartsAtDateLabel') : t('admin.calendar.newStartsAtLabel')}
            </span>
            <div className="flex gap-2">
              <div className="flex-1">
                <ILDatePicker value={date} onChange={setDate} disabled={isPending} required />
              </div>
              {!event.isAllDay && (
                <div className="w-28">
                  <ILTimeInput value={time} onChange={setTime} disabled={isPending} required />
                </div>
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
              className="h-9 px-4 rounded-xl text-xs font-bold bg-surface-sunken hover:bg-line/80 text-ink-secondary dark:bg-ink-secondary dark:hover:bg-ink-secondary dark:text-line transition-colors"
            >
              {t('admin.calendar.cancelButton')}
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="h-9 px-4 rounded-xl text-xs font-bold bg-accent hover:bg-accent-strong text-white flex items-center justify-center gap-1.5 transition-colors"
            >
              {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <span>{t('admin.calendar.updateButton')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
