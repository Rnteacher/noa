# Google Calendar Outbound Sync v1

This document explains the architecture, security boundaries, authentication flow, setup requirements, and event-mapping rules for the Google Calendar outbound sync implementation.

> [!IMPORTANT]
> **Implementation Status & Safety Guidelines:**
> - **Implementation Complete**: The database schema mapping, server actions, and UI components are fully implemented.
> - **Live Verification Passed**: Browser verification against a dedicated test Google Calendar and test service-account credentials is complete. Two real bugs were found and fixed during that pass (an all-day/multi-day date-mapping off-by-one, and a missing audit log on remote-deletion recovery); both are reflected below. See [`docs/26_GOOGLE_CALENDAR_SYNC_BROWSER_VERIFICATION.md`](26_GOOGLE_CALENDAR_SYNC_BROWSER_VERIFICATION.md) for the full report.
> - **Safety Boundary**: No real credentials or `.env.local` keys were committed to the repository.

---

## 1. Overview & Architecture

The Google Calendar Sync is designed as a **one-way outbound mirror** from the local database (`public.calendar_events` table) to a single configured institutional Google Calendar. 

- **Source of Truth**: The Chamama Staff App remains the absolute source of truth.
- **Inbound Sync**: There is **no inbound sync** from Google Calendar. Any manual modifications or additions made directly in Google Calendar will not reflect back inside this app.
- **Outbound Actions**:
  - **Batch Ingest/Sync**: Pushes new events (missing `google_calendar_event_id`) and updates existing synced events via the `/admin/import-export` dashboard.
  - **Single Sync**: Syncs a single event directly from the Edit Sidebar in `/admin/calendar`.
  - **Deletion**: When deleting an event locally that has a `google_calendar_event_id`, it is removed from Google Calendar.

---

## 2. Authentication Model

The app uses a **Google Service Account** (JWT Auth) to authenticate server-side:
- **No User Consent Needed**: Individual administrators (like Noa) do not need to individually sign in or grant calendar scopes inside the normal Google OAuth login flow.
- **Dedicated Credentials**: Credentials are kept server-side only and are never exposed to the client browser.
- **Target Calendar Access**: The target Google Calendar must be shared with the Service Account's email address with permission to **Make changes to events**.

---

## 3. Environment Variables

Configure these server-only variables in the hosting environment or `.env.local`:

- `GOOGLE_CALENDAR_SYNC_ENABLED`: Set to `true` to enable calendar sync UI cards and sidebar actions. Defaults to `false`.
- `GOOGLE_CALENDAR_ID`: The unique ID of the target institutional Google Calendar (e.g. `your-school@group.calendar.google.com` or `primary`).
- `GOOGLE_CALENDAR_SERVICE_ACCOUNT_CLIENT_EMAIL`: The client email generated for the Google service account.
- `GOOGLE_CALENDAR_SERVICE_ACCOUNT_PRIVATE_KEY`: The RSA private key of the service account. Escape newline characters (i.e. replace them with `\n` literal strings) when setting this value in a flat env format.

---

## 4. Event Mapping Rules

Local events are converted to Google Calendar event resources as follows:

| Local Table (`calendar_events`) | Google Event Resource (`Schema$Event`) | Notes |
| :--- | :--- | :--- |
| `title` | `summary` | String (validated max 160 chars) |
| `description` | `description` | Text |
| `location` | `location` | String |
| `starts_at` / `ends_at` | `start` / `end` | Handled differently for timed vs all-day events (see below) |
| `id` | `extendedProperties.private.chamama_event_id` | Private tracking property for idempotency |
| `source` | `extendedProperties.private.chamama_source` | Set to `'staff_app'` |

### All-Day Events
- Stored in the database at local (`Asia/Jerusalem`) midnight, which the server records as its UTC-equivalent timestamp (e.g. local midnight on 2026-09-01 is stored as `2026-08-31T21:00:00Z` in summer, when the server runs in `Asia/Jerusalem`).
- Mapped to pure Google dates by extracting the calendar date in the `Asia/Jerusalem` timezone (not raw UTC), so the mapping is correct regardless of which timezone the Node server process happens to run in:
  ```json
  "start": { "date": "2026-09-01" },
  "end": { "date": "2026-09-02" }
  ```
- Google's `end.date` boundary is **exclusive**, which aligns perfectly with how dates are stored in the local schema.
- **Bug found and fixed in browser verification**: the mapping previously extracted the Google date using raw UTC getters, which assumed the stored timestamp was already UTC midnight. On a server running in a timezone ahead of UTC (this app's real deployment target, `Asia/Jerusalem`), that assumption was wrong and every all-day/multi-day event synced one calendar day too early. See [`docs/26_GOOGLE_CALENDAR_SYNC_BROWSER_VERIFICATION.md`](26_GOOGLE_CALENDAR_SYNC_BROWSER_VERIFICATION.md) for details.

### Timed Events
- Mapped as full date-times with timezone:
  ```json
  "start": { "dateTime": "2026-09-01T08:00:00Z", "timeZone": "Asia/Jerusalem" },
  "end": { "dateTime": "2026-09-01T16:00:00Z", "timeZone": "Asia/Jerusalem" }
  ```

---

## 5. Sync Workflows

### A. Preview Sync
- Calculates the sync plan for the selected school year.
- Reads local events, counting those requiring insert (missing `google_calendar_event_id`) and update.
- Identifies malformed dates or missing titles as warnings.
- **No Google API mutations are made** during preview.

### B. Run Sync
- Loops through all local events for the school year.
- **Insert**: Pushes event, receives Google Event ID, and saves it in `calendar_events.google_calendar_event_id` without relying on `RETURNING` (to prevent RLS snapshot query issues).
- **Update**: Performs update on the existing remote ID. If Google returns `404 Not Found` (meaning the event was manually deleted from Google Calendar), it is automatically re-created, a new ID is linked, and a `calendar_google_event.recreated` audit row is written with the new and previous Google event IDs.
- **Note on Google's deletion tombstones**: Google Calendar retains a `status: cancelled` tombstone for a period after an event is deleted, and calling `events.update()` against a tombstoned event can silently revive it under the same ID rather than returning `404`. A remote deletion made just before a sync run may therefore not trigger the recreate path at all. This is a candidate for a future delete/conflict hardening task.

### C. Deletion Sync
- When deleting an event locally:
  - If a `google_calendar_event_id` is present, it attempts to delete it on Google.
  - **Resilient Deletion Policy**: If Google delete fails (due to connection failure or permissions), the error is logged as a warning, and the local deletion is **still allowed to proceed**. This prevents administrators from getting locked out of editing local calendars due to external network issues. Because of this, a failed remote delete may leave a stale event on the Google Calendar. This behavior is audited under `calendar_google_event.delete_failed` and was confirmed correct by code review during browser verification (live end-to-end local-to-Google deletion was also verified against the real test calendar; see [`docs/26_GOOGLE_CALENDAR_SYNC_BROWSER_VERIFICATION.md`](26_GOOGLE_CALENDAR_SYNC_BROWSER_VERIFICATION.md)).
  - If Google returns `404 Not Found`, the error is ignored and local deletion proceeds.

---

## 6. Security Boundaries

- **Audit Trails**: Sync start, sync completed, preview, individual insertions, updates, and deletions are logged to `public.audit_logs`.
- **No Credentials Logged**: Service account emails, private keys, and calendar access scopes are never logged or returned to the browser client.
- **Client Sanitization**: UI components only receive boolean configuration flags (`isSyncConfigured`) and counts; no credential strings are exposed.
- **RLS Preserved**: Server actions query the database via request-scoped Supabase client credentials representing the active session; RLS is never bypassed. Only managers and super admins have permissions to invoke sync actions.
