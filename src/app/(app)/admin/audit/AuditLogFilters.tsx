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
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3 border-b border-zinc-100 pb-4 dark:border-zinc-800">
      <div className="space-y-1">
        <label htmlFor="audit-action" className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400">
          {t('admin.audit.filterActionLabel')}
        </label>
        <select
          id="audit-action"
          name="action"
          defaultValue={filters.action ?? ''}
          className="h-10 min-w-[10rem] rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-950 outline-none transition-colors focus:border-emerald-600 dark:border-zinc-750 dark:bg-zinc-950 dark:text-zinc-50"
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
        <label htmlFor="audit-entity-type" className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400">
          {t('admin.audit.filterEntityTypeLabel')}
        </label>
        <select
          id="audit-entity-type"
          name="entityType"
          defaultValue={filters.entityType ?? ''}
          className="h-10 min-w-[10rem] rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-950 outline-none transition-colors focus:border-emerald-600 dark:border-zinc-750 dark:bg-zinc-950 dark:text-zinc-50"
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
        <label htmlFor="audit-actor" className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400">
          {t('admin.audit.filterActorLabel')}
        </label>
        <select
          id="audit-actor"
          name="actorId"
          defaultValue={filters.actorId ?? ''}
          className="h-10 min-w-[12rem] max-w-[16rem] rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-950 outline-none transition-colors focus:border-emerald-600 dark:border-zinc-750 dark:bg-zinc-950 dark:text-zinc-50"
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
        <label htmlFor="audit-from-date" className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400">
          {t('admin.audit.filterFromDateLabel')}
        </label>
        <input
          id="audit-from-date"
          type="date"
          name="fromDate"
          defaultValue={filters.fromDate ?? ''}
          className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-950 outline-none transition-colors focus:border-emerald-600 dark:border-zinc-750 dark:bg-zinc-950 dark:text-zinc-50"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="audit-to-date" className="block text-xs font-semibold text-zinc-500 dark:text-zinc-400">
          {t('admin.audit.filterToDateLabel')}
        </label>
        <input
          id="audit-to-date"
          type="date"
          name="toDate"
          defaultValue={filters.toDate ?? ''}
          className="h-10 rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-950 outline-none transition-colors focus:border-emerald-600 dark:border-zinc-750 dark:bg-zinc-950 dark:text-zinc-50"
        />
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          className="h-10 rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white transition-colors hover:bg-emerald-700"
        >
          {t('admin.audit.filterSubmit')}
        </button>

        {filters.action || filters.entityType || filters.actorId || filters.fromDate || filters.toDate ? (
          <button
            type="button"
            onClick={handleClear}
            className="h-10 rounded-xl border border-zinc-200 px-4 text-sm font-semibold text-zinc-600 hover:bg-zinc-50 dark:border-zinc-750 dark:text-zinc-450 dark:hover:bg-zinc-850"
          >
            {t('admin.audit.filterClear')}
          </button>
        ) : null}

        <button
          type="button"
          onClick={handleExport}
          className="h-10 rounded-xl border border-emerald-250 bg-emerald-50 px-4 text-sm font-bold text-emerald-700 transition-colors hover:bg-emerald-100 dark:border-emerald-900/30 dark:bg-emerald-950/20 dark:text-emerald-400 dark:hover:bg-emerald-955/40"
        >
          {t('admin.audit.exportButton')}
        </button>
      </div>
    </form>
  );
}
