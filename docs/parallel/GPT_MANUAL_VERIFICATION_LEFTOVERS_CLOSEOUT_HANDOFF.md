# GPT Manual Verification Leftovers Closeout Handoff

This task closes out the five remaining live-browser/manual verification items that had been tracked as open across prior handoff passes. All five were fully completed with real accounts and real browser sessions in this pass. No application code bugs were found; no code was changed.

---

## 1. Summary of Results

| # | Item | Result |
|---|------|--------|
| 1 | Wrong-domain Google OAuth rejection | **Fully verified live** |
| 2 | Cross-user in-app notification/badge test | **Fully verified live** |
| 3 | Genuine two-account Web Push test | **Fully verified live** |
| 4 | Live 403 test for `/api/admin/audit/export` | **Fully verified live** |
| 5 | Learning Groups mobile viewport spot-check | **Fully verified live** |

All five items that were previously documented as "manual-only" or "blocked by account availability" are now closed with real evidence. This required a second real Chrome browser profile (a personal Google account, for the wrong-domain test) and a second real institutional account, `studio@chamama.org` (already an active `staff`-only profile, pre-granted before this task), operated directly by the user in parallel with this session.

---

## 2. Phase 1 — Wrong-Domain Google OAuth Rejection

**Accounts used:** the user's real Google account outside the `chamama.org` domain, signed in via a separate Chrome browser profile with no prior session for the app.

**Result:** Fully verified live.
- Signing in with the non-allowed-domain account redirected to `/access-denied`, showing the correct localized message ("This Google account is not authorized to sign in to the staff app.") and a link back to `/login`.
- No console errors during the flow.
- Direct database check confirmed **no profile row** was created for the rejected account (`profiles` table unchanged) — matches the code path: `src/app/auth/callback/route.ts` checks `isEmailDomainAllowed(user.email)` and signs out immediately, *before* `syncProfileAfterOAuth` (the only function that writes to `profiles`) is ever called.
- The session was fully cleared: a subsequent request to `/dashboard` redirected to `/login`, confirming `src/proxy.ts`'s independent domain re-check (defense-in-depth) also holds even if a session had somehow persisted.

No bug found. The rejection logic worked exactly as designed on the first real attempt.

---

## 3. Phase 2 — Cross-User In-App Notification and Badge Test

**Accounts used:** `ronen@chamama.org` (super_admin, User A / actor) in the primary browser session; `studio@chamama.org` (active staff, no manager/super_admin role, User B / recipient) in a separate real browser, operated by the user.

**Steps performed:**
1. User B followed the test student (Alice Smith, `55000000-...0001`) via the UI. Baseline unread count: 0.
2. User A created a temporary student-card message ("CROSS-USER NOTIFICATION TEST MESSAGE - safe to delete") on Alice Smith's card.
3. Confirmed via direct database read: a `notifications` row was created for User B with `type: student_message.created`, `title: "New update on student card"`, `body: "A new message was added for Alice Smith."` — privacy-safe, containing no raw message text — and `deep_link: /students/55000000-...-0001`. **Zero** notification rows were created for User A (the actor does not notify themselves).
4. User B confirmed live: the notification appeared on `/notifications`, the `/more` badge count updated, clicking the notification navigated to Alice Smith's student card, and clicking "mark read" dropped the unread count. Confirmed via direct database read that `read_at` was set on the notification row.

No bug found. Cleanup: the temporary message was soft-deleted by its author (User A) immediately afterward; the database confirms `deleted_at` is set. The follow relationship between User B and Alice Smith was intentionally left in place at the user's request (harmless real app state, not test pollution).

---

## 4. Phase 3 — Genuine Two-Account Web Push Test

**Accounts used:** same as Phase 2.

**Steps performed:**
1. User B enabled browser push notifications from `/notifications`. Confirmed via direct database read: a real `push_subscriptions` row was created for User B, `is_active: true`, with a genuine FCM endpoint (`https://fcm.googleapis.com/fcm/send/...`).
2. User A performed the same student-message mutation described in Phase 2 (a single action served both Phase 2's in-app notification test and Phase 3's push test).
3. User B confirmed live: a real browser/OS push notification appeared, and clicking it focused/navigated to the correct student card.

This closes the previously-documented gap where only a single-account-plus-server-script substitution had been used. No bug found. Cleanup: at the user's request, the push subscription was left active (a legitimate real feature, not test pollution).

---

## 5. Phase 4 — Live 403 Audit Export Test

**Account used:** `studio@chamama.org` (active staff, no manager/super_admin role).

**Result:** Fully verified live.
- Navigating directly to `http://localhost:3000/api/admin/audit/export` while signed in as `studio` returned a plain **"Forbidden"** response — no CSV download occurred.
- Direct database read confirmed **zero** `audit_log.exported` rows exist in the entire `audit_logs` table, i.e. the denied request never reached (and could not have reached) the point in `src/app/api/admin/audit/export/route.ts` where `writeAuditLog` is called, since that call happens only after the `current_user_is_manager_or_super_admin` RPC check passes.
- Manager/super_admin export success itself was not re-exercised in this pass (a sandboxed `fetch` call was blocked by this session's tooling, unrelated to the app) — this exact path was already thoroughly browser-verified in the prior Admin Audit Log Viewer v2 pass, and the route code is unchanged since then.

No bug found.

---

## 6. Phase 5 — Learning Groups Mobile Viewport Spot-Check

**Method:** the user manually narrowed their own real browser to a mobile width (~375-390px) — automated viewport resizing via the browser-automation tool was attempted first but, consistent with a limitation already noted in an earlier pass this session, did not reliably change the actual rendered viewport, so the user performed the check directly instead.

**Result:** Fully verified live. The user confirmed, at a narrow mobile width: Timetable view, List view, and an open reschedule modal all render correctly — no problematic overflow, cards remain readable, and controls (filters, reschedule button, edit/archive) remain usable. No visual issues reported.

This closes the previous "nice-to-have, not reliably reproducible in an automated session" note with a genuine manual confirmation.

---

## 7. Bugs Found / Fixed

**None in application code.** One environment artifact was encountered and resolved without any code change:

- **HTTP 431 "Request Header Fields Too Large"** occurred in the `studio@chamama.org` browser on the first attempt to click "Follow" on Alice Smith's card, along with a client-side error fetching the unread notification count in `BottomNav`. This is caused by an oversized `Cookie` header sent to `localhost:3000`, most plausibly from stale/accumulated cookies built up over that browser's long history of testing against this local dev server (not from anything this task's code path wrote). Clearing cookies/site data for `localhost:3000` in that browser resolved it immediately and permanently for the remainder of this pass — the `Follow` action, push enablement, and every subsequent request all succeeded cleanly afterward with no recurrence.
- Code review of `src/lib/supabase/server.ts` and `src/lib/supabase/client.ts` confirms both use the standard `@supabase/ssr` cookie adapter pattern with no custom or oversized cookie writes; nothing in this application's code is responsible for the header bloat. No fix was made or needed.

---

## 8. Cleanup Performed

- Temporary student message on Alice Smith's card: soft-deleted (author self-delete), `deleted_at` confirmed set.
- `studio@chamama.org`'s follow relationship on Alice Smith and its push subscription: left active at the user's explicit request (real, harmless app state).
- No temporary calendar events or learning groups were created in this pass.
- No scratch SQL files were created; all database checks used inline read-only (or, for the one required insert/delete in a prior task's leftover cleanup — not applicable here) `curl` calls against the local REST API with the service-role key, consistent with prior passes in this session.
- No service-role client was used in any application code path exercised during this pass; the service-role key was only used for my own read-only verification `curl` calls outside the app, exactly as in every prior verification pass this session.

---

## 9. Validation Results

- `npm run check:no-hebrew-in-code` — Pass.
- `npm run lint` — Pass (0 warnings, 0 errors).
- `npm run build` — Pass (production build compiles successfully).
- `git diff --check` — Pass (only pre-existing line-ending warnings on documentation files; no trailing-whitespace violations).

No source code was changed in this pass, so no targeted re-test was required beyond the live verification already performed above.

---

## 10. Remaining Pilot-Readiness Blockers

None identified specific to these five items — all are now closed with live evidence. No new gaps were discovered during this pass.
