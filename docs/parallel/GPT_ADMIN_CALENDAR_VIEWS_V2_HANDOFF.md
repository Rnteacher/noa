# GPT Admin Calendar Views V2 Handoff

This task upgrades the Admin Calendar workspace to support multiple rich read views (List, Day, Week, Month) while keeping existing mutations fully stable.

---

## 1. Files Changed

- `src/features/calendar/admin-queries.ts` [MODIFY] — Added `google_calendar_event_id` to query SELECT and event mappings. Implemented range overlap query (`getAdminCalendarEventsForRange`) and date calculation utility helpers (`startOfWeek`, `endOfWeek`, `getEndOfMonth`, etc.).
- `src/app/(app)/admin/calendar/page.tsx` [MODIFY] — Handled query parameter parsed values, date fallbacks, custom views range queries, and instantiated the `CalendarWorkspace` wrapper.
- `src/app/(app)/admin/calendar/CalendarWorkspace.tsx` [NEW] — Client-side wrapper coordinating active views, selected date ranges, navigators, and dynamic sidebar creation/editing forms.
- `src/app/(app)/admin/calendar/CalendarViewSwitcher.tsx` [NEW] — Client tab toggle updating the URL state parameter `view`.
- `src/app/(app)/admin/calendar/CalendarDateNavigator.tsx` [NEW] — Client navigation bar updating the URL state parameter `date` and rendering localized date range headers.
- `src/app/(app)/admin/calendar/CalendarViews.tsx` [NEW] — Layout panels for Day, Week, and Month views, with event card detail elements, edit hooks, and Google Calendar sync indicators.
- `src/i18n/en.json` & `he.json` [MODIFY] — Added translation keys for view switcher names, navigator tags, weekdays, and sync statuses.

---

## 2. Implemented Features

### Calendar Read Views
1. **List View**: Preserves the original upcoming / today / week / month table listing layout.
2. **Day View**: Lists all events active during a selected day. Sorts timed events chronologically and displays all-day events in a separate panel at the top.
3. **Week View**: Displays a 7-day grid column (Sunday to Saturday) mapping events. Today is visually highlighted.
4. **Month View**: Renders a standard 35-day or 42-day calendar block. Dimmed cell displays represent dates outside the active month. Clicking a day cell shifts the view to Day view of that date.

### URL State Integration
- **`view=list|day|week|month`**: Sets the active rendering layout panel (default is `week`).
- **`date=YYYY-MM-DD`**: Sets the center anchor date for navigation (default is today's local date).
- **Navigation Controls**:
  - `Prev`/`Next` shift the selected anchor date relative to the active view (e.g., +/-1 day, 7 days, or 1 month).
  - `Today` resets the anchor to the current system date.

### Queries and RLS
- Event queries are made overlapping the active view range (`ends_at > startDate` and `starts_at < endDate`), ensuring multi-day and full-duration events display correctly.
- Operations remain strictly request-scoped and run under active session user permissions (no service-role calls).

### Sidebar Form Integration
- The sidebar form coordinates dynamically with all views:
  - Default state is "New event" (create mode).
  - Clicking any event's Pencil icon in any view (List, Day, or Week) immediately updates the sidebar to "Edit event" mode, pre-populating all values.
  - Clicking "Cancel" reverts the sidebar back to create mode.
- Safely maintains the Postgres RLS `RETURNING` fix (generates IDs client-side, never chains `.select()` after write actions).

### Sync Indicators
- Displays a clean visual icon for Google Calendar synchronization status:
  - **Synced** (green check icon) when `google_calendar_event_id` is present in the database.
  - **Not Synced** (gray alert icon) when absent.

---

## 3. Deferred Scopes

- **Timetable Drag-and-Drop mutations**: Drag-to-reschedule mutations remain deferred.
- **Recurrence rules**: Editing/modifying recurrence patterns in the UI remains deferred.
- **Outbound Google Calendar Sync API integration**: Actual sync actions remain deferred.

---

## 4. Validation Results

- `npm run check:no-hebrew-in-code` — Pass (no Hebrew character literals exist in implementation code; weekdays mapped to `he.json`).
- `npm run lint` — Pass (0 warnings, 0 errors).
- `npm run build` — Pass (compiled production build successfully).
- `git diff --check` — Pass (0 trailing whitespace violations).

---

## 5. Browser Verification

Completed in a later pass against a real authenticated Google OAuth session (super_admin) and a real Chrome browser. Summary (see `docs/12_CURRENT_STATE.md`'s "Latest Admin Calendar Views v2 browser verification results" for full detail):

- All 8 required URL/param combinations (`view=list|day|week|month`, invalid `view=bad`, invalid `date=bad`, and a `date` in a different month) rendered with no console errors; invalid `view`/`date` both fell back safely to the default.
- Prev/Today/Next all updated the URL correctly for every view; clicking a Month-view day cell correctly navigated to Day view for that date.
- Create/edit/delete of a same-day timed event was correctly reflected across List, Day, Week, and Month views and on the dashboard's Today/This Week cards, with no RLS/`RETURNING` regression in server logs.
- Edge cases verified live: an existing seeded multi-day event rendered correctly across every relevant day in Week and Month grids with no overflow; a newly created all-day event rendered in the separate all-day section of Day view; a newly created group-targeted event showed its target group name; an event spanning a month boundary (Jul 30 - Aug 1) appeared correctly on the relevant cells in both months' grids; the sync indicator correctly showed "Synced"/"Not synced" based on `google_calendar_event_id` in Day/Week/Month views (List view intentionally has no sync indicator, as it is the preserved legacy v1 row).
- All test events created during this pass were deleted afterward; the `calendar_events` table was verified to match its original 2-row seeded state.

**Bug found and fixed**: the week/day/month date-range label in `CalendarDateNavigator.tsx` rendered in reversed visual order under RTL — the label span had no explicit `dir`, so the browser's Unicode bidi algorithm displayed a range like `"5.7 - 11.7.2026"` (correct DOM text) visually as `"1.7.2026 - 5.7"` (reversed). Fixed with a one-line `dir="ltr"` addition on that span. Verified fixed live.

Validation after the fix: `npm run check:no-hebrew-in-code`, `npm run lint`, `npm run build`, `git diff --check` — all passed. No new migrations were needed.
