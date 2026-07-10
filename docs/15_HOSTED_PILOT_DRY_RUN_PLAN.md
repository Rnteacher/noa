# 15 - Hosted Pilot Dry-Run Plan

## Purpose

This plan prepares a fake-data-only rehearsal of `docs/14_PRODUCTION_ENVIRONMENT_SETUP_RUNBOOK.md` against a hosted pilot-like environment.

Goals:

- Plan a hosted dry run before any real student data is introduced.
- Define exact evidence a human operator must collect.
- Define pass/fail gates before any future real-data discussion.
- Keep the rehearsal repeatable, auditable, and safe for a privacy-sensitive school app.

## Non-goals

- No actual deployment is performed by this task.
- No Supabase Cloud project is created by this task.
- No hosting project is created by this task.
- No real OAuth credentials are configured by this task.
- No real student data is used.
- No production launch approval is granted.
- No Google Calendar sync is implemented or configured.
- No import tooling is created.
- No product features are added.
- No RLS policy is weakened.
- No service-role credential is used for normal app flows.

## Required approval before executing the dry run

The dry run may be executed later only after these approvals are recorded:

- [ ] Project owner approval.
- [ ] Technical operator assigned.
- [ ] Data/privacy owner aware.
- [ ] Hosting and Supabase budget approval.
- [ ] Backup/restore owner assigned.
- [ ] Incident contact assigned.
- [ ] Fake-data scope approved.
- [ ] Confirmation that no real student data will be used.

## Dry-run inputs worksheet

Use placeholders only. Do not paste secrets, real OAuth credentials, database passwords, service-role keys, or real student data into this worksheet.

### Supabase project placeholder

| Field | Placeholder value | Evidence location |
|---|---|---|
| Project name | `<staff-app-hosted-dry-run>` | |
| Project ref | `<project-ref>` | |
| Region | `<approved-region>` | |
| Plan/tier | `<plan-or-tier>` | |
| Backup retention | `<retention-summary>` | |
| PostgreSQL major version | `<version>` | |
| API URL | `https://<project-ref>.supabase.co` | |
| Anon key recorded in secret manager | yes/no | |
| Service-role key recorded in secret manager | yes/no | |

### Hosting placeholder

| Field | Placeholder value | Evidence location |
|---|---|---|
| Provider | `<hosting-provider>` | |
| Project name | `<hosting-project-name>` | |
| Production-like URL | `https://<dry-run-app-domain>` | |
| Preview URL policy | `<disabled-or-exact-preview-policy>` | |
| Build command | `npm run build` | |
| Install command | `npm ci` unless provider-specific decision changes it | |
| Runtime notes | `<provider-nextjs-runtime-notes>` | |

### OAuth placeholder

| Field | Placeholder value | Evidence location |
|---|---|---|
| Allowed Google Workspace domain | `<approved-domain.example>` | |
| OAuth client owner | `<owner-name-or-team>` | |
| Hosted app callback URL | `https://<dry-run-app-domain>/auth/callback` | |
| Supabase callback URL | `https://<project-ref>.supabase.co/auth/v1/callback` | |
| Supabase Site URL | `https://<dry-run-app-domain>` | |
| Preview redirect policy | `<none-or-exact-urls>` | |

### Operator contacts

| Role | Name/contact placeholder | Available during dry run |
|---|---|---|
| Technical operator | `<operator>` | yes/no |
| Backup/restore owner | `<backup-owner>` | yes/no |
| Incident owner | `<incident-owner>` | yes/no |
| School/data owner | `<data-owner>` | yes/no |
| OAuth owner | `<oauth-owner>` | yes/no |
| Hosting owner | `<hosting-owner>` | yes/no |

### Pilot scope choices

| Scope item | Choice | Notes |
|---|---|---|
| Web Push | included/deferred | If included, use production-like VAPID placeholders in hosting secrets only. |
| Fake-data scope | bootstrap-only/minimal fake dataset/full fake workflow dataset | No real data. |
| Photo upload | included/deferred | Use fake/generated image only. |
| Audit export | included/deferred | Use fake audit rows only. |
| Preview deployments | enabled/disabled | Exact OAuth redirects required if enabled. |

## Execution sequence plan

This is a plan for a future approved operator. Do not execute these steps as part of this documentation task.

### 1. Create hosted Supabase project

Reference: `docs/14_PRODUCTION_ENVIRONMENT_SETUP_RUNBOOK.md`, "Hosted Supabase setup runbook".

Planned actions:

- Create `<staff-app-hosted-dry-run>` in the approved Supabase organization.
- Record project ref, API URL, anon key, and service-role key outside git.
- Confirm selected plan/tier and backup-retention details.

Checkpoint:

- Project metadata recorded in the worksheet.
- No secrets recorded in repo, screenshots, issue comments, or docs.

### 2. Apply migrations

Reference command example:

```bash
supabase login
supabase link --project-ref <project-ref>
supabase db push
```

Checkpoint:

- All checked-in migrations apply in order.
- No manual Dashboard-only schema change is made.
- Migration evidence is saved without secrets.

### 3. Verify schema, RLS, functions, and views

Reference: schema verification SQL in `docs/14_PRODUCTION_ENVIRONMENT_SETUP_RUNBOOK.md`.

Checkpoint:

- Required enums exist.
- Core tables exist.
- RLS is enabled on app tables.
- Security-definer helpers and RPCs exist.
- `current_student_project_statuses` and `latest_student_emotional_statuses` views exist.

### 4. Verify private `student-photos` bucket

Checkpoint:

- `student-photos` bucket exists.
- Bucket is private.
- Allowed MIME types and 5 MB limit match current app expectations.
- Storage object policies for student photos exist.

### 5. Configure fake/bootstrap-only data

Allowed:

- Bootstrap admin email through `BOOTSTRAP_SUPER_ADMIN_EMAILS`.
- Fake staff access grant.
- Minimal fake school/group/student/project dataset if approved.
- Fake/generated photo only if photo upload is in scope.

Not allowed:

- Real student data.
- Real photos.
- Real project, emotional-status, goal, message, or calendar content.
- Blind copy of `supabase/seeds/dev_seed.sql` into hosted Supabase. The local seed includes fake data and future-dated emotional-status rows; hosted dry-run data should be smaller and reviewed.

### 6. Configure hosting environment variables

Reference: environment variable matrix in `docs/14_PRODUCTION_ENVIRONMENT_SETUP_RUNBOOK.md`.

Checkpoint:

- Hosting variables are configured in the hosting secret/env manager.
- `SUPABASE_SERVICE_ROLE_KEY`, `VAPID_PRIVATE_KEY`, and OAuth secrets are not exposed in client-visible settings.
- Deferred Google Calendar variables are not configured.

### 7. Deploy app to production-like URL

Reference defaults:

```txt
Install command: npm ci
Build command: npm run build
Runtime: provider-managed Next.js runtime or documented Node runtime
```

Checkpoint:

- Deployment uses a known commit SHA.
- HTTPS production-like URL is available.
- `/sw.js` serves from the root path.

### 8. Configure Google OAuth and redirects

Checkpoint:

- Google OAuth client uses `https://<project-ref>.supabase.co/auth/v1/callback`.
- Supabase Site URL is `https://<dry-run-app-domain>`.
- Supabase additional redirect URL includes `https://<dry-run-app-domain>/auth/callback`.
- Preview URLs are either disabled or explicitly listed.
- `GOOGLE_ALLOWED_DOMAIN` matches the approved Workspace domain.

### 9. Run auth smoke tests

Checkpoint:

- Allowed-domain bootstrap admin reaches `/dashboard`.
- Wrong-domain login reaches `/access-denied`.
- Valid-domain account without grant reaches `/access-pending`, if available.
- `/auth/sign-out` clears session.

### 10. Run fake-data app smoke tests

Checkpoint:

- Dashboard renders.
- Fake student workflows operate as expected.
- Admin workflows operate as expected for manager/super-admin.
- Non-manager denial paths are verified.

### 11. Run hosted RLS probes

Checkpoint:

- Anonymous access blocked.
- Staff-only account cannot mutate admin-only resources.
- Direct unauthorized writes are blocked by RLS.
- Push subscriptions are scoped to current user.
- Audit logs visible only to manager/super-admin.

### 12. Run audit export allowed/denied tests

Checkpoint:

- Manager/super-admin export succeeds with fake data only.
- Staff-only export is forbidden.
- Denied export does not create an `audit_log.exported` row.
- Export omits raw JSON payloads.

### 13. Run Web Push test if in scope

Checkpoint:

- Browser permission prompt appears only after user action.
- Subscription row is created for current user only.
- Push payload contains generic text only.
- Notification click focuses the authenticated app path.

### 14. Run backup/restore review

Checkpoint:

- Backup tier/retention recorded.
- Restore owner signs off on procedure.
- Rollback approach for app, migration, bad data, and leaked secret scenarios is documented.

### 15. Complete go/no-go report

Checkpoint:

- Report template in this plan is completed.
- Failures and required fixes are listed.
- Real-data gate remains closed unless a later approved process explicitly opens planning for import.

## Evidence collection checklist

Do not collect screenshots containing secrets, tokens, full env var values, real student data, or real staff personal data.

- [ ] Migration success evidence: migration list, CLI output summary, or Supabase migration status without secrets.
- [ ] RLS enabled evidence: SQL result showing `rowsecurity = true` for app tables.
- [ ] Supabase Auth configuration notes or redacted screenshots.
- [ ] Hosting environment variable checklist showing names configured, not values.
- [ ] OAuth redirect checklist showing exact URLs, no client secret.
- [ ] Private storage bucket confirmation for `student-photos`.
- [ ] Wrong-domain rejection result: route reached and database/session observation.
- [ ] Allowed-domain login result: route reached and profile/roles observation.
- [ ] Inactive valid-domain pending result, if tested.
- [ ] Non-manager audit export denial result.
- [ ] Manager/super-admin audit export success result with fake data only.
- [ ] Student photo signed URL result using fake/generated image only.
- [ ] Notification and Web Push result, if in scope.
- [ ] Backup/restore owner sign-off.
- [ ] Incident owner sign-off.
- [ ] Fake data cleanup confirmation.
- [ ] No-real-data confirmation.

## Fake-data verification script

Execute only after explicit approval for a hosted dry run.

### Accounts

Prepare:

- `<bootstrap-admin@approved-domain>` via `BOOTSTRAP_SUPER_ADMIN_EMAILS`.
- `<fake-staff@approved-domain>` through `/admin/access-grants`.
- `<fake-manager@approved-domain>` if a separate manager account is needed.
- `<wrong-domain-user@example.org>` for rejection testing.

### Flow

1. Login with bootstrap super-admin.
2. Confirm dashboard renders and `/admin/access-grants` is available.
3. Create or activate a fake staff-only account.
4. Sign in as fake staff-only account and confirm app access.
5. Verify wrong-domain login is rejected at `/access-denied`.
6. Create or verify fake school year, group, student, and project records only if approved for hosted smoke testing.
7. Dashboard: verify announcements/events/followed-student counts render without errors.
8. Student message: create, edit, and soft-delete a fake student-card message.
9. Project status: update fake project status and verify audit row.
10. Emotional status: update fake emotional status. Avoid future-dated seed data so the latest-status badge reflects the inserted row normally.
11. Goals: create a fake goal, edit details, change status, set primary, and delete/archive according to role.
12. Follow/unfollow: follow fake student, verify notification settings, then unfollow or restore intended fake state.
13. Announcements: create fake announcement, acknowledge as fake staff, then delete as manager/super-admin.
14. Calendar: create fake event, edit it, reschedule it, then delete it.
15. Learning groups: create fake group, edit it, reschedule it, then archive it.
16. Notifications and badge: trigger fake student update from one account and verify recipient badge/notification only, with no sensitive payload content.
17. Web Push: run only if included; enable browser permission, create subscription, trigger generic fake notification, click notification, then disable subscription.
18. Audit log filters: filter by fake actions/entity types/date range.
19. Audit export: verify allowed export for manager/super-admin and denied export for staff-only.
20. Cleanup fake data through app flows where possible.
21. Confirm no real data was used.
22. Confirm no fake test data remains unless explicitly retained as a fake smoke dataset.

## Hosted RLS probe plan

Use app flows first. If SQL examples are used, keep them fake-data-only and rollback-wrapped.

### Required probes

- [ ] Anonymous access blocked from `/dashboard`, `/students`, `/admin/access-grants`, `/admin/calendar`, `/admin/learning-groups`, and `/admin/audit`.
- [ ] Staff-only account cannot access admin-only mutation paths.
- [ ] Staff-only account cannot export audit CSV.
- [ ] Manager/super-admin can create and clean up fake admin announcement, calendar event, and learning group records.
- [ ] Audit logs visible only to manager/super-admin.
- [ ] Push subscription rows are scoped to current user.
- [ ] `student-photos` bucket remains private.
- [ ] Signed photo URL works only through authenticated app path and fake data.
- [ ] `SUPABASE_SERVICE_ROLE_KEY` never appears in client bundle, logs, browser DevTools, or network responses.
- [ ] Direct table writes from non-authorized user are blocked by RLS.

### Catalog probe examples

```sql
select schemaname, tablename, rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in (
    'profiles',
    'profile_roles',
    'students',
    'student_messages',
    'announcements',
    'calendar_events',
    'learning_groups',
    'push_subscriptions',
    'notifications',
    'audit_logs'
  )
order by tablename;
```

```sql
select id, public, file_size_limit, allowed_mime_types
from storage.buckets
where id = 'student-photos';
```

### Rollback-wrapped destructive examples

Use only with fake IDs and only in a dry-run environment.

```sql
begin;

-- Replace with the JWT/session simulation method approved for the dry run.
-- This block is illustrative only: verify unauthorized writes affect 0 rows
-- or are rejected by RLS for a fake staff-only user.

update public.calendar_events
set title = 'Fake unauthorized update attempt'
where id = '<fake-calendar-event-id>';

rollback;
```

```sql
begin;

-- Verify constraints remain active for fake learning-group data.
insert into public.learning_groups (
  id,
  school_year_id,
  title,
  weekday,
  starts_at,
  ends_at,
  is_active
) values (
  '00000000-0000-4000-8000-000000000015',
  '<fake-school-year-id>',
  'Fake invalid group',
  'sunday',
  '13:00',
  '14:00',
  true
);

rollback;
```

Expected result: invalid or unauthorized writes fail or affect zero rows. If they succeed unexpectedly, stop the dry run and classify as security no-go.

## Failure handling and rollback rehearsal

### Stop immediately

Stop the dry run and mark no-go if:

- RLS is disabled or an unauthorized user can read/mutate protected data.
- `student-photos` is public.
- Service-role key appears client-side, in logs, or in browser network responses.
- Real student data is discovered in the environment.
- Wrong-domain login becomes authorized.
- Backup/restore owner is unavailable when backup/restore is in scope.
- A secret exposure is suspected.

### Fix and continue only after review

Fix, document, and continue only if the project owner and technical operator agree:

- Migration fails before real/fake data is loaded.
- Hosting env var is wrong and no secret/data exposure occurred.
- OAuth redirect URL mismatch blocks login.
- Web Push fails while Web Push is not required for the dry-run scope.
- Fake data cleanup needs manual admin cleanup with no real data involved.

### Abandon the dry run

Abandon and schedule a new attempt if:

- Multiple independent security checks fail.
- The environment cannot be trusted after a suspected secret leak.
- Backup/restore assumptions are materially wrong.
- The selected hosting provider cannot support required Next.js runtime behavior.
- OAuth cannot be made to work without broadening allowed domains or weakening checks.

### Scenario handling

| Failure | Immediate action | Evidence to record | Recovery decision |
|---|---|---|---|
| Failed migration | Stop schema work; do not add manual Dashboard fixes | Migration name, error summary, project ref | Fix migration locally, rerun in new/clean dry-run state |
| Bad environment variable | Remove bad value, redeploy/restart | Variable name only, not value | Continue if no exposure occurred |
| OAuth redirect mismatch | Stop auth tests | Expected vs actual URLs, no secrets | Fix redirects and repeat auth section |
| RLS policy failure | Stop immediately | Persona, attempted action, observed access | Security no-go |
| Storage bucket privacy failure | Stop immediately | Bucket public flag and access result | Security no-go |
| Web Push failure | Mark scoped failure | Browser, permission state, generic error | Continue only if Web Push is out of scope |
| Hosting deployment rollback | Roll back through provider | Commit SHA, deployment id, rollback result | Continue after stable deploy |
| Secret exposure suspicion | Rotate affected secret; stop | Secret type only, exposure surface | Abandon or restart after rotation |
| Fake data cleanup failure | Freeze environment for cleanup owner | Fake record IDs/types | Continue only after cleanup complete |

## Go/no-go report template

Copy this template into the execution record for a future approved dry run.

```md
# Hosted Pilot Dry-Run Report

Date:
Operator:
Project owner:
Data/privacy owner:
Backup/restore owner:
Incident owner:

Commit SHA:
Supabase project ref:
Hosting provider/project:
Production-like URL:
Preview URL policy:
Google Workspace domain:
Web Push scope: included/deferred
Photo upload scope: included/deferred
Audit export scope: included/deferred

## Tests passed

- [ ] Migrations applied
- [ ] Schema verified
- [ ] RLS enabled
- [ ] Functions/RPCs verified
- [ ] Views verified
- [ ] Private storage verified
- [ ] Hosting env vars configured by name
- [ ] OAuth redirects verified
- [ ] Allowed-domain login passed
- [ ] Wrong-domain rejection passed
- [ ] Inactive valid-domain pending path passed or marked not tested
- [ ] Fake-data app workflow passed
- [ ] Hosted RLS probes passed
- [ ] Audit export allowed path passed
- [ ] Audit export denied path passed
- [ ] Web Push passed or marked out of scope
- [ ] Backup/restore review completed
- [ ] Cleanup completed
- [ ] No-real-data confirmation completed

## Tests failed

- Item:
- Evidence:
- Severity:
- Owner:

## Bugs found

- Bug:
- Reproduction:
- Impact:
- Required fix:

## Security/privacy findings

- Finding:
- Persona:
- Data affected:
- Required fix:

## Real-data gate status

Status: closed/open-for-planning-only
Reason:
Remaining approvals:

## Required fixes before next attempt

- Fix:
- Owner:
- Due:

## Final recommendation

Choose one:

- [ ] No-go
- [ ] Repeat dry run
- [ ] Approved for fake-data pilot
- [ ] Approved to plan real-data import, not to execute it

Rationale:
```

## Recommended next task

Recommended next task: Hosting provider decision memo.

Reason: the dry-run plan is now ready, but execution still depends on choosing a provider, domain, preview policy, rollback mechanism, and operational owner. After that decision and explicit approval, the next task can be Hosted Pilot Dry-Run Execution v1.
