# Admin Calendar Operations — Annual Gantt + Event Import/Export

This document tracks the placeholder audit, functional designs, and next-step sync preparations for the Chamama calendar administration features.

---

## 1. Admin Sidebar Navigation Placeholder Audit

A search across `src/components/layout/AdminShell.tsx` and related routes identifies the following admin-facing items:

| Translation Key / Label | Current Path | Status | Relevant to Noa's Gantt? | Recommended Order |
| :--- | :--- | :--- | :--- | :--- |
| `admin.nav.accessGrants` | `/admin/access-grants` | Active | No | Completed |
| `admin.nav.calendar` | `/admin/calendar` | Active | **Yes** | Active |
| `admin.nav.learningGroups` | `/admin/learning-groups` | Active | No | Completed |
| `admin.nav.announcements` | `/admin/announcements` | Active | No | Completed |
| `admin.nav.students` | `#` | Disabled / coming soon | No | 3rd Priority |
| `admin.nav.groups` | `#` | Disabled / coming soon | No | 4th Priority |
| `admin.nav.users` | `#` | Disabled / coming soon | No | 5th Priority |
| `admin.nav.audit` | `/admin/audit` | Active | No | Completed |
| `admin.nav.importExport` | `/admin/import-export` | **Enabled in this task** | **Yes (Events)** | 1st Priority |
| `admin.nav.settings` | `#` | Disabled / coming soon | No | 6th Priority |

### Rationale
- **Noa's Immediate Workflow**: Noa is planning the annual calendar (Gantt style) and wants to seed events easily (Import/Export). Thus, `admin.nav.importExport` is enabled and wired directly to the new `/admin/import-export` page.
- **Other placeholders**: Items like Students, Groups, Users, and Settings remain disabled as they do not affect Gantt calendar operations.

---

## 2. Google Calendar Sync: Completed

The sync functionality has been completed in the task **Google Calendar Outbound Sync v1**.

### Summary of Design & Implementation
- **API Scopes**: Uses Google service-account JWT auth with `https://www.googleapis.com/auth/calendar.events` scope.
- **Calendar ID Storage**: Stored in `GOOGLE_CALENDAR_ID` server-side env variable.
- **Mapping**: Matches local events fields to Google event summary, description, and location. Correctly handles timed vs all-day events (exclusive `end.date` formatting) and Jerusalem timezone. Private properties store internal IDs.
- **Idempotency**: Pushes local events and stores Google event ID in `google_calendar_event_id` in the local DB. Handles remote-deletion recovery.
- **Resilient Deletions**: Deletes remote Google events during local deletion, but fails gracefully (warns and deletes locally) if Google API is unreachable.
- **Sync Actions & UI**: Exposes preview and run sync in a dedicated panel on `/admin/import-export`, and single-event sync inside the calendar workspace.
