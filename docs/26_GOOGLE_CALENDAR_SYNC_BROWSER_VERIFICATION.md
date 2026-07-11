# 26 — Google Calendar Sync Browser Verification v1

This document reports the results of live, browser-driven verification of Google Calendar Outbound Sync v1 (see [`docs/25_GOOGLE_CALENDAR_OUTBOUND_SYNC.md`](25_GOOGLE_CALENDAR_OUTBOUND_SYNC.md)) against a real dedicated test Google Calendar and a real Google service account.

> [!IMPORTANT]
> **Live verification passed.** A dedicated test calendar (`לוח שנה החממה`) and test service-account credentials, configured locally in `.env.local` by the human operator, were used for the entire pass. The production school calendar was **not** used. No real credentials, `.env.local`, or real student/calendar data were committed to the repository. Two real bugs were found and fixed during this pass (see below).

---

## 1. Scope and environment

- Local Next.js dev server (`npm run dev`), local Supabase stack (already running), local seed loaded via `supabase/seeds/dev_seed.sql`.
- Browser: the user's real, already-authenticated Chrome profile (Claude in Chrome), authenticated as `ronen@chamama.org` (`super_admin` + `manager`). No credentials were entered by the assistant.
- Test Google Calendar: a dedicated calendar (`לוח שנה החממה`), separate from the school's real production calendars (`תיכון החממה - תכנון שנתי`, `ימי הולדת חניכים`, etc., which remained untouched throughout).
- Test service-account credentials (`GOOGLE_CALENDAR_SYNC_ENABLED`, `GOOGLE_CALENDAR_ID`, `GOOGLE_CALENDAR_SERVICE_ACCOUNT_CLIENT_EMAIL`, `GOOGLE_CALENDAR_SERVICE_ACCOUNT_PRIVATE_KEY`) were configured locally by the user in `.env.local` before this pass began; their presence was checked programmatically (`present`/`missing` only) and their values were never read, printed, or logged by the assistant at any point.
- Only one real Google-authenticated account was available this session (matching the limitation noted in `docs/parallel/GPT_AUTHENTICATED_BROWSER_SMOKE_TEST_HANDOFF.md`), so the non-manager access-denial check (Phase 10) was verified by code review rather than a live second-account test.

## 2. Preflight

- `git status --short` was clean at the start; the prior commit `Add Google Calendar outbound sync` was confirmed present.
- No stray `task.md`, `walkthrough.md`, `implementation_plan.md`, `.env.local` (tracked), real-data CSVs, or manifests were found.
- `npm run check:no-hebrew-in-code`, `npm run lint`, `npm run build`, and `git diff --check` all passed before any changes were made.

## 3. Disabled/unconfigured regression check (Phase 2)

With `GOOGLE_CALENDAR_SYNC_ENABLED=false` (dev server restarted to pick up the change):

- `/admin/import-export` loaded correctly and the sync card showed **"Google Calendar Sync is not configured. Enable via server environment variables to begin."** with no Preview/Run buttons rendered (a safe form of "disabled").
- `/admin/calendar` still loaded and normal create/delete of a local event worked with no errors, confirming the sync-disabled code path doesn't break core calendar functionality.

Passed with no issues. The test sync configuration was restored afterward and the dev server restarted.

## 4. Preview sync (Phase 3)

With sync enabled, Preview Sync on `/admin/import-export` reported **"Will Create in Google: 2, Will Update in Google: 0"**, matching the 2 seeded `calendar_events` rows (neither previously synced). Server logs confirmed `previewGoogleCalendarSyncAction` executed in 64ms — a local DB-only read with **no Google API calls**, confirming preview performs no mutations.

**Passed.**

## 5. Insert sync (Phase 4)

Created a local event `Sync Test Event - Temporary` (07/20 09:00–10:00, description, location "Test Room A"). Confirmed it initially had no `google_calendar_event_id`. Ran sync: **"Created: 3, Updated: 0"** (the new event plus the 2 seeded events, none of which had synced before). Confirmed:

- Local `calendar_events.google_calendar_event_id` was populated.
- The event appeared in the test Google Calendar with the correct title, time (9–10am, timed, not all-day), description, and location.
- Audit trail: `calendar_google_sync.previewed` → `calendar_google_sync.started` → `calendar_google_event.inserted` (×3) → `calendar_google_sync.completed`.

**Passed.**

## 6. Update sync (Phase 5)

Edited the same event (title → `Sync Test Event - Temporary (Updated)`, time → 11:00–12:00, description, location → "Test Room B"). Ran sync again: **"Created: 0, Updated: 3"**. Confirmed:

- `google_calendar_event_id` was unchanged (`7ggklapl8vmpojld959g36o488` before and after) — the same remote event was updated in place, not duplicated.
- The Google Calendar event visually reflected all the edits.

**Passed.**

## 7. Single-event sync (Phase 6)

Created a second unsynced test event and used the compact **Sync Now** button in the `/admin/calendar` edit sidebar (only rendered for events without a `google_calendar_event_id`, in the Day/Week/Month/Year sidebar — not the List view's row-level edit form). The action succeeded (`Google Calendar: Synced ✓ — Synced successfully!`), `syncSingleCalendarEventAction` ran server-side with a real Google API call (~693ms), and the local `google_calendar_event_id` was populated.

**Passed.**

## 8. All-day and multi-day mapping (Phase 7) — bug found and fixed

Created a single-day all-day event, a 3-day multi-day all-day event, and a timed event crossing school hours (8am–4pm), then ran sync.

**Bug found:** all-day and multi-day events appeared **one calendar day too early** in Google Calendar (an intended July 22 single-day event showed as July 21; an intended July 24–26 multi-day event showed as July 23–25). The timed event was correct.

Root cause: `getLocalDateString()` in [`src/features/calendar/google-calendar-mapping.ts`](../src/features/calendar/google-calendar-mapping.ts) extracted the Google `date` field using `Date.prototype.getUTC*()` getters, implicitly assuming the stored `starts_at`/`ends_at` timestamp was already UTC midnight. In practice, all-day timestamps are produced by parsing a naive `datetime-local` string (no timezone) with the Node server's **local** timezone (`Asia/Jerusalem`, UTC+3 in July), so a local midnight is actually stored as `21:00 UTC` the previous day — and the buggy UTC-based extraction then read that as the wrong day.

Fix: `getLocalDateString()` now extracts the calendar date using an explicit `Intl.DateTimeFormat` with `timeZone: 'Asia/Jerusalem'` (matching the timezone already used for timed events), which correctly reverses the local-time interpretation applied at creation time regardless of what timezone the Node process happens to run in.

Re-ran sync after the fix (0 created, 7 updated — corrected the previously-wrong dates in place): the single all-day event now correctly showed July 22, and the multi-day event correctly showed July 24–26. The timed event remained correct throughout.

`npm run check:no-hebrew-in-code` and `npm run lint` both passed after the fix.

**Fixed and re-verified live.**

## 9. Remote deletion recovery (Phase 8) — bug found and fixed

Deleting the single-event-sync test event directly from Google Calendar and immediately re-running sync did **not** reproduce a real `404`: Google Calendar retains a tombstone (`status: cancelled`) for a period after deletion, and calling `events.update()` against that tombstoned ID silently "revived" it under the same event ID rather than returning 404. This is expected Google Calendar API behavior, not an app bug, and made the documented 404-recovery path hard to trigger via a simple "delete then immediately re-sync" test.

To reliably exercise the 404-recovery branch, the local `google_calendar_event_id` was set to a synthetic, well-formed but nonexistent value directly in the database (a legitimate test technique, not a change to committed code or data). Re-running sync against that fake ID reliably produced a real `404` from Google and triggered the recovery path: **"Created: 1, Updated: 6"**, a genuinely new Google event ID was assigned, and the event correctly reappeared in the test calendar.

**Bug found:** the 404-recovery branch (in both `runGoogleCalendarSyncAction`/`previewGoogleCalendarSyncAction`'s shared loop and `syncSingleCalendarEventAction`, in [`src/features/calendar/google-sync-actions.ts`](../src/features/calendar/google-sync-actions.ts)) recreated the Google event and updated the local `google_calendar_event_id`, but never wrote an audit log entry — unlike the normal first-time insert path, which does. This violated the explicit "audit the recovery/reinsert behavior" requirement and the documented "Audit Trails" claim in `docs/25_GOOGLE_CALENDAR_OUTBOUND_SYNC.md`.

Fix: both recovery branches now write a `calendar_google_event.recreated` audit log entry, including both the new and the previous (now-stale) Google event ID, mirroring the existing `.inserted`/`.updated` audit calls.

Re-ran the synthetic-404 scenario after the fix and confirmed the audit row:

```
action: calendar_google_event.recreated
after_data: {"eventId": "...", "googleEventId": "<new-id>", "previousGoogleEventId": "<old-id>"}
```

**Fixed and re-verified live.**

## 10. Local deletion → Google deletion (Phase 9)

Deleted a synced test event locally via `/admin/calendar`. Confirmed:

- The local event disappeared immediately.
- The corresponding Google Calendar event disappeared from the test calendar.
- Audit logs included both `calendar_google_event.deleted` and `calendar_event.deleted`, with correct event IDs and no credentials.

**Code review of the documented failure policy** (in `deleteCalendarEvent`, `src/features/calendar/admin-actions.ts`): if the Google deletion call fails with a non-404 status, a `calendar_google_event.delete_failed` audit row is written (error message only, no credentials) and **local deletion still proceeds unconditionally** afterward — this may leave a stale remote event, exactly as documented. A 404 (already gone) is silently ignored. This matches `docs/25_GOOGLE_CALENDAR_OUTBOUND_SYNC.md` exactly; no bug found in this path.

**Passed.**

## 11. Security and audit checks (Phase 10)

- Permission checks: all three sync entry points (`previewGoogleCalendarSyncAction`, `runGoogleCalendarSyncAction`, `syncSingleCalendarEventAction`) call a shared `checkAdminAuth()` helper backed by the `current_user_is_manager_or_super_admin()` `SECURITY DEFINER` SQL function. Verified by code review only (no second real Google-authenticated account was available this session to test live, matching the limitation noted in prior sessions).
- No service-account private key or client email appears anywhere client-visible: `src/lib/google/calendar-client.ts` is guarded by `import 'server-only'`; a full-text search of `.next/static` client bundles for private-key markers found zero matches; browser console messages contained only HMR/dev-tooling noise; the sync UI (`isSyncConfigured: boolean` prop) and all sync action return types (`SyncPreviewResult`, `SyncRunResult`, `CalendarActionResult`) carry only booleans, counts, error strings, and event IDs.
- Audit log rows for all `calendar_google_*` actions were scanned directly in the database and contain no credential-shaped content.
- `.env.local` was confirmed present but gitignored and untracked (`.gitignore:34`); it was never staged.

**Passed** (non-manager live test deferred to code review, as above).

## 12. Cleanup (Phase 11)

All temporary test events created during this pass were deleted from both the local database and the test Google Calendar, including two orphaned duplicate Google events that were an artifact of the Phase 8 synthetic-404 testing technique (each forced recovery correctly created a new Google event and abandoned the previous one, exactly as the recovery code is designed to do — the orphans were a byproduct of manually corrupting the ID via SQL, not a code defect). `calendar_events` was confirmed back to exactly the 2-row seed baseline. Audit log rows from this session remain, which is expected and acceptable.

## 13. Bugs found and fixed (summary)

1. **All-day/multi-day date mapping was off by one day** on any server running in a timezone ahead of UTC (e.g. `Asia/Jerusalem`, this app's real deployment target) — see §8. Fixed in `getLocalDateString()`.
2. **The 404-recovery (remote-deletion-recovery) path never wrote an audit log entry**, in both the batch sync and single-event sync actions — see §9. Fixed by adding a `calendar_google_event.recreated` audit call to both recovery branches.

Both fixes were minimal, targeted at the confirmed defect, and re-verified live against the real test Google Calendar API afterward.

## 14. Limitations

- The non-manager access-denial check (Phase 10) was verified by code review only; no second real Google-authenticated test account was available this session.
- Google Calendar's tombstone/soft-delete retention window means a genuine "delete in Google UI, then immediately re-sync" 404 is not reliably reproducible within a single short test session; the 404-recovery path was instead exercised deterministically via a synthetic invalid `google_calendar_event_id` (a legitimate testing technique that does not touch committed code or real data). This is a testing-methodology note, not an application defect, and is worth keeping in mind for the delete/conflict hardening follow-up task.

## 15. Validation results

```bash
npm run check:no-hebrew-in-code
npm run lint
npm run build
git diff --check
```

All passed after the two fixes.

## 16. Confirmation

- No real credentials were committed. `.env.local` remained gitignored and untracked throughout.
- No real calendar or student data was committed. All test events used clearly-labeled, harmless titles (`Sync Test ...`) on a dedicated test calendar, never the production school calendar.
- Files changed: `src/features/calendar/google-calendar-mapping.ts`, `src/features/calendar/google-sync-actions.ts`, plus this documentation set.

## 17. Recommended next task

**Google Calendar Sync Delete/Conflict Hardening v1.** This pass confirmed the core sync flows (preview, insert, update, single-sync, all-day/multi-day mapping, remote-deletion recovery, local-to-Google deletion) all work correctly after two real fixes, but also surfaced a concrete, documented gap worth hardening deliberately: Google Calendar's tombstone/soft-delete retention means a remote event deleted just before a sync run may not 404 at all (it can silently "revive" under `events.update()`), and the recovery/conflict story for that specific case is not yet designed or tested. A dedicated hardening task can address tombstone-revival detection, conflict handling for concurrently-edited remote events, and any further deletion-path edge cases without the time pressure of a first browser-verification pass.
