import Link from 'next/link';
import { ShieldAlert, Pin, CheckCircle2, Circle } from 'lucide-react';
import { getAdminAnnouncements } from '@/features/announcements/admin-queries';
import { AnnouncementForm } from './AnnouncementForm';
import { DeleteAnnouncementButton } from './DeleteAnnouncementButton';
import { t } from '@/lib/i18n';

function formatDate(value: string) {
  return new Intl.DateTimeFormat('he-IL', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}

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
          {t('admin.accessGrants.forbiddenDescription')}
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

export default async function AdminAnnouncementsPage() {
  const data = await getAdminAnnouncements();

  if (!data.isAuthorized) {
    return <ForbiddenState />;
  }

  return (
    <main className="p-4 md:p-6 lg:p-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        {/* Header */}
        <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold text-accent-strong dark:text-accent-strong">
              {t('nav.admin')}
            </p>
            <h1 className="text-2xl font-bold tracking-tight text-ink dark:text-surface">
              {t('admin.announcements.title')}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-secondary dark:text-ink-muted">
              {t('admin.announcements.description')}
            </p>
          </div>
        </header>

        {/* Desktop-first Grid */}
        <div className="grid gap-6 lg:grid-cols-[1fr_380px] items-start">
          {/* Announcements List (Dense Table) */}
          <section className="space-y-4 rounded-2xl border border-line dark:border-ink-secondary bg-white dark:bg-ink p-4 shadow-sm min-w-0">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-ink dark:text-surface">
                {t('admin.announcements.listTitle')}
              </h2>
              <span className="rounded-full bg-surface-sunken dark:bg-ink px-2.5 py-0.5 text-xs font-bold text-ink-secondary dark:text-ink-muted">
                {data.announcements.length}
              </span>
            </div>

            {data.announcements.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-start text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-surface-sunken dark:border-ink-secondary text-ink-muted dark:text-ink-muted font-semibold">
                      <th className="py-2.5 px-2 text-start">{t('admin.announcements.colTitle')}</th>
                      <th className="py-2.5 px-2 text-start">{t('admin.announcements.colAuthor')}</th>
                      <th className="py-2.5 px-2 text-start">{t('admin.announcements.colTarget')}</th>
                      <th className="py-2.5 px-2 text-center w-12">{t('admin.announcements.colPinned')}</th>
                      <th className="py-2.5 px-2 text-center w-12">{t('admin.announcements.colAck')}</th>
                      <th className="py-2.5 px-2 text-center w-16">{t('admin.announcements.colReads')}</th>
                      <th className="py-2.5 px-2 text-center w-12"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-sunken dark:divide-ink-secondary/50">
                    {data.announcements.map((ann) => (
                      <tr key={ann.id} className="hover:bg-surface/50 dark:hover:bg-ink/30">
                        <td className="py-3 px-2 font-medium text-ink dark:text-surface-sunken max-w-[150px] sm:max-w-[200px] truncate">
                          <div>{ann.title}</div>
                          <div className="text-[10px] text-ink-muted dark:text-ink-muted mt-0.5">
                            {formatDate(ann.published_at)}
                          </div>
                        </td>
                        <td className="py-3 px-2 text-ink-secondary dark:text-ink-muted">
                          {ann.author_name ?? t('dashboard.announcements.noAuthor')}
                        </td>
                        <td className="py-3 px-2 text-ink-secondary dark:text-ink-muted uppercase font-mono tracking-wider text-[10px]">
                          {t(`admin.announcements.targetType_${ann.target_type}`)}
                        </td>
                        <td className="py-3 px-2 text-center">
                          {ann.is_pinned ? (
                            <Pin className="h-3.5 w-3.5 mx-auto text-accent" />
                          ) : (
                            <span className="text-line dark:text-ink-secondary">-</span>
                          )}
                        </td>
                        <td className="py-3 px-2 text-center">
                          {ann.requires_acknowledgement ? (
                            <CheckCircle2 className="h-3.5 w-3.5 mx-auto text-accent" />
                          ) : (
                            <Circle className="h-3.5 w-3.5 mx-auto text-line dark:text-ink-secondary" />
                          )}
                        </td>
                        <td className="py-3 px-2 text-center font-bold font-mono text-ink-secondary dark:text-line">
                          {ann.requires_acknowledgement ? ann.readCount : '-'}
                        </td>
                        <td className="py-2 px-1 text-center">
                          <DeleteAnnouncementButton announcementId={ann.id} title={ann.title} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-line dark:border-ink py-10 text-center text-ink-muted dark:text-ink-muted">
                {t('admin.announcements.emptyList')}
              </div>
            )}
          </section>

          {/* Create Announcement Side Section */}
          <aside className="sticky top-6">
            <AnnouncementForm groups={data.groups} />
          </aside>
        </div>
      </div>
    </main>
  );
}
