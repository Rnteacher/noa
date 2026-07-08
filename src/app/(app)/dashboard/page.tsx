import Link from 'next/link';
import {
  Bell,
  Calendar,
  CalendarDays,
  CheckCircle2,
  Megaphone,
  Search,
  ShieldCheck,
  Star,
} from 'lucide-react';
import { Alert, AppHeader, Card, EmptyState, ListRow } from '@/components/ui';
import { getDashboardData } from '@/features/dashboard/queries';
import type {
  DashboardAnnouncement,
  DashboardCalendarEvent,
} from '@/features/dashboard/types';
import { t } from '@/lib/i18n';

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

function formatEventSubtitle(event: DashboardCalendarEvent) {
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

function formatWeekEventDate(event: DashboardCalendarEvent) {
  return dateFormatter.format(new Date(event.starts_at));
}

function AnnouncementRow({
  announcement,
  emphasize = false,
}: {
  announcement: DashboardAnnouncement;
  emphasize?: boolean;
}) {
  return (
    <ListRow
      href={`/announcements/${announcement.id}`}
      className={emphasize ? 'bg-status-caution-soft/40' : undefined}
      leading={
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-soft text-accent">
          {emphasize ? (
            <CheckCircle2 aria-hidden="true" className="h-4 w-4" />
          ) : (
            <Megaphone aria-hidden="true" className="h-4 w-4" />
          )}
        </span>
      }
      title={announcement.title}
      subtitle={
        announcement.author_name
          ? t('dashboard.announcements.byAuthor', {
              author: announcement.author_name,
            })
          : t('dashboard.announcements.noAuthor')
      }
      trailing={
        <span className="text-xs font-medium text-ink-muted">
          {dateFormatter.format(new Date(announcement.published_at))}
        </span>
      }
    />
  );
}

function EventRow({
  event,
  showDate = false,
}: {
  event: DashboardCalendarEvent;
  showDate?: boolean;
}) {
  return (
    <ListRow
      leading={
        <span className="flex min-w-14 flex-col items-center rounded-xl bg-surface-sunken px-2 py-1 text-center">
          <span className="text-[10px] font-semibold text-ink-muted">
            {showDate ? formatWeekEventDate(event) : t('nav.today')}
          </span>
          <span className="text-xs font-bold text-ink">
            {event.is_all_day
              ? t('dashboard.calendar.allDayShort')
              : timeFormatter.format(new Date(event.starts_at))}
          </span>
        </span>
      }
      title={event.title}
      subtitle={formatEventSubtitle(event)}
    />
  );
}

export default async function DashboardPage() {
  const dashboard = await getDashboardData();

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col border-x border-line bg-surface">
      <AppHeader
        title={t('app.title')}
        trailing={
          <>
            <Link
              href="/students"
              aria-label={t('dashboard.actions.searchStudents')}
              className="flex h-10 w-10 items-center justify-center rounded-full text-ink-secondary transition-colors hover:bg-surface-sunken focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            >
              <Search aria-hidden="true" className="h-5 w-5" />
            </Link>
            <span className="relative flex h-10 w-10 items-center justify-center rounded-full text-ink-secondary">
              <Bell aria-hidden="true" className="h-5 w-5" />
              {dashboard.requiredAcknowledgements.length > 0 ? (
                <span className="absolute top-2 end-2 h-2 w-2 rounded-full bg-status-critical ring-2 ring-surface-raised" />
              ) : null}
            </span>
          </>
        }
      />

      <main className="flex-1 space-y-5 p-4">
        {dashboard.error ? (
          <Alert variant="warning" title={t('dashboard.error.title')}>
            {t(dashboard.error)}
          </Alert>
        ) : null}

        {dashboard.requiredAcknowledgements.length > 0 ? (
          <Card
            title={t('dashboard.requiredAcknowledgements.title')}
            description={t('dashboard.requiredAcknowledgements.description')}
            className="border-status-caution/30"
          >
            <div className="-mx-4 -mb-4 divide-y divide-line">
              {dashboard.requiredAcknowledgements.map((announcement) => (
                <AnnouncementRow
                  key={announcement.id}
                  announcement={announcement}
                  emphasize
                />
              ))}
            </div>
          </Card>
        ) : null}

        {dashboard.profile ? (
          <Card
            title={t('dashboard.greeting', {
              name: dashboard.profile.fullName,
            })}
            description={t('dashboard.summary')}
          />
        ) : null}

        <Card title={t('sections.announcements')}>
          {dashboard.recentAnnouncements.length > 0 ? (
            <div className="-mx-4 -my-4 divide-y divide-line">
              {dashboard.recentAnnouncements.map((announcement) => (
                <AnnouncementRow
                  key={announcement.id}
                  announcement={announcement}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<Megaphone aria-hidden="true" className="h-5 w-5" />}
              title={t('dashboard.announcements.emptyTitle')}
              description={t('dashboard.announcements.emptyDescription')}
              className="border-0 px-2 py-4"
            />
          )}
        </Card>

        <Card title={t('sections.today')}>
          {dashboard.todayEvents.length > 0 ? (
            <div className="-mx-4 -my-4 divide-y divide-line">
              {dashboard.todayEvents.map((event) => (
                <EventRow key={event.id} event={event} />
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

        <Card title={t('dashboard.week.title')}>
          {dashboard.weekEvents.length > 0 ? (
            <div className="-mx-4 -my-4 divide-y divide-line">
              {dashboard.weekEvents.map((event) => (
                <EventRow key={event.id} event={event} showDate />
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

        <Card title={t('sections.followedStudents')}>
          <ListRow
            leading={
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-soft text-accent">
                <Star aria-hidden="true" className="h-4 w-4" />
              </span>
            }
            title={t('dashboard.followed.count', {
              count: String(dashboard.followedStudentsCount),
            })}
            subtitle={t('dashboard.followed.description')}
            href="/students"
            className="-mx-4 -my-4"
          />
        </Card>

        {dashboard.isSuperAdmin ? (
          <Link
            href="/admin/access-grants"
            className="flex items-center gap-3 rounded-2xl border border-accent/30 bg-accent-soft/50 p-4 text-accent transition-colors hover:bg-accent-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-on-accent">
              <ShieldCheck aria-hidden="true" className="h-5 w-5" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-bold">
                {t('admin.accessGrants.shortLink')}
              </span>
              <span className="block text-xs text-ink-secondary">
                {t('admin.accessGrants.shortDescription')}
              </span>
            </span>
          </Link>
        ) : null}
      </main>
    </div>
  );
}
