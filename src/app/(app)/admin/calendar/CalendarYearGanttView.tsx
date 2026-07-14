'use client';

import { useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Users, MapPin, Eye, AlertTriangle } from 'lucide-react';
import { t } from '@/lib/i18n';
import { cn } from '@/lib/cn';
import { moveCalendarEvent, resizeCalendarEvent } from '@/features/calendar/admin-actions';
import type { AdminCalendarEvent, AdminSchoolYearOption } from '@/features/calendar/admin-queries';
import type { QuickCreateRange } from './FullCalendarView';
import {
  type DateParts,
  isoToDateParts,
  isoToTimeParts,
  combineDateAndTimeToIso,
  allDayStartIso,
  allDayEndIsoExclusive,
  addDaysToDateParts,
  compareDateParts,
} from '@/lib/date/il-date';

type CalendarYearGanttViewProps = {
  events: AdminCalendarEvent[];
  schoolYears: AdminSchoolYearOption[];
  selectedSchoolYear: AdminSchoolYearOption | null;
  onEditEvent: (event: AdminCalendarEvent) => void;
  onQuickCreate: (range: QuickCreateRange) => void;
};

/** Pixels of pointer movement below which a drag is treated as a plain click (opens edit, not a move/resize). */
const CLICK_THRESHOLD_PX = 5;

type MoveDrag = { kind: 'move'; eventId: string; pointerId: number; startClientX: number; containerWidthPx: number };
type ResizeDrag = {
  kind: 'resize-start' | 'resize-end';
  eventId: string;
  pointerId: number;
  startClientX: number;
  containerWidthPx: number;
};
type SelectDrag = { kind: 'select'; pointerId: number; startClientX: number; containerLeftPx: number; containerWidthPx: number };
type DragState = MoveDrag | ResizeDrag | SelectDrag | null;

function shiftDateByDays(date: DateParts, days: number): DateParts {
  return addDaysToDateParts(date, days);
}

/** Recomputes an event's start/end after a horizontal drag of `deltaDays`, preserving duration and time-of-day. */
function shiftedEventIso(event: AdminCalendarEvent, deltaDays: number) {
  if (deltaDays === 0) {
    return { startsAt: event.startsAt, endsAt: event.endsAt };
  }

  if (event.isAllDay) {
    const newStart = shiftDateByDays(isoToDateParts(event.startsAt), deltaDays);
    // stored end is exclusive; shift the same number of days keeps duration identical
    const newEndExclusive = shiftDateByDays(isoToDateParts(event.endsAt), deltaDays);
    return { startsAt: allDayStartIso(newStart), endsAt: allDayStartIso(newEndExclusive) };
  }

  const startDate = shiftDateByDays(isoToDateParts(event.startsAt), deltaDays);
  const endDate = shiftDateByDays(isoToDateParts(event.endsAt), deltaDays);
  return {
    startsAt: combineDateAndTimeToIso(startDate, isoToTimeParts(event.startsAt)),
    endsAt: combineDateAndTimeToIso(endDate, isoToTimeParts(event.endsAt)),
  };
}

/** Recomputes a single boundary (start or end) after dragging a resize handle to `newDate`. */
function resizedEventIso(event: AdminCalendarEvent, edge: 'start' | 'end', newDate: DateParts) {
  if (event.isAllDay) {
    if (edge === 'start') {
      return { startsAt: allDayStartIso(newDate), endsAt: event.endsAt };
    }
    // newDate is the new inclusive last day; stored end is exclusive
    return { startsAt: event.startsAt, endsAt: allDayEndIsoExclusive(newDate) };
  }

  if (edge === 'start') {
    return { startsAt: combineDateAndTimeToIso(newDate, isoToTimeParts(event.startsAt)), endsAt: event.endsAt };
  }
  return { startsAt: event.startsAt, endsAt: combineDateAndTimeToIso(newDate, isoToTimeParts(event.endsAt)) };
}

export function CalendarYearGanttView({
  events,
  schoolYears,
  selectedSchoolYear,
  onEditEvent,
  onQuickCreate,
}: CalendarYearGanttViewProps) {
  const router = useRouter();
  const timelineRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState>(null);

  const [dragDeltaPercent, setDragDeltaPercent] = useState(0);
  const [draggingEventId, setDraggingEventId] = useState<string | null>(null);
  const [draggingKind, setDraggingKind] = useState<'move' | 'resize-start' | 'resize-end' | null>(null);
  const [selectionRange, setSelectionRange] = useState<{ startPercent: number; endPercent: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!selectedSchoolYear) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 py-12 text-center text-zinc-500">
        {t('admin.calendar.errorNoCurrentSchoolYear')}
      </div>
    );
  }

  const start = new Date(selectedSchoolYear.startsOn);
  const end = new Date(selectedSchoolYear.endsOn);
  const totalMs = end.getTime() - start.getTime();
  const totalDays = Math.max(1, Math.round(totalMs / (24 * 60 * 60 * 1000)));
  const schoolYearStartParts = isoToDateParts(start.toISOString());

  function percentToDateParts(percent: number): DateParts {
    const clamped = Math.min(100, Math.max(0, percent));
    const dayOffset = Math.round((clamped / 100) * totalDays);
    return shiftDateByDays(schoolYearStartParts, dayOffset);
  }

  // Generate monthly column headers
  const months: { year: number; month: number; label: string }[] = [];
  const tempDate = new Date(start.getFullYear(), start.getMonth(), 1);
  while (tempDate <= end) {
    months.push({
      year: tempDate.getFullYear(),
      month: tempDate.getMonth(),
      label: tempDate.toLocaleString('en-US', { month: 'short' }),
    });
    tempDate.setMonth(tempDate.getMonth() + 1);
  }

  // Filter events that fall within or overlap the school year
  const activeEvents = events.filter((e) => {
    const eStart = new Date(e.startsAt);
    const eEnd = new Date(e.endsAt);
    return eStart <= end && eEnd >= start;
  });

  function clientXToPercent(clientX: number): number {
    const rect = timelineRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) {
      return 0;
    }
    return ((clientX - rect.left) / rect.width) * 100;
  }

  function handleBarPointerDown(event: ReactPointerEvent<HTMLButtonElement>, calendarEvent: AdminCalendarEvent) {
    if (event.button !== 0) return;
    const rect = timelineRef.current?.getBoundingClientRect();
    if (!rect) return;

    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      kind: 'move',
      eventId: calendarEvent.id,
      pointerId: event.pointerId,
      startClientX: event.clientX,
      containerWidthPx: rect.width,
    };
    setDraggingEventId(calendarEvent.id);
    setDraggingKind('move');
    setDragDeltaPercent(0);
  }

  function handleResizeHandlePointerDown(
    event: ReactPointerEvent<HTMLSpanElement>,
    calendarEvent: AdminCalendarEvent,
    edge: 'start' | 'end'
  ) {
    if (event.button !== 0) return;
    event.stopPropagation();
    const rect = timelineRef.current?.getBoundingClientRect();
    if (!rect) return;

    event.currentTarget.setPointerCapture(event.pointerId);
    const kind = edge === 'start' ? 'resize-start' : 'resize-end';
    dragRef.current = {
      kind,
      eventId: calendarEvent.id,
      pointerId: event.pointerId,
      startClientX: event.clientX,
      containerWidthPx: rect.width,
    };
    setDraggingEventId(calendarEvent.id);
    setDraggingKind(kind);
    setDragDeltaPercent(0);
  }

  function handleBarPointerMove(event: ReactPointerEvent<HTMLElement>) {
    const drag = dragRef.current;
    if (!drag || drag.kind === 'select') return;
    const deltaPx = event.clientX - drag.startClientX;
    setDragDeltaPercent((deltaPx / drag.containerWidthPx) * 100);
  }

  async function persistMove(calendarEvent: AdminCalendarEvent, deltaDays: number) {
    if (deltaDays === 0) return;
    setError(null);
    const { startsAt, endsAt } = shiftedEventIso(calendarEvent, deltaDays);
    const result = await moveCalendarEvent(calendarEvent.id, startsAt, endsAt, calendarEvent.isAllDay);
    if (!result.success) {
      setError(result.error ? t(result.error) : t('admin.calendar.errorUpdateFailed'));
      return;
    }
    router.refresh();
  }

  async function persistResize(calendarEvent: AdminCalendarEvent, edge: 'start' | 'end', newDate: DateParts) {
    setError(null);
    const { startsAt, endsAt } = resizedEventIso(calendarEvent, edge, newDate);
    const result = await resizeCalendarEvent(calendarEvent.id, startsAt, endsAt);
    if (!result.success) {
      setError(result.error ? t(result.error) : t('admin.calendar.errorUpdateFailed'));
      return;
    }
    router.refresh();
  }

  function handleBarPointerUp(event: ReactPointerEvent<HTMLElement>, calendarEvent: AdminCalendarEvent) {
    const drag = dragRef.current;
    if (!drag || drag.kind === 'select') return;

    const deltaPx = event.clientX - drag.startClientX;
    dragRef.current = null;
    setDraggingEventId(null);
    setDraggingKind(null);
    setDragDeltaPercent(0);

    if (Math.abs(deltaPx) < CLICK_THRESHOLD_PX) {
      if (drag.kind === 'move') {
        onEditEvent(calendarEvent);
      }
      return;
    }

    const deltaPercent = (deltaPx / drag.containerWidthPx) * 100;
    const deltaDays = Math.round((deltaPercent / 100) * totalDays);
    if (deltaDays === 0) return;

    if (drag.kind === 'move') {
      void persistMove(calendarEvent, deltaDays);
    } else {
      const eventStartParts = isoToDateParts(calendarEvent.startsAt);
      const eventEndParts = drag.kind === 'resize-end' && calendarEvent.isAllDay
        ? addDaysToDateParts(isoToDateParts(calendarEvent.endsAt), -1) // inclusive last day
        : isoToDateParts(calendarEvent.endsAt);

      if (drag.kind === 'resize-start') {
        const newStart = shiftDateByDays(eventStartParts, deltaDays);
        if (compareDateParts(newStart, eventEndParts) < 0) {
          void persistResize(calendarEvent, 'start', newStart);
        }
      } else {
        const newEnd = shiftDateByDays(eventEndParts, deltaDays);
        if (compareDateParts(newEnd, eventStartParts) >= 0) {
          void persistResize(calendarEvent, 'end', newEnd);
        }
      }
    }
  }

  function handleRulerPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return;
    const rect = timelineRef.current?.getBoundingClientRect();
    if (!rect) return;

    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      kind: 'select',
      pointerId: event.pointerId,
      startClientX: event.clientX,
      containerLeftPx: rect.left,
      containerWidthPx: rect.width,
    };
    const percent = clientXToPercent(event.clientX);
    setSelectionRange({ startPercent: percent, endPercent: percent });
  }

  function handleRulerPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || drag.kind !== 'select') return;
    const percent = clientXToPercent(event.clientX);
    setSelectionRange((prev) => (prev ? { startPercent: prev.startPercent, endPercent: percent } : null));
  }

  function handleRulerPointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || drag.kind !== 'select') return;
    dragRef.current = null;

    const endPercent = clientXToPercent(event.clientX);
    const startPercent = selectionRange?.startPercent ?? endPercent;
    setSelectionRange(null);

    const rangeStart = percentToDateParts(Math.min(startPercent, endPercent));
    const rangeEnd = percentToDateParts(Math.max(startPercent, endPercent));

    onQuickCreate({
      startIso: allDayStartIso(rangeStart),
      endIso: allDayEndIsoExclusive(rangeEnd),
      allDay: true,
    });
  }

  return (
    <div className="space-y-4">
      {/* Selector & Info */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-zinc-50 dark:bg-zinc-900/50 p-3 rounded-xl border border-zinc-200/50 dark:border-zinc-800/50">
        <div>
          <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
            {selectedSchoolYear.name}
          </h2>
          <p dir="ltr" className="text-[10px] text-zinc-500 text-end">
            {selectedSchoolYear.startsOn} &rarr; {selectedSchoolYear.endsOn}
          </p>
        </div>

        {/* School Year Switcher */}
        <div className="flex gap-2">
          {schoolYears.map((sy) => {
            const isSelected = sy.id === selectedSchoolYear.id;
            return (
              <a
                key={sy.id}
                href={`/admin/calendar?view=year&date=${sy.startsOn}`}
                className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                  isSelected
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-750'
                }`}
              >
                {sy.name}
              </a>
            );
          })}
        </div>
      </div>

      {error ? (
        <div
          className="flex items-center gap-2 rounded-xl border border-status-critical/30 bg-status-critical-soft px-3 py-2 text-xs font-semibold text-status-critical"
          role="alert"
        >
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      ) : null}

      <div dir="ltr" className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-xs">
        <div className="min-w-[800px] divide-y divide-zinc-200 dark:divide-zinc-800">
          {/* Grid Header */}
          <div className="flex bg-zinc-50 dark:bg-zinc-900/60 font-semibold text-[10px] text-zinc-500 dark:text-zinc-400 select-none">
            <div className="w-[240px] px-3 py-2.5 border-r border-zinc-200 dark:border-zinc-800 shrink-0">
              {t('admin.calendar.colTitle')}
            </div>
            <div className="flex-1 grid" style={{ gridTemplateColumns: `repeat(${months.length}, 1fr)` }}>
              {months.map((m, idx) => (
                <div
                  key={idx}
                  className="px-2 py-2.5 text-center border-r border-zinc-200 dark:border-zinc-800 last:border-r-0 truncate"
                >
                  {m.label}
                </div>
              ))}
            </div>
          </div>

          {/* Ruler: click or drag an empty date position to quick-create */}
          <div className="flex">
            <div className="w-[240px] px-3 py-1.5 border-r border-zinc-200 dark:border-zinc-800 shrink-0 flex items-center">
              <span className="text-[9px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-600">
                {t('admin.calendar.ganttRulerHint')}
              </span>
            </div>
            <div
              ref={timelineRef}
              className="relative flex-1 h-6 cursor-crosshair bg-zinc-50/60 dark:bg-zinc-900/30 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/10 touch-none"
              onPointerDown={handleRulerPointerDown}
              onPointerMove={handleRulerPointerMove}
              onPointerUp={handleRulerPointerUp}
              role="button"
              tabIndex={0}
              aria-label={t('admin.calendar.ganttRulerHint')}
            >
              {selectionRange ? (
                <div
                  className="absolute inset-y-0 rounded bg-emerald-500/30 border border-emerald-500 pointer-events-none"
                  style={{
                    left: `${Math.min(selectionRange.startPercent, selectionRange.endPercent)}%`,
                    width: `${Math.abs(selectionRange.endPercent - selectionRange.startPercent)}%`,
                  }}
                />
              ) : null}
            </div>
          </div>

          {/* Gantt Rows */}
          {activeEvents.map((event) => {
            const eventStart = new Date(event.startsAt);
            const eventEnd = new Date(event.endsAt);

            const leftMs = Math.max(0, eventStart.getTime() - start.getTime());
            const durationMs =
              Math.min(end.getTime(), eventEnd.getTime()) -
              Math.max(start.getTime(), eventStart.getTime());

            let leftPercent = (leftMs / totalMs) * 100;
            let widthPercent = Math.max(2.0, (durationMs / totalMs) * 100);

            const isDraggingThis = draggingEventId === event.id;
            if (isDraggingThis && draggingKind) {
              if (draggingKind === 'move') {
                leftPercent += dragDeltaPercent;
              } else if (draggingKind === 'resize-start') {
                leftPercent += dragDeltaPercent;
                widthPercent -= dragDeltaPercent;
              } else if (draggingKind === 'resize-end') {
                widthPercent += dragDeltaPercent;
              }
              widthPercent = Math.max(2.0, widthPercent);
            }

            // Colors based on visibility
            let barColorClass =
              'bg-emerald-500/10 dark:bg-emerald-500/20 border-emerald-500/30 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-500/20';
            if (event.visibility === 'staff_only') {
              barColorClass =
                'bg-blue-500/10 dark:bg-blue-500/20 border-blue-500/30 text-blue-800 dark:text-blue-300 hover:bg-blue-500/20';
            } else if (event.visibility === 'leadership_only') {
              barColorClass =
                'bg-purple-500/10 dark:bg-purple-500/20 border-purple-500/30 text-purple-800 dark:text-purple-300 hover:bg-purple-500/20';
            }

            return (
              <div key={event.id} className="flex group hover:bg-zinc-50/30 dark:hover:bg-zinc-900/10">
                {/* Left Column: Details */}
                <div className="w-[240px] px-3 py-2 border-r border-zinc-200 dark:border-zinc-800 shrink-0 flex flex-col justify-center min-w-0">
                  <button
                    onClick={() => onEditEvent(event)}
                    dir="rtl"
                    className="text-start font-bold text-zinc-900 dark:text-zinc-150 text-xs truncate hover:underline hover:text-emerald-600"
                  >
                    {event.title}
                  </button>
                  <div className="flex flex-wrap gap-2 mt-1">
                    <span className="inline-flex items-center gap-0.5 text-[8px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                      <Eye className="h-2 w-2" />
                      {t(`admin.calendar.visibility_${event.visibility}`)}
                    </span>
                    {event.location && (
                      <span className="inline-flex items-center gap-0.5 text-[8px] text-zinc-400 dark:text-zinc-500 truncate max-w-[100px]">
                        <MapPin className="h-2 w-2" />
                        {event.location}
                      </span>
                    )}
                    {event.targetGroupNames.length > 0 && (
                      <span className="inline-flex items-center gap-0.5 text-[8px] text-emerald-600 dark:text-emerald-500 truncate max-w-[100px]">
                        <Users className="h-2 w-2" />
                        {event.targetGroupNames.join(', ')}
                      </span>
                    )}
                  </div>
                </div>

                {/* Right Column: Timeline Bar with Grid Lines Background */}
                <div className="flex-1 relative h-12 flex items-center min-w-0">
                  {/* Background Monthly Divider Lines */}
                  <div
                    className="absolute inset-0 grid pointer-events-none"
                    style={{ gridTemplateColumns: `repeat(${months.length}, 1fr)` }}
                  >
                    {months.map((_, idx) => (
                      <div
                        key={idx}
                        className="h-full border-r border-zinc-100 dark:border-zinc-850/50 last:border-r-0"
                      />
                    ))}
                  </div>

                  {/* Bar Element */}
                  <button
                    type="button"
                    onPointerDown={(pointerEvent) => handleBarPointerDown(pointerEvent, event)}
                    onPointerMove={handleBarPointerMove}
                    onPointerUp={(pointerEvent) => handleBarPointerUp(pointerEvent, event)}
                    style={{ left: `${leftPercent}%`, width: `${widthPercent}%` }}
                    title={`${event.title} (${event.startsAt.split('T')[0]} - ${event.endsAt.split('T')[0]})`}
                    aria-label={t('admin.calendar.ganttDragHint', { title: event.title })}
                    className={cn(
                      'absolute h-7 rounded-lg border text-[9px] font-bold px-2 py-1 truncate shadow-xs flex items-center justify-between transition-[background-color,box-shadow] select-none touch-none cursor-grab active:cursor-grabbing',
                      barColorClass,
                      isDraggingThis && 'ring-2 ring-emerald-500 shadow-lg z-10'
                    )}
                  >
                    <span dir="rtl" className="truncate pointer-events-none">
                      {event.title}
                    </span>
                    <span
                      onPointerDown={(pointerEvent) => handleResizeHandlePointerDown(pointerEvent, event, 'start')}
                      onPointerMove={handleBarPointerMove}
                      onPointerUp={(pointerEvent) => handleBarPointerUp(pointerEvent, event)}
                      title={t('admin.calendar.ganttResizeStartHint')}
                      aria-label={t('admin.calendar.ganttResizeStartHint')}
                      className="absolute inset-y-0 start-0 w-2 cursor-ew-resize hover:bg-white/40 rounded-s-lg touch-none"
                    />
                    <span
                      onPointerDown={(pointerEvent) => handleResizeHandlePointerDown(pointerEvent, event, 'end')}
                      onPointerMove={handleBarPointerMove}
                      onPointerUp={(pointerEvent) => handleBarPointerUp(pointerEvent, event)}
                      title={t('admin.calendar.ganttResizeEndHint')}
                      aria-label={t('admin.calendar.ganttResizeEndHint')}
                      className="absolute inset-y-0 end-0 w-2 cursor-ew-resize hover:bg-white/40 rounded-e-lg touch-none"
                    />
                  </button>
                </div>
              </div>
            );
          })}

          {activeEvents.length === 0 ? (
            <div className="py-16 text-center text-zinc-500 flex flex-col items-center justify-center gap-2">
              <Calendar className="h-8 w-8 text-zinc-300 dark:text-zinc-700" />
              <p dir="rtl" className="text-sm font-medium">
                {t('admin.calendar.emptyList')}
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
