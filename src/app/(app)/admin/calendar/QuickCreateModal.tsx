'use client';

import { useState, useTransition, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ChevronDown, X } from 'lucide-react';
import { createCalendarEvent, type CalendarEventInput } from '@/features/calendar/admin-actions';
import type { AdminCalendarGroupOption, CalendarEventVisibility } from '@/features/calendar/admin-queries';
import { DEFAULT_EVENT_DURATION_MINUTES } from '@/features/calendar/constants';
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
  addMinutesToIso,
  formatILTime,
} from '@/lib/date/il-date';
import { t } from '@/lib/i18n';

export type QuickCreateRange = {
  startIso: string;
  endIso: string;
  allDay: boolean;
};

type QuickCreateModalProps = {
  range: QuickCreateRange;
  groups: AdminCalendarGroupOption[];
  onClose: () => void;
  onCreated: () => void;
};

const VISIBILITIES: CalendarEventVisibility[] = ['all_school', 'staff_only', 'leadership_only', 'groups'];
const DEFAULT_TIMED_START: TimeParts = { hour: 9, minute: 0 };

export function QuickCreateModal({ range, groups, onClose, onCreated }: QuickCreateModalProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [title, setTitle] = useState('');
  const [isAllDay, setIsAllDay] = useState(range.allDay);

  const [startDate, setStartDate] = useState<DateParts>(() => isoToDateParts(range.startIso));
  const [endDate, setEndDate] = useState<DateParts>(() =>
    range.allDay ? exclusiveEndIsoToInclusiveDateParts(range.endIso) : isoToDateParts(range.endIso)
  );
  const [startTime, setStartTime] = useState<TimeParts>(() =>
    range.allDay ? DEFAULT_TIMED_START : isoToTimeParts(range.startIso)
  );
  const [visibility, setVisibility] = useState<CalendarEventVisibility>('all_school');
  const [selectedGroups, setSelectedGroups] = useState<Set<string>>(new Set());

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [customEndDate, setCustomEndDate] = useState<DateParts | null>(null);
  // A drag-selected timed range (Day/Week) carries a real end time that must be
  // respected as-is; only a plain click (or an all-day-sourced range) falls
  // back to the DEFAULT_EVENT_DURATION_MINUTES computed in computeStartEndIso.
  const [customEndTime, setCustomEndTime] = useState<TimeParts | null>(() =>
    range.allDay ? null : isoToTimeParts(range.endIso)
  );

  const [error, setError] = useState<string | null>(null);

  function computeStartEndIso(): { startsAt: string; endsAt: string } {
    if (isAllDay) {
      return {
        startsAt: allDayStartIso(startDate),
        endsAt: allDayEndIsoExclusive(customEndDate ?? endDate),
      };
    }

    const startsAt = combineDateAndTimeToIso(startDate, startTime);
    const endsAt = customEndTime
      ? combineDateAndTimeToIso(customEndDate ?? startDate, customEndTime)
      : addMinutesToIso(startsAt, DEFAULT_EVENT_DURATION_MINUTES);

    return { startsAt, endsAt };
  }

  const defaultEndPreview = isAllDay ? null : computeStartEndIso().endsAt;

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

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setError(t('admin.calendar.errorTitleRequired'));
      return;
    }

    if (visibility === 'groups' && selectedGroups.size === 0) {
      setError(t('admin.calendar.errorGroupsRequired'));
      return;
    }

    const { startsAt, endsAt } = computeStartEndIso();

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
      const result = await createCalendarEvent(input);
      if (!result.success) {
        setError(result.error ? t(result.error) : t('admin.calendar.errorCreateFailed'));
        return;
      }
      router.refresh();
      onCreated();
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-xs p-4"
      role="dialog"
      aria-modal="true"
      aria-label={t('admin.calendar.quickCreateTitle')}
    >
      <div
        className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border border-line dark:border-ink-secondary bg-white dark:bg-ink p-6 shadow-xl animate-in fade-in zoom-in-95 duration-150"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-black text-ink dark:text-surface">
            {t('admin.calendar.quickCreateTitle')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('admin.calendar.cancelButton')}
            className="rounded-lg p-1.5 text-ink-muted hover:bg-surface-sunken dark:hover:bg-ink-secondary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="mb-1 block text-xs font-bold text-ink-secondary dark:text-line">
              {t('admin.calendar.titleLabel')}
            </span>
            <input
              type="text"
              autoFocus
              required
              disabled={isPending}
              value={title}
              maxLength={160}
              onChange={(event) => setTitle(event.target.value)}
              placeholder={t('admin.calendar.titlePlaceholder')}
              className="h-11 w-full rounded-xl border border-line dark:border-ink-secondary bg-white dark:bg-ink px-3 text-sm text-ink dark:text-surface outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
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

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs font-bold text-ink-secondary dark:text-line">
                {t('admin.calendar.startsAtDateLabel')}
              </span>
              <ILDatePicker value={startDate} onChange={setStartDate} disabled={isPending} required />
            </label>
            {isAllDay ? (
              <label className="block">
                <span className="mb-1 block text-xs font-bold text-ink-secondary dark:text-line">
                  {t('admin.calendar.endsAtDateLabel')}
                </span>
                <ILDatePicker value={endDate} onChange={setEndDate} disabled={isPending} required />
              </label>
            ) : (
              <label className="block">
                <span className="mb-1 block text-xs font-bold text-ink-secondary dark:text-line">
                  {t('admin.calendar.startsAtTimeLabel')}
                </span>
                <ILTimeInput value={startTime} onChange={setStartTime} disabled={isPending} required />
              </label>
            )}
          </div>

          {!isAllDay && !showAdvanced && defaultEndPreview ? (
            <p className="text-[11px] text-ink-muted dark:text-ink-muted">
              {t('admin.calendar.quickCreateDefaultEndHint', { time: formatILTime(defaultEndPreview) })}
            </p>
          ) : null}

          <label className="block">
            <span className="mb-1 block text-xs font-bold text-ink-secondary dark:text-line">
              {t('admin.calendar.visibilityLabel')}
            </span>
            <select
              disabled={isPending}
              value={visibility}
              onChange={(event) => setVisibility(event.target.value as CalendarEventVisibility)}
              className="h-11 w-full rounded-xl border border-line dark:border-ink-secondary bg-white dark:bg-ink px-3 text-sm text-ink dark:text-surface outline-none focus:border-accent"
            >
              {VISIBILITIES.map((option) => (
                <option key={option} value={option}>
                  {t(`admin.calendar.visibility_${option}`)}
                </option>
              ))}
            </select>
          </label>

          {visibility === 'groups' ? (
            <div className="rounded-xl border border-surface-sunken dark:border-ink-secondary bg-surface dark:bg-ink/50 p-3">
              <span className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-ink-muted dark:text-ink-muted">
                {t('admin.calendar.selectGroupsTitle')}
              </span>
              {groups.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {groups.map((group) => (
                    <label
                      key={group.id}
                      className="flex items-center gap-2 rounded-lg border border-line dark:border-ink-secondary bg-white dark:bg-ink px-2.5 py-1.5 text-xs font-medium text-ink-secondary dark:text-line cursor-pointer"
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

          <button
            type="button"
            onClick={() => setShowAdvanced((value) => !value)}
            aria-expanded={showAdvanced}
            className="flex w-full items-center justify-between rounded-xl border border-surface-sunken dark:border-ink-secondary px-3 py-2 text-xs font-bold text-ink-secondary dark:text-line hover:bg-surface dark:hover:bg-ink-secondary/50"
          >
            <span>{t('admin.calendar.advancedFieldsToggle')}</span>
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
          </button>

          {showAdvanced ? (
            <div className="space-y-3 rounded-xl border border-surface-sunken dark:border-ink-secondary p-3">
              <label className="block">
                <span className="mb-1 block text-xs font-bold text-ink-secondary dark:text-line">
                  {t('admin.calendar.descriptionLabel')}
                </span>
                <textarea
                  rows={2}
                  disabled={isPending}
                  value={description}
                  maxLength={2000}
                  onChange={(event) => setDescription(event.target.value)}
                  className="w-full rounded-xl border border-line dark:border-ink-secondary bg-white dark:bg-ink p-2.5 text-xs text-ink dark:text-surface outline-none focus:border-accent resize-y"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-bold text-ink-secondary dark:text-line">
                  {t('admin.calendar.locationLabel')}
                </span>
                <input
                  type="text"
                  disabled={isPending}
                  value={location}
                  maxLength={160}
                  onChange={(event) => setLocation(event.target.value)}
                  className="h-10 w-full rounded-xl border border-line dark:border-ink-secondary bg-white dark:bg-ink px-3 text-xs text-ink dark:text-surface outline-none focus:border-accent"
                />
              </label>
              {!isAllDay ? (
                <div className="grid gap-2 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-1 block text-xs font-bold text-ink-secondary dark:text-line">
                      {t('admin.calendar.endsAtDateLabel')}
                    </span>
                    <ILDatePicker value={customEndDate ?? startDate} onChange={setCustomEndDate} disabled={isPending} />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-xs font-bold text-ink-secondary dark:text-line">
                      {t('admin.calendar.endsAtTimeLabel')}
                    </span>
                    <ILTimeInput value={customEndTime} onChange={setCustomEndTime} disabled={isPending} />
                  </label>
                </div>
              ) : null}
            </div>
          ) : null}

          {error ? (
            <p className="text-xs font-semibold text-status-critical" role="alert">
              {error}
            </p>
          ) : null}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              disabled={isPending}
              onClick={onClose}
              className="h-10 px-4 rounded-xl text-xs font-bold bg-surface-sunken hover:bg-line/80 text-ink-secondary dark:bg-ink-secondary dark:hover:bg-ink-secondary dark:text-line transition-colors"
            >
              {t('admin.calendar.cancelButton')}
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="h-10 px-5 rounded-xl text-xs font-bold bg-accent hover:bg-accent-strong text-white flex items-center justify-center gap-1.5 transition-colors"
            >
              {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
              <span>{t('admin.calendar.createButton')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
