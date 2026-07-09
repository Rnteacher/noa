# GPT Admin Learning Groups Reschedule V1 Handoff

This feature implements a focused reschedule/move capability on `/admin/learning-groups` Timetable view, allowing managers and super admins to move existing learning groups to a different weekday and/or starts_at time slot.

---

## 1. Files Changed

- `src/features/learning-groups/admin-actions.ts` [MODIFY] — Added `rescheduleLearningGroup(learningGroupId, targetWeekday, targetStartsAt)` server action. Fetches the existing group, computes the duration delta, calculates the new `ends_at` time string, verifies the new slot remains within the 11:30–13:30 window, updates the weekday/starts_at/ends_at fields, and logs a secure audit event. Avoids `.select()` immediately after writes.
- `src/app/(app)/admin/learning-groups/LearningGroupRescheduleModal.tsx` [NEW] — Client-side modal dialog providing a weekday select dropdown and starts_at time picker. Dynamically computes the preview end time and range, and handles transition loading states.
- `src/app/(app)/admin/learning-groups/LearningGroupsTimetable.tsx` [MODIFY] — Passed `onRescheduleGroup` callback prop. Renders a calendar-days reschedule icon button next to the Pencil edit button on timetable cards.
- `src/app/(app)/admin/learning-groups/LearningGroupsWorkspace.tsx` [MODIFY] — Integrated `reschedulingGroup` state and rendered the `LearningGroupRescheduleModal` within the workspace container.
- `src/i18n/en.json` & `he.json` [MODIFY] — Added translation tags for modal headers, buttons, previews, and status results.

---

## 2. Reschedule User Experience

1. **Timetable Card Controls**: Hovering over a learning group card in the Timetable view displays a reschedule button (icon `CalendarDays`) next to the Pencil edit button. Clicking it triggers the reschedule modal.
2. **Reschedule Modal**:
   - Renders a clean backdrop overlay with glassmorphism blur (`backdrop-blur-xs`).
   - Displays the group title and inputs to select a target weekday and a new starts_at time.
   - Automatically computes and displays the resulting time range preview based on the original duration of the group (e.g. `Resulting time range: 11:30 - 13:00`).
   - Validates the time, calls the server action, displays status feedback, and automatically closes on success.

---

## 3. Server Action & Audit Behavior

- **Authentication & Authorization**: The `rescheduleLearningGroup` server action validates the user session and queries `current_user_is_manager_or_super_admin` to restrict mutations.
- **Database Safety**:
  - Uses the request-scoped Supabase client `createClient()`.
  - Runs under the caller's RLS constraints (no service-role client used).
  - Avoids `.select()` or RETURNING statements after updating to maintain compatibility with Postgres RLS command snapshots.
- **Audit Trails**: Logs a secure audit log via `writeAuditLog` with action `learning_group.rescheduled`, logging the before and after `weekday`, `starts_at` and `ends_at` timestamps.

---

## 4. Verification Results

### Automated Tests
- `npm run check:no-hebrew-in-code` — Pass (no inline Hebrew character literals exist in implementation code).
- `npm run lint` — Pass (0 warnings, 0 errors).
- `npm run build` — Pass (Next.js production build compiles successfully).
- `git diff --check` — Pass (0 trailing whitespace violations).

### Database SQL Probes
Tested via local transaction rollback query file `learning_groups_reschedule_probes.sql`:
- **RLS Update Violation**: An unrelated generic staff session attempt to update a learning group schedule affected 0 rows, confirming RLS security.
- **Successful Reschedule**: An authorized manager session reschedule update succeeded and persisted the new weekday and times.
- **CHECK Constraint (Time Order)**: An end-before-start reschedule update was correctly rejected by the database constraint `learning_groups_time_order`.
- **CHECK Constraint (Window Limit)**: Out-of-window reschedule updates (starts_at < 11:30 or ends_at > 13:30) were correctly rejected by the database constraint `learning_groups_standard_window`.

### Browser/Manual Verification (closeout pass)

Completed against a real authenticated Google OAuth session (super_admin). No application bugs were found.

- **Same-weekday reschedule**: created a temporary group on Sunday (no leader, no room) and moved it to a later time the same day via the Timetable reschedule button. The card moved to the new time with no console errors; adding a second temporary group at an earlier Sunday time confirmed the column still sorts chronologically.
- **Cross-weekday reschedule**: moved the same group from Sunday to Wednesday. It disappeared from the Sunday column and appeared in Wednesday's, with duration preserved; List view showed the new weekday/time; the `weekday=sunday`, `weekday=wednesday`, and `state=all` filters all behaved correctly afterward.
- **Boundary case**: moving the group to exactly 12:30–13:30 (the window's upper edge) succeeded, confirming the boundary is inclusive as designed.
- **Negative/security paths**: an out-of-window move (13:00 start, computed 14:00 end) produced a clean localized error and left the database row unchanged; rescheduling a group that was deleted out from under the open modal (simulating a stale/invalid target) produced a clean "could not be loaded" error with no crash. Rollback-only SQL probes reconfirmed a staff-only (non-manager) role's direct update affects 0 rows under RLS, and an end-before-start update is rejected by the `learning_groups_time_order` CHECK constraint. Code review confirmed the server action uses only the request-scoped client (no service-role path) and never chains `.select()` after the update.
- **Regression checks**: create, edit (from a Timetable card), and archive all still work correctly; groups with no leader and no room continue to render their fallback placeholders correctly.
- **Audit**: three `learning_group.rescheduled` audit rows were confirmed via direct database read, each with before/after data limited to `id`, `title`, `weekday`, `starts_at`, and `ends_at`.
- All temporary test groups were deleted afterward; the `learning_groups` table was confirmed back to the single original seeded group.

---

## 5. Deferred Scopes

- **Full interactive drag-and-drop weekly timetable editing**: Replaced by an accessible modal date/time selection UX.
- **Google Calendar sync indicators**: Deferred.
- **Notifications**: Automatic notifications on reschedule remain deferred.
- **Capacity/Roster/School-year selectors**: Remain deferred.
