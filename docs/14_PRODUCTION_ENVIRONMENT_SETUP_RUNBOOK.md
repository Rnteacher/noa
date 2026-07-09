# 14 - Production Environment Setup Runbook

## Purpose

This runbook gives a technical operator exact, fake-data-only steps for creating and verifying a hosted pilot/production-like Chamama Staff App environment.

It converts `docs/13_PILOT_PRODUCTION_READINESS.md` into an actionable setup and verification path. It is safe to use before a real pilot because every data-bearing step is either metadata-only, bootstrap/access-only, fake-data-only, or wrapped in rollback guidance.

## Non-goals

- This runbook does not approve production launch.
- This runbook does not permit real student data.
- This runbook does not import real data.
- This runbook does not configure real OAuth credentials in this repository.
- This runbook does not implement or enable Google Calendar sync.
- This runbook does not perform direct deployment by itself.
- This runbook does not weaken RLS or bypass normal app permissions.
- This runbook does not use service-role credentials for normal app flows.

## Operator prerequisites

The operator needs:

- Repository access to the Chamama Staff App source.
- Supabase organization permissions to create or administer the target project.
- Hosting provider permissions for the chosen deployment target.
- Google Workspace and Google Cloud OAuth admin permissions.
- Access to the approved secret manager or hosting environment-variable manager.
- A local machine with Node.js dependencies installed and Supabase CLI access.
- Approval to create fake or bootstrap-only smoke-test data in the hosted environment.

## Required approvals before real data

Real student data may not enter the hosted environment until these approvals are recorded:

- School leadership approval.
- Data/privacy owner approval.
- Backup/restore owner approval.
- Incident contact owner assignment.
- Import source review approval.
- Access-grant and role approval.

## Environment variable matrix

| Variable | Required | Used by | Configure in | Public/secret | Notes |
|---|---|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Required | Browser client, server client, proxy, service-role client URL | Hosting provider; local operator machine for verification | Public | Hosted Supabase API URL. Must not point at local Supabase in hosted envs. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Required | Browser client, server client, proxy | Hosting provider; local operator machine for verification | Public | Browser-safe anon key. RLS must still enforce data access. |
| `SUPABASE_SERVICE_ROLE_KEY` | Required for privileged server flows | `src/lib/auth/admin.ts`, audit writes, access grants, OAuth profile sync, push dispatch cleanup | Hosting provider only; local operator machine only for controlled admin verification | Secret | Server-only. Never expose to browser, logs, docs, screenshots, or client bundles. |
| `NEXT_PUBLIC_APP_URL` | Required | Login redirect URL and app canonical origin | Hosting provider | Public | Must exactly match the final HTTPS app origin, for example `https://staff-app.example`. |
| `GOOGLE_ALLOWED_DOMAIN` | Required | OAuth callback and proxy domain checks | Hosting provider | Public operational setting | Strict email-domain comparison after normalization. Use the approved Google Workspace domain only. |
| `BOOTSTRAP_SUPER_ADMIN_EMAILS` | Required for first admin bootstrap, then should be minimized | OAuth profile sync | Hosting provider secret/env manager | Sensitive operational setting | Comma-separated allowed-domain emails. Keep short; remove or narrow after durable access grants exist. |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Required only if Web Push is in pilot | Push UI and server push configuration | Hosting provider | Public | Public half of production VAPID key pair. |
| `VAPID_PRIVATE_KEY` | Required only if Web Push is in pilot | Server push dispatch | Hosting provider only | Secret | Server-only. Rotate if leaked. |
| `VAPID_SUBJECT` | Required only if Web Push is in pilot | Server push dispatch | Hosting provider | Public contact value | Usually `mailto:<ops-contact@example>`. Must be controlled by the operator/school. |
| `SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID` | Required for Supabase Google provider | Supabase Auth provider configuration | Supabase Dashboard or Supabase config workflow; local operator shell if using CLI config | Public-ish provider id | Do not commit real values. The hosted provider config is the source of truth. |
| `SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_SECRET` | Required for Supabase Google provider | Supabase Auth provider configuration | Supabase Dashboard or secret manager; local operator shell only when needed | Secret | Never commit, paste into docs, or expose in app hosting env unless the provider requires it there. |
| `GOOGLE_CALENDAR_CLIENT_ID` | Deferred | Not used yet | Do not configure for this runbook | Deferred | Google Calendar sync is not implemented. |
| `GOOGLE_CALENDAR_CLIENT_SECRET` | Deferred | Not used yet | Do not configure for this runbook | Deferred secret | Google Calendar sync is not implemented. |
| `GOOGLE_CALENDAR_REDIRECT_URI` | Deferred | Not used yet | Do not configure for this runbook | Deferred | Google Calendar sync is not implemented. |

`.env.example` already contains placeholder-only entries for the variables above. Do not replace placeholders with real values in git.

## Hosted Supabase setup runbook

### 1. Create the hosted project

In Supabase Cloud, create a new project using placeholder planning values:

- Organization: `<supabase-organization>`
- Project name: `<staff-app-pilot>`
- Region: `<approved-region>`
- Database password: generate and store in the approved secret manager
- Pricing/tier: choose only after backup/retention needs are approved

Record these values outside git:

- Project ref: `<project-ref>`
- API URL: `https://<project-ref>.supabase.co`
- Anon key: `<hosted-anon-key>`
- Service-role key: `<hosted-service-role-key>`
- Database connection string: store only if needed for approved admin operations

### 2. Link the local repo to the hosted project

Example commands for the operator:

```bash
supabase login
supabase link --project-ref <project-ref>
```

Do not commit generated local Supabase temp files or secrets.

### 3. Apply migrations

Current migrations, in order:

```txt
20260707111701_initial_schema_and_rls.sql
20260707115303_staff_access_grants.sql
20260708184000_student_photos.sql
20260708190500_harden_student_photo_updates.sql
20260708234000_notifications_system.sql
20260708235000_harden_notifications_rpc.sql
20260709000000_student_goal_primary.sql
20260709010000_student_message_editing.sql
20260709020000_student_message_soft_delete_fix.sql
20260709030000_push_subscriptions_v1.sql
20260709040000_harden_student_photo_url_path.sql
```

Example command:

```bash
supabase db push
```

> WARNING: `supabase db push` changes the linked hosted database. Confirm the project ref, environment name, and migration list before running it. Do not run this against an environment containing real data until backup/rollback approval exists.

### 4. Verify schema

Run read-only SQL in Supabase SQL Editor or another approved SQL client.

Required enums:

```sql
select typname
from pg_type
where typnamespace = 'public'::regnamespace
  and typname in (
    'app_role',
    'traffic_light_status',
    'goal_status',
    'student_message_tag',
    'announcement_target_type',
    'event_visibility',
    'weekday'
  )
order by typname;
```

Core tables:

```sql
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in (
    'profiles',
    'profile_roles',
    'staff_access_grants',
    'staff_access_grant_roles',
    'school_years',
    'student_groups',
    'group_mentors',
    'students',
    'projects',
    'student_masters',
    'student_emotional_statuses',
    'student_goals',
    'student_messages',
    'followed_students',
    'announcements',
    'announcement_reads',
    'calendar_events',
    'calendar_event_groups',
    'learning_groups',
    'learning_group_target_groups',
    'push_subscriptions',
    'notifications',
    'audit_logs'
  )
order by table_name;
```

RLS enabled:

```sql
select schemaname, tablename, rowsecurity
from pg_tables
where schemaname = 'public'
  and tablename in (
    'profiles',
    'profile_roles',
    'staff_access_grants',
    'staff_access_grant_roles',
    'students',
    'projects',
    'student_messages',
    'student_goals',
    'announcements',
    'calendar_events',
    'learning_groups',
    'push_subscriptions',
    'notifications',
    'audit_logs'
  )
order by tablename;
```

Expected result: every listed table has `rowsecurity = true`.

Security-definer helpers and RPCs:

```sql
select proname
from pg_proc
where pronamespace = 'public'::regnamespace
  and proname in (
    'current_user_is_active_staff',
    'current_user_has_role',
    'current_user_is_manager_or_super_admin',
    'current_user_is_super_admin',
    'current_user_can_manage_student_photo',
    'update_student_photo_path',
    'create_student_change_notifications'
  )
order by proname;
```

Views:

```sql
select table_name
from information_schema.views
where table_schema = 'public'
  and table_name in (
    'current_student_project_statuses',
    'latest_student_emotional_statuses'
  )
order by table_name;
```

### 5. Verify storage

Bucket check:

```sql
select id, name, public, file_size_limit, allowed_mime_types
from storage.buckets
where id = 'student-photos';
```

Expected:

- `id = 'student-photos'`
- `public = false`
- `file_size_limit = 5242880` or equivalent 5 MB setting
- MIME types include `image/jpeg`, `image/png`, and `image/webp`

Storage policies:

```sql
select policyname, cmd
from pg_policies
where schemaname = 'storage'
  and tablename = 'objects'
  and policyname ilike '%student photos%'
order by policyname;
```

### 6. Generate production types if needed

Only regenerate and commit types when the hosted schema differs from checked-in types or after a migration changes schema.

Example:

```bash
supabase gen types typescript --project-id <project-ref> > src/types/supabase.ts
```

Do not run this as part of a production setup if it would create unrelated source changes.

### 7. Seed strategy

Allowed before real-data approval:

- Bootstrap-only settings through `BOOTSTRAP_SUPER_ADMIN_EMAILS`.
- Access grants for fake or approved operator accounts.
- Fake smoke-test data only, if approved.

Not allowed:

- Real student names.
- Real student contacts.
- Real student photos.
- Real staff personal data beyond approved operator/admin email addresses.
- Real project, emotional-status, goal, message, or calendar content.
- Copying `supabase/seeds/dev_seed.sql` into production without explicit review. It is local development seed data and includes fake users/students plus future-dated emotional-status rows.

## Google OAuth production configuration runbook

### 1. Google Cloud OAuth client

In Google Cloud, create or select an OAuth client for the hosted Supabase Auth provider:

- Application type: web application.
- Name: `<staff-app-pilot-oauth-client>`.
- Authorized JavaScript origins: include the hosted app origin, for example `https://<staff-app-domain>`.
- Authorized redirect URI for Supabase Auth: `https://<project-ref>.supabase.co/auth/v1/callback`.
- Store the client id and client secret in the approved secret manager.

Do not store real client IDs or secrets in git.

### 2. Supabase Auth provider

In Supabase Dashboard:

- Enable Google provider.
- Configure the Google OAuth client id.
- Configure the Google OAuth client secret.
- Confirm the provider callback URL shown by Supabase matches the Google redirect URI.

### 3. Supabase Auth URLs

Configure:

- Site URL: `https://<staff-app-domain>`.
- Additional redirect URL: `https://<staff-app-domain>/auth/callback`.
- Preview redirect URLs only if preview OAuth testing is explicitly approved.

Preview policy:

- Preview URLs may need exact redirect entries.
- Never test real student data on previews unless explicitly approved by the privacy owner.
- Prefer fake-data-only preview smoke tests.

### 4. App domain behavior

Set hosting env:

```txt
NEXT_PUBLIC_APP_URL=https://<staff-app-domain>
GOOGLE_ALLOWED_DOMAIN=<approved-google-workspace-domain>
BOOTSTRAP_SUPER_ADMIN_EMAILS=<bootstrap-admin@approved-domain>
```

The app enforces the domain in both:

- `src/app/auth/callback/route.ts`
- `src/proxy.ts`

The Google login page also passes the domain hint through the OAuth request.

### 5. Bootstrap super-admin flow

Initial bootstrap:

1. Set `BOOTSTRAP_SUPER_ADMIN_EMAILS` to one or two approved operator/admin emails.
2. Deploy/restart the app with the env var present.
3. Have the bootstrap admin sign in with Google.
4. Confirm the app redirects to `/dashboard`.
5. Confirm the profile and roles exist.
6. Use `/admin/access-grants` to create durable access grants for ongoing admins/staff.
7. Remove or narrow `BOOTSTRAP_SUPER_ADMIN_EMAILS` after durable grants are verified.

Database checks after bootstrap login:

```sql
select id, email, is_active
from public.profiles
where email = '<bootstrap-admin@approved-domain>';

select pr.profile_id, pr.role
from public.profile_roles pr
join public.profiles p on p.id = pr.profile_id
where p.email = '<bootstrap-admin@approved-domain>'
order by pr.role;
```

Expected bootstrap roles: `manager` and `super_admin`.

Access grant checks:

```sql
select email, is_active
from public.staff_access_grants
where email = '<fake-staff@approved-domain>';

select sagr.role
from public.staff_access_grant_roles sagr
join public.staff_access_grants sag on sag.id = sagr.grant_id
where sag.email = '<fake-staff@approved-domain>'
order by sagr.role;
```

### 6. OAuth verification tests

- Allowed-domain login: approved bootstrap/admin account reaches `/dashboard`.
- Wrong-domain login: non-approved-domain Google account reaches `/access-denied`, creates no authorized profile, and cannot access `/dashboard`.
- Inactive valid-domain login: valid-domain user without bootstrap or access grant reaches `/access-pending`.
- Sign-out: `/auth/sign-out` clears session and a later `/dashboard` request redirects to `/login`.

## Hosting setup runbook

### 1. Hosting provider decision

No hosting provider is selected in current docs. Choose one before setup and document:

- Provider name.
- Production domain.
- Preview deployment policy.
- Runtime support for Next.js 16.
- Log access owner.
- Rollback mechanism.

### 2. Build settings

Use these defaults unless the chosen provider requires a documented variation:

```txt
Install command: npm ci
Build command: npm run build
Start/runtime: provider-managed Next.js runtime or npm run start for Node hosting
```

The project is a Next.js App Router app with `src/proxy.ts`, server components, route handlers, and a root service worker file at `public/sw.js`.

### 3. Hosting environment variables

Configure active runtime variables from the matrix:

```txt
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_APP_URL
GOOGLE_ALLOWED_DOMAIN
BOOTSTRAP_SUPER_ADMIN_EMAILS
NEXT_PUBLIC_VAPID_PUBLIC_KEY
VAPID_PRIVATE_KEY
VAPID_SUBJECT
```

Do not configure deferred Google Calendar variables for this runbook.

### 4. HTTPS and OAuth dependency

- Production must use HTTPS.
- `NEXT_PUBLIC_APP_URL`, Supabase Auth Site URL, Supabase additional redirect URLs, and Google OAuth allowed origins/redirects must agree.
- If the final domain changes, update all four places before OAuth testing.

### 5. Service worker check

After deployment, verify:

```txt
GET https://<staff-app-domain>/sw.js
```

Expected:

- HTTP 200.
- JavaScript content.
- Served from the site root, not behind authentication.

### 6. Basic smoke tests after deploy

- Visit `/login`: page renders.
- Visit `/dashboard` while unauthenticated: redirects to `/login`.
- Sign in with allowed-domain bootstrap admin: redirects to `/dashboard`.
- Dashboard renders with no server error.
- Visit `/admin/access-grants` as bootstrap admin: route renders.
- Visit an admin route as non-manager fake staff later: access is denied by page/server checks or RLS.
- Sign out: session clears and `/dashboard` redirects to `/login`.

## Hosted RLS smoke probes

Use fake-data-only records. Prefer app UI flows for realistic behavior, then use read-only SQL to confirm database state.

> WARNING: Do not run smoke probes against real student data. If SQL writes are used, wrap them in `begin; ... rollback;` unless the fake records are intentionally part of the smoke dataset.

### Route and auth probes

- Anonymous cannot access `/dashboard`, `/students`, `/admin/access-grants`, `/admin/calendar`, `/admin/learning-groups`, or `/admin/audit`.
- Inactive valid-domain user reaches `/access-pending`.
- Wrong-domain user reaches `/access-denied`.

### RLS catalog checks

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

### Fake admin mutation probes

Use the app as a fake manager or super-admin:

- Create an admin announcement with fake content.
- Create a calendar event with fake content.
- Create a learning group with fake title, room, and staff assignment.
- Confirm audit rows appear for each action to manager/super-admin only.
- Delete/archive the fake records through the app.

### Non-manager denial probes

Use a fake active `staff`-only account:

- Cannot manage `staff_access_grants`.
- Cannot create calendar events.
- Cannot create learning groups.
- Cannot export `/api/admin/audit/export`.
- Can access permitted staff routes after active role exists.

Audit export denial expectation:

- HTTP response is forbidden.
- No `audit_log.exported` row is written for the denied request.

### Student-card visibility and mutation probes

With approved fake student data only:

- Active staff can view student cards.
- Staff without the correct relationship cannot perform restricted mutations.
- Manager/super-admin can perform manager-level mutations.
- Normal staff message create/edit/delete follows current app rules.

### Student photo storage probes

- Direct public URL access to `student-photos` objects fails.
- Signed URLs generated through the app display fake photo objects only.
- Authorized fake mentor/manager/super-admin can upload according to current app permissions.
- Unauthorized fake staff cannot update another student's photo.

Storage catalog check:

```sql
select id, public, file_size_limit, allowed_mime_types
from storage.buckets
where id = 'student-photos';
```

### Push subscription probes

Use a fake active user and a real browser only if Web Push is in pilot:

- User can create/read/update/delete only their own `push_subscriptions` row through app controls.
- User cannot read another user's subscription.
- Push payload contains generic text only.
- Stale subscription cleanup does not expose subscription keys in logs.

### Audit log visibility probe

- Manager/super-admin can view `/admin/audit`.
- Staff-only user cannot view audit rows or export CSV.
- Audit CSV omits raw `before_data` and `after_data`.

### Service-role exposure probe

- Search built client output and browser DevTools for `SUPABASE_SERVICE_ROLE_KEY`; it must not appear.
- Confirm server-only code paths use `createServiceRoleClient()` only for privileged operations: access grants, OAuth profile sync, audit writes, and push dispatch cleanup.
- Confirm normal app CRUD uses request-scoped Supabase clients and RLS.

## Backup, restore, and rollback runbook

Complete this checklist before pilot:

- [ ] Confirm Supabase plan backup tier and retention.
- [ ] Confirm whether point-in-time recovery is available for the selected plan.
- [ ] Confirm manual backup/export procedure and where backup artifacts are stored.
- [ ] Assign restore owner and backup verification owner.
- [ ] Run or tabletop a restore procedure before real data import.
- [ ] Document app deployment rollback steps for the chosen hosting provider.
- [ ] Document database migration rollback policy. Prefer forward-fix migrations once real data exists; only use destructive rollback with explicit approval and backups.
- [ ] Document bad data import rollback plan before any import.
- [ ] Document leaked secret rotation steps for Supabase anon key, service-role key, Google OAuth secret, VAPID keys, and hosting env vars.
- [ ] Assign incident contacts and escalation order.
- [ ] Confirm audit log retention expectations.
- [ ] Confirm storage/photo backup expectations and restore process.

> WARNING: Database rollback, restore, or secret rotation can interrupt active users. Do not execute these operations without the assigned incident owner and backup/restore owner present.

## Fake-data pilot verification checklist

Use only fake or bootstrap-only data.

1. Login with bootstrap super-admin.
2. Create or activate a fake staff account through access grants.
3. Verify wrong-domain rejection with a non-approved-domain Google account.
4. If approved for hosted smoke testing, create fake school year/group/student/project data.
5. Verify dashboard render and route protection.
6. Verify student message create, edit, and delete on fake student.
7. Verify project status mutation on fake project.
8. Verify emotional status mutation on fake student. The local seed date quirk does not apply unless future-dated seed data is used in the hosted environment.
9. Verify goal create, status update, details edit, primary selection, and delete/archive paths.
10. Verify follow/unfollow on fake student.
11. Verify announcement create, acknowledgement, and delete with fake content.
12. Verify calendar create, edit, reschedule, and delete with fake event.
13. Verify learning group create, edit, reschedule, and archive with fake group.
14. Verify in-app notifications and badges with fake accounts.
15. Verify Web Push only if included in pilot scope and production VAPID keys are configured.
16. Verify audit export allowed for manager/super-admin.
17. Verify audit export denied for non-manager staff.
18. Clean up fake test data through app flows where possible.
19. Confirm no real data was used in hosted smoke tests.
20. Confirm no fake test data remains unless explicitly retained as a smoke dataset.

## Real-data import gate

Real data import may begin only after:

- [ ] Hosted Supabase RLS smoke tests pass.
- [ ] Production OAuth tests pass.
- [ ] Storage private bucket tests pass.
- [ ] Backups and restore owner are confirmed.
- [ ] Import source files are reviewed.
- [ ] Rollback procedure is approved.
- [ ] Access grants and roles are approved.
- [ ] Incident contact is assigned.

Never commit to git:

- Real student names, contact details, photos, messages, project notes, emotional notes, goal details, calendar details, or imports.
- Real staff personal data beyond approved placeholder examples.
- OAuth secrets, Supabase keys, VAPID private keys, database passwords, backup files, export files, or generated CSVs with real data.
- Screenshots, logs, or docs containing real student or staff data.

Test environments should use:

- De-identified student names and contacts.
- Fake staff accounts or approved operator accounts.
- Fake project and emotional-status notes.
- Fake photos or generated placeholders.
- Fake calendar and learning-group content.

Only approved operators may run imports:

- Import operator: manager or super-admin level, explicitly approved.
- Reviewer: data/privacy owner.
- Backup owner: confirms restore point before import.
- Incident owner: available during import window.

Audit/log expectations:

- Import start/end should be recorded.
- Import operator identity should be recorded.
- Row counts and high-level result summaries may be logged.
- Raw real-data file contents must not be logged.
- Failed rows should be reported without exposing unnecessary sensitive content.

## Final setup sign-off

Before pilot launch, collect written sign-off for:

- Hosted environment verification.
- OAuth verification.
- RLS smoke verification.
- Storage privacy verification.
- Backup/restore readiness.
- Incident contacts.
- Real data import approval.
- Scope of Web Push inclusion.
- Deferred Google Calendar sync acknowledgment.
