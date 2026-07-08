# GPT Admin Calendar V1 Handoff

## Files changed

- `src/features/calendar/admin-queries.ts` (new)
- `src/features/calendar/admin-actions.ts` (new)
- `src/app/(app)/admin/calendar/page.tsx` (new)
- `src/app/(app)/admin/calendar/CalendarEventForm.tsx` (new)
- `src/app/(app)/admin/calendar/CalendarEventRow.tsx` (new)
- `src/app/(app)/admin/calendar/DeleteCalendarEventButton.tsx` (new)
- `src/components/layout/AdminShell.tsx` (Calendar nav item enabled)
- `src/i18n/en.json`
- `src/i18n/he.json`
- `docs/12_CURRENT_STATE.md`
- `docs/handoff.md`
- `docs/parallel/GPT_ADMIN_CALENDAR_V1_HANDOFF.md` (this file)

## Whether a migration was added

**No migration was added.** The existing `calendar_events` table, `calendar_event_groups` junction table, `event_visibility` enum, and RLS policies from the initial migration (`20260707111701_initial_schema_and_rls.sql`) are fully sufficient:

- `calendar_events`: `id`, `school_year_id` (not null), `title` (not null), `description`, `starts_at`/`ends_at` (not null, `ends_at > starts_at` check constraint), `is_all_day`, `recurrence_rule` (unused in v1), `visibility` (default `all_school`), `location`, `color_key` (unused), `push_enabled` (unused), `google_calendar_event_id` (unused), `created_by`/`updated_by`, timestamps. No soft-delete/archive column exists — deletion is a hard delete.
- `calendar_event_groups`: `id`, `event_id` (cascade), `group_id` (cascade), unique on `(event_id, group_id)`.
- `event_visibility` enum: `all_school`, `groups`, `staff_only`, `leadership_only`.
- RLS: SELECT via `current_user_can_read_calendar_event(id)`; INSERT requires `current_user_is_manager_or_super_admin() AND created_by = auth.uid()`; UPDATE and DELETE require `current_user_is_manager_or_super_admin()`. `calendar_event_groups` SELECT mirrors the parent event's visibility check; INSERT/UPDATE/DELETE ("for all") require `current_user_is_manager_or_super_admin()`.

## Calendar management behavior

`/admin/calendar` lists events with four date-range filters (upcoming/today/week/month, matching the day/week boundary logic already used by `src/features/dashboard/queries.ts`), a create form in a sticky side panel, and per-row inline edit (toggled via `CalendarEventRow`) plus delete. `createCalendarEvent`, `updateCalendarEvent`, and `deleteCalendarEvent` in `src/features/calendar/admin-actions.ts` all use the normal request-scoped Supabase client — no service-role client is used anywhere in this feature.

Validation performed both client-side (`CalendarEventForm`) and server-side (`validateCalendarEventInput` in `admin-actions.ts`): title required (≤160 chars), description ≤2000 chars, location ≤160 chars, visibility must be one of the four enum values, start/end must parse as valid dates, end must be strictly after start (also enforced at the database level by the pre-existing `calendar_events_time_order` check constraint), and when visibility is `groups`, at least one valid-UUID group id is required.

The current school year is resolved automatically via `school_years.is_current = true` on create; there is no school-year picker in v1, since none was requested and the schema already has exactly one "current" year via a partial unique index.

## Important finding: RLS + `RETURNING` interaction

While probing permissions, a genuine Postgres/RLS interaction was discovered (not introduced by this task, pre-existing in the original schema): `calendar_events`' SELECT policy (`current_user_can_read_calendar_event`) is a `security definer` function that re-queries `calendar_events` by id. Because that subquery runs within the same command as an `INSERT`/`UPDATE ... RETURNING`, it uses the same command snapshot and cannot see the row that same statement just wrote or modified. Consequently, `INSERT`/`UPDATE` on `calendar_events` **succeed** under RLS, but immediately chaining `.select()` (which Supabase's client turns into `RETURNING`) on the same statement **fails** RLS — even for a fully authorized manager or super admin.

This was confirmed with direct rollback-only SQL probes: a plain `INSERT`/`UPDATE` (no `RETURNING`) succeeded for `manager.one`, while the identical statement with `RETURNING id, title` failed with `new row violates row-level security policy for table "calendar_events"`.

The fix applied is purely at the application layer, with no schema change and no authorization bypass: `createCalendarEvent` generates the event's `id` client-side with `crypto.randomUUID()` (via `node:crypto`) and inserts without `.select()`; `updateCalendarEvent` updates without `.select()` and builds its audit "after" payload from the already-validated input rather than re-fetching via `RETURNING`. The "before" audit payload for updates and deletes still comes from a separate, prior `SELECT` against the already-committed row, which is unaffected by this issue (that SELECT runs as its own independent statement/transaction, not chained onto the mutating statement).

This limitation and the workaround are documented in a code comment at the top of `src/features/calendar/admin-actions.ts` and in `docs/12_CURRENT_STATE.md`.

## Permission model

- **Create/update/delete**: managers and super admins only, via `current_user_is_manager_or_super_admin()` on the RLS insert/update/delete policies, matching the RBAC matrix ("Manage annual calendar": school manager and super admin only). Leadership-role holders, mentors, masters, counselors, and general staff cannot mutate calendar events — confirmed by rollback-only RLS probes (leadership-only insert denied, mentor insert denied, unrelated staff insert/update/delete all denied or affected 0 rows).
- **Read**: `current_user_can_read_calendar_event`, unchanged from the existing schema — `all_school`/`staff_only` visible to any active staff member, `leadership_only` visible to leadership-or-above (which includes managers/super admins), `groups` visible to the target groups' mentors/masters plus leadership-or-above.
- Each server action independently re-checks `current_user_is_manager_or_super_admin()` before mutating, in addition to relying on RLS, per the RBAC implementation notes (UI hide + server check + RLS enforcement).

## Event targeting model

When `visibility = 'groups'`, the selected `student_groups` ids are inserted into `calendar_event_groups` alongside the event. On update, the full target-group set is replaced (`delete` all existing links for the event, then re-insert the newly selected set) inside the same server action call — this keeps the junction table exactly in sync with the form's checkbox state rather than diffing individual rows. Group options are fetched from active (`is_active = true`) `student_groups` rows.

## Audit logging behavior

- `calendar_event.created`: entity id is the client-generated event UUID; after-data includes title, start/end, visibility, and target group ids.
- `calendar_event.updated`: before-data is the event row fetched immediately prior to the update (already committed); after-data is built from the validated input (title, description, start/end, all-day, visibility, location, target group ids) plus the event id.
- `calendar_event.deleted`: before-data is the event row fetched immediately prior to the delete.
- All three use the existing privileged server-only `writeAuditLog` helper; audit failures are logged to the console but never block the mutation.

## UI behavior

`/admin/calendar` follows the same desktop-first two-column layout pattern as `/admin/announcements` (dense table + sticky create panel on the side). The table shows title/location, start, end, all-day indicator, visibility (plus target group names when applicable), and per-row edit/delete actions. Clicking edit swaps the row for an inline `CalendarEventForm` in edit mode (pre-filled, including converting stored ISO timestamps to `datetime-local` input values); clicking the close icon or a successful save collapses it back to the read-only row. Delete uses a native `window.confirm` dialog naming the event title before calling the server action, matching the existing `DeleteAnnouncementButton` pattern. All buttons show a loading spinner via `useTransition` and localized success/error text.

## Dashboard regression notes

- The dashboard's existing `calendar_events` queries in `src/features/dashboard/queries.ts` were not modified and require no changes — they are unaffected by the RLS/`RETURNING` finding above, since they are plain reads (no insert/update chaining).
- Both `createCalendarEvent` and `updateCalendarEvent` call `revalidatePath('/dashboard')` in addition to `revalidatePath('/admin/calendar')`.
- A rollback-only SQL probe confirmed a manager-created `all_school`-visibility event scheduled for "today" is readable by an unrelated staff member using the exact date-range predicate the dashboard's "Today at Chamama" query uses (`starts_at < tomorrow AND ends_at > today`), verifying the dashboard regression path end-to-end at the database level.
- `npm run build` succeeded with `/dashboard` and `/admin/announcements` still compiling and listed as dynamic routes alongside the new `/admin/calendar` route.

## Deferred calendar/sync items

- Google Calendar outbound sync (the `google_calendar_event_id` column exists but has no sync logic).
- Recurrence (the `recurrence_rule` column exists but has no interpretation/materialization logic).
- Drag-and-drop event creation/move/resize.
- The full Day/Week/Year-Gantt view switcher described in the admin desktop UX design doc; v1 is a filterable list/table only.
- Event push notifications (the `push_enabled` column exists but is unused).
- A school-year picker for events outside the current school year.

## Validation results

Commands run:

```bash
supabase db reset
supabase gen types typescript --local | Out-File -Encoding utf8 src/types/supabase.ts
npm run check:no-hebrew-in-code
npm run lint
npm run build
git diff --check
```

Results:

- `supabase db reset`: passed, loaded `supabase/seeds/dev_seed.sql`. No migration was added, so this was a sanity re-check.
- Type generation: passed; `src/types/supabase.ts` showed no diff, confirming no schema drift.
- `npm run check:no-hebrew-in-code`: passed.
- `npm run lint`: passed.
- `npm run build`: passed; `/admin/calendar` is registered as a dynamic route alongside existing routes.
- `git diff --check`: passed with line-ending normalization warnings only.
- Anonymous `GET /admin/calendar`, `GET /dashboard`, and `GET /admin/announcements` against the running production build all returned `307` to `/login`.
- Rollback-only database RLS probes confirmed: unrelated staff insert denied, leadership-only insert denied, manager insert with group targeting succeeded and inserted exactly one `calendar_event_groups` row, super admin update (without `RETURNING`) succeeded, unrelated staff update/delete affected 0 rows, a mentor could not delete another event's target-group rows, and an end-before-start insert was rejected by the `calendar_events_time_order` check constraint even for an authorized manager.
- A rollback-only probe confirmed a manager-created `all_school` event for "today" is readable by unrelated staff via the dashboard's exact date-range query shape.
- Seed event/group-link row counts were verified unchanged after all probes (2 events, 1 group link, matching the original seed).
- Authenticated browser smoke testing was not completed because local login is Google-only and the seeded email/password accounts do not create usable Supabase auth sessions for the protected app. Server-side validation, build checks, and database authorization probes all passed.
