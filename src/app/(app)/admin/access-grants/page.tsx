import Link from 'next/link';
import { ShieldAlert, UserPlus } from 'lucide-react';
import { createAccessGrantAction, updateAccessGrantAction } from '@/lib/admin/access-grants';
import { APP_ROLES } from '@/lib/auth/roles';
import { t } from '@/lib/i18n';
import { createClient } from '@/lib/supabase/server';
import type { AppRole } from '@/lib/auth/access';

type GrantRow = {
  id: string;
  email: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  staff_access_grant_roles: { role: AppRole }[] | null;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat('he-IL', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}

function RoleCheckboxes({ selectedRoles }: { selectedRoles?: AppRole[] }) {
  const selected = new Set(selectedRoles || []);

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {APP_ROLES.map((role) => (
        <label
          key={role}
          className="flex items-center gap-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-zinc-700 dark:text-zinc-200"
        >
          <input
            name="roles"
            type="checkbox"
            value={role}
            defaultChecked={selected.has(role)}
            className="h-4 w-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-600"
          />
          <span>{t(`admin.accessGrants.roles.${role}`)}</span>
        </label>
      ))}
    </div>
  );
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

function GrantForm({ grant }: { grant: GrantRow }) {
  const selectedRoles = (grant.staff_access_grant_roles || []).map((row) => row.role);

  return (
    <form
      action={updateAccessGrantAction}
      className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-sm"
    >
      <input type="hidden" name="grant_id" value={grant.id} />
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="space-y-1">
          <h2 className="text-base font-bold text-zinc-950 dark:text-zinc-50">
            {grant.email}
          </h2>
          <div className="flex flex-wrap gap-2 text-xs text-zinc-500 dark:text-zinc-400">
            <span>{t('admin.accessGrants.createdAt')}: {formatDate(grant.created_at)}</span>
            <span>{t('admin.accessGrants.updatedAt')}: {formatDate(grant.updated_at)}</span>
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-200">
          <input
            name="is_active"
            type="checkbox"
            defaultChecked={grant.is_active}
            className="h-4 w-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-600"
          />
          {t('admin.accessGrants.active')}
        </label>
      </div>

      <div className="mt-4">
        <RoleCheckboxes selectedRoles={selectedRoles} />
      </div>

      <div className="mt-4 flex justify-end">
        <button
          type="submit"
          className="h-10 rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white transition-colors hover:bg-emerald-700"
        >
          {t('admin.accessGrants.saveGrant')}
        </button>
      </div>
    </form>
  );
}

export default async function AccessGrantsPage() {
  const supabase = await createClient();
  const { data: isSuperAdmin } = await supabase.rpc('current_user_is_super_admin');

  if (!isSuperAdmin) {
    return <ForbiddenState />;
  }

  const { data: grants, error } = await supabase
    .from('staff_access_grants')
    .select('id, email, is_active, created_at, updated_at, staff_access_grant_roles(role)')
    .order('email', { ascending: true });

  if (error) {
    throw error;
  }

  return (
    <main className="p-4 md:p-6 lg:p-8">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
              {t('nav.admin')}
            </p>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
              {t('admin.accessGrants.title')}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              {t('admin.accessGrants.description')}
            </p>
          </div>
          <Link
            href="/dashboard"
            className="inline-flex h-10 items-center justify-center rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 text-sm font-bold text-zinc-700 dark:text-zinc-200 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800"
          >
            {t('admin.accessGrants.backToDashboard')}
          </Link>
        </header>

        <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-600 text-white">
              <UserPlus className="h-5 w-5" />
            </div>
            <h2 className="text-lg font-bold text-zinc-950 dark:text-zinc-50">
              {t('admin.accessGrants.createTitle')}
            </h2>
          </div>

          <form action={createAccessGrantAction} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
              <label className="block">
                <span className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-200">
                  {t('admin.accessGrants.email')}
                </span>
                <input
                  name="email"
                  type="email"
                  required
                  placeholder={t('admin.accessGrants.emailPlaceholder')}
                  className="h-11 w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 text-sm text-zinc-950 dark:text-zinc-50 outline-none transition-colors focus:border-emerald-600"
                />
              </label>
              <label className="flex h-11 items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-200">
                <input
                  name="is_active"
                  type="checkbox"
                  defaultChecked
                  className="h-4 w-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-600"
                />
                {t('admin.accessGrants.active')}
              </label>
            </div>

            <RoleCheckboxes selectedRoles={['staff']} />

            <div className="flex justify-end">
              <button
                type="submit"
                className="h-10 rounded-xl bg-emerald-600 px-4 text-sm font-bold text-white transition-colors hover:bg-emerald-700"
              >
                {t('admin.accessGrants.createGrant')}
              </button>
            </div>
          </form>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-zinc-950 dark:text-zinc-50">
              {t('admin.accessGrants.existingTitle')}
            </h2>
            <span className="rounded-full bg-zinc-200 dark:bg-zinc-800 px-3 py-1 text-xs font-bold text-zinc-600 dark:text-zinc-300">
              {grants?.length || 0}
            </span>
          </div>

          {grants && grants.length > 0 ? (
            <div className="space-y-3">
              {(grants as GrantRow[]).map((grant) => (
                <GrantForm key={grant.id} grant={grant} />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 p-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
              {t('admin.accessGrants.empty')}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
