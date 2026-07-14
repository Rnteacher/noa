'use client';

import { useEffect, useRef, useState } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { t } from '@/lib/i18n';
import { cn } from '@/lib/cn';
import {
  type DateParts,
  parseDDMMYYYY,
  formatDateParts,
  dateStringFromParts,
  compareDateParts,
  todayDateParts,
} from '@/lib/date/il-date';

const WEEKDAY_KEYS = [
  'common.date.day_0',
  'common.date.day_1',
  'common.date.day_2',
  'common.date.day_3',
  'common.date.day_4',
  'common.date.day_5',
  'common.date.day_6',
];

function shiftMonth(parts: DateParts, delta: number): DateParts {
  const d = new Date(parts.year, parts.month - 1 + delta, 1);
  return { year: d.getFullYear(), month: d.getMonth() + 1, day: 1 };
}

function buildMonthGrid(viewMonth: DateParts): DateParts[] {
  const gridStart = new Date(viewMonth.year, viewMonth.month - 1, 1);
  gridStart.setDate(gridStart.getDate() - gridStart.getDay());

  const days: DateParts[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    days.push({ year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() });
  }
  return days;
}

type ILDatePickerProps = {
  value: DateParts | null;
  onChange: (value: DateParts) => void;
  disabled?: boolean;
  id?: string;
  ariaLabel?: string;
  required?: boolean;
};

export function ILDatePicker({ value, onChange, disabled, id, ariaLabel, required }: ILDatePickerProps) {
  const [textValue, setTextValue] = useState(value ? formatDateParts(value) : '');
  const [isOpen, setIsOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState<DateParts>(value ?? todayDateParts());
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync local editing buffer when the value changes from outside (e.g. a
  // parent-driven reset), without diverging from external updates while the
  // user is mid-edit. Adjusting state during render (not in an effect) per
  // https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  const [prevValue, setPrevValue] = useState(value);
  if (value !== prevValue && (value === null || prevValue === null || compareDateParts(value, prevValue) !== 0)) {
    setPrevValue(value);
    setTextValue(value ? formatDateParts(value) : '');
    if (value) {
      setViewMonth(value);
    }
  }

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  function commitTextValue(raw: string) {
    const parsed = parseDDMMYYYY(raw);
    if (parsed) {
      onChange(parsed);
      setViewMonth(parsed);
    } else {
      setTextValue(value ? formatDateParts(value) : '');
    }
  }

  function selectDay(day: DateParts) {
    onChange(day);
    setTextValue(formatDateParts(day));
    setIsOpen(false);
  }

  const days = buildMonthGrid(viewMonth);
  const today = todayDateParts();
  const monthLabel = new Intl.DateTimeFormat('he-IL', { month: 'long', year: 'numeric' }).format(
    new Date(viewMonth.year, viewMonth.month - 1, 1)
  );

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <input
          id={id}
          type="text"
          inputMode="numeric"
          dir="ltr"
          required={required}
          disabled={disabled}
          value={textValue}
          placeholder={t('common.date.placeholder')}
          onChange={(event) => setTextValue(event.target.value)}
          onBlur={(event) => commitTextValue(event.target.value)}
          onFocus={() => setIsOpen(true)}
          aria-label={ariaLabel ?? t('common.date.openPicker')}
          className="h-11 w-full rounded-xl border border-zinc-200 dark:border-zinc-750 bg-white dark:bg-zinc-950 ps-3 pe-10 text-sm text-zinc-950 dark:text-zinc-50 outline-none transition-colors focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
        />
        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen((open) => !open)}
          aria-label={t('common.date.openPicker')}
          aria-expanded={isOpen}
          className="absolute inset-y-0 end-0 flex w-10 items-center justify-center text-zinc-400 hover:text-emerald-600 disabled:opacity-50"
        >
          <CalendarIcon className="h-4 w-4" />
        </button>
      </div>

      {isOpen && !disabled ? (
        <div
          role="dialog"
          aria-label={t('common.date.pickerLabel')}
          className="absolute z-30 mt-1 w-72 rounded-xl border border-zinc-200 dark:border-zinc-750 bg-white dark:bg-zinc-900 p-3 shadow-xl"
        >
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setViewMonth((m) => shiftMonth(m, -1))}
              title={t('admin.calendar.prev')}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <ChevronRight className="h-4 w-4 rtl:hidden" />
              <ChevronLeft className="h-4 w-4 ltr:hidden" />
            </button>
            <span className="text-sm font-bold text-zinc-900 dark:text-zinc-50">{monthLabel}</span>
            <button
              type="button"
              onClick={() => setViewMonth((m) => shiftMonth(m, 1))}
              title={t('admin.calendar.next')}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <ChevronLeft className="h-4 w-4 rtl:hidden" />
              <ChevronRight className="h-4 w-4 ltr:hidden" />
            </button>
          </div>

          <div className="mb-1 grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-zinc-500 dark:text-zinc-400">
            {WEEKDAY_KEYS.map((key) => (
              <span key={key}>{t(key)}</span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {days.map((day) => {
              const inMonth = day.month === viewMonth.month;
              const isSelected = value ? compareDateParts(day, value) === 0 : false;
              const isToday = compareDateParts(day, today) === 0;

              return (
                <button
                  key={dateStringFromParts(day)}
                  type="button"
                  onClick={() => selectDay(day)}
                  aria-current={isToday ? 'date' : undefined}
                  aria-pressed={isSelected}
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-lg text-xs font-semibold transition-colors',
                    !inMonth && 'text-zinc-300 dark:text-zinc-700',
                    inMonth && !isSelected && 'text-zinc-700 dark:text-zinc-200',
                    isSelected && 'bg-emerald-600 text-white',
                    !isSelected && isToday && 'ring-1 ring-emerald-500',
                    !isSelected && 'hover:bg-zinc-100 dark:hover:bg-zinc-800'
                  )}
                >
                  {day.day}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => selectDay(today)}
            className="mt-2 w-full rounded-lg py-1.5 text-center text-xs font-bold text-emerald-700 hover:bg-emerald-50 dark:text-emerald-400 dark:hover:bg-emerald-950/30"
          >
            {t('admin.calendar.today')}
          </button>
        </div>
      ) : null}
    </div>
  );
}
