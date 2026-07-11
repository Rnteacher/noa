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

## 2. Google Calendar Sync: Next Task

The sync functionality is deferred to the next phase, **Google Calendar Outbound Sync v1**.

### Recommended Design & Blueprint
- **API Scopes**: Requires Google OAuth API scopes for calendar editing (`https://www.googleapis.com/auth/calendar.events`).
- **Calendar ID Storage**: Store the target Google Calendar ID in database settings or environment variables (`GOOGLE_CALENDAR_ID`).
- **Mapping**: Map local database fields from `public.calendar_events` directly to Google Calendar Event resources:
  - `title` -> `summary`
  - `description` -> `description`
  - `starts_at`/`ends_at` -> `start.dateTime`/`end.dateTime` (or `start.date`/`end.date` if `is_all_day` is true).
  - `location` -> `location`
- **Idempotency**: Use the `google_calendar_event_id` column to store Google's event ID on insert. When updating or deleting, reference this ID directly.
- **Outbound Sync Rules**:
  - **Insert**: Call Google API `events.insert()`, receive Google ID, and write to `google_calendar_event_id` in the local DB.
  - **Update**: If `google_calendar_event_id` is present, call Google API `events.update()`.
  - **Delete**: If `google_calendar_event_id` is present, call Google API `events.delete()`.
- **Dry-run Mode**: Provide a "Sync Preview" flag where the admin sees which local additions, modifications, and deletions would be pushed to Google Calendar without making actual API mutations.
