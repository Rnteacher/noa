import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';
import { getAdminAuditLogs } from '@/features/admin/audit-queries';
import { AuditLogFilters } from './AuditLogFilters';
import { AuditLogPagination } from './AuditLogPagination';
import { t } from '@/lib/i18n';

type AdminAuditPageProps = {
  searchParams: Promise<{
    action?: string;
    entityType?: string;
    actorId?: string;
    fromDate?: string;
    toDate?: string;
    page?: string;
    pageSize?: string;
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
    <main className="min-h-screen bg-surface-sunken dark:bg-ink px-4 py-8">
      <section className="mx-auto max-w-md rounded-2xl border border-line dark:border-ink-secondary bg-white dark:bg-ink p-6 text-center shadow-xl">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-rose-600 text-white">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <h1 className="text-xl font-bold text-ink dark:text-surface">
          {t('admin.accessGrants.forbiddenTitle')}
        </h1>
        <p className="mt-2 text-sm leading-6 text-ink-secondary dark:text-ink-muted">
          {t('admin.audit.errorForbidden')}
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

export default async function AdminAuditPage({ searchParams }: AdminAuditPageProps) {
  const params = await searchParams;
  const data = await getAdminAuditLogs({
    action: params.action,
    entityType: params.entityType,
    actorId: params.actorId,
    fromDate: params.fromDate,
    toDate: params.toDate,
    page: params.page ? Number(params.page) : undefined,
    pageSize: params.pageSize ? Number(params.pageSize) : undefined,
  });

  if (!data.isAuthorized) {
    return <ForbiddenState />;
  }

  return (
    <main className="p-4 md:p-6 lg:p-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <header>
          <p className="text-sm font-semibold text-accent-strong dark:text-accent-strong">
            {t('nav.admin')}
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-ink dark:text-surface">
            {t('admin.audit.title')}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-secondary dark:text-ink-muted">
            {t('admin.audit.description')}
          </p>
        </header>

        <section className="space-y-4 rounded-2xl border border-line dark:border-ink-secondary bg-white dark:bg-ink p-4 shadow-sm">
          <AuditLogFilters
            actionOptions={data.actionOptions}
            entityTypeOptions={data.entityTypeOptions}
            actorOptions={data.actorOptions}
            filters={data.filters}
          />

          {data.logs.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-start text-xs border-collapse">
                <thead>
                  <tr className="border-b border-surface-sunken dark:border-ink-secondary text-ink-muted dark:text-ink-muted font-semibold">
                    <th className="py-2.5 px-2 text-start">{t('admin.audit.colDate')}</th>
                    <th className="py-2.5 px-2 text-start">{t('admin.audit.colActor')}</th>
                    <th className="py-2.5 px-2 text-start">{t('admin.audit.colAction')}</th>
                    <th className="py-2.5 px-2 text-start">{t('admin.audit.colEntity')}</th>
                    <th className="py-2.5 px-2 text-start">{t('admin.audit.colDetails')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-sunken dark:divide-ink-secondary/50">
                  {data.logs.map((log) => {
                    const beforePreview = formatJsonPreview(log.beforeData);
                    const afterPreview = formatJsonPreview(log.afterData);

                    return (
                      <tr key={log.id} className="align-top hover:bg-surface/50 dark:hover:bg-ink/30">
                        <td className="py-3 px-2 whitespace-nowrap text-ink-secondary dark:text-ink-muted">
                          {formatDateTime(log.createdAt)}
                        </td>
                        <td className="py-3 px-2 text-ink-secondary dark:text-ink-muted">
                          <div className="font-semibold">{log.actorName ?? t('admin.audit.unknownActor')}</div>
                          {log.actorEmail ? (
                            <div className="mt-0.5 text-[10px] text-ink-muted dark:text-ink-muted select-all">
                              {log.actorEmail}
                            </div>
                          ) : null}
                        </td>
                        <td className="py-3 px-2 font-mono text-[11px] font-semibold text-ink dark:text-surface-sunken">
                          {log.action}
                        </td>
                        <td className="py-3 px-2 text-ink-secondary dark:text-ink-muted">
                          <div className="font-mono text-[11px]">{log.entityType}</div>
                          {log.entityId ? (
                            <div className="mt-0.5 max-w-[140px] truncate font-mono text-[10px] text-ink-muted dark:text-ink-muted select-all">
                              {log.entityId}
                            </div>
                          ) : null}
                        </td>
                        <td className="py-3 px-2">
                          {beforePreview || afterPreview ? (
                            <div className="space-y-1">
                              {beforePreview ? (
                                <details>
                                  <summary className="cursor-pointer text-[11px] font-semibold text-ink-muted dark:text-ink-muted select-none">
                                    {t('admin.audit.beforeLabel')}
                                  </summary>
                                  <pre className="mt-1 max-w-md overflow-x-auto rounded-lg bg-surface dark:bg-ink p-2 text-[10px] text-ink-secondary dark:text-line">
                                    {beforePreview}
                                  </pre>
                                </details>
                              ) : null}
                              {afterPreview ? (
                                <details>
                                  <summary className="cursor-pointer text-[11px] font-semibold text-ink-muted dark:text-ink-muted select-none">
                                    {t('admin.audit.afterLabel')}
                                  </summary>
                                  <pre className="mt-1 max-w-md overflow-x-auto rounded-lg bg-surface dark:bg-ink p-2 text-[10px] text-ink-secondary dark:text-line">
                                    {afterPreview}
                                  </pre>
                                </details>
                              ) : null}
                            </div>
                          ) : (
                            <span className="text-line dark:text-ink-secondary">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-line dark:border-ink py-10 text-center text-ink-muted dark:text-ink-muted">
              {t('admin.audit.emptyList')}
            </div>
          )}

          <AuditLogPagination
            currentPage={data.currentPage}
            totalPages={data.totalPages}
            pageSize={data.pageSize}
            hasPrevious={data.hasPrevious}
            hasNext={data.hasNext}
          />
        </section>
      </div>
    </main>
  );
}
