'use client';

import { useState } from 'react';
import { Pencil, X, CalendarDays } from 'lucide-react';
import { CalendarEventForm } from './CalendarEventForm';
import { DeleteCalendarEventButton } from './DeleteCalendarEventButton';
import { RescheduleModal } from './RescheduleModal';
import type { AdminCalendarEvent, AdminCalendarGroupOption } from '@/features/calendar/admin-queries';
import { formatILDate, formatILTime } from '@/lib/date/il-date';
import { t } from '@/lib/i18n';

type CalendarEventRowProps = {
  event: AdminCalendarEvent;
  groups: AdminCalendarGroupOption[];
};

function formatDateTime(value: string) {
  return `${formatILDate(value)} ${formatILTime(value)}`;
}

export function CalendarEventRow({ event, groups }: CalendarEventRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isRescheduling, setIsRescheduling] = useState(false);

  if (isEditing) {
    return (
      <tr className="bg-surface/60 dark:bg-ink/40">
        <td colSpan={6} className="p-3">
          <div className="rounded-xl border border-line dark:border-ink-secondary bg-white dark:bg-ink p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold text-ink dark:text-surface">
                {t('admin.calendar.editTitle')}
              </h3>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-muted hover:bg-surface-sunken dark:hover:bg-ink-secondary"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <CalendarEventForm
              groups={groups}
              mode="edit"
              eventId={event.id}
              initialValues={{
                title: event.title,
                description: event.description ?? '',
                startsAt: event.startsAt,
                endsAt: event.endsAt,
                isAllDay: event.isAllDay,
                visibility: event.visibility,
                location: event.location ?? '',
                groupIds: event.targetGroupIds,
              }}
              onSaved={() => setIsEditing(false)}
            />
          </div>
        </td>
      </tr>
    );
  }

  return (
    <>
    <tr className="hover:bg-surface/50 dark:hover:bg-ink/30">
      <td className="py-3 px-2 font-medium text-ink dark:text-surface-sunken max-w-[150px] sm:max-w-[220px]">
        <div className="truncate">{event.title}</div>
        {event.location ? (
          <div className="text-[10px] text-ink-muted dark:text-ink-muted mt-0.5 truncate">
            {event.location}
          </div>
        ) : null}
      </td>
      <td className="py-3 px-2 text-ink-secondary dark:text-ink-muted whitespace-nowrap">
        <span dir="ltr">{formatDateTime(event.startsAt)}</span>
      </td>
      <td className="py-3 px-2 text-ink-secondary dark:text-ink-muted whitespace-nowrap">
        <span dir="ltr">{formatDateTime(event.endsAt)}</span>
      </td>
      <td className="py-3 px-2 text-center">
        {event.isAllDay ? (
          <span className="text-[10px] font-bold uppercase text-accent">
            {t('admin.calendar.allDay')}
          </span>
        ) : (
          <span className="text-line dark:text-ink-secondary">-</span>
        )}
      </td>
      <td className="py-3 px-2 text-ink-secondary dark:text-ink-muted uppercase font-mono tracking-wider text-[10px]">
        <div>{t(`admin.calendar.visibility_${event.visibility}`)}</div>
        {event.visibility === 'groups' && event.targetGroupNames.length > 0 ? (
          <div className="mt-0.5 normal-case font-sans text-[10px] text-ink-muted dark:text-ink-muted truncate">
            {event.targetGroupNames.join(', ')}
          </div>
        ) : null}
      </td>
      <td className="py-2 px-1 text-center">
        <div className="flex items-center justify-center gap-1">
          <button
            type="button"
            onClick={() => setIsRescheduling(true)}
            title={t('admin.calendar.rescheduleButton')}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-muted hover:text-accent hover:bg-surface dark:hover:bg-ink-secondary transition-colors"
          >
            <CalendarDays className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            title={t('admin.calendar.editButton')}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-muted hover:text-accent hover:bg-surface dark:hover:bg-ink-secondary transition-colors"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <DeleteCalendarEventButton eventId={event.id} title={event.title} />
        </div>
      </td>
    </tr>
    {isRescheduling ? (
      <RescheduleModal event={event} onClose={() => setIsRescheduling(false)} />
    ) : null}
    </>
  );
}
