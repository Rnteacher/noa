import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';
import { getAdminAuditLogs } from '@/features/admin/audit-queries';
import { t } from '@/lib/i18n';

type AdminAuditPageProps = {
  searchParams: Promise<{
    action?: string;
    entityType?: string;
  }>;
};

const JSON_PREVIEW_MAX_LENGTH = 2000;

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('he-IL', {
    dateStyle: 'short',
    timeStyle: 'medium',
  }).format(new Date(value));
}

function formatJsonPreview(value: unknown) {
  if (value === null || value === undefined) {
    return null;
  }

  const text = JSON.stringify(value, null, 2);

  if (text.length > JSON_PREVIEW_MAX_LENGTH) {
    return `${text.slice(0, JSON_PREVIEW_MAX_LENGTH)}\n... (${text.length - JSON_PREVIEW_MAX_LENGTH} more characters truncated)`;
  }

  return text;
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
          {t('admin.audit.errorForbidden')}
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

export default async function AdminAuditPage({ searchParams }: AdminAuditPageProps) {
  const { action, entityType } = await searchParams;
  const data = await getAdminAuditLogs({ action, entityType });

  if (!data.isAuthorized) {
    return <ForbiddenState />;
  }

  return (
    <main className="p-4 md:p-6 lg:p-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <header>
          <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
            {t('nav.admin')}
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
            {t('admin.audit.title')}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600 dark:text-zinc-400">
            {t('admin.audit.description')}
          </p>
        </header>

        <section className="space-y-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-sm">
          <form className="flex flex-wrap items-end gap-3" action="/admin/audit">
            <div className="space-y-1">
              <label htmlFor="audit-action" className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                {t('admin.audit.filterActionLabel')}
              </label>
              <select
                id="audit-action"
                name="action"
                defaultValue={data.filters.action ?? ''}
                className="h-10 min-w-[10rem] rounded-xl border border-zinc-200 dark:border-zinc-750 bg-white dark:bg-zinc-950 px-3 text-sm text-zinc-950 dark:text-zinc-50 outline-none transition-colors focus:border-emerald-600"
              >
                <option value="">{t('admin.audit.filterAllActions')}</option>
                {data.actionOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label htmlFor="audit-entity-type" className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                {t('admin.audit.filterEntityTypeLabel')}
              </label>
              <select
                id="audit-entity-type"
                name="entityType"
                defaultValue={data.filters.entityType ?? ''}
                className="h-10 min-w-[10rem] rounded-xl border border-zinc-200 dark:border-zinc-750 bg-white dark:bg-zinc-950 px-3 text-sm text-zinc-950 dark:text-zinc-50 outline-none transition-colors focus:border-emerald-600"
              >
                <option value="">{t('admin.audit.filterAllEntityTypes')}</option>
                {data.entityTypeOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 text-sm font-bold text-white transition-colors"
            >
              {t('admin.audit.filterSubmit')}
            </button>

            {data.filters.action || data.filters.entityType ? (
              <Link
                href="/admin/audit"
                className="h-10 flex items-center rounded-xl border border-zinc-200 dark:border-zinc-750 px-4 text-sm font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-850"
              >
                {t('admin.audit.filterClear')}
              </Link>
            ) : null}
          </form>

          {data.logs.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-start text-xs border-collapse">
                <thead>
                  <tr className="border-b border-zinc-100 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 font-semibold">
                    <th className="py-2.5 px-2 text-start">{t('admin.audit.colDate')}</th>
                    <th className="py-2.5 px-2 text-start">{t('admin.audit.colActor')}</th>
                    <th className="py-2.5 px-2 text-start">{t('admin.audit.colAction')}</th>
                    <th className="py-2.5 px-2 text-start">{t('admin.audit.colEntity')}</th>
                    <th className="py-2.5 px-2 text-start">{t('admin.audit.colDetails')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
                  {data.logs.map((log) => {
                    const beforePreview = formatJsonPreview(log.beforeData);
                    const afterPreview = formatJsonPreview(log.afterData);

                    return (
                      <tr key={log.id} className="align-top hover:bg-zinc-50/50 dark:hover:bg-zinc-850/30">
                        <td className="py-3 px-2 whitespace-nowrap text-zinc-600 dark:text-zinc-450">
                          {formatDateTime(log.createdAt)}
                        </td>
                        <td className="py-3 px-2 text-zinc-600 dark:text-zinc-450">
                          {log.actorName ?? t('admin.audit.unknownActor')}
                        </td>
                        <td className="py-3 px-2 font-mono text-[11px] font-semibold text-zinc-900 dark:text-zinc-100">
                          {log.action}
                        </td>
                        <td className="py-3 px-2 text-zinc-600 dark:text-zinc-450">
                          <div className="font-mono text-[11px]">{log.entityType}</div>
                          {log.entityId ? (
                            <div className="mt-0.5 max-w-[140px] truncate font-mono text-[10px] text-zinc-400 dark:text-zinc-550">
                              {log.entityId}
                            </div>
                          ) : null}
                        </td>
                        <td className="py-3 px-2">
                          {beforePreview || afterPreview ? (
                            <div className="space-y-1">
                              {beforePreview ? (
                                <details>
                                  <summary className="cursor-pointer text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
                                    {t('admin.audit.beforeLabel')}
                                  </summary>
                                  <pre className="mt-1 max-w-md overflow-x-auto rounded-lg bg-zinc-50 dark:bg-zinc-950 p-2 text-[10px] text-zinc-700 dark:text-zinc-300">
                                    {beforePreview}
                                  </pre>
                                </details>
                              ) : null}
                              {afterPreview ? (
                                <details>
                                  <summary className="cursor-pointer text-[11px] font-semibold text-zinc-500 dark:text-zinc-400">
                                    {t('admin.audit.afterLabel')}
                                  </summary>
                                  <pre className="mt-1 max-w-md overflow-x-auto rounded-lg bg-zinc-50 dark:bg-zinc-950 p-2 text-[10px] text-zinc-700 dark:text-zinc-300">
                                    {afterPreview}
                                  </pre>
                                </details>
                              ) : null}
                            </div>
                          ) : (
                            <span className="text-zinc-300 dark:text-zinc-700">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-zinc-200 dark:border-zinc-850 py-10 text-center text-zinc-500 dark:text-zinc-450">
              {t('admin.audit.emptyList')}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
