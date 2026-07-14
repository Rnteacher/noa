'use client';

import { useState } from 'react';
import { Flag, Goal, HeartPulse, MessageSquareText, Phone } from 'lucide-react';
import { Alert, Card, EmptyState, ListRow, StatusBadge } from '@/components/ui';
import type { StatusVariant } from '@/components/ui';
import type {
  StudentCardData,
  GoalStatus,
  StudentMessage,
  StudentPerson,
  TrafficLightStatus,
} from '@/features/students/types';
import { t } from '@/lib/i18n';
import { MessageComposer } from './MessageComposer';
import { DeleteMessageButton } from './DeleteMessageButton';
import { MessageEditForm } from './MessageEditForm';
import { ProjectStatusForm } from './ProjectStatusForm';
import { EmotionalStatusForm } from './EmotionalStatusForm';
import { GoalForm } from './GoalForm';
import { GoalStatusForm } from './GoalStatusForm';
import { GoalDetailsForm } from './GoalDetailsForm';
import { DeleteGoalButton } from './DeleteGoalButton';
import { SetPrimaryGoalButton } from './SetPrimaryGoalButton';

type TabId = 'overview' | 'goals' | 'edit';

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
  canEditAny,
  studentId,
}: {
  message: StudentMessage;
  currentUserId: string | null;
  canDeleteAny: boolean;
  canEditAny: boolean;
  studentId: string;
}) {
  const tag = message.tags[0] ?? null;
  const isOwnMessage = message.authorId === currentUserId && message.authorId !== null;
  const canDelete = canDeleteAny || isOwnMessage;
  const canEdit = canEditAny || isOwnMessage;

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
      {canEdit ? (
        <MessageEditForm
          studentId={studentId}
          messageId={message.id}
          currentBody={message.body}
          currentTag={tag}
          currentIsImportant={message.isImportant}
        />
      ) : null}
    </div>
  );
}

function TabButton({
  isActive,
  onClick,
  children,
}: {
  isActive: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={isActive}
      className={`flex-1 rounded-[12px] px-3 py-2 text-[13.5px] font-bold transition-colors ${
        isActive
          ? 'bg-accent text-on-accent'
          : 'text-ink-secondary hover:bg-surface-sunken'
      }`}
    >
      {children}
    </button>
  );
}

export function StudentCardTabs({
  studentId,
  data,
}: {
  studentId: string;
  data: StudentCardData;
}) {
  const [tab, setTab] = useState<TabId>('overview');
  const currentUserId = data.currentUserId;
  const canDeleteAny = data.canDeleteAny;
  const hasEditAccess =
    Boolean(data.project?.canUpdateStatus) || data.canUpdateEmotionalStatus || data.canManageGoals;

  return (
    <>
      <div className="chm-card-shadow flex gap-1 rounded-[16px] bg-surface-raised p-1">
        <TabButton isActive={tab === 'overview'} onClick={() => setTab('overview')}>
          {t('students.tabs.overview')}
        </TabButton>
        <TabButton isActive={tab === 'goals'} onClick={() => setTab('goals')}>
          {t('students.tabs.goals')}
        </TabButton>
        <TabButton isActive={tab === 'edit'} onClick={() => setTab('edit')}>
          {t('students.tabs.edit')}
        </TabButton>
      </div>

      {tab === 'overview' ? (
        <div className="space-y-4">
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
              <div className="space-y-3">
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
                <p className="text-xs text-ink-muted">
                  {t('students.card.statusSince', {
                    date: formatDateTime(data.emotionalStatus.statusSince),
                  })}
                </p>
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

          <Card title={t('students.card.messagesTitle')}>
            {data.messages.length > 0 ? (
              <div className="space-y-3">
                {data.messages.map((message) => (
                  <MessageRow
                    key={message.id}
                    message={message}
                    currentUserId={currentUserId}
                    canDeleteAny={canDeleteAny}
                    canEditAny={canDeleteAny}
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
        </div>
      ) : null}

      {tab === 'goals' ? (
        <div className="space-y-4">
          <Card title={t('students.card.goalsTitle')}>
            {data.goals.length > 0 ? (
              <div className="space-y-3">
                {data.goals.map((goal) => (
                  <div key={goal.id} className="rounded-xl border border-line bg-surface p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-ink">{goal.title}</p>
                        <p className="mt-1 text-xs text-ink-muted">
                          {goal.description ?? goalStatusLabel(goal.status)}
                        </p>
                      </div>
                      <span className="shrink-0 rounded-full bg-surface-sunken px-2 py-0.5 text-xs font-semibold text-ink-secondary">
                        {goal.isPrimary ? t('students.goals.primary') : goalStatusLabel(goal.status)}
                      </span>
                    </div>
                  </div>
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
        </div>
      ) : null}

      {tab === 'edit' ? (
        <div className="space-y-4">
          {!hasEditAccess ? (
            <Alert variant="info" title={t('students.tabs.edit')}>
              {t('students.edit.noPermission')}
            </Alert>
          ) : null}

          {data.project?.canUpdateStatus && data.project.id ? (
            <Card title={t('students.edit.projectSection')}>
              <ProjectStatusForm
                studentId={studentId}
                projectId={data.project.id}
                currentStatus={data.project.status}
              />
            </Card>
          ) : null}

          {data.canUpdateEmotionalStatus ? (
            <Card title={t('students.edit.emotionalSection')}>
              <EmotionalStatusForm
                studentId={studentId}
                currentStatus={data.emotionalStatus?.status ?? null}
              />
            </Card>
          ) : null}

          {data.canManageGoals ? (
            <Card title={t('students.edit.goalsSection')}>
              <div className="space-y-4">
                {data.goals.map((goal) => (
                  <div key={goal.id} className="space-y-3 rounded-xl border border-line bg-surface p-3">
                    <p className="text-sm font-semibold text-ink">{goal.title}</p>
                    <GoalDetailsForm
                      studentId={studentId}
                      goalId={goal.id}
                      currentTitle={goal.title}
                      currentDescription={goal.description}
                    />
                    <GoalStatusForm
                      studentId={studentId}
                      goalId={goal.id}
                      currentStatus={goal.status}
                    />
                    {!goal.isPrimary ? (
                      <SetPrimaryGoalButton studentId={studentId} goalId={goal.id} />
                    ) : null}
                    {data.canDeleteGoals ? (
                      <DeleteGoalButton studentId={studentId} goalId={goal.id} goalTitle={goal.title} />
                    ) : null}
                  </div>
                ))}
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                    {t('students.goals.addTitle')}
                  </p>
                  <GoalForm studentId={studentId} />
                </div>
              </div>
            </Card>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
