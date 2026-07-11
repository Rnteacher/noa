# GPT Handoff: Google Calendar Outbound Sync v1

This document summarizes changes and details for the outbound Google Calendar Sync implementation.

---

## 1. Accomplishments & Scope
- **Outbound-Only Mirror**: Mirror calendar events from `public.calendar_events` to a single institutional Google Calendar.
- **Service Account (JWT Auth)**: Server-side JWT authentication via a Google Service Account using `googleapis`. No individual Google OAuth scopes required in the user login flow.
- **CSV Ingestion Card**: Integrates a "Google Calendar Outbound Mirror" control panel in `/admin/import-export` supporting school year previews and execution.
- **Sidebar Integration**: Compact "Sync Now" button inside the `/admin/calendar` edit sidebar drawer for individual unsynced events.
- **Resilient Deletes**: Remote Google event deletion happens inside `deleteCalendarEvent()`. If Google API throws an error (or 404), the local delete still proceeds to prevent administrator lockouts, with failures logged/audited.
- **Audit Logging**: Logs audit entries for sync preflight, runs, updates, insertions, and deletions.

---

## 2. File and Schema Overview

### Client & API Utilities
- [src/lib/google/calendar-client.ts](file:///d:/Projects/staff-app/src/lib/google/calendar-client.ts)
  - Reads `GOOGLE_CALENDAR_SYNC_ENABLED`, `GOOGLE_CALENDAR_ID`, `GOOGLE_CALENDAR_SERVICE_ACCOUNT_CLIENT_EMAIL`, and `GOOGLE_CALENDAR_SERVICE_ACCOUNT_PRIVATE_KEY` from `serverEnv`.
  - Escaped newlines (`\n` literals) are normalized at runtime via `.replace(/\\n/g, '\n')`.
- [src/features/calendar/google-calendar-mapping.ts](file:///d:/Projects/staff-app/src/features/calendar/google-calendar-mapping.ts)
  - Maps `calendar_events` records to `Schema$Event` resources.
  - Handles timezone (`Asia/Jerusalem`) for timed events.
  - Formats exclusive dates for all-day events (`new Date(dt).toISOString().split('T')[0]`).
  - Sets private extended properties (`chamama_event_id` and `chamama_source = 'staff_app'`).

### Server Actions
- [src/features/calendar/google-sync-actions.ts](file:///d:/Projects/staff-app/src/features/calendar/google-sync-actions.ts)
  - `previewGoogleCalendarSyncAction(schoolYearId)`
  - `runGoogleCalendarSyncAction(schoolYearId)`
  - `syncSingleCalendarEventAction(eventId)`
  - Revalidates router paths (`/admin/calendar`, `/admin/import-export`, `/dashboard`) and writes structured audits.
  - Gracefully recovers from remote deletions (`404` errors on update) by re-inserting the event.
  - Continues processing on row-specific errors but halts immediately on global `401`/`403` connection errors.

### UI Modifications
- [src/app/(app)/admin/import-export/page.tsx](file:///d:/Projects/staff-app/src/app/(app)/admin/import-export/page.tsx)
  - Retrieves `school_years` and passes sync configurations.
- [src/app/(app)/admin/import-export/ImportExportPanel.tsx](file:///d:/Projects/staff-app/src/app/(app)/admin/import-export/ImportExportPanel.tsx)
  - Renders Google Calendar Outbound Mirror card in the left stack. Handles preview/run transitions and displays detailed warning lists and sync counts.
- [src/app/(app)/admin/calendar/page.tsx](file:///d:/Projects/staff-app/src/app/(app)/admin/calendar/page.tsx)
  - Passes `isSyncConfigured` configuration check to workspace wrapper.
- [src/app/(app)/admin/calendar/CalendarWorkspace.tsx](file:///d:/Projects/staff-app/src/app/(app)/admin/calendar/CalendarWorkspace.tsx)
  - Renders a compact sync indicator and "Sync Now" button inside the Edit Sidebar drawer.

### Existing Actions Updated
- [src/features/calendar/admin-actions.ts](file:///d:/Projects/staff-app/src/features/calendar/admin-actions.ts)
  - `deleteCalendarEvent` queries `google_calendar_event_id` and fires `calendar.events.delete()` before removing the local row. Logs failures/deletions and handles errors resiliently.

---

## 3. Recommended Next Steps
1. **Sync Browser Verification v1**: Run manual end-to-end testing with configured test credentials to verify outbound insertions, updates, and resilient deletions visually in Google Calendar.
2. **Sync Deletion/Conflict Hardening v1**: Implement background reconciliation or secondary verification routines if two-way sync or strict integrity constraints become desired.
