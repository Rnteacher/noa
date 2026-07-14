'use client';

import { useState } from 'react';
import { t } from '@/lib/i18n';
import { type TimeParts, parseHHmm, formatTimeParts } from '@/lib/date/il-date';

function sameTime(a: TimeParts | null, b: TimeParts | null): boolean {
  if (a === b) return true;
  if (!a || !b) return false;
  return a.hour === b.hour && a.minute === b.minute;
}

type ILTimeInputProps = {
  value: TimeParts | null;
  onChange: (value: TimeParts) => void;
  disabled?: boolean;
  id?: string;
  ariaLabel?: string;
  required?: boolean;
};

/**
 * Always renders/accepts 24h HH:mm text, independent of the browser or OS
 * locale (unlike native <input type="time">, which can render 12h AM/PM
 * depending on locale settings).
 */
export function ILTimeInput({ value, onChange, disabled, id, ariaLabel, required }: ILTimeInputProps) {
  const [textValue, setTextValue] = useState(value ? formatTimeParts(value) : '');

  // Adjusting state during render (not in an effect) per
  // https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
  const [prevValue, setPrevValue] = useState(value);
  if (!sameTime(value, prevValue)) {
    setPrevValue(value);
    setTextValue(value ? formatTimeParts(value) : '');
  }

  function commitTextValue(raw: string) {
    const parsed = parseHHmm(raw);
    if (parsed) {
      onChange(parsed);
      setTextValue(formatTimeParts(parsed));
    } else {
      setTextValue(value ? formatTimeParts(value) : '');
    }
  }

  return (
    <input
      id={id}
      type="text"
      inputMode="numeric"
      dir="ltr"
      required={required}
      disabled={disabled}
      value={textValue}
      placeholder={t('common.date.timePlaceholder')}
      onChange={(event) => setTextValue(event.target.value)}
      onBlur={(event) => commitTextValue(event.target.value)}
      aria-label={ariaLabel ?? t('common.date.timeLabel')}
      className="h-11 w-full rounded-xl border border-zinc-200 dark:border-zinc-750 bg-white dark:bg-zinc-950 px-3 text-center text-sm text-zinc-950 dark:text-zinc-50 outline-none transition-colors focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600"
    />
  );
}
