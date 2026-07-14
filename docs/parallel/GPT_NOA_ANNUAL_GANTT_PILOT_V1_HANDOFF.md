# GPT Noa Annual Gantt Pilot V1 Handoff

This milestone makes the admin calendar directly manipulable (click/drag/select/resize), forces Israeli `DD/MM/YYYY` + 24h date/time display everywhere, and activates a real student-group administration surface (`/admin/groups`) so Noa can maintain the annual Gantt and its groups without engineering help.

---

## 1. Architecture decision

- **Day/Week/Month**: `@fullcalendar/react` + `@fullcalendar/{core,daygrid,timegrid,interaction}` (all MIT, `^6.1.21`), confirmed compatible with React 19.2.4 before installing. No premium plugins.
- **Year/Gantt**: stays fully custom (as instructed), enhanced with hand-rolled pointer-event move/resize.
- **Date/time**: hand-built `ILDatePicker`/`ILTimeInput` components + centralized `src/lib/date/il-date.ts` helpers, `Asia/Jerusalem`-pinned via `Intl`. No new date-picker dependency (matches this repo's existing all-hand-built-UI convention).
- Full rationale and research findings: `docs/28_NOA_ANNUAL_GANTT_PILOT_V1.md`.

---

## 2. Files Changed

**New:**
- `src/lib/date/il-date.ts` — centralized IL date/time helpers (parse/format DD/MM/YYYY + HH:mm, Jerusalem-pinned zoned conversion, all-day exclusive-end helpers, move/resize date math primitives).
- `src/features/calendar/constants.ts` — `DEFAULT_EVENT_DURATION_MINUTES = 60`.
- `src/components/date/ILDatePicker.tsx`, `src/components/date/ILTimeInput.tsx` — hand-built RTL-aware DD/MM/YYYY popover picker and HH:mm masked input.
- `src/app/(app)/admin/calendar/FullCalendarView.tsx` — FullCalendar wrapper for Day/Week/Month, replacing the old hand-rolled grids for those three views only.
- `src/app/(app)/admin/calendar/QuickCreateModal.tsx` — minimal-input quick-create panel with an "advanced fields" disclosure.
- `src/features/groups/{types,admin-queries,admin-actions}.ts` — new groups feature module.
- `src/app/(app)/admin/groups/{page,GroupsWorkspace,GroupForm,GroupRow,MentorAssignmentPanel,ArchiveGroupButton}.tsx` — new `/admin/groups` route.
- `supabase/migrations/20260714074316_managers_can_manage_student_groups.sql` — RLS-only migration (see below).
- `scripts/calendar/verify-date-and-scheduling.ts` — standalone `npx tsx` assertion script (`npm run test:calendar`), 53 assertions.

**Modified:**
- `src/app/(app)/admin/calendar/CalendarWorkspace.tsx` — wires `FullCalendarView`/`QuickCreateModal`, adds a delete button to the edit panel, drops the now-unused `RescheduleModal` top-level wiring (moved to `CalendarEventRow`).
- `src/app/(app)/admin/calendar/CalendarViews.tsx` — stripped down to just the still-shared `SyncIndicator` export; the Day/Week/Month rendering it used to contain is superseded by `FullCalendarView.tsx`.
- `src/app/(app)/admin/calendar/CalendarYearGanttView.tsx` — added drag-to-move, edge-handle resize, click/drag-select-to-create ruler row, `dir="ltr"` timeline wrapper.
- `src/app/(app)/admin/calendar/CalendarEventForm.tsx`, `RescheduleModal.tsx` — swapped `datetime-local`/native date-time inputs for `ILDatePicker`/`ILTimeInput`; `RescheduleModal` now renders via `createPortal(..., document.body)` since it's triggered from inside a table row.
- `src/app/(app)/admin/calendar/CalendarEventRow.tsx` — added a dedicated reschedule button (opens `RescheduleModal`) as the List view's non-drag reschedule affordance; date/time cells now use the centralized `formatILDate`/`formatILTime` helpers wrapped in `dir="ltr"`.
- `src/app/(app)/admin/calendar/DeleteCalendarEventButton.tsx` — added an optional `onDeleted` callback.
- `src/features/calendar/admin-actions.ts` — added `moveCalendarEvent`/`resizeCalendarEvent`, sharing a private `applyCalendarEventTimeChange` helper with the existing `rescheduleCalendarEvent`'s permission/validation shape.
- `src/components/layout/AdminShell.tsx` — enabled the Groups nav item (`/admin/groups`, was a disabled `#` placeholder).
- `src/app/globals.css` — small `.il-fullcalendar` CSS custom-property overrides to align FullCalendar's theme with the existing zinc/emerald palette.
- `src/i18n/{he,en}.json` — new keys only, kept in sync; no Hebrew literals anywhere in code (`npm run check:no-hebrew-in-code` passes).
- `package.json` — FullCalendar dependencies + `test:calendar` script.

---

## 3. Migration

`supabase/migrations/20260714074316_managers_can_manage_student_groups.sql` — realigns the `student_groups`/`group_mentors` "manage" RLS policies from `current_user_is_super_admin()`-only to `current_user_is_manager_or_super_admin()`, matching the pattern `calendar_events`/`calendar_event_groups` already used. No table/column changes. `supabase gen types` rerun after `supabase db reset`; output was byte-identical to the pre-migration file (confirmed via diff), as expected for an RLS-only change. Full rationale in `docs/28_NOA_ANNUAL_GANTT_PILOT_V1.md` §3.

---

## 4. Server Action & Audit Behavior

- `moveCalendarEvent(eventId, newStartsAtIso, newEndsAtIso, newIsAllDay)` and `resizeCalendarEvent(eventId, newStartsAtIso, newEndsAtIso)` both: check session + `current_user_is_manager_or_super_admin` RPC, validate the UUID and date order, fetch the existing row for the audit `beforeData`, update only `starts_at`/`ends_at`(/`is_all_day`) via the request-scoped client, write `calendar_event.moved`/`calendar_event.resized` respectively, `revalidatePath('/admin/calendar')` + `/dashboard`. Neither ever touches `google_calendar_event_id`.
- Groups actions (`createGroup`, `updateGroup`, `setGroupActiveState`, `assignMentor`, `removeMentor`) follow the identical shape used by the existing `learning-groups` feature: `randomUUID()` before insert, no `.select()` chained after any write, request-scoped client throughout, `writeAuditLog` (service-role, already-approved) for `student_group.created/updated/activated/archived` and `group_mentor.assigned/removed`.
- Mentor removal is a soft-end (`active_until = today`), not a hard delete, matching the schema's existing `active_from`/`active_until` design (same pattern as `student_masters`).

---

## 5. Verification Results

### Automated

- `npx tsc --noEmit` — Pass.
- `npm run check:no-hebrew-in-code` — Pass.
- `npm run lint` — Pass (0 warnings, 0 errors; caught and fixed three React Compiler lint findings during development — a ref read during render in the Gantt view, and effect-based derived-state anti-patterns in both `ILDatePicker`/`ILTimeInput`, all fixed using React's documented "adjust state during render" pattern instead of `useEffect`).
- `npm run build` — Pass.
- `npm run validate:import -- docs/import/examples` — Pass.
- `git diff --check` — Pass (line-ending warnings only, no real violations).
- `npm run test:calendar` — Pass, 53/53 assertions (IL date parse/format round-trips including month/year/leap-day boundaries and DST offset changes, all-day exclusive/inclusive semantics, default-duration calculation, move/resize date math including a cross-month-boundary case, invalid-range rejection).

### Browser verification

Performed against a local-only, throwaway staff profile (`noa.browsertest@chamama.org`, manager role, deleted afterward — never a real account) after two pre-existing local Supabase bootstrap gaps (§7) were fixed live. All test data was deleted/reverted afterward; the local DB was independently confirmed back to the original 2 seed calendar events, 2 seed groups, 0 audit rows, and the original 8 seed auth users.

**Confirmed working, live:**
- Login as a manager, `/admin/calendar` and `/admin/groups` both load correctly with no console errors.
- Month view (FullCalendar): clicking a day opened Quick Create pre-filled with `20/07/2026` (DD/MM/YYYY confirmed), all-day defaulted on; created an event end-to-end, confirmed it rendered on the calendar and its `calendar_event.created` audit row was correct.
- Week view (FullCalendar): clicking a time slot opened Quick Create pre-filled with the correct date and `17:00` start time, all-day off, with the "ends automatically at 18:00" hint showing correctly (60-minute default) and the underlying FullCalendar slot mirror showing the matching `17:00–18:00` highlighted range — this also confirms the `slotDuration` fix (below) took effect.
- Edit panel: clicking an event opens the full edit form with the new `ILDatePicker`/`ILTimeInput` controls; the delete button (added to the edit panel per the plan) is present and functions correctly.
- Year/Gantt view: renders correctly with month columns and the new ruler row; a **trusted click** (verified via `computer.left_click`, not a synthetic JS event — see the drag caveat below) on the ruler correctly opened Quick Create, and a trusted click on an event bar/title correctly opened the full edit form — confirming the pointer-based click-vs-drag distinguishing logic itself fires correctly on real click input.
- Groups admin (`/admin/groups`): full round trip verified live — create a group, the mentor-count warning badge correctly shows "0 active mentors" with the fixed accessible label, assign a first mentor (warning still shows "1"), assign a second mentor (warning correctly disappears at 2), edit the group's name, archive it (correctly disappears from the active list, correctly appears under the archived filter), and confirm a calendar event already targeting that group still renders safely after archiving while the archived group no longer appears in new-event group pickers.
- Audit trail: every action above produced the correct, distinct audit row (`calendar_event.created`, `student_group.created`, `student_group.updated`, `group_mentor.assigned` ×2, `student_group.archived`, `calendar_event.deleted` ×3) — confirmed via direct database read after the local `service_role` grants fix (§7).

**Real mouse-drag/resize verification — completed in a follow-up closeout pass.** The gap disclosed in the initial pass (this automated session's `computer` tool could not produce a genuine pixel-level drag, and synthetic JS `PointerEvent`s aren't trusted by the browser's `setPointerCapture`-based drag detection) was closed using an ephemeral Playwright installation: its own `package.json` in an OS-temp scratchpad directory, browser binaries in the global Playwright cache — **never added to this project's `package.json`, never committed**. Playwright drove genuine trusted mouse events (`page.mouse.move`/`.down`/`.up` with intermediate steps) against a real authenticated session (a throwaway local manager profile, deleted afterward). Full results are in §5a below.

---

## 5a. Real Browser-Automation Drag/Resize Verification (Playwright closeout pass)

All 10 required FullCalendar scenarios passed: same-day timed move, cross-day timed move, resize longer, resize shorter, all-day move, multi-day extend via the end handle, multi-day shorten, each independently confirmed via a direct database read of `starts_at`/`ends_at` after the drop/resize, `google_calendar_event_id` preservation confirmed unchanged on the event that had one, and the correct `calendar_event.moved`/`calendar_event.resized` audit-action name confirmed for every operation.

All 6 required Year/Gantt scenarios passed: drag a bar horizontally to another date, drag the right edge to extend, drag the right edge to shorten to exactly one day, drag the left edge to change the start date — each confirmed via a direct database read and the correct audit-action name.

A failure/revert check was performed for both surfaces, per the instruction to verify clean failure handling rather than assume it: a temporary event was loaded in the browser, then deleted directly in the local test database while it remained rendered (now stale) client-side, then a real drag was attempted on the stale element. In both cases: the server action's `existingEvent` fetch (used to build the audit `beforeData`) returned nothing, so it failed cleanly with `errorNotFound`, no error was thrown; no database row was recreated; no audit row was written (confirmed via `count(*)` before/after); a visible localized error banner (`role="alert"`) rendered; and the event visually reverted — FullCalendar's `info.revert()` restored the exact original time-slot (confirmed via the event harness's inline CSS `top` position, immune to any incidental page scroll during the drag), and the Gantt view's drag-preview offset reset to 0 on pointer-up and, since it never optimistically commits a new position before a successful `router.refresh()`, the bar simply stayed at its original coordinates. No browser crash or uncaught console error occurred in either case.

All synthetic test data (13 calendar events, 1 throwaway manager profile + its `auth.users`/`profile_roles` rows, and every audit row generated during the pass) was deleted afterward and confirmed at zero residual by four independent checks: by fixed event ID, by `title like 'PW %'` pattern, by `actor_id`, and by `email like '%dragtest%'`.

**One test-fixture bug (not an application bug) was found and fixed during this pass**: the harness's own seed script hardcoded a `+03` UTC offset for every test timestamp; Israel is `+02` outside daylight saving time (roughly late October–late March), so a January-dated fixture used for the "shorten to exactly 1 day" scenario was off by exactly one hour, initially producing a spurious 25-hour duration instead of the intended 24. Fixed by adding a small DST-aware Jerusalem-local-to-UTC conversion helper to the seed script, replicating the same single-correction round-trip algorithm already used by the application's own `src/lib/date/il-date.ts`. No application code changed as part of this fix.

---

## 6. Bugs found and fixed this session (before/during browser verification)

1. **Gantt resize-end boundary off-by-one**: shrinking an all-day multi-day event down to exactly 1 day via the *right* resize handle was incorrectly rejected client-side (the *left* handle correctly allowed it), an asymmetric boundary-comparison bug (`> 0` where `>= 0` was correct) caught during a careful re-review of `CalendarYearGanttView.tsx`, before any live drag was attempted. Fixed.
2. **Quick Create ignored a real dragged time range**: dragging a timed range in Day/Week view opened Quick Create but always fell back to the fixed 60-minute default instead of respecting the actual dragged end time, because `customEndTime` was never initialized from the selection. Fixed by initializing it from the range when not all-day, and by aligning FullCalendar's `slotDuration` with `DEFAULT_EVENT_DURATION_MINUTES` so a plain click and a real drag both flow through the same mechanism correctly (verified live: a Week-view slot click now shows the exact matching 60-minute default).
3. Three React Compiler lint findings (a Gantt-view ref read during render, and effect-based derived-state anti-patterns in both new date-input components) — see §5.

## 7. Local environment issues found (not application bugs)

Both were pre-existing local Supabase bootstrap gaps discovered while setting up an authenticated browser session for verification, fixed live in the local database only (never committed, never affecting the application's code or RLS policies):

1. Several seeded `auth.users` rows had `instance_id IS NULL` and `NULL` (rather than empty-string) token columns (`confirmation_token`, etc.), which crashes GoTrue's Go SQL scanner on any admin API call touching those rows (`converting NULL to string is unsupported`). Unrelated to this milestone's changes.
2. The local `service_role` Postgres role was missing baseline `SELECT/INSERT/UPDATE/DELETE` grants on `public` schema tables entirely (confirmed via `information_schema.role_table_grants` — the same gap existed on `calendar_events`, a table this milestone never touched), meaning `writeAuditLog` (which always used the already-approved service-role client) failed silently for **every** audit-logged mutation in this local environment, not just the new ones. This is a local bootstrap gap, not a migration-worthy fix — real/hosted Supabase projects get these grants automatically at platform provisioning time.

---

## 8. Deferred / Known Limitations

- Primary/secondary mentor designation is not exposed in the `/admin/groups` UI this milestone (schema still supports it; documented in `docs/28_NOA_ANNUAL_GANTT_PILOT_V1.md` §11).
- Gantt resize handles are pointer/mouse-only; the full edit form is the keyboard-accessible fallback for changing dates.
- All-day ↔ timed conversion via drag only works in the FullCalendar Day/Week/Month views, not the Gantt (whose rows are date-only).
- Students, Users, and Settings remain disabled placeholders — next milestone is **Admin Students, Users, and Settings Usability v1**.
