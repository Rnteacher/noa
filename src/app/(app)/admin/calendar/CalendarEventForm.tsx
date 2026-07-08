'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarPlus, Loader2 } from 'lucide-react';
import {
  createCalendarEvent,
  updateCalendarEvent,
  type CalendarEventInput,
} from '@/features/calendar/admin-actions';
import type {
  AdminCalendarGroupOption,
  CalendarEventVisibility,
} from '@/features/calendar/admin-queries';
import { t } from '@/lib/i18n';

type GroupOption = AdminCalendarGroupOption;

type CalendarEventFormInitialValues = {
  title: string;
  description: string;
  startsAt: string;
  endsAt: string;
  isAllDay: boolean;
  visibility: CalendarEventVisibility;
  location: string;
  groupIds: string[];
};

type CalendarEventFormProps = {
  groups: GroupOption[];
  mode: 'create' | 'edit';
  eventId?: string;
  initialValues?: CalendarEventFormInitialValues;
  onSaved?: () => void;
};

const VISIBILITIES: CalendarEventVisibility[] = [
  'all_school',
  'staff_only',
  'leadership_only',
  'groups',
];

function toDatetimeLocalValue(iso: string) {
  const date = new Date(iso);
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}

const emptyValues: CalendarEventFormInitialValues = {
  title: '',
  description: '',
  startsAt: '',
  endsAt: '',
  isAllDay: false,
  visibility: 'all_school',
  location: '',
  groupIds: [],
};

export function CalendarEventForm({ groups, mode, eventId, initialValues, onSaved }: CalendarEventFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const initial = initialValues ?? emptyValues;

  const [title, setTitle] = useState(initial.title);
  const [description, setDescription] = useState(initial.description);
  const [startsAt, setStartsAt] = useState(
    initial.startsAt ? toDatetimeLocalValue(initial.startsAt) : ''
  );
  const [endsAt, setEndsAt] = useState(initial.endsAt ? toDatetimeLocalValue(initial.endsAt) : '');
  const [isAllDay, setIsAllDay] = useState(initial.isAllDay);
  const [visibility, setVisibility] = useState<CalendarEventVisibility>(initial.visibility);
  const [location, setLocation] = useState(initial.location);
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

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError(t('admin.calendar.errorTitleRequired'));
      return;
    }

    if (!startsAt || !endsAt) {
      setError(t('admin.calendar.errorInvalidDateTime'));
      return;
    }

    if (visibility === 'groups' && selectedGroups.size === 0) {
      setError(t('admin.calendar.errorGroupsRequired'));
      return;
    }

    const input: CalendarEventInput = {
      title: trimmedTitle,
      description,
      startsAt,
      endsAt,
      isAllDay,
      visibility,
      location,
      groupIds: visibility === 'groups' ? Array.from(selectedGroups) : [],
    };

    startTransition(async () => {
      const result =
        mode === 'edit' && eventId
          ? await updateCalendarEvent(eventId, input)
          : await createCalendarEvent(input);

      if (!result.success) {
        setError(result.error ? t(result.error) : t('admin.calendar.errorCreateFailed'));
        return;
      }

      setSuccess(
        mode === 'edit' ? t('admin.calendar.updateSuccess') : t('admin.calendar.createSuccess')
      );

      if (mode === 'create') {
        setTitle('');
        setDescription('');
        setStartsAt('');
        setEndsAt('');
        setIsAllDay(false);
        setVisibility('all_school');
        setLocation('');
        setSelectedGroups(new Set());
      }

      router.refresh();
      onSaved?.();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-200">
          {t('admin.calendar.titleLabel')}
        </span>
        <input
          type="text"
          required
          disabled={isPending}
          value={title}
          maxLength={160}
          onChange={(event) => setTitle(event.target.value)}
          placeholder={t('admin.calendar.titlePlaceholder')}
          className="h-11 w-full rounded-xl border border-zinc-200 dark:border-zinc-750 bg-white dark:bg-zinc-950 px-3 text-sm text-zinc-950 dark:text-zinc-50 outline-none transition-colors focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-200">
          {t('admin.calendar.descriptionLabel')}
        </span>
        <textarea
          rows={3}
          disabled={isPending}
          value={description}
          maxLength={2000}
          onChange={(event) => setDescription(event.target.value)}
          placeholder={t('admin.calendar.descriptionPlaceholder')}
          className="w-full rounded-xl border border-zinc-200 dark:border-zinc-750 bg-white dark:bg-zinc-950 p-3 text-sm text-zinc-950 dark:text-zinc-50 outline-none transition-colors focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 resize-y"
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-200">
            {t('admin.calendar.startsAtLabel')}
          </span>
          <input
            type="datetime-local"
            required
            disabled={isPending}
            value={startsAt}
            onChange={(event) => setStartsAt(event.target.value)}
            className="h-11 w-full rounded-xl border border-zinc-200 dark:border-zinc-750 bg-white dark:bg-zinc-950 px-3 text-sm text-zinc-950 dark:text-zinc-50 outline-none transition-colors focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-200">
            {t('admin.calendar.endsAtLabel')}
          </span>
          <input
            type="datetime-local"
            required
            disabled={isPending}
            value={endsAt}
            onChange={(event) => setEndsAt(event.target.value)}
            className="h-11 w-full rounded-xl border border-zinc-200 dark:border-zinc-750 bg-white dark:bg-zinc-950 px-3 text-sm text-zinc-950 dark:text-zinc-50 outline-none transition-colors focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-200">
            {t('admin.calendar.locationLabel')}
          </span>
          <input
            type="text"
            disabled={isPending}
            value={location}
            maxLength={160}
            onChange={(event) => setLocation(event.target.value)}
            placeholder={t('admin.calendar.locationPlaceholder')}
            className="h-11 w-full rounded-xl border border-zinc-200 dark:border-zinc-750 bg-white dark:bg-zinc-950 px-3 text-sm text-zinc-950 dark:text-zinc-50 outline-none transition-colors focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-zinc-700 dark:text-zinc-200">
            {t('admin.calendar.visibilityLabel')}
          </span>
          <select
            disabled={isPending}
            value={visibility}
            onChange={(event) => setVisibility(event.target.value as CalendarEventVisibility)}
            className="h-11 w-full rounded-xl border border-zinc-200 dark:border-zinc-750 bg-white dark:bg-zinc-950 px-3 text-sm text-zinc-950 dark:text-zinc-50 outline-none transition-colors focus:border-emerald-600"
          >
            {VISIBILITIES.map((option) => (
              <option key={option} value={option}>
                {t(`admin.calendar.visibility_${option}`)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-200 cursor-pointer">
        <input
          type="checkbox"
          disabled={isPending}
          checked={isAllDay}
          onChange={(event) => setIsAllDay(event.target.checked)}
          className="h-4 w-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-600"
        />
        {t('admin.calendar.isAllDayLabel')}
      </label>

      {visibility === 'groups' ? (
        <div className="rounded-xl border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 p-4">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            {t('admin.calendar.selectGroupsTitle')}
          </span>
          {groups.length > 0 ? (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {groups.map((group) => (
                <label
                  key={group.id}
                  className="flex items-center gap-2 rounded-lg border border-zinc-200 dark:border-zinc-750 bg-white dark:bg-zinc-950 px-3 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-200 cursor-pointer"
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
              {t('admin.calendar.noGroupsAvailable')}
            </p>
          )}
        </div>
      ) : null}

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
          className="flex h-10 items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-5 text-sm font-bold text-white transition-all disabled:opacity-50"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <CalendarPlus className="h-4 w-4" />
          )}
          <span>
            {mode === 'edit' ? t('admin.calendar.updateButton') : t('admin.calendar.createButton')}
          </span>
        </button>
      </div>
    </form>
  );
}
