import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';
import {
  getAdminCalendarData,
  getAdminCalendarEventsForRange,
  getAdminSchoolYears,
  startOfLocalDay,
  addDays,
  startOfWeek,
  startOfMonth,
  type AdminCalendarEvent,
  type AdminCalendarGroupOption,
  type AdminSchoolYearOption,
} from '@/features/calendar/admin-queries';
import { CalendarWorkspace } from './CalendarWorkspace';
import { t } from '@/lib/i18n';
import { isGoogleCalendarSyncConfigured } from '@/lib/google/calendar-client';

type AdminCalendarPageProps = {
  searchParams: Promise<{
    view?: string;
    date?: string;
    range?: string;
  }>;
};

function ForbiddenState() {
  return (
    <main className="min-h-screen bg-surface-sunken dark:bg-ink px-4 py-8">
      <section className="mx-auto max-w-md rounded-2xl border border-line dark:border-ink-secondary bg-white dark:bg-ink p-6 text-center shadow-xl">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-rose-600 text-white">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <h1 className="text-xl font-bold text-ink dark:text-surface">
          {t('admin.accessGrants.forbiddenTitle')}
        </h1>
        <p className="mt-2 text-sm leading-6 text-ink-secondary dark:text-ink-muted">
          {t('admin.calendar.errorForbidden')}
        </p>
        <Link
          href="/calendar"
          className="mt-5 inline-flex h-10 items-center justify-center rounded-xl bg-ink px-4 text-sm font-bold text-white transition-colors hover:bg-ink-secondary dark:bg-surface dark:text-ink dark:hover:bg-line"
        >
          {t('admin.accessGrants.backToDashboard')}
        </Link>
      </section>
    </main>
  );
}

export default async function AdminCalendarPage({ searchParams }: AdminCalendarPageProps) {
  const isSyncConfigured = isGoogleCalendarSyncConfigured();
  const params = await searchParams;
  const rawView = params.view;
  const view =
    rawView === 'list' || rawView === 'day' || rawView === 'week' || rawView === 'month' || rawView === 'year'
      ? rawView
      : 'week';

  const rawDate = params.date;
  let currentDateStr = rawDate ?? '';
  let currentDate = new Date();
  if (currentDateStr) {
    const parts = currentDateStr.split('-').map(Number);
    if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
      currentDate = new Date(parts[0], parts[1] - 1, parts[2]);
    } else {
      currentDateStr = '';
    }
  }

  if (!currentDateStr) {
    const pad = (n: number) => String(n).padStart(2, '0');
    currentDateStr = `${currentDate.getFullYear()}-${pad(currentDate.getMonth() + 1)}-${pad(currentDate.getDate())}`;
  }

  let events: AdminCalendarEvent[] = [];
  let groups: AdminCalendarGroupOption[] = [];
  let isAuthorized = false;
  const listRange = params.range ?? 'upcoming';
  let schoolYears: AdminSchoolYearOption[] = [];
  let selectedSchoolYear: AdminSchoolYearOption | null = null;

  if (view === 'list') {
    const data = await getAdminCalendarData(listRange, currentDate);
    events = data.events;
    groups = data.groups;
    isAuthorized = data.isAuthorized;
  } else if (view === 'year') {
    schoolYears = await getAdminSchoolYears();
    selectedSchoolYear =
      schoolYears.find((sy) => {
        const start = new Date(sy.startsOn);
        const end = new Date(sy.endsOn);
        // Strip time
        const d = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
        return d >= start && d <= end;
      }) || null;
    if (!selectedSchoolYear && schoolYears.length > 0) {
      selectedSchoolYear = schoolYears.find((sy) => sy.isCurrent) || schoolYears[0] || null;
    }

    if (selectedSchoolYear) {
      const start = new Date(selectedSchoolYear.startsOn);
      const end = new Date(selectedSchoolYear.endsOn);
      const data = await getAdminCalendarEventsForRange(start, end);
      events = data.events;
      groups = data.groups;
      isAuthorized = data.isAuthorized;
    } else {
      const start = new Date(currentDate.getFullYear(), 8, 1);
      const end = new Date(currentDate.getFullYear() + 1, 7, 31);
      const data = await getAdminCalendarEventsForRange(start, end);
      events = data.events;
      groups = data.groups;
      isAuthorized = data.isAuthorized;
    }
  } else {
    let startDate: Date;
    let endDate: Date;

    if (view === 'day') {
      startDate = startOfLocalDay(currentDate);
      endDate = addDays(startDate, 1);
    } else if (view === 'week') {
      startDate = startOfWeek(currentDate);
      endDate = addDays(startDate, 7);
    } else {
      const monthStart = startOfMonth(currentDate);
      startDate = startOfWeek(monthStart);
      endDate = addDays(startDate, 42);
    }

    const data = await getAdminCalendarEventsForRange(startDate, endDate);
    events = data.events;
    groups = data.groups;
    isAuthorized = data.isAuthorized;
  }

  if (!isAuthorized) {
    return <ForbiddenState />;
  }

  return (
    <main className="p-4 md:p-6 lg:p-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold text-accent-strong dark:text-accent-strong">
              {t('nav.admin')}
            </p>
            <h1 className="text-2xl font-bold tracking-tight text-ink dark:text-surface">
              {t('admin.calendar.title')}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-secondary dark:text-ink-muted">
              {t('admin.calendar.description')}
            </p>
          </div>
        </header>

        <CalendarWorkspace
          view={view}
          dateStr={currentDateStr}
          events={events}
          groups={groups}
          listRange={listRange}
          schoolYears={schoolYears}
          selectedSchoolYear={selectedSchoolYear}
          isSyncConfigured={isSyncConfigured}
        />
      </div>
    </main>
  );
}
