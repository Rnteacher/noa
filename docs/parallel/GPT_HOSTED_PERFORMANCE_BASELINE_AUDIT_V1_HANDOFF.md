# GPT Hosted Performance Baseline Audit v1 - Handoff

## Outcome

Hosted performance is not acceptable for real-data planning yet. The dominant hypothesis is a confirmed Vercel/Supabase region mismatch amplified by excessive request count and query waterfalls:

- Vercel dynamic functions: `iad1` (Washington, D.C./Virginia).
- Supabase: `ap-northeast-2` (Seoul), matching Vercel `icn1`.
- Hosted SQL execution: approximately `0.08-0.81 ms` for the audited reads.
- Slowest route: fake student card, `4.53-6.66 s` first navigation and about `10.05 s` reload signals.
- Fake student card path: approximately 24 initial hosted Auth/PostgREST/Storage calls before client background work.
- Vercel logs confirmed staff navigation prefetch/background request amplification.

The full evidence and limitations are in `docs/19_HOSTED_PERFORMANCE_BASELINE_AND_BOTTLENECK_AUDIT.md`.

## Main code findings

1. `src/proxy.ts` performs sequential `getUser()` and active-staff RPC checks on protected requests; pages repeat auth/access checks.
2. `src/features/students/queries.ts` has several dependent batches, duplicate manager checks, and a private-photo signed-URL request.
3. `src/app/(app)/students/[studentId]/page.tsx` repeats `getUser()` and `current_user_is_super_admin()` after `getStudentCard()`.
4. `src/components/ui/BottomNav.tsx` invokes unread count on every pathname and leaves default prefetch enabled for five protected dynamic routes.
5. `src/features/calendar/admin-queries.ts` fetches group options after events rather than in parallel.
6. Dashboard reads are parallelized but over-select announcement/calendar columns.
7. Audit filters scan up to 500 action and 500 entity rows on every page and fetch full JSON payloads for displayed rows.

## Database/index findings

- Safe hosted plans were sub-millisecond.
- Requested indexes already exist or have a constraint/partial-index equivalent except a dedicated `audit_logs.action` index.
- Do not add indexes in the next change without representative-volume evidence.
- Future candidates: audit composite filter/order indexes and `pg_trgm` student-name search indexes.

## Recommended next task

Run **Performance Fixes v1** before real-data import planning:

1. Controlled Vercel `icn1` region deploy with rollback and the same measurements.
2. Stop heavy protected-route prefetch and pathname-based unread-count refetching.
3. Remove duplicate student-card auth/role calls and reuse permission results.
4. Parallelize safe independent reads and reduce selected columns.
5. Add opt-in, PII-free timing instrumentation only in the fix task.
6. Re-measure before deciding on aggregate RPCs or indexes.

## Scope and safety

- Documentation only; no application code or schema changed.
- No real student data used.
- No secrets recorded or committed.
- RLS and security checks unchanged.
- No service-role client used for normal reads.
- The pre-existing `.gitignore` modification was preserved and not edited.

