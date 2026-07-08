'use client';

import { useState } from 'react';
import { Pencil, X } from 'lucide-react';
import { CalendarEventForm } from './CalendarEventForm';
import { DeleteCalendarEventButton } from './DeleteCalendarEventButton';
import type { AdminCalendarEvent, AdminCalendarGroupOption } from '@/features/calendar/admin-queries';
import { t } from '@/lib/i18n';

type CalendarEventRowProps = {
  event: AdminCalendarEvent;
  groups: AdminCalendarGroupOption[];
  formatDateTime: (value: string) => string;
};

export function CalendarEventRow({ event, groups, formatDateTime }: CalendarEventRowProps) {
  const [isEditing, setIsEditing] = useState(false);

  if (isEditing) {
    return (
      <tr className="bg-zinc-50/60 dark:bg-zinc-900/40">
        <td colSpan={6} className="p-3">
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-750 bg-white dark:bg-zinc-950 p-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-bold text-zinc-950 dark:text-zinc-50">
                {t('admin.calendar.editTitle')}
              </h3>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
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
    <tr className="hover:bg-zinc-50/50 dark:hover:bg-zinc-850/30">
      <td className="py-3 px-2 font-medium text-zinc-900 dark:text-zinc-100 max-w-[150px] sm:max-w-[220px]">
        <div className="truncate">{event.title}</div>
        {event.location ? (
          <div className="text-[10px] text-zinc-400 dark:text-zinc-550 mt-0.5 truncate">
            {event.location}
          </div>
        ) : null}
      </td>
      <td className="py-3 px-2 text-zinc-600 dark:text-zinc-450 whitespace-nowrap">
        {formatDateTime(event.startsAt)}
      </td>
      <td className="py-3 px-2 text-zinc-600 dark:text-zinc-450 whitespace-nowrap">
        {formatDateTime(event.endsAt)}
      </td>
      <td className="py-3 px-2 text-center">
        {event.isAllDay ? (
          <span className="text-[10px] font-bold uppercase text-emerald-600">
            {t('admin.calendar.allDay')}
          </span>
        ) : (
          <span className="text-zinc-300 dark:text-zinc-700">-</span>
        )}
      </td>
      <td className="py-3 px-2 text-zinc-600 dark:text-zinc-450 uppercase font-mono tracking-wider text-[10px]">
        <div>{t(`admin.calendar.visibility_${event.visibility}`)}</div>
        {event.visibility === 'groups' && event.targetGroupNames.length > 0 ? (
          <div className="mt-0.5 normal-case font-sans text-[10px] text-zinc-400 dark:text-zinc-550 truncate">
            {event.targetGroupNames.join(', ')}
          </div>
        ) : null}
      </td>
      <td className="py-2 px-1 text-center">
        <div className="flex items-center justify-center gap-1">
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            title={t('admin.calendar.editButton')}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 hover:text-emerald-600 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <DeleteCalendarEventButton eventId={event.id} title={event.title} />
        </div>
      </td>
    </tr>
  );
}
