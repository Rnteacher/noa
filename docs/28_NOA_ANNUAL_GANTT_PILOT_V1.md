# 28 — Noa Annual Gantt Pilot v1

This document tracks the architecture decision, implementation, and browser verification for making the admin calendar and student-group administration directly usable for Noa's day-to-day annual planning workflow.

---

## 1. Problem statement

Before this milestone, the admin calendar required typing both a start and end `datetime-local` value (locale-dependent, could render `MM/DD/YYYY`), had no drag/resize/click-to-create, and the student-group admin surface was a disabled sidebar placeholder even though the underlying `student_groups`/`group_mentors` tables already existed and were already wired into calendar event targeting.

---

## 2. Architecture decision

**Day/Week/Month views**: replaced the hand-rolled grids in `CalendarViews.tsx` with `@fullcalendar/react` + `@fullcalendar/daygrid` + `@fullcalendar/timegrid` + `@fullcalendar/interaction` (all MIT-licensed, no premium plugins), in a new client component `FullCalendarView.tsx`. Compatibility was confirmed before installing: `@fullcalendar/react` declares `react: '^16.7.0 || ^17 || ^18 || ^19'`, matching this repo's React 19.2.4; FullCalendar v6 auto-injects its own CSS (no manual `.css` import friction under the App Router); RTL is handled via the built-in `direction="rtl"` option plus a small `.il-fullcalendar` override block in `globals.css` to align FullCalendar's CSS custom properties with the existing zinc/emerald theme.

**Year/Gantt view**: stays fully custom, per instruction, enhanced in place (`CalendarYearGanttView.tsx`) with hand-rolled pointer-event drag (move) and edge-handle resize, using a 5px movement threshold to distinguish a click (open edit) from a drag (move/resize). A new interactive "ruler" row was added directly below the month header specifically for click/drag-to-select date creation, since the Gantt's rows are one-per-event (not a day grid), so there was no existing empty-cell surface to click.

**Israeli date/time**: centralized in `src/lib/date/il-date.ts`. All formatting/parsing is pinned to `Asia/Jerusalem` via `Intl.DateTimeFormat`/`Intl` timezone-aware conversion (a standard single-correction round-trip algorithm), not the host machine's local timezone — this is more robust than the pre-existing codebase convention of constructing `Date` objects from local components (which only produced correct results when the browser's OS timezone happened to be Israel). Two new hand-built components, `ILDatePicker` (popover day-grid, DD/MM/YYYY text field) and `ILTimeInput` (masked 24h HH:mm text field), replace every `datetime-local`/native date/time input in `CalendarEventForm.tsx`, `RescheduleModal.tsx`, and the new `QuickCreateModal.tsx`. No new date-picker dependency was added — this matches the existing codebase convention where every UI element (including `RescheduleModal`, `CalendarMonthView`, etc.) is hand-built with Tailwind, with no UI/date-picker library used anywhere else in the app.

**All-day event semantics**: all-day events store an **exclusive** end boundary (Jerusalem-local midnight of the day *after* the last inclusive day), matching FullCalendar's own native model exactly (no conversion needed when feeding events to/from FullCalendar) and Google Calendar's own all-day convention. A single-day all-day event spans exactly 24h.

**Quick create**: `QuickCreateModal.tsx`, opened from FullCalendar's `select` callback (Day/Week/Month — a plain click and a drag both route through the same callback with a 1-slot vs. multi-slot range) and from the Year/Gantt ruler. Minimal fields only (title, all-day toggle, start date/time, visibility, groups-if-`groups`); description/location/custom end date-time are under an "advanced fields" disclosure. `DEFAULT_EVENT_DURATION_MINUTES = 60` is centralized in `src/features/calendar/constants.ts` (a non-`server-only` file, importable from both client components and server actions).

**Drag/resize persistence**: two new server actions, `moveCalendarEvent` and `resizeCalendarEvent` (`src/features/calendar/admin-actions.ts`), sharing a private `applyCalendarEventTimeChange` helper with the same permission check (`current_user_is_manager_or_super_admin` RPC), date-order validation, and request-scoped Supabase client as the pre-existing `rescheduleCalendarEvent`. Distinct audit actions (`calendar_event.moved` / `calendar_event.resized`) so the audit trail can tell a drag-move apart from a drag-resize apart from a full-form edit. Neither action touches `google_calendar_event_id` — same update shape as the existing `rescheduleCalendarEvent`, so dragging/resizing a Google-synced event does not erase its sync link. On server failure, FullCalendar's `eventDrop`/`eventResize` callbacks call `info.revert()` (the library's built-in optimistic-revert primitive); the Gantt's custom drag reverts by clearing its local optimistic delta state, snapping the bar back to its last-known-good position.

**Groups admin**: new feature module `src/features/groups/{types,admin-queries,admin-actions}.ts` and route `src/app/(app)/admin/groups/`, mirroring the existing `learning-groups` feature's structure and conventions (same auth-check helper shape, same validate → write → audit → revalidate pipeline, same `randomUUID()`-before-insert convention, no `.select()` chained after writes). Mentor removal sets `active_until` to today (soft end, preserving history) rather than hard-deleting the `group_mentors` row, matching the schema's existing `active_from`/`active_until` design (the same pattern already used for `student_masters`). The "normally two mentors" business expectation is a **UI-only warning** (not a DB constraint) — the schema's only real constraint is "at most one active primary mentor," and `docs/03_DATA_MODEL_DRAFT.md`'s original `mentor_slot` design was never implemented, so inventing a hard cap here would have been out of scope. Primary/secondary mentor designation is not exposed in this milestone's UI (see Known Limitations) — all new assignments insert `is_primary=false`.

---

## 3. Migration

One migration: `supabase/migrations/20260714074316_managers_can_manage_student_groups.sql`.

**Why**: `calendar_events`/`calendar_event_groups` write policies already used `current_user_is_manager_or_super_admin()`, but `student_groups`/`group_mentors` write policies were still `current_user_is_super_admin()`-only from the initial schema migration. Since this milestone requires managers (not just super admins) to manage groups and mentors, the policies needed to be aligned with the calendar_events pattern, or manager writes would pass the application-layer permission check and then fail RLS.

**What it does**: drops and recreates exactly two policies (`"Super admins can manage student groups"` → `"Managers and super admins can manage student groups"`, same for `group_mentors`), swapping `current_user_is_super_admin()` for `current_user_is_manager_or_super_admin()`. No table/column changes.

**Rollback**: recreate both policies with `current_user_is_super_admin()` in place of `current_user_is_manager_or_super_admin()`.

`supabase gen types` was rerun after `supabase db reset` and produced a byte-identical `src/types/supabase.ts` (confirmed via diff), as expected for an RLS-only change.

---

## 4. Calendar interactions implemented

- **Click a day** (Month view, FullCalendar `select`): opens Quick Create pre-filled with that date, all-day defaulted on.
- **Click a time slot** (Day/Week view, FullCalendar `select`): opens Quick Create pre-filled with that date + start time; end time auto-calculated from `DEFAULT_EVENT_DURATION_MINUTES`.
- **Drag-select a date range** (Month view) or **time range** (Day/Week view): opens Quick Create with both boundaries pre-filled.
- **Drag an event** (Day/Week/Month, FullCalendar `eventDrop`): moves it, preserving duration; supports moving between the all-day row and the timed grid (FullCalendar reports this natively via `event.allDay`; the server action accepts an explicit `newIsAllDay` flag).
- **Resize an event** (Day/Week/Month, FullCalendar `eventResize`): changes duration from either edge (`eventResizableFromStart: true`).
- **Click an event**: opens the full edit form (existing `CalendarEventForm`, now with the new IL date/time controls) — this remains the accessible, keyboard-usable fallback per Phase 8.
- **Delete**: previously only available from the List view row and the (now-removed) Day/Week inline hover buttons; the delete button is now on the edit panel itself (`DeleteCalendarEventButton`, wired via a new optional `onDeleted` callback), so it's available consistently regardless of which view you're browsing from.
- **Reschedule via modal**: `RescheduleModal` (now using `ILDatePicker`/`ILTimeInput`) is preserved as a dedicated non-drag reschedule affordance, wired into the List view's row actions (`CalendarEventRow`) as a portal-rendered dialog (`createPortal(..., document.body)`, required since it's triggered from inside a `<tbody>` row).

---

## 5. Year/Gantt interactions implemented

- **Click an empty date on the ruler**: opens Quick Create for that single day (all-day).
- **Drag-select a date span on the ruler**: opens Quick Create with both boundaries pre-filled (all-day, multi-day).
- **Drag an event bar horizontally**: moves it (shifts both start and end by the same number of days, preserving duration and, for timed events, time-of-day), calling `moveCalendarEvent`.
- **Drag the left/right edge handles**: resizes the start or end boundary independently, calling `resizeCalendarEvent`. Handles are small (`w-2`) hit targets at each end of the bar with `cursor-ew-resize`, `title`/`aria-label` for discoverability.
- **Click a bar (no drag)**: opens full edit, distinguished from a drag via a 5px pointer-movement threshold.
- **Visual feedback while dragging**: the dragged/resized bar gets a live `left`/`width` delta applied from local state plus a `ring-2 ring-emerald-500` highlight; on server failure the delta state clears, snapping back to the last confirmed position.
- The whole Gantt grid (header, ruler, event rows) is wrapped in `dir="ltr"` so the timeline always reads chronologically left-to-right regardless of the page's RTL context — event titles inside bars stay `dir="rtl"` for correct Hebrew text shaping.
- Uses the same `moveCalendarEvent`/`resizeCalendarEvent` server actions as the FullCalendar views — no separate/inconsistent event model.

---

## 6. Israeli date behavior implemented

- Display is always `DD/MM/YYYY` + 24h `HH:mm`, computed against `Asia/Jerusalem`, never a native `<input type="date/time/datetime-local">` (whose rendered format depends on browser/OS locale).
- Storage stays ISO/UTC `timestamptz`, unchanged from the existing schema.
- `scripts/calendar/verify-date-and-scheduling.ts` (`npm run test:calendar`) exercises: normal dates, month/year boundaries (including a leap day), DST (confirms the same 10:00 Jerusalem wall-clock time produces a different UTC offset in January vs. July), all-day exclusive/inclusive semantics, default-duration calculation, move/resize date math (including a cross-month-boundary move), and invalid-range rejection. 53 assertions, all passing.

---

## 7. Group administration capabilities implemented

`/admin/groups`, enabled in `AdminShell` (previously a disabled placeholder pointing at `#`):

- View groups with active/inactive/all filter tabs (URL-driven, matching the `learning-groups` convention).
- School year, student count (live count of active `students` rows), and active mentor list/count per group.
- Create a group (name, school year, optional grade-level "layer" field).
- Edit name/school year/layer.
- Activate/archive (`setGroupActiveState`, distinct audit actions `student_group.activated`/`student_group.archived`).
- Assign a mentor (from active staff profiles not already actively assigned) and remove a mentor assignment (soft-ends `active_until`, not a hard delete).
- A warning banner + inline badge appear when a group's active-mentor count is not exactly 2 (the business expectation), without blocking the action — this is intentionally not a hard constraint (see Known Limitations).

Calendar integration: the calendar event form's group picker already read from `student_groups where is_active = true` before this milestone (no change needed there) — newly created/reactivated groups become selectable immediately (server-rendered, `revalidatePath` on save), archived groups stop appearing in new-event group pickers but a previously-created event that already targets an archived group still renders and remains editable (the join just resolves the group's current, possibly-archived, name).

---

## 8. Authorization and RLS

- All new/changed mutations (`moveCalendarEvent`, `resizeCalendarEvent`, `createGroup`, `updateGroup`, `setGroupActiveState`, `assignMentor`, `removeMentor`) use the request-scoped `createClient()` from `@/lib/supabase/server`, never the service-role client.
- The service-role client (`createServiceRoleClient`) is used only inside the pre-existing `writeAuditLog` helper — unchanged, already-approved infrastructure.
- Permission checks use the existing `current_user_is_manager_or_super_admin()` RPC everywhere, matching the established calendar/learning-groups pattern.
- IDs are generated client-side via `randomUUID()` before insert; no `.select()`/RETURNING is chained after any write, matching the project's documented workaround for the self-referential SELECT-RLS/RETURNING interaction.
- Only the migration described in §3 changes RLS, and it *aligns* `student_groups`/`group_mentors` with the already-existing `calendar_events` manager-access pattern — it does not introduce any new capability beyond what managers already had for calendar events.

---

## 9. Audit actions added

`calendar_event.moved`, `calendar_event.resized`, `student_group.created`, `student_group.updated`, `student_group.activated`, `student_group.archived`, `group_mentor.assigned`, `group_mentor.removed` — all following the existing `entity.verb` snake_case convention.

---

## 9a. Browser verification summary

Full detail in `docs/parallel/GPT_NOA_ANNUAL_GANTT_PILOT_V1_HANDOFF.md` §5 and §5a. In short: authenticated as a throwaway local manager profile (never a real account, deleted afterward), verified live end-to-end — Month/Week quick-create with correct `DD/MM/YYYY` display and correct default-duration behavior, Year/Gantt ruler click-to-create and event-bar click-to-edit (both via trusted click input), full Groups admin round trip (create/edit/mentor-assign/mentor-remove/archive) with correct mentor-count warning behavior and correct calendar-targeting behavior for an archived group, and correct audit rows for every action. All test data and audit rows were deleted afterward; the local database was confirmed back to the exact original seed baseline.

**Real mouse-drag/resize verification (closeout pass, completed)**: a follow-up pass used an ephemeral Playwright installation (own `package.json` in an OS-temp scratchpad, browser binaries in the global Playwright cache — never added to this project's dependencies, never committed) to drive genuine trusted mouse events (`mouse.move`/`mouse.down`/`mouse.up`) against a real authenticated session. All 10 required FullCalendar scenarios (same-day move, cross-day move, resize longer, resize shorter, all-day move, multi-day extend, multi-day shorten, each with a DB value check, `google_calendar_event_id` preservation check, and correct `calendar_event.moved`/`calendar_event.resized` audit-action check) passed. All 6 required Year/Gantt scenarios (drag bar horizontally, drag right edge to extend, drag right edge to shorten to exactly one day, drag left edge to change the start date, each with a DB value check and correct audit-action check) passed. A failure/revert check was also performed for both surfaces: a temporary event was loaded in the browser, then deleted directly in the database while still rendered (stale) client-side; a real drag was then attempted on the stale element. In both cases the server action failed cleanly (`errorNotFound`, since the row that was fetched to compute `beforeData` no longer existed), no database row was recreated, no audit row was written, the UI rendered a visible localized error banner, and the event visually reverted (FullCalendar's `info.revert()` restored the exact original time-slot position; the Gantt view's drag-preview offset reset to 0 and, since it never optimistically committed, the bar stayed at its original position) — with no browser crash or console error in either case. All synthetic test data (13 calendar events, 1 throwaway manager profile/auth user, all associated audit rows) was deleted afterward and confirmed at zero residual by four independent checks (by event ID, by title pattern, by actor ID, by email). One test-fixture bug (not an application bug) was found and fixed during this pass: the harness's seed script hardcoded a UTC+3 offset for all test timestamps, which is wrong for winter months (Israel is UTC+2 outside DST) and corrupted a January-dated fixture by exactly one hour; fixed by using the same DST-aware `Asia/Jerusalem` conversion algorithm as `src/lib/date/il-date.ts`.

Two pre-existing local-environment bugs (unrelated to this milestone's code) were found and fixed live in the local database only, never committed: `auth.users` rows with `NULL` `instance_id`/token columns crashing GoTrue's admin API, and the local `service_role` Postgres role missing baseline table grants entirely (silently breaking all audit logging, including for features that predate this milestone).

---

## 10. Google Calendar regression status

`moveCalendarEvent`/`resizeCalendarEvent` only ever update `starts_at`/`ends_at`(/`is_all_day`) — the same column set the pre-existing `rescheduleCalendarEvent` already touched — so `google_calendar_event_id` is never cleared by a drag or resize. No change was made to outbound sync logic, conflict semantics, or any inbound sync (none exists, and none was added).

---

## 11. Known limitations

- Primary/secondary mentor designation (from the original `docs/03_DATA_MODEL_DRAFT.md` design) is not exposed in the `/admin/groups` UI this milestone; all assignments insert as non-primary. The schema still only enforces "at most one active primary," so this can be layered on later without a migration.
- The Gantt's resize handles are pointer/mouse-only (not independently keyboard-focusable); the full edit form remains the keyboard-accessible way to change an event's dates, satisfying "dragging is not the only way to move an event."
- All-day ↔ timed conversion via drag is only wired for the FullCalendar Day/Week/Month views (where FullCalendar reports it natively); the Gantt view doesn't support this conversion via drag, since its rows/bars are date-only.

---

## 12. Next milestone

Per this task's explicit instruction, the next milestone after this one is **Admin Students, Users, and Settings Usability v1**. Students, Users, and Settings remain disabled placeholders in `AdminShell` — intentionally not filled with placeholder pages.
