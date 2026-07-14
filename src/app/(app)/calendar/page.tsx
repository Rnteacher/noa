import { Calendar, CalendarDays } from 'lucide-react';
import { Alert, AppHeader, Card, EmptyState, ListRow } from '@/components/ui';
import { getCalendarFeedData } from '@/features/calendar-feed/queries';
import type { CalendarFeedEvent } from '@/features/calendar-feed/types';
import { t } from '@/lib/i18n';

const todayLabelFormatter = new Intl.DateTimeFormat('he-IL', {
  weekday: 'long',
  day: 'numeric',
  month: 'numeric',
});

const dateFormatter = new Intl.DateTimeFormat('he-IL', {
  weekday: 'short',
  day: 'numeric',
  month: 'numeric',
});

const timeFormatter = new Intl.DateTimeFormat('he-IL', {
  hour: '2-digit',
  minute: '2-digit',
});

function formatTimeRange(startsAt: string, endsAt: string) {
  return `${timeFormatter.format(new Date(startsAt))}-${timeFormatter.format(
    new Date(endsAt)
  )}`;
}

function formatEventSubtitle(event: CalendarFeedEvent) {
  const timeRange = event.is_all_day
    ? t('dashboard.calendar.allDay')
    : formatTimeRange(event.starts_at, event.ends_at);

  if (!event.location) {
    return timeRange;
  }

  return t('dashboard.calendar.timeAndLocation', {
    time: timeRange,
    location: event.location,
  });
}

function TodayEventRow({ event }: { event: CalendarFeedEvent }) {
  return (
    <ListRow
      leading={
        <span className="flex h-[34px] min-w-[66px] items-center justify-center rounded-[10px] bg-accent-soft px-1.5 text-xs font-bold text-accent" dir="ltr">
          {event.is_all_day ? t('dashboard.calendar.allDayShort') : timeFormatter.format(new Date(event.starts_at))}
        </span>
      }
      title={event.title}
      subtitle={formatEventSubtitle(event)}
    />
  );
}

function WeekEventRow({ event }: { event: CalendarFeedEvent }) {
  return (
    <ListRow
      leading={
        <span className="flex h-[34px] min-w-[54px] items-center justify-center rounded-[10px] bg-accent-soft px-1.5 text-[11.5px] font-bold text-accent">
          {dateFormatter.format(new Date(event.starts_at))}
        </span>
      }
      title={event.title}
      subtitle={formatEventSubtitle(event)}
    />
  );
}

export default async function CalendarPage() {
  const { todayEvents, weekEvents, error } = await getCalendarFeedData();

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col bg-surface">
      <AppHeader
        variant="large"
        title={t('nav.calendar')}
        subtitle={todayLabelFormatter.format(new Date())}
      />

      <main className="flex-1 space-y-4 px-[18px] pb-4">
        {error ? (
          <Alert variant="warning" title={t('dashboard.error.title')}>
            {t(error)}
          </Alert>
        ) : null}

        <div>
          <p className="mb-1.5 mt-2.5 px-1.5 text-[13px] font-bold text-ink-muted">
            {t('sections.today')}
          </p>
          <Card>
            {todayEvents.length > 0 ? (
              <div className="-mx-4 -my-4 divide-y divide-line">
                {todayEvents.map((event) => (
                  <TodayEventRow key={event.id} event={event} />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<Calendar aria-hidden="true" className="h-5 w-5" />}
                title={t('dashboard.today.emptyTitle')}
                description={t('dashboard.today.emptyDescription')}
                className="border-0 px-2 py-4"
              />
            )}
          </Card>
        </div>

        <div>
          <p className="mb-1.5 mt-5 px-1.5 text-[13px] font-bold text-ink-muted">
            {t('dashboard.week.title')}
          </p>
          <Card>
            {weekEvents.length > 0 ? (
              <div className="-mx-4 -my-4 divide-y divide-line">
                {weekEvents.map((event) => (
                  <WeekEventRow key={event.id} event={event} />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<CalendarDays aria-hidden="true" className="h-5 w-5" />}
                title={t('dashboard.week.emptyTitle')}
                description={t('dashboard.week.emptyDescription')}
                className="border-0 px-2 py-4"
              />
            )}
          </Card>
        </div>
      </main>
    </div>
  );
}
