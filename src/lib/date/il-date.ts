/**
 * Centralized Israeli date/time helpers.
 *
 * All display uses DD/MM/YYYY and 24h HH:mm, always relative to the
 * Asia/Jerusalem calendar (never the server's or browser's local timezone).
 * Storage stays ISO/UTC timestamptz, matching the existing database columns.
 *
 * All-day events use an EXCLUSIVE end boundary (the Jerusalem midnight of
 * the day AFTER the last inclusive day), matching FullCalendar's native
 * model. A single-day all-day event therefore spans exactly 24h.
 */

export const JERUSALEM_TZ = 'Asia/Jerusalem';

export type DateParts = { year: number; month: number; day: number };
export type TimeParts = { hour: number; minute: number };

const DDMMYYYY_PATTERN = /^(\d{2})\/(\d{2})\/(\d{4})$/;
const HHMM_PATTERN = /^(\d{2}):(\d{2})$/;

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

function daysInMonth(year: number, month: number): number {
  // month is 1-12
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

/** Validates and parses a DD/MM/YYYY string into calendar parts, rejecting impossible dates (e.g. 31/02/2026). */
export function parseDDMMYYYY(value: string): DateParts | null {
  const match = DDMMYYYY_PATTERN.exec(value.trim());
  if (!match) {
    return null;
  }

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);

  if (year < 1900 || year > 2200) {
    return null;
  }
  if (month < 1 || month > 12) {
    return null;
  }
  if (day < 1 || day > daysInMonth(year, month)) {
    return null;
  }

  return { year, month, day };
}

export function formatDateParts(parts: DateParts): string {
  return `${pad2(parts.day)}/${pad2(parts.month)}/${parts.year}`;
}

/** Validates and parses an HH:mm 24h string. */
export function parseHHmm(value: string): TimeParts | null {
  const match = HHMM_PATTERN.exec(value.trim());
  if (!match) {
    return null;
  }

  const hour = Number(match[1]);
  const minute = Number(match[2]);

  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return null;
  }

  return { hour, minute };
}

export function formatTimeParts(parts: TimeParts): string {
  return `${pad2(parts.hour)}:${pad2(parts.minute)}`;
}

/**
 * Converts Jerusalem-local wall-clock date+time parts into a correct UTC ISO
 * instant, accounting for DST, without assuming the host's local timezone.
 * Uses a standard single-correction Intl round-trip; correct for all normal
 * (non-transition-hour) times, which is sufficient for a school calendar.
 */
export function zonedPartsToIso(
  date: DateParts,
  time: TimeParts,
  timeZone: string = JERUSALEM_TZ
): string {
  const utcGuessMs = Date.UTC(date.year, date.month - 1, date.day, time.hour, time.minute, 0);

  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  });

  const parts = dtf.formatToParts(new Date(utcGuessMs));
  const map: Record<string, string> = {};
  for (const part of parts) {
    map[part.type] = part.value;
  }

  const wallClockAsUtcMs = Date.UTC(
    Number(map.year),
    Number(map.month) - 1,
    Number(map.day),
    Number(map.hour),
    Number(map.minute),
    Number(map.second)
  );

  const offsetErrorMs = wallClockAsUtcMs - utcGuessMs;
  return new Date(utcGuessMs - offsetErrorMs).toISOString();
}

/** Reads Jerusalem-local calendar date parts out of a UTC ISO instant. */
export function isoToDateParts(iso: string, timeZone: string = JERUSALEM_TZ): DateParts {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = dtf.formatToParts(new Date(iso));
  const map: Record<string, string> = {};
  for (const part of parts) {
    map[part.type] = part.value;
  }
  return { year: Number(map.year), month: Number(map.month), day: Number(map.day) };
}

/** Reads Jerusalem-local wall-clock time parts out of a UTC ISO instant. */
export function isoToTimeParts(iso: string, timeZone: string = JERUSALEM_TZ): TimeParts {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });
  const parts = dtf.formatToParts(new Date(iso));
  const map: Record<string, string> = {};
  for (const part of parts) {
    map[part.type] = part.value;
  }
  return { hour: Number(map.hour), minute: Number(map.minute) };
}

/** DD/MM/YYYY display string for a stored UTC ISO instant. */
export function formatILDate(iso: string): string {
  return formatDateParts(isoToDateParts(iso));
}

/** HH:mm display string for a stored UTC ISO instant. */
export function formatILTime(iso: string): string {
  return formatTimeParts(isoToTimeParts(iso));
}

export function combineDateAndTimeToIso(date: DateParts, time: TimeParts): string {
  return zonedPartsToIso(date, time);
}

/** Jerusalem-local midnight of the given date, as a UTC ISO instant. */
export function allDayStartIso(date: DateParts): string {
  return zonedPartsToIso(date, { hour: 0, minute: 0 });
}

/** Exclusive all-day end: Jerusalem-local midnight of the day AFTER the given (inclusive) end date. */
export function allDayEndIsoExclusive(date: DateParts): string {
  return zonedPartsToIso(addDaysToDateParts(date, 1), { hour: 0, minute: 0 });
}

/**
 * Converts a stored exclusive all-day end instant back into the inclusive
 * last day for display/editing (the inverse of allDayEndIsoExclusive).
 */
export function exclusiveEndIsoToInclusiveDateParts(iso: string): DateParts {
  return addDaysToDateParts(isoToDateParts(iso), -1);
}

export function addDaysToDateParts(date: DateParts, days: number): DateParts {
  const utc = new Date(Date.UTC(date.year, date.month - 1, date.day));
  utc.setUTCDate(utc.getUTCDate() + days);
  return { year: utc.getUTCFullYear(), month: utc.getUTCMonth() + 1, day: utc.getUTCDate() };
}

export function addMinutesToIso(iso: string, minutes: number): string {
  return new Date(new Date(iso).getTime() + minutes * 60_000).toISOString();
}

export function isoDiffMinutes(startIso: string, endIso: string): number {
  return Math.round((new Date(endIso).getTime() - new Date(startIso).getTime()) / 60_000);
}

export function isValidDateOrder(startIso: string, endIso: string): boolean {
  return new Date(endIso).getTime() > new Date(startIso).getTime();
}

export function todayDateParts(timeZone: string = JERUSALEM_TZ): DateParts {
  return isoToDateParts(new Date().toISOString(), timeZone);
}

export function dateStringFromParts(date: DateParts): string {
  return `${date.year}-${pad2(date.month)}-${pad2(date.day)}`;
}

export function compareDateParts(a: DateParts, b: DateParts): number {
  return dateStringFromParts(a).localeCompare(dateStringFromParts(b));
}
