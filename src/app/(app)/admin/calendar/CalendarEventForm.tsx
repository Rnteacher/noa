'use client';

import { useState, useTransition, type FormEvent } from 'react';
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
import { ILDatePicker } from '@/components/date/ILDatePicker';
import { ILTimeInput } from '@/components/date/ILTimeInput';
import {
  type DateParts,
  type TimeParts,
  isoToDateParts,
  isoToTimeParts,
  combineDateAndTimeToIso,
  allDayStartIso,
  allDayEndIsoExclusive,
  exclusiveEndIsoToInclusiveDateParts,
  todayDateParts,
} from '@/lib/date/il-date';
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

const DEFAULT_TIME: TimeParts = { hour: 9, minute: 0 };
const DEFAULT_END_TIME: TimeParts = { hour: 10, minute: 0 };

export function CalendarEventForm({ groups, mode, eventId, initialValues, onSaved }: CalendarEventFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [title, setTitle] = useState(initialValues?.title ?? '');
  const [description, setDescription] = useState(initialValues?.description ?? '');
  const [isAllDay, setIsAllDay] = useState(initialValues?.isAllDay ?? false);

  const [startDate, setStartDate] = useState<DateParts>(() =>
    initialValues ? isoToDateParts(initialValues.startsAt) : todayDateParts()
  );
  const [startTime, setStartTime] = useState<TimeParts>(() =>
    initialValues && !initialValues.isAllDay ? isoToTimeParts(initialValues.startsAt) : DEFAULT_TIME
  );
  const [endDate, setEndDate] = useState<DateParts>(() => {
    if (!initialValues) {
      return todayDateParts();
    }
    return initialValues.isAllDay
      ? exclusiveEndIsoToInclusiveDateParts(initialValues.endsAt)
      : isoToDateParts(initialValues.endsAt);
  });
  const [endTime, setEndTime] = useState<TimeParts>(() =>
    initialValues && !initialValues.isAllDay ? isoToTimeParts(initialValues.endsAt) : DEFAULT_END_TIME
  );

  const [visibility, setVisibility] = useState<CalendarEventVisibility>(
    initialValues?.visibility ?? 'all_school'
  );
  const [location, setLocation] = useState(initialValues?.location ?? '');
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(
    new Set(initialValues?.groupIds ?? [])
  );

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

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError(t('admin.calendar.errorTitleRequired'));
      return;
    }

    if (visibility === 'groups' && selectedGroups.size === 0) {
      setError(t('admin.calendar.errorGroupsRequired'));
      return;
    }

    const startsAt = isAllDay ? allDayStartIso(startDate) : combineDateAndTimeToIso(startDate, startTime);
    const endsAt = isAllDay ? allDayEndIsoExclusive(endDate) : combineDateAndTimeToIso(endDate, endTime);

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
        setIsAllDay(false);
        const today = todayDateParts();
        setStartDate(today);
        setEndDate(today);
        setStartTime(DEFAULT_TIME);
        setEndTime(DEFAULT_END_TIME);
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
        <span className="mb-1 block text-sm font-medium text-ink-secondary dark:text-line">
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
          className="h-11 w-full rounded-xl border border-line dark:border-ink-secondary bg-white dark:bg-ink px-3 text-sm text-ink dark:text-surface outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-sm font-medium text-ink-secondary dark:text-line">
          {t('admin.calendar.descriptionLabel')}
        </span>
        <textarea
          rows={3}
          disabled={isPending}
          value={description}
          maxLength={2000}
          onChange={(event) => setDescription(event.target.value)}
          placeholder={t('admin.calendar.descriptionPlaceholder')}
          className="w-full rounded-xl border border-line dark:border-ink-secondary bg-white dark:bg-ink p-3 text-sm text-ink dark:text-surface outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent resize-y"
        />
      </label>

      <label className="flex items-center gap-2 text-sm font-medium text-ink-secondary dark:text-line cursor-pointer">
        <input
          type="checkbox"
          disabled={isPending}
          checked={isAllDay}
          onChange={(event) => setIsAllDay(event.target.checked)}
          className="h-4 w-4 rounded border-line text-accent focus:ring-accent"
        />
        {t('admin.calendar.isAllDayLabel')}
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink-secondary dark:text-line">
            {t('admin.calendar.startsAtDateLabel')}
          </span>
          <ILDatePicker value={startDate} onChange={setStartDate} disabled={isPending} required />
        </label>
        {isAllDay ? (
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-ink-secondary dark:text-line">
              {t('admin.calendar.endsAtDateLabel')}
            </span>
            <ILDatePicker value={endDate} onChange={setEndDate} disabled={isPending} required />
          </label>
        ) : (
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-ink-secondary dark:text-line">
              {t('admin.calendar.startsAtTimeLabel')}
            </span>
            <ILTimeInput value={startTime} onChange={setStartTime} disabled={isPending} required />
          </label>
        )}
      </div>

      {!isAllDay ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-ink-secondary dark:text-line">
              {t('admin.calendar.endsAtDateLabel')}
            </span>
            <ILDatePicker value={endDate} onChange={setEndDate} disabled={isPending} required />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-ink-secondary dark:text-line">
              {t('admin.calendar.endsAtTimeLabel')}
            </span>
            <ILTimeInput value={endTime} onChange={setEndTime} disabled={isPending} required />
          </label>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink-secondary dark:text-line">
            {t('admin.calendar.locationLabel')}
          </span>
          <input
            type="text"
            disabled={isPending}
            value={location}
            maxLength={160}
            onChange={(event) => setLocation(event.target.value)}
            placeholder={t('admin.calendar.locationPlaceholder')}
            className="h-11 w-full rounded-xl border border-line dark:border-ink-secondary bg-white dark:bg-ink px-3 text-sm text-ink dark:text-surface outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink-secondary dark:text-line">
            {t('admin.calendar.visibilityLabel')}
          </span>
          <select
            disabled={isPending}
            value={visibility}
            onChange={(event) => setVisibility(event.target.value as CalendarEventVisibility)}
            className="h-11 w-full rounded-xl border border-line dark:border-ink-secondary bg-white dark:bg-ink px-3 text-sm text-ink dark:text-surface outline-none transition-colors focus:border-accent"
          >
            {VISIBILITIES.map((option) => (
              <option key={option} value={option}>
                {t(`admin.calendar.visibility_${option}`)}
              </option>
            ))}
          </select>
        </label>
      </div>

      {visibility === 'groups' ? (
        <div className="rounded-xl border border-surface-sunken dark:border-ink-secondary bg-surface dark:bg-ink/50 p-4">
          <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-ink-muted dark:text-ink-muted">
            {t('admin.calendar.selectGroupsTitle')}
          </span>
          {groups.length > 0 ? (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {groups.map((group) => (
                <label
                  key={group.id}
                  className="flex items-center gap-2 rounded-lg border border-line dark:border-ink-secondary bg-white dark:bg-ink px-3 py-2 text-xs font-medium text-ink-secondary dark:text-line cursor-pointer"
                >
                  <input
                    type="checkbox"
                    disabled={isPending}
                    checked={selectedGroups.has(group.id)}
                    onChange={() => handleGroupToggle(group.id)}
                    className="h-3.5 w-3.5 rounded border-line text-accent focus:ring-accent"
                  />
                  <span className="truncate">{group.name}</span>
                </label>
              ))}
            </div>
          ) : (
            <p className="text-xs text-ink-muted dark:text-ink-secondary">
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
          className="flex h-10 items-center justify-center gap-2 rounded-xl bg-accent hover:bg-accent-strong px-5 text-sm font-bold text-white transition-all disabled:opacity-50"
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
