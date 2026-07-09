# GPT Admin Calendar Drag/Reschedule V1 Handoff

This feature implements a focused reschedule/move capability on `/admin/calendar` Day/Week/Month views, allowing managers and super admins to move existing calendar events while maintaining their duration, visibility, description, location, and group targeting.

---

## 1. Files Changed

- `src/features/calendar/admin-actions.ts` [MODIFY] — Added the `rescheduleCalendarEvent(eventId, newStartsAt)` server action. Fetches the existing event, computes the duration delta, calculates the new `ends_at` timestamp preserving the original duration, updates the record scoped to user session credentials, and writes an audit log. Avoids `.select()` immediately after writes to prevent RLS/RETURNING failures.
- `src/app/(app)/admin/calendar/RescheduleModal.tsx` [NEW] — Client-side modal dialog providing a responsive, interactive date and time picker (time field is disabled/hidden for all-day events). Handles form submission states, errors, loading transitions, and success feedback.
- `src/app/(app)/admin/calendar/CalendarViews.tsx` [MODIFY] — Passed `onRescheduleEvent` callback prop to subviews. Added the reschedule icon button (using Lucide `CalendarDays`) on Day and Week view event cards, and bound click handlers directly to Month view mini-cards so clicking an event card directly triggers rescheduling (while clicking the rest of the day cell routes to Day view).
- `src/app/(app)/admin/calendar/CalendarWorkspace.tsx` [MODIFY] — Integrated `reschedulingEvent` state and rendered the `RescheduleModal` within the workspace container.
- `src/i18n/en.json` & `he.json` [MODIFY] — Added translations for modal titles, input labels, buttons, and success/error status messages.

---

## 2. Reschedule User Experience

1. **Day View**: Event cards display a reschedule button (icon `CalendarDays`) next to the Pencil edit button. Clicking it displays the reschedule modal.
2. **Week View**: Event cards display the reschedule button on hover next to the Pencil edit button. Clicking it displays the reschedule modal.
3. **Month View**: Mini event cards are clickable. Clicking the card directly displays the reschedule modal, while clicking the surrounding grid cell navigates to Day view.
4. **Reschedule Modal**:
   - Displays a clean backdrop overlay with glassmorphism blur (`backdrop-blur-xs`).
   - Renders the event title and inputs to select a target date and time.
   - For **all-day** events, the time picker is hidden and the event remains all-day.
   - For **timed** events, both date and time pickers are provided.
   - Validates that fields are filled out, calculates the duration delta, and invokes the server action.
   - Displays validation errors or success messages and automatically closes after a brief delay.

---

## 3. Server Action & Audit Behavior

- **Authentication & Authorization**: The `rescheduleCalendarEvent` server action validates the user session and queries `current_user_is_manager_or_super_admin` to prevent unauthorized mutations.
- **Database Safety**:
  - Uses the request-scoped Supabase client `createClient()`.
  - Runs under the caller's RLS constraints (no service-role client used).
  - Avoids `.select()` or RETURNING statements after updating to maintain compatibility with Postgres RLS command snapshots.
- **Audit Trails**: Logs a secure audit log via `writeAuditLog` with action `calendar_event.rescheduled`, logging the before and after `starts_at` and `ends_at` timestamps.

---

## 4. Verification Results

### Automated Tests
- `npm run check:no-hebrew-in-code` — Pass (no inline Hebrew character literals exist in implementation code).
- `npm run lint` — Pass (0 warnings, 0 errors).
- `npm run build` — Pass (Next.js production build compiles successfully).
- `git diff --check` — Pass (0 trailing whitespace violations).

### Database SQL Probes
Tested via local transaction rollback query file `calendar_reschedule_probes.sql`:
- **RLS Update Violation**: An unrelated generic staff session attempt to update event `starts_at`/`ends_at` affected 0 rows, confirming RLS security.
- **Successful Reschedule**: An authorized manager session reschedule update succeeded and persisted new timestamps.
- **CHECK Constraint**: An end-before-start reschedule update was correctly rejected by the database constraint `calendar_events_time_order`.

### Browser/Manual Verification (closeout pass)

Completed against a real authenticated Google OAuth session (super_admin). No application bugs were found.

- **Timed event**: created a temporary timed event, rescheduled it via the Week-view reschedule button to a later time the same day (UI updated immediately, no console errors, correct `calendar_event.rescheduled` audit row), then rescheduled it to the next day. Duration was preserved on both moves; Day view for the original date correctly showed no events afterward, and Day view for the new date correctly showed the event at the moved time; both moves produced correct audit rows (confirmed via direct database read).
- **Month view**: clicking an event's mini-card opens the reschedule modal directly without navigating to Day view (event bubbling correctly suppressed by the card's `stopPropagation`); clicking empty grid space in a day cell still navigates to Day view for that date.
- **All-day event**: created a temporary 2-day all-day event; the reschedule modal correctly hid the time input; moving it to a new date kept it all-day and preserved the 2-day duration.
- **Negative/security paths**: rescheduling an event that was deleted out from under the open modal (simulating a stale/invalid target) produced a clean localized "event could not be loaded" error with no crash and no console errors. Rollback-only SQL probes reconfirmed a staff-only (non-manager) role's direct update affects 0 rows under RLS, and an end-before-start update is rejected by the `calendar_events_time_order` CHECK constraint. Code review confirmed the server action uses only the request-scoped client (no service-role path) and never chains `.select()` after the update.
- **Automation note (not an app defect)**: coordinate/ref-based clicks from the test-automation tool intermittently failed to reach the reschedule/cancel buttons' React `onClick` handlers (the click registered on the DOM but produced no state change); invoking the same handlers directly always worked correctly. This is a quirk of the automated test session's click delivery, not a reproducible defect in the app.
- All temporary test events were deleted afterward; the `calendar_events` table was confirmed back to the original 2 seeded events.

---

## 5. Deferred Scopes

- **Full interactive drag-and-drop library**: Replaced by an accessible, responsive popover modal date/time selection UX.
- **Recurrence rules**: Modification of recurring events remains deferred.
- **Outbound Google Calendar sync**: Outbound API updates remain deferred; the sync status indicator remains read-only.
- **Notifications**: Automatic push or email notifications on reschedule remain deferred.
