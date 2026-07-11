'use client';

import { useState, useTransition } from 'react';
import { CalendarViewSwitcher } from './CalendarViewSwitcher';
import { CalendarDateNavigator } from './CalendarDateNavigator';
import { CalendarViews } from './CalendarViews';
import { CalendarYearGanttView } from './CalendarYearGanttView';
import { CalendarEventRow } from './CalendarEventRow';
import { CalendarEventForm } from './CalendarEventForm';
import { RescheduleModal } from './RescheduleModal';
import { CheckCircle2, AlertTriangle, Loader2, RefreshCw } from 'lucide-react';
import { syncSingleCalendarEventAction } from '@/features/calendar/google-sync-actions';
import { t } from '@/lib/i18n';
import type {
  AdminCalendarEvent,
  AdminCalendarGroupOption,
  AdminSchoolYearOption,
} from '@/features/calendar/admin-queries';

type CalendarWorkspaceProps = {
  view: string;
  dateStr: string;
  events: AdminCalendarEvent[];
  groups: AdminCalendarGroupOption[];
  listRange: string;
  schoolYears: AdminSchoolYearOption[];
  selectedSchoolYear: AdminSchoolYearOption | null;
  isSyncConfigured: boolean;
};

export function CalendarWorkspace({
  view,
  dateStr,
  events,
  groups,
  listRange,
  schoolYears,
  selectedSchoolYear,
  isSyncConfigured,
}: CalendarWorkspaceProps) {
  const [editingEvent, setEditingEvent] = useState<AdminCalendarEvent | null>(null);
  const [reschedulingEvent, setReschedulingEvent] = useState<AdminCalendarEvent | null>(null);

  const [isSyncing, startSync] = useTransition();
  const [syncError, setSyncError] = useState<string | null>(null);
  const [syncSuccess, setSyncSuccess] = useState<boolean>(false);

  function handleSingleSync(eventId: string) {
    setSyncError(null);
    setSyncSuccess(false);

    startSync(async () => {
      const res = await syncSingleCalendarEventAction(eventId);
      if (!res.success) {
        setSyncError(res.error || 'Failed to sync event.');
      } else {
        setSyncSuccess(true);
        setEditingEvent((prev) => (prev ? { ...prev, googleCalendarEventId: 'synced-id' } : null));
      }
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_380px] items-start">
      <section className="space-y-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-sm min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-100 dark:border-zinc-800 pb-4">
          <CalendarDateNavigator view={view} currentDateStr={dateStr} />
          <CalendarViewSwitcher currentView={view} />
        </div>

        {view === 'list' ? (
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <h2 className="text-base font-bold text-zinc-950 dark:text-zinc-50">
                {t('admin.calendar.listTitle')}
              </h2>
              <div className="flex gap-1 bg-zinc-100 dark:bg-zinc-850 p-0.5 rounded-lg text-[10px]">
                {['upcoming', 'today', 'week', 'month'].map((opt) => (
                  <a
                    key={opt}
                    href={opt === 'upcoming' ? '/admin/calendar?view=list' : `/admin/calendar?view=list&range=${opt}`}
                    className={`px-2.5 py-1 rounded-md font-bold transition-all ${
                      listRange === opt
                        ? 'bg-white dark:bg-zinc-950 text-emerald-600 dark:text-emerald-450 shadow-sm'
                        : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
                    }`}
                  >
                    {t(`admin.calendar.range_${opt}`)}
                  </a>
                ))}
              </div>
            </div>

            {events.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-start text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-100 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 font-semibold">
                      <th className="py-2.5 px-2 text-start">{t('admin.calendar.colTitle')}</th>
                      <th className="py-2.5 px-2 text-start">{t('admin.calendar.colStartsAt')}</th>
                      <th className="py-2.5 px-2 text-start">{t('admin.calendar.colEndsAt')}</th>
                      <th className="py-2.5 px-2 text-center w-16">{t('admin.calendar.colAllDay')}</th>
                      <th className="py-2.5 px-2 text-start">{t('admin.calendar.colVisibility')}</th>
                      <th className="py-2.5 px-2 text-center w-20"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
                    {events.map((event) => (
                      <CalendarEventRow
                        key={event.id}
                        event={event}
                        groups={groups}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-zinc-200 dark:border-zinc-850 py-10 text-center text-zinc-500 dark:text-zinc-450">
                {t('admin.calendar.emptyList')}
              </div>
            )}
          </div>
        ) : view === 'year' ? (
          <CalendarYearGanttView
            events={events}
            schoolYears={schoolYears}
            selectedSchoolYear={selectedSchoolYear}
            onEditEvent={(event) => setEditingEvent(event)}
          />
        ) : (
          <CalendarViews
            view={view}
            dateStr={dateStr}
            events={events}
            onEditEvent={(event) => setEditingEvent(event)}
            onRescheduleEvent={(event) => setReschedulingEvent(event)}
          />
        )}
      </section>

      <aside className="sticky top-6">
        <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm">
          {editingEvent ? (
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold text-zinc-950 dark:text-zinc-50">
                  {t('admin.calendar.editTitle')}
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    setEditingEvent(null);
                    setSyncError(null);
                    setSyncSuccess(false);
                  }}
                  className="text-xs text-emerald-600 hover:text-emerald-700 font-bold"
                >
                  {t('admin.calendar.cancelButton')}
                </button>
              </div>

              {isSyncConfigured && (
                <div className="mb-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 p-3 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-zinc-650 dark:text-zinc-400">Google Calendar:</span>
                    {editingEvent.googleCalendarEventId ? (
                      <span className="inline-flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-450">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Synced
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 font-bold text-amber-600 dark:text-amber-500">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        Not Synced
                      </span>
                    )}
                  </div>

                  {!editingEvent.googleCalendarEventId && (
                    <div className="mt-2 flex items-center justify-between gap-2 border-t border-zinc-150 dark:border-zinc-800 pt-2">
                      <p className="text-[10px] text-zinc-500">Mirror event to Google Calendar</p>
                      <button
                        type="button"
                        onClick={() => handleSingleSync(editingEvent.id)}
                        disabled={isSyncing}
                        className="rounded-lg bg-zinc-900 hover:bg-zinc-850 dark:bg-zinc-50 dark:hover:bg-zinc-200 px-2 py-1 text-[10px] font-bold text-white dark:text-zinc-950 transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        {isSyncing ? (
                          <Loader2 className="h-2.5 w-2.5 animate-spin" />
                        ) : (
                          <RefreshCw className="h-2.5 w-2.5" />
                        )}
                        Sync Now
                      </button>
                    </div>
                  )}

                  {syncError && (
                    <p className="mt-1.5 text-[10px] font-bold text-rose-600 dark:text-rose-400">{syncError}</p>
                  )}
                  {syncSuccess && (
                    <p className="mt-1.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">Synced successfully!</p>
                  )}
                </div>
              )}

              <CalendarEventForm
                key={`edit-${editingEvent.id}`}
                groups={groups}
                mode="edit"
                eventId={editingEvent.id}
                initialValues={{
                  title: editingEvent.title,
                  description: editingEvent.description ?? '',
                  startsAt: editingEvent.startsAt,
                  endsAt: editingEvent.endsAt,
                  isAllDay: editingEvent.isAllDay,
                  visibility: editingEvent.visibility,
                  location: editingEvent.location ?? '',
                  groupIds: editingEvent.targetGroupIds,
                }}
                onSaved={() => setEditingEvent(null)}
              />
            </div>
          ) : (
            <div>
              <h2 className="mb-4 text-lg font-bold text-zinc-950 dark:text-zinc-50">
                {t('admin.calendar.createTitle')}
              </h2>
              <CalendarEventForm groups={groups} mode="create" />
            </div>
          )}
        </section>
      </aside>

      {reschedulingEvent && (
        <RescheduleModal
          event={reschedulingEvent}
          onClose={() => setReschedulingEvent(null)}
        />
      )}
    </div>
  );
}
