# Authenticated Browser Smoke Test Handoff

## 1. Test environment

- Local Next.js dev server (`npm run dev`), local Supabase stack (`supabase start`), local seed loaded via `supabase/seeds/dev_seed.sql`.
- `.env.local` confirmed present with all required vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_APP_URL=http://localhost:3000`, `GOOGLE_ALLOWED_DOMAIN`, `SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID`, `SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_SECRET`, `BOOTSTRAP_SUPER_ADMIN_EMAILS`.
- `supabase/config.toml` confirmed `[auth.external.google] enabled = true`.
- Browser: the user's real, already-authenticated Chrome profile, driven via the Claude Chrome extension (not a fresh/automated login flow). No credentials were entered by the assistant at any point.

## 2. Account/role used

- A single real Google account in the allowed domain, already signed in by the user before the test began. The account resolves to an active profile with **super_admin** role (via `BOOTSTRAP_SUPER_ADMIN_EMAILS`), which also grants access to all lower-privilege views (manager/leadership/mentor/counselor/master/staff-level pages) for verification purposes.
- No account secrets, tokens, or emails are recorded here beyond what's already documented in `.env.local`/`docs/12_CURRENT_STATE.md`.
- Only one account was available this session, so genuine cross-account behaviors (two different real users interacting) could not be fully exercised live in the UI; where relevant, they were instead verified by direct inspection of the database rows produced by the mutation (see section 6).

## 3. Routes tested

- Auth/shell: `/login`, `/dashboard` (anonymous redirect), Google sign-in, `/auth/sign-out`
- `/dashboard`
- `/students`, `/students/[studentId]` (search, identity, contacts, project, masters, emotional status, goals, messages)
- Student card: message composer/edit/soft-delete, project status update, emotional status update, goal create/edit/status/delete/primary-toggle, follow/unfollow, photo upload control
- `/announcements`, `/announcements/[announcementId]`
- `/admin/announcements` (list, create, acknowledge, delete)
- `/admin/calendar` (list, create, edit, delete, range filters)
- `/admin/learning-groups` (list, create, edit, archive)
- `/admin/audit` (list, filters, before/after JSON expansion)
- `AdminShell` nav vs. staff `BottomNav` shell-switch behavior across the above

## 4. Pass/fail results

| Area | Result |
|---|---|
| A. Auth/shell | Pass |
| B. Dashboard | Pass |
| C. Students | Pass |
| D. Student messages (create/edit/soft-delete) | Pass |
| E. Project status | Pass |
| F. Emotional status | Pass (mutation/permissions/audit correct; UI "latest badge" has a known seed-timing display quirk, not a code bug — see section 6) |
| G. Goals | Pass |
| H. Follow/notifications | Pass (verified via DB inspection for the live-click part — see section 6) |
| I. Photo upload | Partial — upload control renders correctly for authorized roles; actual file upload could not be exercised by the automated tooling (see section 6) |
| J. Announcements | Pass (after fix — was failing pre-fix, see section 5) |
| K. Calendar | Pass (after fix — was crashing pre-fix, see section 5) |
| L. Learning groups | Pass |
| M. Audit log viewer | Pass |
| N. Regression routes | Pass |

## 5. Bugs fixed

1. **`/admin/calendar` crashed for every user.** Next.js server error: a plain `formatDateTime` function was passed as a prop from the Server Component `page.tsx` to the Client Component `CalendarEventRow`, which Next.js disallows (only serializable data or `"use server"` actions may cross that boundary). Fixed in [CalendarEventRow.tsx](../../src/app/(app)/admin/calendar/CalendarEventRow.tsx) by defining `formatDateTime` locally inside the client component, and in [page.tsx](../../src/app/(app)/admin/calendar/page.tsx) by removing the now-unused function and the prop pass. Verified: page renders, create/edit/delete/dashboard-reflection all work.
2. **Admin announcement creation failed for every user, including super admins.** `createAnnouncementAction` in [admin-actions.ts](../../src/features/announcements/admin-actions.ts) chained `.select('id').single()` (i.e. `RETURNING`) immediately after `INSERT INTO announcements`. The `announcements` SELECT RLS policy is a security-definer function that re-queries the table by id; that subquery runs against the same command's snapshot and cannot see the row the same `INSERT` just wrote, so `RETURNING` fails RLS even for a fully authorized super admin (same root cause previously found and fixed for `calendar_events`, but never applied here). Fixed by generating the row's `id` client-side with `randomUUID()` from `node:crypto` and never chaining `.select()` after the insert. Verified: create (including "requires acknowledgement"), acknowledge, and delete all work; `deleteAnnouncementAction` and `learning-groups` actions were checked and already followed the safe pattern.

No schema/migration changes were needed for either fix; no seed data was touched.

## 6. Bugs deferred / manual-only items

- **Emotional status "latest" badge display (test-environment artifact, not a code defect):** the dev seed's emotional-status history rows are dated in the future (school year starting September 2026) relative to the real local clock at test time (July 2026). Since the "current status" view orders by `created_at DESC`, a freshly inserted real-time row is always chronologically older than the seeded row and never displays as "latest" locally. The mutation, permission checks, and audit trail were all confirmed correct directly against the database. Not fixed, by design: touching seed data risks breaking other tasks' date-dependent RLS scenarios, and the view's ordering logic itself is semantically correct.
- **Student photo upload (manual verification needed):** the upload control renders correctly and is gated to the correct roles, but the automated browser-tooling's file-upload capability only accepts files explicitly pre-shared with the session, so the actual multipart upload path could not be exercised end-to-end in this pass.
- **Wrong-domain Google account rejection (manual verification needed):** no second Google account outside the allowed domain was available this session to confirm the rejection path live.
- **Genuine two-account real-time notification click-test (manual verification needed):** only one live authenticated account was available. The notification-delivery pipeline was instead verified by directly inspecting the database: every student-card mutation performed during this test correctly created a notification row for a pre-existing seeded follower, with privacy-safe generic content, and never notified the acting user themselves.

## 7. Validation results

- `npm run check:no-hebrew-in-code` — Pass
- `npm run lint` — Pass
- `npm run build` — Pass
- `git diff --check` — Pass (no whitespace errors)
- No schema changes were made, so `supabase db reset` / type regeneration were not required.
- All test data created live in the UI during this pass (test messages, goals, announcements, calendar events, learning group edits, follow/unfollow toggles) was cleaned up afterward and verified via direct SQL to match the original seed state.
