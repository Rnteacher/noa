# 19 - Hosted Performance Baseline and Bottleneck Audit v1

Date: 2026-07-11
Hosted app: `https://noa-rho-dusky.vercel.app`
Hosted Supabase project: `qxjfzdmszgvymcuyuisu`
Scope: measurement and documentation only; fake dry-run data only

## 1. Executive summary

The hosted slowness is real on authenticated routes. The strongest supported explanation is not slow SQL and not a large client bundle. It is the combination of:

1. **A confirmed compute/data region mismatch.** The production Next.js functions are deployed in Vercel `iad1` (Washington, D.C./Virginia), while the Supabase project is in `ap-northeast-2` (Seoul). Vercel's own guidance says functions should run in the same region as their database where possible. Vercel exposes the matching Seoul region as `icn1`. See [Vercel function region configuration](https://vercel.com/docs/functions/configuring-functions/region) and [Vercel region list](https://vercel.com/docs/regions).
2. **Many separate Supabase HTTP calls per rendered route.** The proxy performs two sequential auth/access calls before dynamic page work. Pages then repeat user/access checks and issue more PostgREST/RPC calls. The fake student card reaches approximately 24 hosted Supabase/Auth/Storage requests for the initial document path before client-side background work.
3. **Several serialized query waves.** Parallel reads are already used in some modules, but the student card still has multiple dependent batches. Each batch pays the cross-region round trip.
4. **Automatic background work.** The staff `BottomNav` triggers an unread-count server action on every pathname and its visible links are prefetched by default. Vercel logs showed `/dashboard` loads followed by requests for `/today`, `/students`, `/announcements`, and `/more`, creating additional serverless and middleware work that is not required to display the current page.
5. **Cold starts are a secondary possibility, not the primary explanation.** Some first requests were slower than immediate repeats, but `/dashboard` and the student card remained slow across repeated measurements. Vercel CLI logs did not expose an explicit cold-start or function-duration field.

Hosted database execution itself is healthy at the current fake-data size. Safe `EXPLAIN ANALYZE` checks completed in approximately `0.08-0.81 ms`, and Supabase query statistics showed `current_user_is_active_staff()` using about `361.6 ms` across `541` calls (approximately `0.67 ms` per database execution). The time is therefore predominantly outside the SQL executor.

**Decision:** Do not proceed to the real-data import plan yet. Run **Performance Fixes v1** first, beginning with a controlled Vercel `icn1` region experiment and request-count reduction. No feature, RLS, schema, or index change was made in this audit.

## 2. Safety and baseline

- Part B is committed at `1d9a777` (`Document hosted dry-run execution part B`).
- The only pre-existing worktree change at audit start was `.gitignore`; it was not modified by this task.
- No listed secret/local path was tracked or staged: `.env.local`, `.vercel/`, `.supabase/.temp/`, `scripts/local/`, or local secret-bearing PowerShell files.
- `.env.local` and `.vercel/` were confirmed ignored.
- No real student data was imported, generated, or accessed. Only the retained fake dry-run student ID documented in Part B was used.
- No service-role client was used for normal app measurement or database reads.
- Initial validation passed: Hebrew scanner, lint, production build, and `git diff --check`.

## 3. Measurement method and limitations

Evidence sources:

- Chrome full-route navigation/reload wall-clock measurements from the operator workstation in Israel.
- Anonymous `curl` measurements for exact HTTP TTFB and total time.
- Authenticated Vercel CLI deployment inspection and recent runtime logs.
- Authenticated Supabase CLI project metadata, query statistics, index statistics, and read-only `EXPLAIN ANALYZE` statements.
- Local production-build client-reference manifests for comparable route JS/CSS size.
- Static code/query review.

Limitations:

- The available Chrome control surface did not expose the DevTools Network waterfall or authenticated navigation timing entries. Authenticated TTFB, document-response time, and per-resource timing therefore could not be separated from full navigation wall time.
- Chrome reload completion was inconsistent for some warm admin routes. Values under `100 ms` are recorded as warm-cache signals, not as reliable end-to-end document timings.
- Vercel CLI runtime logs exposed request source, path, status, and cache state, but not function duration or an explicit cold-start marker.
- Supabase Studio was unavailable to the active browser account during this pass; read-only database inspection was completed through the authenticated CLI instead.
- Plans reflect the intentionally tiny fake dataset. They establish current execution cost but do not predict plans after a large import.

## 4. Route timing baseline

| Route | First/full navigation | Repeat/reload signal | TTFB / document | Notable network or bundle evidence | Classification |
|---|---:|---:|---|---|---|
| `/login` unauthenticated | `216-256 ms` | `191-221 ms` | exact TTFB `217-256 ms`; total essentially equal | `X-Vercel-Cache: HIT`; hosted HTML `13.1 KB`; cold CLI fetches of individual JS assets were `0.32-0.49 s` each | Fast; not a cold-start problem |
| `/dashboard` authenticated | `2.67-3.62 s` | about `10.06 s` in two reload samples | not separable | 7-8 page calls, 2 proxy calls, then unread-count action and observed nav prefetch traffic | Slow on every tested pass; region/request amplification |
| `/students` authenticated | `1.80-3.13 s` | `2.55-10.05 s` | not separable | students query followed by current-project query; background staff-nav work | Variable, often slow |
| `/students/55000000-0000-0000-0000-000000000001` | `4.53-6.66 s` | about `10.05 s` in two samples | not separable | approximately 24 initial hosted calls with project + private photo; many serial waves | Slowest, repeatable query waterfall |
| `/admin/access-grants` | `1.73 s` | `46 ms` warm signal | not separable | 2 page calls + 2 proxy calls | First request slow; warm path much better |
| `/admin/calendar` | `4.62 s` | `75 ms` warm signal | not separable | 4 page calls + 2 proxy calls; groups fetched after events | First request slow; sequential page reads |
| `/admin/learning-groups` | `4.65 s` | `74 ms` warm signal | not separable | 6 page calls + 2 proxy calls; four data reads already parallel | First request slow; likely region/cold combination |
| `/admin/audit` | `2.40 s` | `74 ms` warm signal | not separable | 6 page calls + 2 proxy calls; 500+500 filter-option rows requested in future steady state | First request slow; current SQL fast |
| Sign-out and sign-in return | sign-out navigation completed in about `2.7 s`; Google-session return click about `6.6 s` (`10.5 s` conservative start-to-confirm bound) | not repeated | not separable | OAuth/auth callback plus profile/access routing | Network/auth round trip, no functional error |

Anonymous protected-route redirects were fast: `/dashboard`, `/students`, and `/admin/audit` followed their redirect to `/login` in approximately `0.30-0.32 s`, versus `/login` at approximately `0.23 s`. This indicates the proxy has measurable overhead but does not by itself explain multi-second authenticated renders.

## 5. Vercel findings

### Deployment and regions

- Production deployment: `dpl_GhBJWGfgn838QiSUpBengjBZrevb`.
- Production functions reported by `vercel inspect`: `1.25 MB`, deployed in **`iad1`**.
- Requests from Israel terminated at a Vercel edge identified as `fra1`, but dynamic compute remained in `iad1`.
- Supabase is in **`ap-northeast-2`**, which maps to Vercel **`icn1`** (Seoul).
- `next.config.ts` contains no region configuration, and the Vercel project is using the platform's `iad1` default.

This is the clearest structural bottleneck. A single SQL statement may execute in under 1 ms, but every Supabase Auth/PostgREST/Storage request must cross from Virginia to Seoul and back before Vercel can continue rendering.

### Runtime and logs

- Authenticated dynamic routes were logged as serverless `lambda` requests with cache `MISS`.
- Middleware/proxy requests appeared separately, confirming proxy work on route and prefetch traffic.
- A dashboard/navigation window showed requests for `/dashboard`, `/today`, `/students`, `/announcements`, and `/more` clustered together. This matches default link prefetch plus the staff navigation shell.
- No missing-environment retry, crash, or application error appeared in the inspected logs.
- No explicit cold-start marker or function-duration value was available through the CLI. Cold start remains plausible for some first-load spread but cannot explain the consistently slow dashboard/student-card paths.

### Bundle/hydration

Local production client-reference manifests showed these approximate uncompressed route assets:

| Route | JS | CSS | Total |
|---|---:|---:|---:|
| Dashboard / students / access grants | `117 KB` | `55 KB` | `172 KB` |
| Student card | `148 KB` | `55 KB` | `203 KB` |
| Admin calendar | `153 KB` | `55 KB` | `208 KB` |
| Admin learning groups | `148 KB` | `55 KB` | `203 KB` |
| Admin audit | `125 KB` | `55 KB` | `180 KB` |

The student card and admin workspaces hydrate more client code, but there is no route-specific multi-megabyte client bundle. JS/hydration is a secondary optimization target, not the main cause of 4-10 second server-driven loads.

## 6. Supabase query, RLS, and index findings

### Database execution

Safe hosted `EXPLAIN ANALYZE` results:

| Read | Execution time | Plan note |
|---|---:|---|
| Active students, ordered, limit 50 | `0.807 ms` | tiny-table sequential scan + sort |
| Current project for fake student | `0.693 ms` | `projects_one_current_per_student_idx` |
| Active goals for fake student | `0.177 ms` | `student_goals_student_id_idx` bitmap scan |
| Active student messages | `0.081 ms` | `student_messages_active_idx` |
| Calendar overlap | `0.077 ms` | `calendar_events_starts_at_idx` |
| Active learning groups | `0.163 ms` | tiny-table sequential scan + sort |
| Latest 50 audit rows | `0.201 ms` | `audit_logs_created_at_desc_idx` |

Sequential scans on the one-row/tiny fake tables are rational planner choices and are not performance defects.

Supabase call statistics also showed high frequency but very low SQL time:

- Auth user/session lookup statements: roughly `587-603` calls in the inspected statistics window.
- `current_user_is_active_staff()`: `541` calls, `361.629 ms` total database execution.
- No application SELECT appeared among the material database-time outliers; dashboard metadata queries dominated the outlier list instead.

RLS helper functions are invoked repeatedly through the proxy, explicit RPC checks, and table policies. At current scale their SQL cost is small. Their performance impact is primarily that separate RPC/PostgREST requests pay network latency and that the same access facts are requested more than once.

### Requested index checklist

All requested areas already have a usable index or constraint-backed equivalent except a dedicated `audit_logs.action` index:

- Present: `profile_roles(profile_id)`, `profile_roles(role)`, unique `(profile_id, role)`.
- Present: unique `profiles(email)`, `profiles(is_active)`, and `lower(email)`.
- Present: `students(group_id)` and `students(is_active)`.
- Present: `projects(student_id)`, `projects(school_year_id)`, and partial unique current-project index.
- Present: `student_masters(student_id)`, `(student_id, master_id)`, `master_id`, and `project_id`.
- Present: `group_mentors(group_id)`, `mentor_id`, and active `(group_id, mentor_id)`.
- Present: `student_messages(student_id)` plus partial active `(student_id, created_at desc)` covering `deleted_at is null`.
- Present: `student_goals(student_id)`, `school_year_id`, and active-primary `(student_id, school_year_id)`.
- Present: `followed_students(profile_id)`, `student_id`, and unique `(profile_id, student_id)`.
- Present: `calendar_events(starts_at)` and `calendar_events(ends_at)`.
- Present: both `calendar_event_groups(event_id)` and `(group_id)` plus unique `(event_id, group_id)`.
- Present: `learning_groups(weekday)` and `(is_active)`.
- Present: `audit_logs(created_at desc)`, `(actor_id)`, and `(entity_type, entity_id)`.
- Missing as a dedicated index: `audit_logs(action)`.
- Present: `notifications(profile_id)` and a partial unread `(profile_id, created_at desc)` covering `read_at is null`.
- Present: `push_subscriptions(profile_id)`.

No index was added. With only four audit rows during the plan, an action index would not improve the current baseline. Before real audit volume grows, prefer composite filter/order indexes based on measured usage, such as `(action, created_at desc)`, `(entity_type, created_at desc)`, and `(actor_id, created_at desc)`, rather than a blanket collection of single-column indexes.

Future import-scale candidates, to validate after representative fake-volume testing:

- `pg_trgm` GIN indexes for the students list's leading-wildcard `ILIKE '%query%'` search; current lower-case B-tree indexes do not accelerate that predicate well.
- A composite learning-group index on `(is_active, weekday, starts_at)` if timetable volume becomes material.
- A range/GiST calendar overlap strategy only if the event table becomes large enough for the two timestamp indexes to stop being sufficient.

## 7. Code-level request audit

Approximate minimum hosted calls for initial page data, before default link prefetch and excluding static assets:

| Route | Proxy calls | Page calls | Important waves |
|---|---:|---:|---|
| Dashboard | 2 | 7-8 | user, then 6 parallel reads, then optional acknowledgement reads |
| Students list | 2 | 4 | user -> active RPC -> students -> projects |
| Fake student card with project/photo | 2 | ~22 | user -> active -> student -> 6 reads -> 6 permission checks -> 4 project checks -> signed URL; page then repeats user + super-admin |
| Access grants | 2 | 2 | super-admin RPC -> grants |
| Admin calendar | 2 | 4 | user -> permission -> events -> groups |
| Admin learning groups | 2 | 6 | user -> permission -> 4 parallel reads |
| Admin audit | 2 | 6 | user -> permission -> 4 parallel reads |

After hydration, the staff `BottomNav` adds an unread-count server action (`getUser()` + notification count) on every pathname. Default link prefetch can invoke other protected dynamic routes, each with its own proxy and page work.

| File / route | Finding | Suspected impact | Recommended fix | Risk | Migration |
|---|---|---|---|---|---|
| Vercel config / all dynamic routes | Functions in `iad1`; DB in `ap-northeast-2` | Highest; every hosted call pays intercontinental RTT | Controlled deploy in `icn1`, re-run the same baseline, retain rollback | Medium operational | No |
| `src/proxy.ts` / all protected routes | Sequential `getUser()` then active-staff RPC; pages repeat auth/access | High under region mismatch | Keep security checks, but design a request-scoped access context for page code; assess whether public paths with no auth cookie can safely short-circuit | Medium security | No, unless claims/RPC change |
| `src/features/students/queries.ts` + student page | ~22 page calls, multiple permission waves, repeated manager RPC, repeated page `getUser()`/super-admin RPC | Very high; matches slowest route | Return caller/access facts with card data; reuse manager result; consolidate permission checks into one RLS-safe RPC; parallelize photo/access work where dependencies allow | Medium | Likely for aggregate RPC |
| `src/components/ui/BottomNav.tsx` / staff routes | Unread-count server action on every pathname; links prefetch expensive dynamic routes | High invisible load; confirmed in Vercel logs | Disable prefetch for heavy protected tabs or prefetch selectively; cache/dedupe unread count and refresh after notification mutations | Low | No |
| `src/features/dashboard/queries.ts` | Six useful parallel reads, but over-selects announcement body/settings and `calendar_events.*`; conditional second wave | Medium | Select only rendered columns; consider one RLS-friendly dashboard RPC only after region/prefetch fixes are measured | Low/Medium | No for columns; yes for RPC |
| `src/features/students/queries.ts` / list | Projects require a second dependent request after student IDs | Medium | Join an RLS-safe current-project relation or add a list RPC returning the compact list shape | Medium | Possibly |
| `src/features/calendar/admin-queries.ts` | Groups load after the events query even though independent after authorization | Medium | Run events and groups together with `Promise.all` | Low | No |
| `src/features/admin/audit-queries.ts` | Loads up to 500 action rows and 500 entity rows on every page, then deduplicates in JS; loads full JSON for 50 rows | Low now, high after real usage | Distinct filter-option RPC/view; defer full JSON until row expansion or cap preview data | Medium | Possibly |
| `src/features/learning-groups/admin-queries.ts` | Four independent reads are already parallelized | Low | Keep; reduce option columns/rows only after evidence | Low | No |
| Protected layout and student/admin workspaces | Client layout and many forms add hydration, but route JS is ~117-153 KB | Secondary | Add route loading UI and split rarely-used editors after server/query fixes | Low/Medium | No |

No normal page-load route handler performs service-role data reads. Privileged service-role use remains confined to existing audit/profile/admin write helpers and was not changed.

## 8. Prioritized safe improvement proposal

### Priority A - high impact / low risk

1. Disable or selectively limit default prefetch for protected dynamic navigation links, starting with the five staff `BottomNav` links; compare Vercel request counts before/after.
2. Stop the unread-count server action from refetching on every pathname; dedupe it per navigation/session and explicitly refresh after notification changes.
3. Remove the duplicate student-card `getUser()` and `current_user_is_super_admin()` calls by returning the already-known caller/access context from `getStudentCard()`.
4. Reuse the existing manager/super-admin result inside the student-card permission logic instead of calling the same RPC again for project permissions.
5. Parallelize admin-calendar event and group-option reads after authorization.
6. Reduce dashboard selected columns and replace `calendar_events.*` with the rendered fields.
7. Add opt-in, privacy-safe server timing instrumentation in a separate fix task (`PERF_TIMING_ENABLED=1`), logging route/query labels and durations only. It must remain disabled by default and must not log IDs, emails, student names, query text, tokens, or payloads.
8. Do not add indexes yet. The requested operational indexes mostly exist and current SQL execution is sub-millisecond.

### Priority B - moderate risk

1. Create one RLS-safe student-card read/access RPC that returns the card shape and permission bundle in fewer network round trips.
2. Consider a compact dashboard RPC only after Priority A and region alignment are measured.
3. Replace audit option scans with distinct values from an RPC/materialized lookup strategy and defer large JSON details.
4. Add route-level `loading.tsx` skeletons to improve perceived latency while preserving the same authorization and data flow.
5. Split or lazy-load rarely used student/admin editing controls if hydration profiling later shows a material main-thread cost.

### Priority C - defer / operational decision

1. **Run a controlled Vercel function-region experiment in `icn1`.** This is the highest-confidence structural hypothesis, but region/runtime changes belong in a separately approved Performance Fixes task with rollback and before/after measurements.
2. Decide whether to keep Supabase in Seoul for the pilot based on school data-location requirements and user geography; do not migrate the database as part of a code performance task.
3. Defer deeper caching until access scope, invalidation, and student-data privacy are designed explicitly.
4. Defer paid-tier, multi-region, and failover decisions until the single-region `icn1` baseline is known.

## 9. Risks

- Removing or bypassing proxy/RLS checks to gain speed would be unsafe and is not recommended.
- Caching user-specific or RLS-scoped data without a precise cache key could expose data across users.
- A large aggregate RPC can become difficult to authorize and maintain; it must preserve normal authenticated role and RLS semantics.
- Adding indexes before representative volume exists adds write/storage overhead and can obscure the dominant network problem.
- Moving compute to Seoul should reduce database latency but may change direct function latency for Israeli users; the expected net benefit must be measured with the same route set.

## 10. Recommended next task

**Performance Fixes v1** is the recommended next task, not real-data import planning.

Suggested execution order:

1. Capture an opt-in server timing baseline and Vercel request counts.
2. Deploy a reversible `icn1` function-region change and repeat every route measurement.
3. Fix staff-nav prefetch/background unread-count amplification.
4. Remove duplicate auth/role calls and reduce the student-card waterfall.
5. Re-measure before considering aggregate RPCs or new indexes.

Real-data import planning can resume only after the hosted student card and dashboard meet an agreed latency target under representative fake volume.

## 11. Validation and change statement

No application code, migration, RLS policy, feature, environment variable, or hosted configuration was changed in this audit. Documentation is the only intended output.

Required validation commands passed before documentation edits and are repeated after all documentation updates:

```text
npm run check:no-hebrew-in-code
npm run lint
npm run build
git diff --check
```
