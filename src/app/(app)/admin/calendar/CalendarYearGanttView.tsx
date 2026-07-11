'use client';

import { Calendar, Users, MapPin, Eye } from 'lucide-react';
import { t } from '@/lib/i18n';
import type { AdminCalendarEvent, AdminSchoolYearOption } from '@/features/calendar/admin-queries';

type CalendarYearGanttViewProps = {
  events: AdminCalendarEvent[];
  schoolYears: AdminSchoolYearOption[];
  selectedSchoolYear: AdminSchoolYearOption | null;
  onEditEvent: (event: AdminCalendarEvent) => void;
};

export function CalendarYearGanttView({
  events,
  schoolYears,
  selectedSchoolYear,
  onEditEvent,
}: CalendarYearGanttViewProps) {
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

  return (
    <div className="space-y-4">
      {/* Selector & Info */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-zinc-50 dark:bg-zinc-900/50 p-3 rounded-xl border border-zinc-200/50 dark:border-zinc-800/50">
        <div>
          <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
            {selectedSchoolYear.name}
          </h2>
          <p className="text-[10px] text-zinc-500">
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

      {activeEvents.length > 0 ? (
        <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-xs">
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

            {/* Gantt Rows */}
            {activeEvents.map((event) => {
              const eventStart = new Date(event.startsAt);
              const eventEnd = new Date(event.endsAt);

              const leftMs = Math.max(0, eventStart.getTime() - start.getTime());
              const durationMs =
                Math.min(end.getTime(), eventEnd.getTime()) -
                Math.max(start.getTime(), eventStart.getTime());

              const leftPercent = (leftMs / totalMs) * 100;
              const widthPercent = Math.max(2.0, (durationMs / totalMs) * 100);

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
                      onClick={() => onEditEvent(event)}
                      style={{ left: `${leftPercent}%`, width: `${widthPercent}%` }}
                      title={`${event.title} (${event.startsAt.split('T')[0]} - ${event.endsAt.split('T')[0]})`}
                      className={`absolute h-7 rounded-lg border text-[9px] font-bold px-2 py-1 truncate shadow-xs flex items-center justify-between transition-all select-none ${barColorClass}`}
                    >
                      <span className="truncate">{event.title}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 py-16 text-center text-zinc-500 flex flex-col items-center justify-center gap-2">
          <Calendar className="h-8 w-8 text-zinc-300 dark:text-zinc-700" />
          <p className="text-sm font-medium">{t('admin.calendar.emptyList')}</p>
        </div>
      )}
    </div>
  );
}
