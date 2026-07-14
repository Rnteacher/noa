import { Search, Users } from 'lucide-react';
import { Alert, AppHeader, Avatar, Card, EmptyState, ListRow } from '@/components/ui';
import { getStudentList } from '@/features/students/queries';
import type { TrafficLightStatus } from '@/features/students/types';
import { t } from '@/lib/i18n';

type StudentsPageProps = {
  searchParams: Promise<{
    q?: string;
  }>;
};

const STATUS_DOT_CLASS: Record<TrafficLightStatus, string> = {
  green: 'bg-status-positive',
  yellow: 'bg-status-caution',
  red: 'bg-status-critical',
};

function statusLabel(status: TrafficLightStatus) {
  if (status === 'green') {
    return t('status.positive');
  }

  if (status === 'yellow') {
    return t('status.caution');
  }

  return t('status.critical');
}

export default async function StudentsPage({ searchParams }: StudentsPageProps) {
  const { q } = await searchParams;
  const data = await getStudentList(q);

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col bg-surface">
      <AppHeader variant="large" title={t('students.title')} />
      <main className="flex-1 space-y-1.5 px-[18px] pb-4">
        <form action="/students" className="flex gap-2">
          <label className="sr-only" htmlFor="student-search">
            {t('students.search.label')}
          </label>
          <div className="chm-card-shadow flex min-w-0 flex-1 items-center gap-2 rounded-[14px] bg-surface-raised px-3.5 py-2.5 text-ink-muted">
            <Search aria-hidden="true" className="h-[17px] w-[17px] shrink-0" />
            <input
              id="student-search"
              name="q"
              type="search"
              defaultValue={data.query}
              placeholder={t('students.search.placeholder')}
              className="min-w-0 flex-1 bg-transparent text-[15px] text-ink outline-none placeholder:text-ink-muted"
            />
          </div>
          <button
            type="submit"
            className="rounded-[14px] bg-accent px-4 text-sm font-semibold text-on-accent transition-colors hover:bg-accent-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            {t('students.search.submit')}
          </button>
        </form>

        {data.error ? (
          <Alert variant="warning" title={t('students.error.title')}>
            {t(data.error)}
          </Alert>
        ) : null}

        <p className="mb-1.5 mt-2.5 px-1.5 text-[13px] font-bold text-ink-muted">
          {data.query
            ? t('students.results.searchTitle', { query: data.query })
            : t('students.results.title')}
        </p>

        <Card>
          {data.students.length > 0 ? (
            <div className="-mx-4 -my-4 divide-y divide-line">
              {data.students.map((student) => (
                <ListRow
                  key={student.id}
                  href={`/students/${student.id}`}
                  leading={<Avatar initials={student.initials} />}
                  title={student.fullName}
                  subtitle={
                    student.project
                      ? t('students.results.subtitleWithProject', {
                          group: student.groupName ?? t('students.groupUnknown'),
                          project: student.project.title,
                        })
                      : t('students.results.subtitleNoProject', {
                          group: student.groupName ?? t('students.groupUnknown'),
                        })
                  }
                  trailing={
                    student.project ? (
                      <span
                        className={`h-2.5 w-2.5 shrink-0 rounded-full ${STATUS_DOT_CLASS[student.project.status]}`}
                        role="img"
                        aria-label={statusLabel(student.project.status)}
                      />
                    ) : null
                  }
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<Users aria-hidden="true" className="h-6 w-6" />}
              title={
                data.query
                  ? t('students.empty.searchTitle')
                  : t('students.empty.title')
              }
              description={
                data.query
                  ? t('students.empty.searchDescription', { query: data.query })
                  : t('students.empty.description')
              }
              className="border-0 px-2 py-4"
            />
          )}
        </Card>
      </main>
    </div>
  );
}
