# 13 - Pilot / Production Readiness

## Executive summary

The Chamama Staff App is locally verified enough to start a controlled pilot-readiness track, but it is not production-ready until a hosted Supabase project, production hosting, production OAuth configuration, backup/restore verification, and production RLS smoke tests are completed.

This document is a planning checklist only. It does not deploy anything, create a Supabase Cloud project, import real data, change secrets, or implement Google Calendar sync.

Readiness conclusion:

- Local application build and major workflows are verified.
- The database schema, RLS policies, private storage bucket migration, and audit model are versioned in migrations.
- Real pilot launch remains blocked until the production environment is created and verified with fake or bootstrap-only data.
- Real student data must not be imported until the security/privacy go/no-go checklist passes in the hosted environment.

## Current readiness status

### Fully verified locally

- Authentication shell: Google OAuth login, protected routes, sign-out, and active-staff route gating have been browser-verified locally.
- Domain restriction: wrong-domain Google OAuth rejection has been browser/manual-verified with a real non-allowed-domain account.
- Active profile and roles: bootstrap super-admin activation, access grants, active profile checks, and role assignment are implemented and locally verified.
- Student-card workflows: student search/card display, messages, message editing, soft deletion, project status, emotional status mutation, goals, primary goal selection, follow/unfollow, and photo upload have been verified through browser/manual tests or database probes.
- Announcements: staff read/acknowledgement and admin create/delete are locally verified.
- Calendar: admin create/edit/delete, views, dashboard reflection, and rescheduling are locally verified.
- Learning groups: admin create/edit/archive, timetable/list views, filters, mobile viewport spot-check, and rescheduling are locally verified.
- Notifications and Web Push: in-app notification delivery, badges, privacy-safe push payloads, subscription save/delete, real push delivery, and notification click focus are locally verified.
- Student photo storage: private `student-photos` bucket migration, storage RLS, signed URL display, image optimization, and path-format hardening are locally verified.
- Admin audit export: manager/super-admin access, CSV export without raw JSON payloads, export audit logging, and non-manager denial are locally verified.
- Manual verification status: previously open manual-only checks are closed in `docs/parallel/GPT_MANUAL_VERIFICATION_LEFTOVERS_CLOSEOUT_HANDOFF.md`.

### Code-reviewed or database-verified only

- Hosted Supabase behavior: migrations are local-verified, but a hosted project has not been created or tested.
- Production RLS smoke tests: equivalent rollback-only probes must be rerun against hosted Supabase before real data import.
- Production OAuth redirect behavior: local OAuth is verified, but production Site URL and redirect URLs have not been configured or tested.
- Production Web Push: local real push delivery is verified, but production VAPID keys, origin, service worker registration, and browser permission behavior must be verified after hosting.
- Backup and restore: no production backup/restore drill has been performed because no hosted production project exists.
- Export volume behavior: CSV export has a 1000-row cap by code inspection and smaller local browser tests, but high-volume export performance has not been exercised.

### Deferred by product choice

- Google Calendar sync is deferred. The app remains the calendar source of truth, with Google Calendar planned only as an outbound sync target.
- Calendar recurrence rule mutation, Year/Gantt panels, and full visual drag-and-drop slot editing are deferred.
- Learning group capacity/roster management, school-year selection, full visual drag-and-drop timetable editing, and sync indicators are deferred.
- Student photo manual crop UI, bulk import, moderation, and responsive variants are deferred.
- Real data import tooling is deferred. No import scripts or templates containing real data should be added until explicitly approved.
- Monitoring vendor selection is deferred. Use hosting/platform logs initially unless a monitoring decision is made later.

## Required pre-pilot checklist

- [ ] Confirm the intended pilot scope: staff count, student count, expected pilot dates, and whether the pilot uses all workflows or a narrower subset.
- [ ] Choose hosting provider for the pilot; no provider is selected in the current docs.
- [ ] Create a hosted Supabase project only after this checklist is accepted.
- [ ] Apply migrations to the hosted project.
- [ ] Configure hosted Auth, Google provider, Site URL, and redirect URLs.
- [ ] Configure production app environment variables in the hosting provider.
- [ ] Configure production VAPID keys and subject if Web Push is included in the pilot.
- [ ] Verify the private `student-photos` bucket and storage RLS in hosted Supabase.
- [ ] Seed only bootstrap/admin/access data; do not seed real students.
- [ ] Run hosted RLS smoke tests with fake or bootstrap-only data.
- [ ] Verify wrong-domain OAuth rejection in production.
- [ ] Verify manager-only audit export access and non-manager denial.
- [ ] Verify backups and complete at least one restore-plan review before real data import.
- [ ] Approve the real data import plan and rollback plan.
- [ ] Confirm no real student data exists in git, logs, screenshots, seed files, or examples.

## Production environment variables checklist

`.env.example` is now complete enough as a placeholder-only inventory for active production variables, local Supabase Google OAuth provider variables, and deferred Google Calendar variables. The app currently validates active runtime variables in `src/lib/env.ts` and `src/lib/env.server.ts`; Google Calendar variables are intentionally not used yet.

Required for the deployed app:

- [ ] `NEXT_PUBLIC_SUPABASE_URL`: hosted Supabase API URL. Must point to the pilot/production project, not local Supabase.
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`: hosted Supabase anon key. Safe for browser use but still environment-specific.
- [ ] `SUPABASE_SERVICE_ROLE_KEY`: hosted Supabase service-role key. Server-only. Never expose in client code, logs, docs, screenshots, or browser bundles.
- [ ] `NEXT_PUBLIC_APP_URL`: canonical HTTPS app URL. Must exactly match the deployed origin used for OAuth callbacks.
- [ ] `GOOGLE_ALLOWED_DOMAIN`: institutional Google Workspace domain. Domain comparison is strict after email normalization.
- [ ] `BOOTSTRAP_SUPER_ADMIN_EMAILS`: comma-separated bootstrap admin emails for first production sign-in. Keep minimal, remove or narrow after initial admin access is established.
- [ ] `NEXT_PUBLIC_VAPID_PUBLIC_KEY`: production Web Push public key if Web Push is enabled.
- [ ] `VAPID_PRIVATE_KEY`: production Web Push private key. Server-only.
- [ ] `VAPID_SUBJECT`: production VAPID subject, usually a `mailto:` contact controlled by the school/operator.

Required in Supabase provider configuration, not consumed by the Next.js app:

- [ ] `SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID`: Google OAuth client id for Supabase Auth provider configuration.
- [ ] `SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_SECRET`: Google OAuth client secret for Supabase Auth provider configuration. Secret value must never be committed.

Deferred until Google Calendar sync is implemented:

- [ ] `GOOGLE_CALENDAR_CLIENT_ID`.
- [ ] `GOOGLE_CALENDAR_CLIENT_SECRET`.
- [ ] `GOOGLE_CALENDAR_REDIRECT_URI`.
- [ ] Any refresh-token, service-account, webhook, or calendar-id variables chosen by the future sync design.

## Supabase Cloud migration checklist

- [ ] Create a new Supabase Cloud project for the pilot/production environment.
- [ ] Confirm PostgreSQL major version compatibility with local `supabase/config.toml` (`major_version = 17`) or document any hosted-version difference before migration.
- [ ] Link the local project to the remote project using approved Supabase CLI workflow.
- [ ] Apply all migrations in order:
  - `20260707111701_initial_schema_and_rls.sql`
  - `20260707115303_staff_access_grants.sql`
  - `20260708184000_student_photos.sql`
  - `20260708190500_harden_student_photo_updates.sql`
  - `20260708234000_notifications_system.sql`
  - `20260708235000_harden_notifications_rpc.sql`
  - `20260709000000_student_goal_primary.sql`
  - `20260709010000_student_message_editing.sql`
  - `20260709020000_student_message_soft_delete_fix.sql`
  - `20260709030000_push_subscriptions_v1.sql`
  - `20260709040000_harden_student_photo_url_path.sql`
- [ ] Verify enum state: `app_role`, `traffic_light_status`, `goal_status`, `student_message_tag`, `announcement_target_type`, `event_visibility`, and `weekday`.
- [ ] Verify table state for all app tables, including `profiles`, role/grant tables, student tables, announcements, calendar, learning groups, notifications, push subscriptions, storage references, and audit logs.
- [ ] Verify security-definer helper functions and RPCs exist with expected privileges, including active-staff checks, role checks, relationship checks, notification RPCs, and `update_student_photo_path`.
- [ ] Verify RLS is enabled on every app table and that no policy has been weakened.
- [ ] Verify `audit_logs` remains append-only through trusted server paths and readable only to manager/super-admin roles through RLS.
- [ ] Verify the private `student-photos` storage bucket exists with expected MIME and size limits.
- [ ] Verify storage object RLS policies allow active staff reads and only authorized photo managers to insert/update/delete.
- [ ] Configure Google Auth provider in Supabase Auth with the production Google OAuth client.
- [ ] Configure Supabase Auth Site URL to the production app URL.
- [ ] Configure redirect URLs exactly, including the production `/auth/callback` URL.
- [ ] Add preview deployment redirect URLs only if preview deployments will be used for authenticated testing.
- [ ] Generate production database types if schema differs from local or after remote migration verification.
- [ ] Seed only safe bootstrap/admin/access data. Do not seed real students, real contacts, real messages, real photos, or real project/emotional history.
- [ ] Verify hosted RLS with fake accounts and fake records before importing real data.
- [ ] Verify backups are enabled and document restore procedure before pilot.
- [ ] Verify signed URL generation for student photos in hosted storage.

## Hosting checklist

- [ ] Select a hosting platform. Current docs do not choose Vercel, Netlify, or another provider.
- [ ] Configure build command: `npm run build`.
- [ ] Configure start/runtime behavior according to the selected provider's Next.js 16 support.
- [ ] Configure all production environment variables listed above.
- [ ] Require HTTPS for the canonical app URL.
- [ ] Configure OAuth redirect URLs for production and approved preview origins.
- [ ] Confirm `/sw.js` is served from the site root and registers under the production origin.
- [ ] Confirm browser sessions/cookies work with the selected deployment domain and no stale localhost cookies are involved in production testing.
- [ ] Decide how preview deployments are handled. If previews are enabled, add their exact redirect URLs to Supabase Auth or avoid OAuth testing on previews.
- [ ] Confirm logs do not print secrets, student records, push subscription keys, full export contents, or OAuth tokens.
- [ ] Decide error monitoring before pilot. No monitoring vendor or dependency is selected in the current docs.
- [ ] Document the operational owner who can inspect hosting logs during the pilot.

## Real data import checklist

Do not implement import tooling or create data templates in this task. Before real data import, define the import owner, source files, validation rules, rollback plan, and audit expectations.

Datasets likely needed:

- [ ] Staff/users: email, display name, active status, and optional profile metadata.
- [ ] Roles: app roles per staff member.
- [ ] Access grants: pre-approved emails and roles for first OAuth login.
- [ ] Student groups: school year, group name, layer, active status.
- [ ] Students: names, group assignment, contact fields, active status, and photo path only after photo storage is ready.
- [ ] Mentors: group mentor assignments and active dates.
- [ ] Masters: student/project master assignments and active dates.
- [ ] Projects: current project per student and status fields.
- [ ] Learning groups: weekday, time window, staff leader, room, target groups, and active status.
- [ ] Calendar events: title, description, timing, visibility, target groups, and sync metadata only if relevant.

Required validation before import:

- [ ] Every staff email belongs to the allowed Google domain unless explicitly excluded.
- [ ] Every role is one of the current `app_role` enum values.
- [ ] Every student belongs to exactly one intended current group unless an approved exception exists.
- [ ] Every mentor/master reference points to an active staff profile or approved pending grant.
- [ ] Every project references an existing active student and current school year.
- [ ] Every learning group respects the database time checks.
- [ ] Every calendar event has valid start/end ordering and visibility.
- [ ] No imported file contains unnecessary sensitive notes.
- [ ] Test environments use de-identified data only.

Rollback and access controls:

- [ ] Define a transaction or restore-point strategy before import.
- [ ] Export/import operators must be manager or super-admin level and explicitly approved.
- [ ] Import actions should be audited before real pilot import proceeds.
- [ ] Real import source files must never be committed to git.
- [ ] Real data must never be added to seed files, docs, logs, screenshots, examples, issue comments, or test fixtures.

## Security/privacy go/no-go checklist

Pilot is a no-go until every item below passes in the hosted environment:

- [ ] RLS smoke tests pass for anonymous, inactive valid-domain, active staff, manager, and super-admin personas.
- [ ] Wrong-domain Google OAuth login is rejected, creates no authorized profile, and clears the session.
- [ ] Non-manager audit export request returns forbidden and does not create an export audit row.
- [ ] `student-photos` bucket is private and direct public access fails.
- [ ] Student photo signed URLs work only through authenticated app flows.
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is present only in server-side hosting secrets and unavailable to browser/client bundles.
- [ ] No normal user flow uses service-role for routine CRUD that should be RLS-governed.
- [ ] No real student data exists in git, seed files, docs, screenshots, logs, or examples.
- [ ] Audit log visibility is restricted to manager/super-admin roles.
- [ ] Sensitive audit/export payloads do not expose raw JSON or full student data in downloadable CSVs.
- [ ] Backup and restore procedure is confirmed.
- [ ] Admin account recovery path is documented.
- [ ] Incident rollback plan is documented, including who can disable access, rotate secrets, and restore backups.

Known residual risks:

- The emotional-status dev seed date quirk is local-only unless similar future-dated seed data is imported into production.
- Service-role is used only in privileged server-only paths today, but every new privileged path must preserve explicit permission checks.
- Web Push subscription endpoint/key data should be treated as sensitive technical data even though it is not direct student content.
- Google Calendar sync is deferred; calendar data will not appear in Google Calendar until a later implementation.
- Production backup/restore and hosted RLS have not been verified because no hosted project exists yet.

## Deferred post-pilot features

- Outbound Google Calendar sync.
- Calendar recurrence editing and Year/Gantt views.
- Full visual drag-and-drop calendar and learning-group editing.
- Learning group roster/capacity management and school-year selector.
- Student photo crop UI, bulk import, moderation, and responsive variants.
- Formal real-data import tooling.
- Monitoring vendor integration if selected.

## Recommended next implementation task

Recommended next task: Production Environment Setup Runbook v1.

Scope:

- Create a deployment runbook from this checklist without actually deploying.
- Define exact Supabase Cloud commands, verification SQL probes, hosting env var names, and rollback steps.
- Add a fake-data-only hosted smoke-test script plan.
- Keep Google Calendar sync and real data import out of scope.
