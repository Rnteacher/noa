import {
  Flag,
  Goal,
  HeartPulse,
  MessageSquareText,
  Phone,
  UserRound,
} from 'lucide-react';
import { Alert, AppHeader, Card, EmptyState, ListRow, StatusBadge } from '@/components/ui';
import type { StatusVariant } from '@/components/ui';
import { getStudentCard } from '@/features/students/queries';
import type {
  GoalStatus,
  StudentMessage,
  StudentPerson,
  TrafficLightStatus,
} from '@/features/students/types';
import { t } from '@/lib/i18n';
import { MessageComposer } from './MessageComposer';
import { DeleteMessageButton } from './DeleteMessageButton';
import { ProjectStatusForm } from './ProjectStatusForm';
import { createClient } from '@/lib/supabase/server';

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

function goalStatusLabel(status: GoalStatus) {
  return t(`students.goals.status.${status}`);
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

function MessageRow({
  message,
  currentUserId,
  canDeleteAny,
  studentId,
}: {
  message: StudentMessage;
  currentUserId: string | null;
  canDeleteAny: boolean;
  studentId: string;
}) {
  const tag = message.tags[0];
  const canDelete = canDeleteAny || (message.authorId === currentUserId && message.authorId !== null);

  return (
    <div className="rounded-xl border border-line bg-surface p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-ink">
            {message.authorName ?? t('students.messages.unknownAuthor')}
          </p>
          <p className="text-xs text-ink-muted">{formatDateTime(message.createdAt)}</p>
        </div>
        <div className="flex items-center gap-2">
          {tag ? (
            <span className="rounded-full bg-surface-sunken px-2 py-0.5 text-xs font-semibold text-ink-secondary">
              {t(`students.messages.tags.${tag}`)}
            </span>
          ) : null}
          {canDelete ? (
            <DeleteMessageButton studentId={studentId} messageId={message.id} />
          ) : null}
        </div>
      </div>
      <p className="mt-3 text-sm leading-6 text-ink-secondary">{message.body}</p>
      {message.isImportant ? (
        <p className="mt-2 text-xs font-semibold text-status-critical">
          {t('students.messages.important')}
        </p>
      ) : null}
    </div>
  );
}

export default async function StudentCardPage({ params }: StudentCardPageProps) {
  const { studentId } = await params;
  const data = await getStudentCard(studentId);

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: isSuperAdmin } = await supabase.rpc('current_user_is_super_admin');
  const currentUserId = user?.id ?? null;
  const canDeleteAny = !!isSuperAdmin;

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
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-accent-soft text-xl font-bold text-accent">
              {student.initials}
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
            {data.isFollowed ? (
              <span className="rounded-full bg-accent-soft px-2 py-1 text-xs font-semibold text-accent">
                {t('students.follow.following')}
              </span>
            ) : (
              <span className="rounded-full bg-surface-sunken px-2 py-1 text-xs font-semibold text-ink-muted">
                {t('students.follow.notFollowing')}
              </span>
            )}
          </div>

          <div className="mt-4 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
              {t('students.card.mentors')}
            </p>
            <PeopleList people={data.mentors} />
          </div>
        </Card>

        <Card title={t('students.card.contactTitle')}>
          {data.contacts.length > 0 ? (
            <div className="-mx-4 -my-4 divide-y divide-line">
              {data.contacts.map((contact) => (
                <ListRow
                  key={contact.labelKey}
                  leading={<Phone aria-hidden="true" className="h-4 w-4 text-ink-muted" />}
                  title={t(contact.labelKey)}
                  subtitle={contact.value}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<Phone aria-hidden="true" className="h-5 w-5" />}
              title={t('students.card.noContactTitle')}
              description={t('students.card.noContactDescription')}
              className="border-0 px-2 py-4"
            />
          )}
        </Card>

        <Card title={t('students.card.projectTitle')}>
          {data.project ? (
            <div className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-base font-bold text-ink">{data.project.title}</h2>
                  <p className="mt-1 text-xs text-ink-muted">
                    {t('students.card.statusSince', {
                      date: formatDateTime(data.project.statusSince),
                    })}
                  </p>
                </div>
                <StatusBadge
                  variant={statusVariant(data.project.status)}
                  label={statusLabel(data.project.status)}
                  size="sm"
                />
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">
                  {t('students.card.masters')}
                </p>
                <PeopleList people={data.project.masters} />
              </div>
              {data.project.canUpdateStatus && data.project.id ? (
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                    {t('students.projectStatus.editTitle')}
                  </p>
                  <ProjectStatusForm
                    studentId={studentId}
                    projectId={data.project.id}
                    currentStatus={data.project.status}
                  />
                </div>
              ) : null}
            </div>
          ) : (
            <EmptyState
              icon={<Flag aria-hidden="true" className="h-5 w-5" />}
              title={t('students.card.noProjectTitle')}
              description={t('students.card.noProjectDescription')}
              className="border-0 px-2 py-4"
            />
          )}
        </Card>

        <Card title={t('students.card.emotionalTitle')}>
          {data.emotionalStatus ? (
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-ink">
                  {t('students.card.emotionalStatusLabel')}
                </p>
                <p className="mt-1 text-xs text-ink-muted">
                  {t('students.card.statusSince', {
                    date: formatDateTime(data.emotionalStatus.statusSince),
                  })}
                </p>
              </div>
              <StatusBadge
                variant={statusVariant(data.emotionalStatus.status)}
                label={statusLabel(data.emotionalStatus.status)}
                size="sm"
              />
            </div>
          ) : (
            <EmptyState
              icon={<HeartPulse aria-hidden="true" className="h-5 w-5" />}
              title={t('students.card.noEmotionalTitle')}
              description={t('students.card.noEmotionalDescription')}
              className="border-0 px-2 py-4"
            />
          )}
        </Card>

        <Card title={t('students.card.goalsTitle')}>
          {data.goals.length > 0 ? (
            <div className="-mx-4 -my-4 divide-y divide-line">
              {data.goals.map((goal) => (
                <ListRow
                  key={goal.id}
                  leading={<Goal aria-hidden="true" className="h-4 w-4 text-ink-muted" />}
                  title={goal.title}
                  subtitle={goal.description ?? goalStatusLabel(goal.status)}
                  trailing={
                    <span className="rounded-full bg-surface-sunken px-2 py-0.5 text-xs font-semibold text-ink-secondary">
                      {goal.isPrimary
                        ? t('students.goals.primary')
                        : goalStatusLabel(goal.status)}
                    </span>
                  }
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<Goal aria-hidden="true" className="h-5 w-5" />}
              title={t('students.card.noGoalsTitle')}
              description={t('students.card.noGoalsDescription')}
              className="border-0 px-2 py-4"
            />
          )}
        </Card>

        <Card title={t('students.card.messagesTitle')}>
          {data.messages.length > 0 ? (
            <div className="space-y-3">
              {data.messages.map((message) => (
                <MessageRow
                  key={message.id}
                  message={message}
                  currentUserId={currentUserId}
                  canDeleteAny={canDeleteAny}
                  studentId={studentId}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<MessageSquareText aria-hidden="true" className="h-5 w-5" />}
              title={t('students.card.noMessagesTitle')}
              description={t('students.card.noMessagesDescription')}
              className="border-0 px-2 py-4"
            />
          )}
        </Card>

        <MessageComposer studentId={studentId} />

        <Alert variant="info" title={t('students.card.readOnlyTitle')}>
          {t('students.card.readOnlyDescription')}
        </Alert>
      </main>
    </div>
  );
}
