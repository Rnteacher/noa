import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';
import { getAdminCalendarData, type CalendarRangeFilter } from '@/features/calendar/admin-queries';
import { CalendarEventForm } from './CalendarEventForm';
import { CalendarEventRow } from './CalendarEventRow';
import { t } from '@/lib/i18n';
import { cn } from '@/lib/cn';

type AdminCalendarPageProps = {
  searchParams: Promise<{
    range?: string;
  }>;
};

const RANGE_OPTIONS: CalendarRangeFilter[] = ['upcoming', 'today', 'week', 'month'];

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('he-IL', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}

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
  const { range: rawRange } = await searchParams;
  const data = await getAdminCalendarData(rawRange);

  if (!data.isAuthorized) {
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

        <div className="grid gap-6 lg:grid-cols-[1fr_380px] items-start">
          <section className="space-y-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-sm min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-base font-bold text-zinc-950 dark:text-zinc-50">
                {t('admin.calendar.listTitle')}
              </h2>
              <nav className="flex gap-1 rounded-lg bg-zinc-100 dark:bg-zinc-850 p-1" aria-label={t('admin.calendar.filterLabel')}>
                {RANGE_OPTIONS.map((option) => (
                  <Link
                    key={option}
                    href={option === 'upcoming' ? '/admin/calendar' : `/admin/calendar?range=${option}`}
                    className={cn(
                      'rounded-md px-2.5 py-1 text-xs font-semibold transition-colors',
                      data.range === option
                        ? 'bg-white dark:bg-zinc-950 text-emerald-700 dark:text-emerald-400 shadow-sm'
                        : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
                    )}
                  >
                    {t(`admin.calendar.range_${option}`)}
                  </Link>
                ))}
              </nav>
            </div>

            {data.events.length > 0 ? (
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
                    {data.events.map((event) => (
                      <CalendarEventRow
                        key={event.id}
                        event={event}
                        groups={data.groups}
                        formatDateTime={formatDateTime}
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
          </section>

          <aside className="sticky top-6">
            <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 shadow-sm">
              <h2 className="mb-4 text-lg font-bold text-zinc-950 dark:text-zinc-50">
                {t('admin.calendar.createTitle')}
              </h2>
              <CalendarEventForm groups={data.groups} mode="create" />
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
