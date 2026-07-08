import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';
import {
  getAdminLearningGroupsData,
} from '@/features/learning-groups/admin-queries';
import {
  LEARNING_GROUP_WEEKDAYS,
  type LearningGroupStateFilter,
  type LearningGroupWeekday,
} from '@/features/learning-groups/types';
import { cn } from '@/lib/cn';
import { t } from '@/lib/i18n';
import { LearningGroupForm } from './LearningGroupForm';
import { LearningGroupRow } from './LearningGroupRow';

type AdminLearningGroupsPageProps = {
  searchParams: Promise<{
    weekday?: string;
    state?: string;
  }>;
};

const STATE_OPTIONS: LearningGroupStateFilter[] = ['active', 'inactive', 'all'];

function buildFilterHref(weekday: LearningGroupWeekday | 'all', state: LearningGroupStateFilter) {
  const params = new URLSearchParams();
  if (weekday !== 'all') {
    params.set('weekday', weekday);
  }
  if (state !== 'active') {
    params.set('state', state);
  }

  const query = params.toString();
  return query ? `/admin/learning-groups?${query}` : '/admin/learning-groups';
}

function ForbiddenState() {
  return (
    <main className="min-h-screen bg-zinc-100 px-4 py-8 dark:bg-zinc-950">
      <section className="mx-auto max-w-md rounded-2xl border border-zinc-200 bg-white p-6 text-center shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-rose-600 text-white">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <h1 className="text-xl font-bold text-zinc-950 dark:text-zinc-50">
          {t('admin.accessGrants.forbiddenTitle')}
        </h1>
        <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
          {t('admin.learningGroups.errorForbidden')}
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

export default async function AdminLearningGroupsPage({
  searchParams,
}: AdminLearningGroupsPageProps) {
  const { weekday: rawWeekday, state: rawState } = await searchParams;
  const data = await getAdminLearningGroupsData(rawWeekday, rawState);

  if (!data.isAuthorized) {
    return <ForbiddenState />;
  }

  return (
    <main className="p-4 md:p-6 lg:p-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
              {t('nav.admin')}
            </p>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
              {t('admin.learningGroups.title')}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600 dark:text-zinc-400">
              {t('admin.learningGroups.description')}
            </p>
          </div>
        </header>

        {data.error ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm font-semibold text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/20 dark:text-rose-300">
            {t(data.error)}
          </div>
        ) : null}

        <div className="grid items-start gap-6 lg:grid-cols-[1fr_380px]">
          <section className="min-w-0 space-y-4 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <h2 className="text-base font-bold text-zinc-950 dark:text-zinc-50">
                {t('admin.learningGroups.listTitle')}
              </h2>
              <div className="flex flex-wrap gap-2">
                <nav
                  className="flex gap-1 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-850"
                  aria-label={t('admin.learningGroups.weekdayFilterLabel')}
                >
                  {(['all', ...LEARNING_GROUP_WEEKDAYS] as Array<LearningGroupWeekday | 'all'>).map(
                    (option) => (
                      <Link
                        key={option}
                        href={buildFilterHref(option, data.state)}
                        className={cn(
                          'rounded-md px-2.5 py-1 text-xs font-semibold transition-colors',
                          data.weekday === option
                            ? 'bg-white text-emerald-700 shadow-sm dark:bg-zinc-950 dark:text-emerald-400'
                            : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
                        )}
                      >
                        {option === 'all'
                          ? t('admin.learningGroups.weekday_all')
                          : t(`admin.learningGroups.weekday_${option}`)}
                      </Link>
                    )
                  )}
                </nav>
                <nav
                  className="flex gap-1 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-850"
                  aria-label={t('admin.learningGroups.stateFilterLabel')}
                >
                  {STATE_OPTIONS.map((option) => (
                    <Link
                      key={option}
                      href={buildFilterHref(data.weekday, option)}
                      className={cn(
                        'rounded-md px-2.5 py-1 text-xs font-semibold transition-colors',
                        data.state === option
                          ? 'bg-white text-emerald-700 shadow-sm dark:bg-zinc-950 dark:text-emerald-400'
                          : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
                      )}
                    >
                      {t(`admin.learningGroups.state_${option}`)}
                    </Link>
                  ))}
                </nav>
              </div>
            </div>

            {data.learningGroups.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-start text-xs">
                  <thead>
                    <tr className="border-b border-zinc-100 font-semibold text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                      <th className="px-2 py-2.5 text-start">{t('admin.learningGroups.colTitle')}</th>
                      <th className="px-2 py-2.5 text-start">
                        {t('admin.learningGroups.colWeekday')}
                      </th>
                      <th className="px-2 py-2.5 text-start">{t('admin.learningGroups.colTime')}</th>
                      <th className="px-2 py-2.5 text-start">
                        {t('admin.learningGroups.colLeader')}
                      </th>
                      <th className="px-2 py-2.5 text-start">{t('admin.learningGroups.colRoom')}</th>
                      <th className="px-2 py-2.5 text-start">
                        {t('admin.learningGroups.colGroups')}
                      </th>
                      <th className="w-20 px-2 py-2.5 text-center">
                        {t('admin.learningGroups.colState')}
                      </th>
                      <th className="w-20 px-2 py-2.5 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
                    {data.learningGroups.map((learningGroup) => (
                      <LearningGroupRow
                        key={learningGroup.id}
                        learningGroup={learningGroup}
                        groups={data.groups}
                        leaders={data.leaders}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-zinc-200 py-10 text-center text-zinc-500 dark:border-zinc-850 dark:text-zinc-450">
                {t('admin.learningGroups.emptyList')}
              </div>
            )}
          </section>

          <aside className="sticky top-6">
            <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              <h2 className="mb-4 text-lg font-bold text-zinc-950 dark:text-zinc-50">
                {t('admin.learningGroups.createTitle')}
              </h2>
              <LearningGroupForm
                groups={data.groups}
                leaders={data.leaders}
                mode="create"
                defaultActiveFrom={data.currentSchoolYear?.startsOn}
                defaultActiveUntil={data.currentSchoolYear?.endsOn}
              />
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
