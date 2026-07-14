import { UserRound } from 'lucide-react';
import { AppHeader, Card, EmptyState } from '@/components/ui';
import { getStudentCard } from '@/features/students/queries';
import type { StudentPerson } from '@/features/students/types';
import { t } from '@/lib/i18n';
import { FollowButton } from './FollowButton';
import { PhotoUploadForm } from './PhotoUploadForm';
import { StudentCardTabs } from './StudentCardTabs';

type StudentCardPageProps = {
  params: Promise<{
    studentId: string;
  }>;
};

const dateTimeFormatter = new Intl.DateTimeFormat('he-IL', {
  day: 'numeric',
  month: 'numeric',
  year: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
});

function formatDateTime(value: string | null) {
  if (!value) {
    return t('students.card.dateUnknown');
  }

  return dateTimeFormatter.format(new Date(value));
}

function PeopleList({ people }: { people: StudentPerson[] }) {
  if (people.length === 0) {
    return <p className="text-sm text-ink-muted">{t('students.card.noneListed')}</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {people.map((person) => (
        <span
          key={person.id}
          className="rounded-full bg-surface-sunken px-3 py-1 text-xs font-semibold text-ink-secondary"
        >
          {person.fullName}
          {person.isPrimary ? ` - ${t('students.card.primary')}` : ''}
        </span>
      ))}
    </div>
  );
}

export default async function StudentCardPage({ params }: StudentCardPageProps) {
  const { studentId } = await params;
  const data = await getStudentCard(studentId);

  if (data.error || !data.student) {
    return (
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col bg-surface">
        <AppHeader title={t('students.card.title')} backHref="/students" />
        <main className="flex-1 p-4">
          <EmptyState
            icon={<UserRound aria-hidden="true" className="h-6 w-6" />}
            title={t('students.card.notFoundTitle')}
            description={t(data.error ?? 'students.card.notFoundDescription')}
          />
        </main>
      </div>
    );
  }

  const { student } = data;

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col bg-surface">
      <AppHeader title={student.fullName} backHref="/students" />
      <main className="flex-1 space-y-4 p-4">
        <Card>
          <div className="flex items-start gap-4">
            <div className="flex flex-col items-center shrink-0">
              <div className="flex h-16 w-16 items-center justify-center rounded-full overflow-hidden bg-accent-soft text-xl font-bold text-accent">
                {student.photoUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={student.photoUrl}
                    alt={student.fullName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  student.initials
                )}
              </div>
              {data.canManagePhoto ? (
                <PhotoUploadForm studentId={studentId} hasPhoto={!!student.photoUrl} />
              ) : null}
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl font-bold text-ink">{student.fullName}</h1>
              <p className="mt-1 text-sm text-ink-secondary">
                {student.groupName ?? t('students.groupUnknown')}
              </p>
              {student.groupLayer ? (
                <p className="mt-0.5 text-xs text-ink-muted">{student.groupLayer}</p>
              ) : null}
              <p className="mt-3 text-xs text-ink-muted">
                {t('students.card.updatedAt', {
                  date: formatDateTime(student.updatedAt),
                })}
              </p>
            </div>
            <FollowButton studentId={studentId} isFollowed={data.isFollowed} />
          </div>

          <div className="mt-4 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
              {t('students.card.mentors')}
            </p>
            <PeopleList people={data.mentors} />
          </div>
        </Card>

        <StudentCardTabs studentId={studentId} data={data} />
      </main>
    </div>
  );
}
