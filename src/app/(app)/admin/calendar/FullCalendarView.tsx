'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import heLocale from '@fullcalendar/core/locales/he';
import type { EventClickArg, EventDropArg, DateSelectArg, EventContentArg } from '@fullcalendar/core';
import type { EventResizeDoneArg } from '@fullcalendar/interaction';
import { AlertTriangle } from 'lucide-react';
import { t } from '@/lib/i18n';
import { moveCalendarEvent, resizeCalendarEvent } from '@/features/calendar/admin-actions';
import { DEFAULT_EVENT_DURATION_MINUTES } from '@/features/calendar/constants';
import type { AdminCalendarEvent } from '@/features/calendar/admin-queries';
import { SyncIndicator } from './CalendarViews';

export type QuickCreateRange = {
  startIso: string;
  endIso: string;
  allDay: boolean;
};

type FullCalendarViewProps = {
  view: 'day' | 'week' | 'month';
  dateStr: string;
  events: AdminCalendarEvent[];
  onEditEvent: (event: AdminCalendarEvent) => void;
  onQuickCreate: (range: QuickCreateRange) => void;
};

const VIEW_MAP: Record<string, string> = {
  day: 'timeGridDay',
  week: 'timeGridWeek',
  month: 'dayGridMonth',
};

// A plain click in Day/Week view selects one slot of this duration, so it
// naturally matches DEFAULT_EVENT_DURATION_MINUTES without any special
// click-vs-drag detection — a real drag simply spans multiple slots.
const SLOT_DURATION = `${String(Math.floor(DEFAULT_EVENT_DURATION_MINUTES / 60)).padStart(2, '0')}:${String(
  DEFAULT_EVENT_DURATION_MINUTES % 60
).padStart(2, '0')}:00`;

const VISIBILITY_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  staff_only: { bg: '#3b82f61a', border: '#3b82f6', text: '#1d4ed8' },
  leadership_only: { bg: '#a855f71a', border: '#a855f7', text: '#7e22ce' },
  all_school: { bg: '#10b9811a', border: '#10b981', text: '#047857' },
  groups: { bg: '#10b9811a', border: '#10b981', text: '#047857' },
};

function renderEventContent(arg: EventContentArg) {
  const source = arg.event.extendedProps.source as AdminCalendarEvent | undefined;
  return (
    <div className="flex items-center gap-1 overflow-hidden px-0.5 py-0.5">
      {!arg.event.allDay && arg.timeText ? (
        <span dir="ltr" className="shrink-0 text-[10px] font-bold opacity-80">
          {arg.timeText}
        </span>
      ) : null}
      <span className="truncate text-[11px] font-bold">{arg.event.title}</span>
      {source ? <SyncIndicator googleCalendarEventId={source.googleCalendarEventId} /> : null}
    </div>
  );
}

export function FullCalendarView({ view, dateStr, events, onEditEvent, onQuickCreate }: FullCalendarViewProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const fcEvents = useMemo(
    () =>
      events.map((event) => {
        const colors = VISIBILITY_COLORS[event.visibility] ?? VISIBILITY_COLORS.all_school;
        return {
          id: event.id,
          title: event.title,
          start: event.startsAt,
          end: event.endsAt,
          allDay: event.isAllDay,
          backgroundColor: colors.bg,
          borderColor: colors.border,
          textColor: colors.text,
          extendedProps: { source: event },
        };
      }),
    [events]
  );

  async function handleEventDrop(info: EventDropArg) {
    const newStart = info.event.start;
    const newEnd =
      info.event.end ??
      (newStart ? new Date(newStart.getTime() + DEFAULT_EVENT_DURATION_MINUTES * 60_000) : null);

    if (!newStart || !newEnd) {
      info.revert();
      return;
    }

    setError(null);
    const result = await moveCalendarEvent(
      info.event.id,
      newStart.toISOString(),
      newEnd.toISOString(),
      info.event.allDay
    );

    if (!result.success) {
      info.revert();
      setError(result.error ? t(result.error) : t('admin.calendar.errorUpdateFailed'));
      return;
    }

    router.refresh();
  }

  async function handleEventResize(info: EventResizeDoneArg) {
    const newStart = info.event.start;
    const newEnd = info.event.end;

    if (!newStart || !newEnd) {
      info.revert();
      return;
    }

    setError(null);
    const result = await resizeCalendarEvent(info.event.id, newStart.toISOString(), newEnd.toISOString());

    if (!result.success) {
      info.revert();
      setError(result.error ? t(result.error) : t('admin.calendar.errorUpdateFailed'));
      return;
    }

    router.refresh();
  }

  function handleSelect(info: DateSelectArg) {
    onQuickCreate({
      startIso: info.start.toISOString(),
      endIso: info.end.toISOString(),
      allDay: info.allDay,
    });
  }

  function handleEventClick(info: EventClickArg) {
    info.jsEvent.preventDefault();
    const source = info.event.extendedProps.source as AdminCalendarEvent | undefined;
    if (source) {
      onEditEvent(source);
    }
  }

  return (
    <div className="il-fullcalendar" dir="rtl">
      {error ? (
        <div
          className="mb-3 flex items-center gap-2 rounded-xl border border-status-critical/30 bg-status-critical-soft px-3 py-2 text-xs font-semibold text-status-critical"
          role="alert"
        >
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      <FullCalendar
        key={`${view}-${dateStr}`}
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView={VIEW_MAP[view] ?? 'timeGridWeek'}
        initialDate={dateStr}
        locale={heLocale}
        direction="rtl"
        firstDay={0}
        headerToolbar={false}
        height={view === 'month' ? 'auto' : 650}
        slotMinTime="06:00:00"
        slotMaxTime="22:00:00"
        slotDuration={SLOT_DURATION}
        nowIndicator
        editable
        eventStartEditable
        eventDurationEditable
        eventResizableFromStart
        selectable
        selectMirror
        dayMaxEvents={3}
        eventTimeFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
        slotLabelFormat={{ hour: '2-digit', minute: '2-digit', hour12: false }}
        events={fcEvents}
        select={handleSelect}
        eventClick={handleEventClick}
        eventDrop={handleEventDrop}
        eventResize={handleEventResize}
        eventContent={renderEventContent}
      />
    </div>
  );
}
