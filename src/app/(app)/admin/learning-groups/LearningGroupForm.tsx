'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpenCheck, Loader2 } from 'lucide-react';
import {
  createLearningGroup,
  updateLearningGroup,
  type LearningGroupInput,
} from '@/features/learning-groups/admin-actions';
import {
  LEARNING_GROUP_WEEKDAYS,
  type AdminLearningGroupLeaderOption,
  type AdminLearningGroupOption,
  type LearningGroupWeekday,
} from '@/features/learning-groups/types';
import { t } from '@/lib/i18n';

type LearningGroupFormInitialValues = {
  title: string;
  description: string;
  weekday: LearningGroupWeekday;
  startsAt: string;
  endsAt: string;
  leaderId: string;
  room: string;
  activeFrom: string;
  activeUntil: string;
  isActive: boolean;
  groupIds: string[];
};

type LearningGroupFormProps = {
  groups: AdminLearningGroupOption[];
  leaders: AdminLearningGroupLeaderOption[];
  mode: 'create' | 'edit';
  learningGroupId?: string;
  initialValues?: LearningGroupFormInitialValues;
  defaultActiveFrom?: string;
  defaultActiveUntil?: string;
  onSaved?: () => void;
};

const emptyValues: LearningGroupFormInitialValues = {
  title: '',
  description: '',
  weekday: 'sunday',
  startsAt: '11:30',
  endsAt: '13:30',
  leaderId: '',
  room: '',
  activeFrom: '',
  activeUntil: '',
  isActive: true,
  groupIds: [],
};

function toTimeInputValue(value: string) {
  return value.slice(0, 5);
}

export function LearningGroupForm({
  groups,
  leaders,
  mode,
  learningGroupId,
  initialValues,
  defaultActiveFrom,
  defaultActiveUntil,
  onSaved,
}: LearningGroupFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const initial = initialValues ?? {
    ...emptyValues,
    activeFrom: defaultActiveFrom ?? '',
    activeUntil: defaultActiveUntil ?? '',
  };

  const [title, setTitle] = useState(initial.title);
  const [description, setDescription] = useState(initial.description);
  const [weekday, setWeekday] = useState<LearningGroupWeekday>(initial.weekday);
  const [startsAt, setStartsAt] = useState(toTimeInputValue(initial.startsAt));
  const [endsAt, setEndsAt] = useState(toTimeInputValue(initial.endsAt));
  const [leaderId, setLeaderId] = useState(initial.leaderId);
  const [room, setRoom] = useState(initial.room);
  const [activeFrom, setActiveFrom] = useState(initial.activeFrom);
  const [activeUntil, setActiveUntil] = useState(initial.activeUntil);
  const [isActive, setIsActive] = useState(initial.isActive);
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set(initial.groupIds));
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function handleGroupToggle(groupId: string) {
    const next = new Set(selectedGroups);
    if (next.has(groupId)) {
      next.delete(groupId);
    } else {
      next.add(groupId);
    }
    setSelectedGroups(next);
  }

  function resetCreateForm() {
    setTitle('');
    setDescription('');
    setWeekday('sunday');
    setStartsAt('11:30');
    setEndsAt('13:30');
    setLeaderId('');
    setRoom('');
    setActiveFrom(defaultActiveFrom ?? '');
    setActiveUntil(defaultActiveUntil ?? '');
    setIsActive(true);
    setSelectedGroups(new Set());
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    if (!title.trim()) {
      setError(t('admin.learningGroups.errorTitleRequired'));
      return;
    }

    if (!startsAt || !endsAt) {
      setError(t('admin.learningGroups.errorInvalidTime'));
      return;
    }

    if (!activeFrom) {
      setError(t('admin.learningGroups.errorInvalidActiveFrom'));
      return;
    }

    if (selectedGroups.size === 0) {
      setError(t('admin.learningGroups.errorGroupsRequired'));
      return;
    }

    const input: LearningGroupInput = {
      title,
      description,
      weekday,
      startsAt,
      endsAt,
      leaderId,
      room,
      activeFrom,
      activeUntil,
      isActive,
      groupIds: Array.from(selectedGroups),
    };

    startTransition(async () => {
      const result =
        mode === 'edit' && learningGroupId
          ? await updateLearningGroup(learningGroupId, input)
          : await createLearningGroup(input);

      if (!result.success) {
        setError(result.error ? t(result.error) : t('admin.learningGroups.errorCreateFailed'));
        return;
      }

      setSuccess(
        mode === 'edit'
          ? t('admin.learningGroups.updateSuccess')
          : t('admin.learningGroups.createSuccess')
      );

      if (mode === 'create') {
        resetCreateForm();
      }

      router.refresh();
      onSaved?.();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-200">
          {t('admin.learningGroups.titleLabel')}
        </span>
        <input
          type="text"
          required
          disabled={isPending}
          value={title}
          maxLength={160}
          onChange={(event) => setTitle(event.target.value)}
          placeholder={t('admin.learningGroups.titlePlaceholder')}
          className="h-11 w-full rounded-xl border border-zinc-200 dark:border-zinc-750 bg-white dark:bg-zinc-950 px-3 text-sm text-zinc-950 dark:text-zinc-50 outline-none transition-colors focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-200">
          {t('admin.learningGroups.descriptionLabel')}
        </span>
        <textarea
          rows={3}
          disabled={isPending}
          value={description}
          maxLength={2000}
          onChange={(event) => setDescription(event.target.value)}
          placeholder={t('admin.learningGroups.descriptionPlaceholder')}
          className="w-full resize-y rounded-xl border border-zinc-200 dark:border-zinc-750 bg-white dark:bg-zinc-950 p-3 text-sm text-zinc-950 dark:text-zinc-50 outline-none transition-colors focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-200">
            {t('admin.learningGroups.weekdayLabel')}
          </span>
          <select
            disabled={isPending}
            value={weekday}
            onChange={(event) => setWeekday(event.target.value as LearningGroupWeekday)}
            className="h-11 w-full rounded-xl border border-zinc-200 dark:border-zinc-750 bg-white dark:bg-zinc-950 px-3 text-sm text-zinc-950 dark:text-zinc-50 outline-none transition-colors focus:border-emerald-600"
          >
            {LEARNING_GROUP_WEEKDAYS.map((option) => (
              <option key={option} value={option}>
                {t(`admin.learningGroups.weekday_${option}`)}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-200">
            {t('admin.learningGroups.leaderLabel')}
          </span>
          <select
            disabled={isPending}
            value={leaderId}
            onChange={(event) => setLeaderId(event.target.value)}
            className="h-11 w-full rounded-xl border border-zinc-200 dark:border-zinc-750 bg-white dark:bg-zinc-950 px-3 text-sm text-zinc-950 dark:text-zinc-50 outline-none transition-colors focus:border-emerald-600"
          >
            <option value="">{t('admin.learningGroups.noLeaderOption')}</option>
            {leaders.map((leader) => (
              <option key={leader.id} value={leader.id}>
                {leader.fullName}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-200">
            {t('admin.learningGroups.startsAtLabel')}
          </span>
          <input
            type="time"
            required
            disabled={isPending}
            min="11:30"
            max="13:30"
            step={300}
            value={startsAt}
            onChange={(event) => setStartsAt(event.target.value)}
            className="h-11 w-full rounded-xl border border-zinc-200 dark:border-zinc-750 bg-white dark:bg-zinc-950 px-3 text-sm text-zinc-950 dark:text-zinc-50 outline-none transition-colors focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-200">
            {t('admin.learningGroups.endsAtLabel')}
          </span>
          <input
            type="time"
            required
            disabled={isPending}
            min="11:30"
            max="13:30"
            step={300}
            value={endsAt}
            onChange={(event) => setEndsAt(event.target.value)}
            className="h-11 w-full rounded-xl border border-zinc-200 dark:border-zinc-750 bg-white dark:bg-zinc-950 px-3 text-sm text-zinc-950 dark:text-zinc-50 outline-none transition-colors focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
          />
        </label>
      </div>

      <label className="block">
        <span className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-200">
          {t('admin.learningGroups.roomLabel')}
        </span>
        <input
          type="text"
          disabled={isPending}
          value={room}
          maxLength={160}
          onChange={(event) => setRoom(event.target.value)}
          placeholder={t('admin.learningGroups.roomPlaceholder')}
          className="h-11 w-full rounded-xl border border-zinc-200 dark:border-zinc-750 bg-white dark:bg-zinc-950 px-3 text-sm text-zinc-950 dark:text-zinc-50 outline-none transition-colors focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-200">
            {t('admin.learningGroups.activeFromLabel')}
          </span>
          <input
            type="date"
            required
            disabled={isPending}
            value={activeFrom}
            onChange={(event) => setActiveFrom(event.target.value)}
            className="h-11 w-full rounded-xl border border-zinc-200 dark:border-zinc-750 bg-white dark:bg-zinc-950 px-3 text-sm text-zinc-950 dark:text-zinc-50 outline-none transition-colors focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-200">
            {t('admin.learningGroups.activeUntilLabel')}
          </span>
          <input
            type="date"
            disabled={isPending}
            value={activeUntil}
            onChange={(event) => setActiveUntil(event.target.value)}
            className="h-11 w-full rounded-xl border border-zinc-200 dark:border-zinc-750 bg-white dark:bg-zinc-950 px-3 text-sm text-zinc-950 dark:text-zinc-50 outline-none transition-colors focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
          />
        </label>
      </div>

      <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-200">
        <input
          type="checkbox"
          disabled={isPending}
          checked={isActive}
          onChange={(event) => setIsActive(event.target.checked)}
          className="h-4 w-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-600"
        />
        {t('admin.learningGroups.isActiveLabel')}
      </label>

      <div className="rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 p-4">
        <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          {t('admin.learningGroups.selectGroupsTitle')}
        </span>
        {groups.length > 0 ? (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {groups.map((group) => (
              <label
                key={group.id}
                className="flex cursor-pointer items-center gap-2 rounded-lg border border-zinc-200 dark:border-zinc-750 bg-white dark:bg-zinc-950 px-3 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-200"
              >
                <input
                  type="checkbox"
                  disabled={isPending}
                  checked={selectedGroups.has(group.id)}
                  onChange={() => handleGroupToggle(group.id)}
                  className="h-3.5 w-3.5 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-600"
                />
                <span className="truncate">{group.name}</span>
              </label>
            ))}
          </div>
        ) : (
          <p className="text-xs text-zinc-450 dark:text-zinc-600">
            {t('admin.learningGroups.noGroupsAvailable')}
          </p>
        )}
      </div>

      {error ? (
        <p className="text-xs font-semibold text-status-critical" role="alert">
          {error}
        </p>
      ) : null}

      {success ? (
        <p className="text-xs font-semibold text-status-positive" role="status">
          {success}
        </p>
      ) : null}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="flex h-10 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-sm font-bold text-white transition-all hover:bg-emerald-700 disabled:opacity-50"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <BookOpenCheck className="h-4 w-4" />
          )}
          <span>
            {mode === 'edit'
              ? t('admin.learningGroups.updateButton')
              : t('admin.learningGroups.createButton')}
          </span>
        </button>
      </div>
    </form>
  );
}
