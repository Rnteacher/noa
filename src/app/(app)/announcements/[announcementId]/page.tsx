import { Alert, AppHeader, StatusBadge } from '@/components/ui';
import { getAnnouncementById } from '@/features/announcements/queries';
import { t } from '@/lib/i18n';
import { Pin, Calendar, User } from 'lucide-react';
import { AcknowledgeButton } from './AcknowledgeButton';

const dateFormatter = new Intl.DateTimeFormat('he-IL', {
  weekday: 'long',
  day: 'numeric',
  month: 'numeric',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

type PageProps = {
  params: Promise<{
    announcementId: string;
  }>;
};

export default async function AnnouncementDetailPage({ params }: PageProps) {
  const { announcementId } = await params;
  const { announcement, acknowledged, error } = await getAnnouncementById(announcementId);

  if (error || !announcement) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col border-x border-line bg-surface">
        <AppHeader title={t('nav.announcements')} backHref="/announcements" />
        <main className="flex-1 p-4">
          <Alert variant="danger" title={t('dashboard.error.title')}>
            {t(error || 'announcements.error.notFound')}
          </Alert>
        </main>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col border-x border-line bg-surface">
      <AppHeader title={t('nav.announcements')} backHref="/announcements" />

      <main className="flex-1 space-y-6 p-4">
        <article className="space-y-4">
          <header className="space-y-3">
            {announcement.is_pinned ? (
              <span className="inline-flex items-center gap-1 rounded bg-accent-soft px-2 py-0.5 text-xs font-semibold text-accent">
                <Pin className="h-3 w-3 rotate-45 shrink-0" />
                {t('announcements.pinned')}
              </span>
            ) : null}

            <h2 className="text-xl font-bold text-ink leading-tight">
              {announcement.title}
            </h2>

            <div className="flex flex-col gap-1.5 border-b border-line pb-4 text-xs text-ink-secondary">
              <div className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-ink-muted shrink-0" />
                <span>
                  {announcement.author_name
                    ? t('dashboard.announcements.byAuthor', {
                        author: announcement.author_name,
                      })
                    : t('dashboard.announcements.noAuthor')}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-ink-muted shrink-0" />
                <span>
                  {dateFormatter.format(new Date(announcement.published_at))}
                </span>
              </div>
              {announcement.requires_acknowledgement ? (
                <div className="mt-1">
                  <StatusBadge
                    variant={acknowledged ? 'positive' : 'caution'}
                    label={
                      acknowledged
                        ? t('announcements.acknowledged')
                        : t('announcements.requiredAcknowledge')
                    }
                  />
                </div>
              ) : null}
            </div>
          </header>

          <div className="whitespace-pre-wrap text-sm leading-relaxed text-ink-secondary">
            {announcement.body}
          </div>
        </article>

        {announcement.requires_acknowledgement ? (
          <div className="border-t border-line pt-6">
            <AcknowledgeButton
              announcementId={announcement.id}
              initialAcknowledged={acknowledged}
            />
          </div>
        ) : null}
      </main>
    </div>
  );
}
