'use client';

import { useRouter } from 'next/navigation';
import {
  MapPin,
  Users,
  CheckCircle,
  AlertCircle,
  Pencil,
} from 'lucide-react';
import { t } from '@/lib/i18n';
import { cn } from '@/lib/cn';
import type { AdminCalendarEvent } from '@/features/calendar/admin-queries';
import { DeleteCalendarEventButton } from './DeleteCalendarEventButton';

type CalendarViewsProps = {
  view: string;
  dateStr: string;
  events: AdminCalendarEvent[];
  onEditEvent: (event: AdminCalendarEvent) => void;
};

// Date helper to parse YYYY-MM-DD
function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

// Date helper to format to YYYY-MM-DD
function formatDateStr(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

// Check if an event overlaps a specific calendar day
function isEventOnDay(event: AdminCalendarEvent, day: Date): boolean {
  const dayStart = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 0, 0, 0, 0);
  const dayEnd = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 23, 59, 59, 999);
  const eventStart = new Date(event.startsAt);
  const eventEnd = new Date(event.endsAt);
  return eventStart <= dayEnd && eventEnd >= dayStart;
}

// Format local time e.g., 09:30
function formatLocalTime(isoString: string): string {
  const d = new Date(isoString);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// Localized weekday lookup keys (Sun-Sat)
const WEEKDAY_KEYS = [
  'admin.calendar.day_0',
  'admin.calendar.day_1',
  'admin.calendar.day_2',
  'admin.calendar.day_3',
  'admin.calendar.day_4',
  'admin.calendar.day_5',
  'admin.calendar.day_6',
];

export function CalendarViews({ view, dateStr, events, onEditEvent }: CalendarViewsProps) {
  const router = useRouter();
  const currentDate = parseLocalDate(dateStr);

  if (view === 'day') {
    return (
      <CalendarDayView
        currentDate={currentDate}
        events={events}
        onEditEvent={onEditEvent}
      />
    );
  }

  if (view === 'week') {
    return (
      <CalendarWeekView
        currentDate={currentDate}
        events={events}
        onEditEvent={onEditEvent}
      />
    );
  }

  if (view === 'month') {
    return (
      <CalendarMonthView
        currentDate={currentDate}
        events={events}
        onSelectDay={(day) => {
          const params = new URLSearchParams(window.location.search);
          params.set('view', 'day');
          params.set('date', formatDateStr(day));
          router.push(`/admin/calendar?${params.toString()}`);
        }}
      />
    );
  }

  // Fallback to List view (handled in parent or standard table)
  return null;
}

/* -------------------- DAY VIEW -------------------- */
type CalendarDayViewProps = {
  currentDate: Date;
  events: AdminCalendarEvent[];
  onEditEvent: (event: AdminCalendarEvent) => void;
};

function CalendarDayView({ currentDate, events, onEditEvent }: CalendarDayViewProps) {
  const dayEvents = events.filter((e) => isEventOnDay(e, currentDate));
  const allDayEvents = dayEvents.filter((e) => e.isAllDay);
  const timedEvents = dayEvents.filter((e) => !e.isAllDay);

  return (
    <div className="space-y-4">
      {/* All-Day Events Section */}
      {allDayEvents.length > 0 && (
        <div className="rounded-xl border border-emerald-100 dark:border-emerald-950 bg-emerald-50/50 dark:bg-emerald-950/20 p-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
            {t('admin.calendar.allDay')}
          </span>
          <div className="mt-2 divide-y divide-emerald-100/50 dark:divide-emerald-950/50">
            {allDayEvents.map((event) => (
              <div key={event.id} className="py-2 first:pt-0 last:pb-0 flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-50">
                    {event.title}
                  </h3>
                  {event.location && (
                    <div className="flex items-center gap-1 mt-0.5 text-[10px] text-zinc-500 dark:text-zinc-400">
                      <MapPin className="h-3 w-3" />
                      <span>{event.location}</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <SyncIndicator googleCalendarEventId={event.googleCalendarEventId} />
                  <button
                    type="button"
                    onClick={() => onEditEvent(event)}
                    className="p-1.5 text-zinc-400 hover:text-emerald-600 rounded-lg hover:bg-white dark:hover:bg-zinc-800"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <DeleteCalendarEventButton eventId={event.id} title={event.title} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Timed Events Section */}
      {timedEvents.length > 0 ? (
        <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {timedEvents.map((event) => (
            <div key={event.id} className="py-4 first:pt-0 last:pb-0 flex items-start gap-4">
              <div className="text-center w-14 shrink-0 font-mono text-xs font-bold text-zinc-500 dark:text-zinc-400">
                <div>{formatLocalTime(event.startsAt)}</div>
                <div className="text-[10px] font-normal text-zinc-450 dark:text-zinc-550 mt-0.5">
                  {formatLocalTime(event.endsAt)}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 truncate">
                  {event.title}
                </h3>
                {event.description && (
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2">
                    {event.description}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-3 mt-2">
                  {event.location && (
                    <div className="flex items-center gap-1 text-[10px] text-zinc-450 dark:text-zinc-500">
                      <MapPin className="h-3.5 w-3.5" />
                      <span>{event.location}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1 text-[10px] text-zinc-450 dark:text-zinc-500">
                    <Users className="h-3.5 w-3.5" />
                    <span className="uppercase tracking-wider font-mono">
                      {t(`admin.calendar.visibility_${event.visibility}`)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <SyncIndicator googleCalendarEventId={event.googleCalendarEventId} />
                <button
                  type="button"
                  onClick={() => onEditEvent(event)}
                  className="p-1.5 text-zinc-400 hover:text-emerald-600 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <DeleteCalendarEventButton eventId={event.id} title={event.title} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        allDayEvents.length === 0 && (
          <div className="py-12 text-center text-xs text-zinc-400 dark:text-zinc-550">
            {t('admin.calendar.emptyList')}
          </div>
        )
      )}
    </div>
  );
}

/* -------------------- WEEK VIEW -------------------- */
type CalendarWeekViewProps = {
  currentDate: Date;
  events: AdminCalendarEvent[];
  onEditEvent: (event: AdminCalendarEvent) => void;
};

function CalendarWeekView({ currentDate, events, onEditEvent }: CalendarWeekViewProps) {
  // Compute start of week (Sunday)
  const sunday = new Date(currentDate);
  const dayOffset = sunday.getDay();
  sunday.setDate(sunday.getDate() - dayOffset);

  // Generate 7 days
  const days: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(sunday);
    d.setDate(sunday.getDate() + i);
    days.push(d);
  }

  return (
    <div className="grid gap-4 sm:grid-cols-7 items-start">
      {days.map((day, idx) => {
        const dayEvents = events.filter((e) => isEventOnDay(e, day));
        const isToday = formatDateStr(day) === formatDateStr(new Date());

        return (
          <div
            key={idx}
            className={cn(
              'rounded-xl border p-3 min-w-0 transition-colors',
              isToday
                ? 'border-emerald-200 dark:border-emerald-950 bg-emerald-50/20 dark:bg-emerald-950/10'
                : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50/40 dark:bg-zinc-900/30'
            )}
          >
            <div className="flex items-baseline justify-between mb-2">
              <span className="text-xs font-bold text-zinc-550 dark:text-zinc-400">
                {t(WEEKDAY_KEYS[idx])}
              </span>
              <span
                className={cn(
                  'flex h-6 w-6 items-center justify-center rounded-full text-xs font-black',
                  isToday
                    ? 'bg-emerald-600 text-white'
                    : 'text-zinc-900 dark:text-zinc-150'
                )}
              >
                {day.getDate()}
              </span>
            </div>

            <div className="space-y-2">
              {dayEvents.length > 0 ? (
                dayEvents.map((event) => (
                  <div
                    key={event.id}
                    className="group relative rounded-lg border border-zinc-200 dark:border-zinc-750 bg-white dark:bg-zinc-950 p-2 shadow-xs"
                  >
                    <div className="flex items-start justify-between gap-1.5">
                      <div className="text-[11px] font-bold text-zinc-900 dark:text-zinc-100 leading-tight truncate">
                        {event.title}
                      </div>
                      <div className="flex items-center shrink-0">
                        <SyncIndicator googleCalendarEventId={event.googleCalendarEventId} />
                      </div>
                    </div>

                    <div className="mt-1 flex items-center justify-between text-[10px] text-zinc-500 dark:text-zinc-400">
                      <span>
                        {event.isAllDay
                          ? t('admin.calendar.allDay')
                          : formatLocalTime(event.startsAt)}
                      </span>
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => onEditEvent(event)}
                          className="p-1 text-zinc-400 hover:text-emerald-600 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800"
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                        <DeleteCalendarEventButton eventId={event.id} title={event.title} />
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-6 text-center text-[10px] text-zinc-400 dark:text-zinc-600 border border-dashed border-zinc-200 dark:border-zinc-800/80 rounded-lg">
                  -
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* -------------------- MONTH VIEW -------------------- */
type CalendarMonthViewProps = {
  currentDate: Date;
  events: AdminCalendarEvent[];
  onSelectDay: (day: Date) => void;
};

function CalendarMonthView({ currentDate, events, onSelectDay }: CalendarMonthViewProps) {
  // Find start of month
  const start = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  // Find Sunday of the first week of the month
  const gridStart = new Date(start);
  const dayOffset = gridStart.getDay();
  gridStart.setDate(gridStart.getDate() - dayOffset);

  // Generate 42 days grid
  const days: Date[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    days.push(d);
  }

  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-850 overflow-hidden bg-white dark:bg-zinc-900 shadow-sm">
      {/* Month Days Header */}
      <div className="grid grid-cols-7 bg-zinc-50 dark:bg-zinc-900/80 border-b border-zinc-200 dark:border-zinc-800">
        {WEEKDAY_KEYS.map((key, idx) => (
          <div
            key={idx}
            className="py-2 text-center text-[11px] font-bold text-zinc-500 dark:text-zinc-400 border-r border-zinc-100 dark:border-zinc-800 last:border-r-0 select-none"
          >
            {t(key)}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 auto-rows-[110px] divide-x divide-y divide-zinc-200 dark:divide-zinc-800 rtl:divide-x-reverse">
        {days.map((day, idx) => {
          const dayEvents = events.filter((e) => isEventOnDay(e, day));
          const isCurrentMonth = day.getMonth() === currentDate.getMonth();
          const isToday = formatDateStr(day) === formatDateStr(new Date());

          return (
            <div
              key={idx}
              onClick={(e) => {
                // Avoid triggers if clicking edit/delete buttons
                if ((e.target as HTMLElement).closest('button')) return;
                onSelectDay(day);
              }}
              className={cn(
                'p-1.5 flex flex-col justify-between cursor-pointer transition-colors group/cell hover:bg-zinc-50/50 dark:hover:bg-zinc-850/20',
                isCurrentMonth ? '' : 'opacity-40 bg-zinc-50/20 dark:bg-zinc-900/10',
                isToday ? 'bg-emerald-50/10 dark:bg-emerald-950/5' : ''
              )}
            >
              {/* Day Header */}
              <div className="flex items-center justify-between mb-1 select-none">
                <span
                  className={cn(
                    'flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-black',
                    isToday
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'text-zinc-650 dark:text-zinc-300'
                  )}
                >
                  {day.getDate()}
                </span>
                {dayEvents.length > 0 && (
                  <span className="text-[9px] font-bold text-zinc-450 dark:text-zinc-500 px-1">
                    {dayEvents.length}
                  </span>
                )}
              </div>

              {/* Event Stack */}
              <div className="flex-1 overflow-y-auto space-y-1 pr-0.5 custom-scrollbar min-h-0">
                {dayEvents.slice(0, 3).map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center justify-between gap-1 rounded bg-zinc-100/70 dark:bg-zinc-800/80 hover:bg-zinc-100 dark:hover:bg-zinc-800 px-1 py-0.5 text-[9px] font-medium text-zinc-700 dark:text-zinc-200"
                  >
                    <span className="truncate flex-1 font-semibold">{event.title}</span>
                    <div className="flex items-center shrink-0">
                      <SyncIndicator googleCalendarEventId={event.googleCalendarEventId} />
                    </div>
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-[8px] font-bold text-emerald-600 dark:text-emerald-400 pl-1 text-start">
                    +{dayEvents.length - 3}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* -------------------- SYNC INDICATOR -------------------- */
type SyncIndicatorProps = {
  googleCalendarEventId: string | null;
};

export function SyncIndicator({ googleCalendarEventId }: SyncIndicatorProps) {
  const isSynced = Boolean(googleCalendarEventId);
  return (
    <span
      title={isSynced ? t('admin.calendar.sync_synced') : t('admin.calendar.sync_not_synced')}
      className="inline-flex items-center justify-center p-0.5"
    >
      {isSynced ? (
        <CheckCircle className="h-3 w-3 text-emerald-600 dark:text-emerald-450" />
      ) : (
        <AlertCircle className="h-3 w-3 text-zinc-350 dark:text-zinc-650" />
      )}
    </span>
  );
}
