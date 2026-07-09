import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';
import {
  getAdminLearningGroupsData,
} from '@/features/learning-groups/admin-queries';
import { LearningGroupsWorkspace } from './LearningGroupsWorkspace';
import { t } from '@/lib/i18n';

type AdminLearningGroupsPageProps = {
  searchParams: Promise<{
    weekday?: string;
    state?: string;
    view?: string;
  }>;
};

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
  const params = await searchParams;
  const rawView = params.view;
  const view = rawView === 'list' || rawView === 'timetable' ? rawView : 'timetable';

  const rawWeekday = params.weekday;
  const rawState = params.state;
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

        <LearningGroupsWorkspace
          view={view}
          learningGroups={data.learningGroups}
          groups={data.groups}
          leaders={data.leaders}
          defaultActiveFrom={data.currentSchoolYear?.startsOn}
          defaultActiveUntil={data.currentSchoolYear?.endsOn}
          weekdayFilter={data.weekday}
          stateFilter={data.state}
        />
      </div>
    </main>
  );
}
