import { Search, Users } from 'lucide-react';
import { Alert, AppHeader, Card, EmptyState, ListRow, StatusBadge } from '@/components/ui';
import { getStudentList } from '@/features/students/queries';
import type { TrafficLightStatus } from '@/features/students/types';
import type { StatusVariant } from '@/components/ui';
import { t } from '@/lib/i18n';

type StudentsPageProps = {
  searchParams: Promise<{
    q?: string;
  }>;
};

function statusVariant(status: TrafficLightStatus): StatusVariant {
  if (status === 'green') {
    return 'positive';
  }

  if (status === 'yellow') {
    return 'caution';
  }

  return 'critical';
}

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
      <AppHeader title={t('students.title')} />
      <main className="flex-1 space-y-4 p-4">
        <form action="/students" className="flex gap-2">
          <label className="sr-only" htmlFor="student-search">
            {t('students.search.label')}
          </label>
          <div className="relative min-w-0 flex-1">
            <Search
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 end-3 h-4 w-4 -translate-y-1/2 text-ink-muted"
            />
            <input
              id="student-search"
              name="q"
              type="search"
              defaultValue={data.query}
              placeholder={t('students.search.placeholder')}
              className="h-11 w-full rounded-xl border border-line bg-surface-raised pe-9 ps-3 text-sm text-ink outline-none transition-colors placeholder:text-ink-muted focus:border-accent focus:ring-2 focus:ring-accent/20"
            />
          </div>
          <button
            type="submit"
            className="h-11 rounded-xl bg-accent px-4 text-sm font-semibold text-on-accent transition-colors hover:bg-accent-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            {t('students.search.submit')}
          </button>
        </form>

        {data.error ? (
          <Alert variant="warning" title={t('students.error.title')}>
            {t(data.error)}
          </Alert>
        ) : null}

        <Card
          title={
            data.query
              ? t('students.results.searchTitle', { query: data.query })
              : t('students.results.title')
          }
          description={t('students.results.description')}
        >
          {data.students.length > 0 ? (
            <div className="-mx-4 -my-4 divide-y divide-line">
              {data.students.map((student) => (
                <ListRow
                  key={student.id}
                  href={`/students/${student.id}`}
                  leading={
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-accent-soft text-sm font-bold text-accent">
                      {student.initials}
                    </span>
                  }
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
                      <StatusBadge
                        variant={statusVariant(student.project.status)}
                        label={statusLabel(student.project.status)}
                        hideLabel
                        size="sm"
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
