import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { ImportExportPanel } from './ImportExportPanel';
import { t } from '@/lib/i18n';

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
          {t('admin.calendar.errorForbidden')}
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

export default async function AdminImportExportPage() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return <ForbiddenState />;
  }

  const { data: isManagerOrSuperAdmin, error: permissionError } = await supabase.rpc(
    'current_user_is_manager_or_super_admin'
  );

  if (permissionError || !isManagerOrSuperAdmin) {
    return <ForbiddenState />;
  }

  // Fetch groups to map names to IDs in CSV import
  const { data: groups } = await supabase
    .from('student_groups')
    .select('id, name')
    .eq('is_active', true)
    .order('name');

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .eq('is_active', true)
    .order('full_name');

  const { data: years } = await supabase
    .from('school_years')
    .select('id, name, is_current')
    .order('name', { ascending: false });

  const schoolYears = (years ?? []).map((y) => ({
    id: y.id,
    name: y.name,
    isCurrent: y.is_current,
  }));

  const { isGoogleCalendarSyncConfigured } = await import('@/lib/google/calendar-client');
  const isSyncConfigured = isGoogleCalendarSyncConfigured();

  return (
    <main className="p-4 md:p-6 lg:p-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header>
          <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
            {t('nav.admin')}
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
            {t('admin.nav.importExport')}
          </h1>
          <p className="mt-2 text-sm leading-6 text-zinc-650 dark:text-zinc-400">
            Bulk validation, ingestion, and export center for school planning rosters.
          </p>
        </header>

        <ImportExportPanel
          groups={groups ?? []}
          profiles={profiles ?? []}
          isSyncConfigured={isSyncConfigured}
          schoolYears={schoolYears}
        />
      </div>
    </main>
  );
}
