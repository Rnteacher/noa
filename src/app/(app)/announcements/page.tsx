import { Megaphone, Pin } from 'lucide-react';
import { Alert, AppHeader, Card, EmptyState, ListRow, StatusBadge } from '@/components/ui';
import { getAnnouncements } from '@/features/announcements/queries';
import { t } from '@/lib/i18n';

const dateFormatter = new Intl.DateTimeFormat('he-IL', {
  weekday: 'short',
  day: 'numeric',
  month: 'numeric',
  year: 'numeric',
});

export default async function AnnouncementsPage() {
  const { announcements, error } = await getAnnouncements();

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col border-x border-line bg-surface">
      <AppHeader title={t('nav.announcements')} />

      <main className="flex-1 space-y-4 p-4">
        {error ? (
          <Alert variant="warning" title={t('dashboard.error.title')}>
            {t(error)}
          </Alert>
        ) : null}

        {announcements.length > 0 ? (
          <Card title={t('sections.announcements')}>
            <div className="-mx-4 -my-4 divide-y divide-line">
              {announcements.map((announcement) => {
                const isPending = announcement.requires_acknowledgement && !announcement.acknowledged;

                return (
                  <ListRow
                    key={announcement.id}
                    href={`/announcements/${announcement.id}`}
                    className={isPending ? 'bg-status-caution-soft/40' : undefined}
                    leading={
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-soft text-accent">
                        {announcement.is_pinned ? (
                          <Pin aria-hidden="true" className="h-4 w-4 rotate-45" />
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
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-[10px] text-ink-muted">
                          {dateFormatter.format(new Date(announcement.published_at))}
                        </span>
                        {announcement.requires_acknowledgement ? (
                          <StatusBadge
                            variant={announcement.acknowledged ? 'positive' : 'caution'}
                            label={
                              announcement.acknowledged
                                ? t('announcements.acknowledged')
                                : t('announcements.requiredAcknowledge')
                            }
                            size="sm"
                          />
                        ) : null}
                      </div>
                    }
                  />
                );
              })}
            </div>
          </Card>
        ) : (
          !error && (
            <EmptyState
              icon={<Megaphone aria-hidden="true" className="h-6 w-6" />}
              title={t('dashboard.announcements.emptyTitle')}
              description={t('dashboard.announcements.emptyDescription')}
            />
          )
        )}
      </main>
    </div>
  );
}
