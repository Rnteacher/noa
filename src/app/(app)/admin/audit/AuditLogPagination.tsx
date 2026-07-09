'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { t } from '@/lib/i18n';

type AuditLogPaginationProps = {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  hasPrevious: boolean;
  hasNext: boolean;
};

export function AuditLogPagination({
  currentPage,
  totalPages,
  pageSize,
  hasPrevious,
  hasNext,
}: AuditLogPaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function updateParams(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set(key, value);
    router.push(`/admin/audit?${params.toString()}`);
  }

  function handlePrev() {
    if (hasPrevious) {
      updateParams('page', String(currentPage - 1));
    }
  }

  function handleNext() {
    if (hasNext) {
      updateParams('page', String(currentPage + 1));
    }
  }

  function handlePageSizeChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('pageSize', e.target.value);
    params.delete('page'); // Reset to page 1
    router.push(`/admin/audit?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-t border-zinc-100 pt-4 dark:border-zinc-800">
      <div className="flex items-center gap-2">
        <label htmlFor="audit-page-size" className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
          {t('admin.audit.pageSizeLabel')}
        </label>
        <select
          id="audit-page-size"
          value={pageSize}
          onChange={handlePageSizeChange}
          className="h-8 rounded-lg border border-zinc-200 bg-white px-2 text-xs text-zinc-950 outline-none focus:border-emerald-600 dark:border-zinc-750 dark:bg-zinc-950 dark:text-zinc-50"
        >
          <option value="25">25</option>
          <option value="50">50</option>
          <option value="100">100</option>
        </select>
      </div>

      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={handlePrev}
          disabled={!hasPrevious}
          className="h-9 rounded-lg border border-zinc-200 px-3 text-xs font-semibold text-zinc-650 hover:bg-zinc-50 disabled:opacity-50 disabled:hover:bg-transparent dark:border-zinc-750 dark:text-zinc-350 dark:hover:bg-zinc-850"
        >
          {t('admin.audit.paginationPrev')}
        </button>

        <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
          {t('admin.audit.paginationInfo')
            .replace('{current}', String(currentPage))
            .replace('{total}', String(Math.max(1, totalPages)))}
        </span>

        <button
          type="button"
          onClick={handleNext}
          disabled={!hasNext}
          className="h-9 rounded-lg border border-zinc-200 px-3 text-xs font-semibold text-zinc-650 hover:bg-zinc-50 disabled:opacity-50 disabled:hover:bg-transparent dark:border-zinc-750 dark:text-zinc-350 dark:hover:bg-zinc-850"
        >
          {t('admin.audit.paginationNext')}
        </button>
      </div>
    </div>
  );
}
