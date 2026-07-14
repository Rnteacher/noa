/**
 * Plain assertion-based verification for the Israeli date/time helpers and
 * calendar move/resize date math. Run with: npx tsx scripts/calendar/verify-date-and-scheduling.ts
 *
 * This project has no test framework (no vitest/jest); this follows the
 * existing convention in scripts/import/validate-real-data.ts of a
 * standalone tsx script that throws on the first failing assertion.
 */
import {
  parseDDMMYYYY,
  formatDateParts,
  parseHHmm,
  formatTimeParts,
  zonedPartsToIso,
  isoToDateParts,
  isoToTimeParts,
  formatILDate,
  formatILTime,
  combineDateAndTimeToIso,
  allDayStartIso,
  allDayEndIsoExclusive,
  exclusiveEndIsoToInclusiveDateParts,
  addDaysToDateParts,
  addMinutesToIso,
  isoDiffMinutes,
  isValidDateOrder,
  type DateParts,
} from '../../src/lib/date/il-date';
import { DEFAULT_EVENT_DURATION_MINUTES } from '../../src/features/calendar/constants';

let passed = 0;
let failed = 0;

function assertEqual<T>(actual: T, expected: T, label: string) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) {
    passed += 1;
  } else {
    failed += 1;
    console.error(`FAIL: ${label}`);
    console.error(`  expected: ${JSON.stringify(expected)}`);
    console.error(`  actual:   ${JSON.stringify(actual)}`);
  }
}

function assertTrue(actual: boolean, label: string) {
  assertEqual(actual, true, label);
}

// ---- DD/MM/YYYY parsing/formatting ----

assertEqual(parseDDMMYYYY('14/07/2026'), { year: 2026, month: 7, day: 14 }, 'parses normal DD/MM/YYYY');
assertEqual(formatDateParts({ year: 2026, month: 7, day: 14 }), '14/07/2026', 'formats normal date');
assertEqual(parseDDMMYYYY('31/02/2026'), null, 'rejects Feb 31 (impossible date)');
assertEqual(parseDDMMYYYY('29/02/2026'), null, 'rejects Feb 29 in non-leap year 2026');
assertEqual(parseDDMMYYYY('29/02/2028'), { year: 2028, month: 2, day: 29 }, 'accepts Feb 29 in leap year 2028');
assertEqual(parseDDMMYYYY('00/01/2026'), null, 'rejects day 00');
assertEqual(parseDDMMYYYY('32/01/2026'), null, 'rejects day 32');
assertEqual(parseDDMMYYYY('10/13/2026'), null, 'rejects month 13');
assertEqual(parseDDMMYYYY('not-a-date'), null, 'rejects garbage string');
assertEqual(parseDDMMYYYY('7/7/2026'), null, 'rejects non-zero-padded input');

// ---- HH:mm parsing/formatting ----

assertEqual(parseHHmm('09:30'), { hour: 9, minute: 30 }, 'parses normal time');
assertEqual(formatTimeParts({ hour: 9, minute: 5 }), '09:05', 'formats time with padding');
assertEqual(parseHHmm('24:00'), null, 'rejects hour 24');
assertEqual(parseHHmm('12:60'), null, 'rejects minute 60');
assertEqual(parseHHmm('abc'), null, 'rejects garbage time string');

// ---- Month/year boundaries ----

assertEqual(addDaysToDateParts({ year: 2026, month: 1, day: 31 }, 1), { year: 2026, month: 2, day: 1 }, 'crosses month boundary (Jan->Feb)');
assertEqual(addDaysToDateParts({ year: 2026, month: 12, day: 31 }, 1), { year: 2027, month: 1, day: 1 }, 'crosses year boundary (2026->2027)');
assertEqual(addDaysToDateParts({ year: 2027, month: 1, day: 1 }, -1), { year: 2026, month: 12, day: 31 }, 'crosses year boundary backwards');
assertEqual(addDaysToDateParts({ year: 2028, month: 2, day: 28 }, 1), { year: 2028, month: 2, day: 29 }, 'lands on Feb 29 leap day');
assertEqual(addDaysToDateParts({ year: 2028, month: 2, day: 29 }, 1), { year: 2028, month: 3, day: 1 }, 'crosses leap day into March');

// ---- Round-trip: zoned parts -> ISO -> zoned parts, across the year (implicitly exercises DST) ----

const roundTripSamples: { date: DateParts; time: { hour: number; minute: number } }[] = [
  { date: { year: 2026, month: 1, day: 15 }, time: { hour: 10, minute: 0 } },
  { date: { year: 2026, month: 3, day: 1 }, time: { hour: 8, minute: 30 } },
  { date: { year: 2026, month: 6, day: 21 }, time: { hour: 14, minute: 45 } },
  { date: { year: 2026, month: 9, day: 30 }, time: { hour: 23, minute: 59 } },
  { date: { year: 2026, month: 12, day: 31 }, time: { hour: 0, minute: 0 } },
];

for (const sample of roundTripSamples) {
  const iso = zonedPartsToIso(sample.date, sample.time);
  assertEqual(isoToDateParts(iso), sample.date, `round-trip date for ${formatDateParts(sample.date)} ${formatTimeParts(sample.time)}`);
  assertEqual(isoToTimeParts(iso), sample.time, `round-trip time for ${formatDateParts(sample.date)} ${formatTimeParts(sample.time)}`);
}

// ---- DST: same wall-clock hour in Jerusalem should have a different UTC offset in winter vs summer ----

const winterIso = zonedPartsToIso({ year: 2026, month: 1, day: 15 }, { hour: 10, minute: 0 });
const summerIso = zonedPartsToIso({ year: 2026, month: 7, day: 15 }, { hour: 10, minute: 0 });
const winterUtcHour = new Date(winterIso).getUTCHours();
const summerUtcHour = new Date(summerIso).getUTCHours();
assertTrue(winterUtcHour !== summerUtcHour, `DST changes the UTC offset for the same 10:00 Jerusalem wall-clock time (winter UTC hour ${winterUtcHour}, summer UTC hour ${summerUtcHour})`);
assertEqual(winterUtcHour, 8, 'winter (Jan) 10:00 Jerusalem is 08:00 UTC (UTC+2, no DST)');
assertEqual(summerUtcHour, 7, 'summer (Jul) 10:00 Jerusalem is 07:00 UTC (UTC+3, DST)');

// ---- formatILDate / formatILTime on stored ISO instants ----

assertEqual(formatILDate(winterIso), '15/01/2026', 'formatILDate renders DD/MM/YYYY');
assertEqual(formatILTime(winterIso), '10:00', 'formatILTime renders HH:mm');

// ---- combineDateAndTimeToIso ----

const combined = combineDateAndTimeToIso({ year: 2026, month: 7, day: 14 }, { hour: 16, minute: 0 });
assertEqual(formatILDate(combined), '14/07/2026', 'combineDateAndTimeToIso preserves date');
assertEqual(formatILTime(combined), '16:00', 'combineDateAndTimeToIso preserves time');

// ---- All-day exclusive/inclusive semantics ----

const allDayStart = allDayStartIso({ year: 2026, month: 3, day: 10 });
const allDayEnd = allDayEndIsoExclusive({ year: 2026, month: 3, day: 12 }); // inclusive Mon 10 - Wed 12 (3 days)
const allDayDurationMs = new Date(allDayEnd).getTime() - new Date(allDayStart).getTime();
assertEqual(allDayDurationMs, 3 * 24 * 60 * 60 * 1000, 'inclusive 3-day all-day event spans exactly 3*24h with exclusive end');
assertEqual(exclusiveEndIsoToInclusiveDateParts(allDayEnd), { year: 2026, month: 3, day: 12 }, 'exclusive end converts back to the correct inclusive last day');

const singleDayStart = allDayStartIso({ year: 2026, month: 5, day: 1 });
const singleDayEnd = allDayEndIsoExclusive({ year: 2026, month: 5, day: 1 });
assertEqual(new Date(singleDayEnd).getTime() - new Date(singleDayStart).getTime(), 24 * 60 * 60 * 1000, 'single-day all-day event spans exactly 24h');

// ---- Default duration ----

const timedStart = zonedPartsToIso({ year: 2026, month: 7, day: 14 }, { hour: 9, minute: 0 });
const timedEnd = addMinutesToIso(timedStart, DEFAULT_EVENT_DURATION_MINUTES);
assertEqual(isoDiffMinutes(timedStart, timedEnd), 60, 'default duration produces a 60-minute event');
assertEqual(formatILTime(timedEnd), '10:00', 'default duration end time is 09:00 + 60min = 10:00');

// ---- Move calculation (shift both start and end by N days, preserving duration) ----

function moveByDays(startIso: string, endIso: string, days: number) {
  const durationMinutes = isoDiffMinutes(startIso, endIso);
  const newStart = zonedPartsToIso(addDaysToDateParts(isoToDateParts(startIso), days), isoToTimeParts(startIso));
  const newEnd = addMinutesToIso(newStart, durationMinutes);
  return { newStart, newEnd, durationMinutes };
}

const moveResult = moveByDays(timedStart, timedEnd, 7);
assertEqual(formatILDate(moveResult.newStart), '21/07/2026', 'move shifts start date by 7 days');
assertEqual(formatILTime(moveResult.newStart), '09:00', 'move preserves start time of day');
assertEqual(isoDiffMinutes(moveResult.newStart, moveResult.newEnd), 60, 'move preserves original duration');

// Move across a month boundary
const endOfMonthStart = zonedPartsToIso({ year: 2026, month: 1, day: 28 }, { hour: 9, minute: 0 });
const endOfMonthEnd = addMinutesToIso(endOfMonthStart, 90);
const crossMonthMove = moveByDays(endOfMonthStart, endOfMonthEnd, 5);
assertEqual(formatILDate(crossMonthMove.newStart), '02/02/2026', 'move correctly crosses a month boundary');
assertEqual(isoDiffMinutes(crossMonthMove.newStart, crossMonthMove.newEnd), 90, 'move across month boundary preserves duration');

// ---- Resize calculation (change only the end) ----

function resizeEnd(startIso: string, newEndIso: string): { valid: boolean } {
  return { valid: isValidDateOrder(startIso, newEndIso) };
}

assertTrue(resizeEnd(timedStart, addMinutesToIso(timedStart, 30)).valid, 'resize to a shorter valid duration is accepted');
assertTrue(!resizeEnd(timedStart, timedStart).valid, 'resize to zero duration is rejected');
assertTrue(!resizeEnd(timedStart, addMinutesToIso(timedStart, -30)).valid, 'resize that puts end before start is rejected');

// ---- Server validation of invalid ranges ----

assertTrue(isValidDateOrder(timedStart, timedEnd), 'valid range (end after start) accepted');
assertTrue(!isValidDateOrder(timedEnd, timedStart), 'inverted range rejected');
assertTrue(!isValidDateOrder(timedStart, timedStart), 'equal start/end rejected');

// ---- Summary ----

console.log(`\n${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exit(1);
}
