'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { t } from '@/lib/i18n';

type AuditLogFiltersProps = {
  actionOptions: string[];
  entityTypeOptions: string[];
  actorOptions: Array<{ id: string; fullName: string; email: string }>;
  filters: {
    action?: string;
    entityType?: string;
    actorId?: string;
    fromDate?: string;
    toDate?: string;
  };
};

export function AuditLogFilters({
  actionOptions,
  entityTypeOptions,
  actorOptions,
  filters,
}: AuditLogFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const params = new URLSearchParams(searchParams.toString());

    // Reset to page 1 when filters change
    params.delete('page');

    const action = formData.get('action') as string;
    if (action) params.set('action', action);
    else params.delete('action');

    const entityType = formData.get('entityType') as string;
    if (entityType) params.set('entityType', entityType);
    else params.delete('entityType');

    const actorId = formData.get('actorId') as string;
    if (actorId) params.set('actorId', actorId);
    else params.delete('actorId');

    const fromDate = formData.get('fromDate') as string;
    if (fromDate) params.set('fromDate', fromDate);
    else params.delete('fromDate');

    const toDate = formData.get('toDate') as string;
    if (toDate) params.set('toDate', toDate);
    else params.delete('toDate');

    router.push(`/admin/audit?${params.toString()}`);
  }

  function handleClear() {
    const params = new URLSearchParams();
    const pageSize = searchParams.get('pageSize');
    if (pageSize) params.set('pageSize', pageSize);
    router.push(`/admin/audit?${params.toString()}`);
  }

  function handleExport() {
    const params = new URLSearchParams(searchParams.toString());
    window.location.href = `/api/admin/audit/export?${params.toString()}`;
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3 border-b border-surface-sunken pb-4 dark:border-ink-secondary">
      <div className="space-y-1">
        <label htmlFor="audit-action" className="block text-xs font-semibold text-ink-muted dark:text-ink-muted">
          {t('admin.audit.filterActionLabel')}
        </label>
        <select
          id="audit-action"
          name="action"
          defaultValue={filters.action ?? ''}
          className="h-10 min-w-[10rem] rounded-xl border border-line bg-white px-3 text-sm text-ink outline-none transition-colors focus:border-accent dark:border-ink-secondary dark:bg-ink dark:text-surface"
        >
          <option value="">{t('admin.audit.filterAllActions')}</option>
          {actionOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label htmlFor="audit-entity-type" className="block text-xs font-semibold text-ink-muted dark:text-ink-muted">
          {t('admin.audit.filterEntityTypeLabel')}
        </label>
        <select
          id="audit-entity-type"
          name="entityType"
          defaultValue={filters.entityType ?? ''}
          className="h-10 min-w-[10rem] rounded-xl border border-line bg-white px-3 text-sm text-ink outline-none transition-colors focus:border-accent dark:border-ink-secondary dark:bg-ink dark:text-surface"
        >
          <option value="">{t('admin.audit.filterAllEntityTypes')}</option>
          {entityTypeOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label htmlFor="audit-actor" className="block text-xs font-semibold text-ink-muted dark:text-ink-muted">
          {t('admin.audit.filterActorLabel')}
        </label>
        <select
          id="audit-actor"
          name="actorId"
          defaultValue={filters.actorId ?? ''}
          className="h-10 min-w-[12rem] max-w-[16rem] rounded-xl border border-line bg-white px-3 text-sm text-ink outline-none transition-colors focus:border-accent dark:border-ink-secondary dark:bg-ink dark:text-surface"
        >
          <option value="">{t('admin.audit.filterAllActors')}</option>
          {actorOptions.map((actor) => (
            <option key={actor.id} value={actor.id}>
              {actor.fullName} ({actor.email})
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1">
        <label htmlFor="audit-from-date" className="block text-xs font-semibold text-ink-muted dark:text-ink-muted">
          {t('admin.audit.filterFromDateLabel')}
        </label>
        <input
          id="audit-from-date"
          type="date"
          name="fromDate"
          defaultValue={filters.fromDate ?? ''}
          className="h-10 rounded-xl border border-line bg-white px-3 text-sm text-ink outline-none transition-colors focus:border-accent dark:border-ink-secondary dark:bg-ink dark:text-surface"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="audit-to-date" className="block text-xs font-semibold text-ink-muted dark:text-ink-muted">
          {t('admin.audit.filterToDateLabel')}
        </label>
        <input
          id="audit-to-date"
          type="date"
          name="toDate"
          defaultValue={filters.toDate ?? ''}
          className="h-10 rounded-xl border border-line bg-white px-3 text-sm text-ink outline-none transition-colors focus:border-accent dark:border-ink-secondary dark:bg-ink dark:text-surface"
        />
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          className="h-10 rounded-xl bg-accent px-4 text-sm font-bold text-white transition-colors hover:bg-accent-strong"
        >
          {t('admin.audit.filterSubmit')}
        </button>

        {filters.action || filters.entityType || filters.actorId || filters.fromDate || filters.toDate ? (
          <button
            type="button"
            onClick={handleClear}
            className="h-10 rounded-xl border border-line px-4 text-sm font-semibold text-ink-secondary hover:bg-surface dark:border-ink-secondary dark:text-ink-muted dark:hover:bg-ink"
          >
            {t('admin.audit.filterClear')}
          </button>
        ) : null}

        <button
          type="button"
          onClick={handleExport}
          className="h-10 rounded-xl border border-accent-soft bg-accent-soft px-4 text-sm font-bold text-accent-strong transition-colors hover:bg-accent-soft dark:border-accent-soft/30 dark:bg-accent-soft/20 dark:text-accent-strong dark:hover:bg-accent-soft/40"
        >
          {t('admin.audit.exportButton')}
        </button>
      </div>
    </form>
  );
}
