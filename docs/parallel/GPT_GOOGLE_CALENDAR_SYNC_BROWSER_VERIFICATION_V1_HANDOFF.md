# GPT Google Calendar Sync Browser Verification V1 Handoff

## Files Changed

- `src/features/calendar/google-calendar-mapping.ts` (bug fix)
- `src/features/calendar/google-sync-actions.ts` (bug fix)
- `docs/26_GOOGLE_CALENDAR_SYNC_BROWSER_VERIFICATION.md` (new)
- `docs/parallel/GPT_GOOGLE_CALENDAR_SYNC_BROWSER_VERIFICATION_V1_HANDOFF.md` (new, this file)
- `docs/12_CURRENT_STATE.md` (updated)
- `docs/handoff.md` (updated)
- `docs/25_GOOGLE_CALENDAR_OUTBOUND_SYNC.md` (updated)

Full report: [`docs/26_GOOGLE_CALENDAR_SYNC_BROWSER_VERIFICATION.md`](../26_GOOGLE_CALENDAR_SYNC_BROWSER_VERIFICATION.md).

## Test Environment

- Local Next.js dev server + local Supabase stack + local seed.
- Real, already-authenticated Chrome profile (Claude in Chrome), `ronen@chamama.org` (`super_admin` + `manager`). No credentials entered by the assistant.
- **Dedicated test Google Calendar** (`לוח שנה החממה`), separate from the school's real production calendars. Production calendar was never touched.
- Test service-account credentials configured locally by the user in `.env.local` (never committed, never read/printed by the assistant — only presence-checked).

## Flows Verified Live

| Flow | Result |
|---|---|
| Disabled/unconfigured regression | Pass |
| Preview sync (no mutations) | Pass |
| Insert sync | Pass |
| Update sync (in-place, no duplication) | Pass |
| Single-event sync ("Sync Now") | Pass |
| All-day mapping | Pass (after fix — was off by one day) |
| Multi-day mapping | Pass (after fix — was off by one day) |
| Remote deletion recovery | Pass (after fix — audit log was missing) |
| Local deletion → Google deletion | Pass |
| Deletion failure policy (code review) | Pass — matches documentation |
| Security/audit (no credential leakage) | Pass |
| Non-manager access denial | Verified by code review only (no second real account available) |

## Bugs Found and Fixed

1. **All-day/multi-day date-mapping off-by-one bug.** `getLocalDateString()` in `google-calendar-mapping.ts` extracted the Google `date` field using UTC getters, assuming the stored timestamp was already UTC midnight. Because all-day timestamps are actually produced by naive local-time parsing on the Node server (this app's real deployment timezone, `Asia/Jerusalem`, is UTC+3 in July), a local midnight is stored as `21:00 UTC` the previous day, and the old UTC-based extraction read the wrong calendar day. Every all-day/multi-day event synced to Google appeared one day too early. Fixed by extracting the date via an explicit `Intl.DateTimeFormat` with `timeZone: 'Asia/Jerusalem'`, matching the timezone already used for timed events. Verified live: a single-day event and a 3-day multi-day event both corrected to the intended dates after re-sync.

2. **Remote-deletion-recovery path had no audit log.** When a sync hits a `404` on `events.update()` (the remote Google event was deleted out-of-band) and recreates it, both the batch sync loop and `syncSingleCalendarEventAction` updated the local `google_calendar_event_id` but never called `writeAuditLog`, unlike the normal insert/update paths. Fixed by adding a `calendar_google_event.recreated` audit entry (with both new and previous Google event IDs) to both recovery branches. Verified live by forcing a real `404` (see limitations below) and confirming the audit row.

Both fixes are minimal and scoped exactly to the confirmed defects; no unrelated refactoring was done.

## Limitations / Testing Notes

- **Google Calendar tombstone behavior (not a bug):** deleting an event directly in the Google Calendar UI and immediately re-running sync did not reliably produce a `404` — Google retains a `status: cancelled` tombstone for a period, and `events.update()` against it can silently "revive" the event under the same ID instead of failing. To reliably exercise the app's 404-recovery code path, the local `google_calendar_event_id` was set to a synthetic, well-formed but nonexistent value directly via SQL (a legitimate one-off test technique — no committed code or real data was touched). This is a good candidate for the recommended follow-up hardening task.
- The non-manager permission-denial check was verified by code review only (`checkAdminAuth()` in `google-sync-actions.ts`, backed by the `current_user_is_manager_or_super_admin()` SQL function) — no second real Google-authenticated test account was available this session.

## Cleanup

All temporary local and Google Calendar test events were deleted after verification, including two orphaned duplicate Google events left over from the synthetic-404 testing technique (each forced recovery correctly created a new Google event, exactly as designed — the orphans were a side effect of manually corrupting the linked ID via SQL, not a code defect). `calendar_events` confirmed back to the exact 2-row seed baseline. Audit log rows from this session were left in place, which is expected and acceptable.

## Validation Results

- `npm run check:no-hebrew-in-code` — Pass
- `npm run lint` — Pass
- `npm run build` — Pass
- `git diff --check` — Pass
- No schema/migration changes were made.
- No real credentials or real calendar/student data were committed at any point.

## Recommended Next Task

**Google Calendar Sync Delete/Conflict Hardening v1** — the core sync flows are now confirmed correct after two real fixes, but this pass surfaced a concrete gap worth a dedicated task: Google's tombstone/soft-delete retention means a remote deletion just before a sync run may not 404 at all, and there is no designed behavior yet for that specific revival case or for other remote-conflict scenarios (e.g. an event edited directly in Google between syncs).
