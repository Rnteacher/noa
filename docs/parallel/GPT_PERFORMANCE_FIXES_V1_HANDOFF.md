# GPT Performance Fixes V1 Handoff

This handoff summarizes the actions taken and results achieved during the **Performance Fixes v1** task.

---

## 1. Files Changed & Created

- `vercel.json` [NEW] — Configured Next.js serverless functions to run in region `icn1` (Seoul), matching the hosted Supabase database location.
- `src/components/ui/BottomNav.tsx` [MODIFY] — Disabled link prefetching (`prefetch={false}`) and throttled unread-count checking to trigger only on mount and pathname transitions to/from notifications/more.
- `src/features/students/types.ts` [MODIFY] — Extended `StudentCardData` to pass caller context (`currentUserId` and `canDeleteAny`).
- `src/features/students/queries.ts` [MODIFY] — Optimized `getStudentCard` by parallelizing the super-admin check, removing duplicate inner RPC calls, and returning caller context.
- `src/app/(app)/students/[studentId]/page.tsx` [MODIFY] — Updated the page to reuse caller context, eliminating page-level sequential `getUser` and super-admin check requests.
- `src/features/calendar/admin-queries.ts` [MODIFY] — Parallelized database loads of calendar events and student groups in `getAdminCalendarData` and `getAdminCalendarEventsForRange`.
- `src/features/dashboard/queries.ts` [MODIFY] — Replaced calendar events `select('*')` with explicit column fields to prevent wildcard expansion.
- `src/lib/auth/profile.ts` [MODIFY] — Combined grant roles query with table join, bypassed database writes for correct/existing profiles/roles on OAuth login return, and exited early for returning users.
- `docs/20_PERFORMANCE_FIXES_V1.md` [NEW] — Created the performance improvements report and timing comparison.
- `docs/12_CURRENT_STATE.md` [MODIFY] — Appended performance fix results.
- `docs/handoff.md` [MODIFY] — Merged changes into handoff logs.

---

## 2. Completed Milestones

- **Safety preflight**: Checked git status and log. Confirmed hosted performance baseline audit commit `3ff4ae3` exists. Verified no secrets were staged.
- **Vercel region alignment**: Switched function region from Virginia (`iad1`) to Seoul (`icn1`). Verified using Vercel CLI that lambda functions are now deployed to `icn1`.
- **Request-count and waterfall reductions**:
  - Eliminated Link prefetching for protected staff nav items.
  - Reduced notification count checking from every pathname transition to mount/context transitions only.
  - Minimized student card waterfalls by combining checks and removing duplicated RPC queries.
  - Parallelized independent calendar fetches.
  - Replaced wildcard dashboard queries.
  - Combined grant roles query with a table join and bypassed redundant database writes on OAuth login return.
- **Local Validation**: Confirmed that `npm run build`, `npm run lint`, `npm run check:no-hebrew-in-code`, and `git diff --check` all pass clean.

---

## 3. Recommended Next Task

We recommend:
- **Pilot Real-Data Import Plan v1** — Since performance is now optimized, we are ready to plan the secure mapping and ingestion of real student records.
