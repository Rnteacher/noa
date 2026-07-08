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
    <main className="min-h-screen bg-zinc-100 dark:bg-zinc-950 px-4 py-8">
      <section className="mx-auto max-w-md rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 text-center shadow-xl">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-rose-600 text-white">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <h1 className="text-xl font-bold text-zinc-950 dark:text-zinc-50">
          {t('admin.accessGrants.forbiddenTitle')}
        </h1>
        <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
          {t('admin.accessGrants.forbiddenDescription')}
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
            <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
              {t('nav.admin')}
            </p>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
              {t('admin.announcements.title')}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              {t('admin.announcements.description')}
            </p>
          </div>
        </header>

        {/* Desktop-first Grid */}
        <div className="grid gap-6 lg:grid-cols-[1fr_380px] items-start">
          {/* Announcements List (Dense Table) */}
          <section className="space-y-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-sm min-w-0">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-zinc-950 dark:text-zinc-50">
                {t('admin.announcements.listTitle')}
              </h2>
              <span className="rounded-full bg-zinc-100 dark:bg-zinc-850 px-2.5 py-0.5 text-xs font-bold text-zinc-600 dark:text-zinc-400">
                {data.announcements.length}
              </span>
            </div>

            {data.announcements.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-start text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-100 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 font-semibold">
                      <th className="py-2.5 px-2 text-start">{t('admin.announcements.colTitle')}</th>
                      <th className="py-2.5 px-2 text-start">{t('admin.announcements.colAuthor')}</th>
                      <th className="py-2.5 px-2 text-start">{t('admin.announcements.colTarget')}</th>
                      <th className="py-2.5 px-2 text-center w-12">{t('admin.announcements.colPinned')}</th>
                      <th className="py-2.5 px-2 text-center w-12">{t('admin.announcements.colAck')}</th>
                      <th className="py-2.5 px-2 text-center w-16">{t('admin.announcements.colReads')}</th>
                      <th className="py-2.5 px-2 text-center w-12"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
                    {data.announcements.map((ann) => (
                      <tr key={ann.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-850/30">
                        <td className="py-3 px-2 font-medium text-zinc-900 dark:text-zinc-100 max-w-[150px] sm:max-w-[200px] truncate">
                          <div>{ann.title}</div>
                          <div className="text-[10px] text-zinc-400 dark:text-zinc-550 mt-0.5">
                            {formatDate(ann.published_at)}
                          </div>
                        </td>
                        <td className="py-3 px-2 text-zinc-600 dark:text-zinc-450">
                          {ann.author_name ?? t('dashboard.announcements.noAuthor')}
                        </td>
                        <td className="py-3 px-2 text-zinc-600 dark:text-zinc-450 uppercase font-mono tracking-wider text-[10px]">
                          {t(`admin.announcements.targetType_${ann.target_type}`)}
                        </td>
                        <td className="py-3 px-2 text-center">
                          {ann.is_pinned ? (
                            <Pin className="h-3.5 w-3.5 mx-auto text-emerald-600" />
                          ) : (
                            <span className="text-zinc-300 dark:text-zinc-700">-</span>
                          )}
                        </td>
                        <td className="py-3 px-2 text-center">
                          {ann.requires_acknowledgement ? (
                            <CheckCircle2 className="h-3.5 w-3.5 mx-auto text-emerald-600" />
                          ) : (
                            <Circle className="h-3.5 w-3.5 mx-auto text-zinc-300 dark:text-zinc-700" />
                          )}
                        </td>
                        <td className="py-3 px-2 text-center font-bold font-mono text-zinc-700 dark:text-zinc-300">
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
              <div className="rounded-xl border border-dashed border-zinc-200 dark:border-zinc-850 py-10 text-center text-zinc-500 dark:text-zinc-450">
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
