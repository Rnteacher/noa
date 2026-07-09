import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';
import {
  getAdminCalendarData,
  getAdminCalendarEventsForRange,
  startOfLocalDay,
  addDays,
  startOfWeek,
  startOfMonth,
  type AdminCalendarEvent,
  type AdminCalendarGroupOption,
} from '@/features/calendar/admin-queries';
import { CalendarWorkspace } from './CalendarWorkspace';
import { t } from '@/lib/i18n';

type AdminCalendarPageProps = {
  searchParams: Promise<{
    view?: string;
    date?: string;
    range?: string;
  }>;
};

function ForbiddenState() {
  return (
    <main className="min-h-screen bg-zinc-100 dark:bg-zinc-950 px-4 py-8">
      <section className="mx-auto max-w-md rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 text-center shadow-xl">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-rose-600 text-white">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <h1 className="text-xl font-bold text-zinc-950 dark:text-zinc-50">
          {t('admin.accessGrants.forbiddenTitle')}
        </h1>
        <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
          {t('admin.calendar.errorForbidden')}
        </p>
        <Link
          href="/dashboard"
          className="mt-5 inline-flex h-10 items-center justify-center rounded-xl bg-zinc-950 px-4 text-sm font-bold text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
        >
          {t('admin.accessGrants.backToDashboard')}
        </Link>
      </section>
    </main>
  );
}

export default async function AdminCalendarPage({ searchParams }: AdminCalendarPageProps) {
  const params = await searchParams;
  const rawView = params.view;
  const view = rawView === 'list' || rawView === 'day' || rawView === 'week' || rawView === 'month' ? rawView : 'week';

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

  if (view === 'list') {
    const data = await getAdminCalendarData(listRange, currentDate);
    events = data.events;
    groups = data.groups;
    isAuthorized = data.isAuthorized;
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
            <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
              {t('nav.admin')}
            </p>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
              {t('admin.calendar.title')}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600 dark:text-zinc-400">
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
        />
      </div>
    </main>
  );
}
