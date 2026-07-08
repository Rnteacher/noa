# 12 — Current State

## Project phase

Database foundation and codebase guardrails validated. Next.js application, internationalization, local Supabase, and Hebrew character enforcement scanner are fully operational and verified.

## Current stack

- Next.js App Router (v16.2.10)
- TypeScript
- Tailwind CSS
- Lucide React (for UI iconography)
- Zod (for environment validation)
- Supabase SSR (browser and server client helpers configured)
- Local Supabase (initialized & migration applied)
- Custom Hebrew Character Code Scanner (Node.js script)

## Scaffold structure created

- `src/app/` (with root layout, page routing, and RTL configuration)
  - `src/app/(app)/layout.tsx` (shared protected app shell layout)
  - `src/app/(app)/today/page.tsx` (protected placeholder tab route)
  - `src/app/(app)/students/page.tsx` (student search list page)
  - `src/app/(app)/students/[studentId]/page.tsx` (student detail card page)
  - `src/app/(app)/students/[studentId]/MessageComposer.tsx` (student message composer client component)
  - `src/app/(app)/students/[studentId]/DeleteMessageButton.tsx` (student message deletion client component)
  - `src/app/(app)/students/[studentId]/ProjectStatusForm.tsx` (project traffic-light status update client component)
  - `src/app/(app)/students/[studentId]/EmotionalStatusForm.tsx` (emotional traffic-light status update client component)
  - `src/app/(app)/students/[studentId]/GoalForm.tsx` (student goal creation client component)
  - `src/app/(app)/students/[studentId]/GoalStatusForm.tsx` (per-goal status update client component)
  - `src/app/(app)/students/[studentId]/FollowButton.tsx` (student follow/unfollow client component)
  - `src/app/(app)/students/[studentId]/PhotoUploadForm.tsx` (student photo upload client component)
  - `src/app/(app)/announcements/page.tsx` (announcements list page)
  - `src/app/(app)/announcements/[announcementId]/page.tsx` (announcement detail and acknowledgement page)
  - `src/app/(app)/admin/announcements/page.tsx` (admin announcements list page)
  - `src/app/(app)/admin/announcements/AnnouncementForm.tsx` (admin announcement creation client form)
  - `src/app/(app)/admin/announcements/DeleteAnnouncementButton.tsx` (admin announcement deletion client button)
  - `src/app/(app)/more/page.tsx` (protected placeholder tab route)
  - `src/app/(app)/dev/ui/page.tsx` (protected base UI component showcase route)
- `src/components/` (UI elements and layouts)
  - `src/components/ui/` (base components: `Card`, `ListRow`, `StatusBadge`, `EmptyState`, `Skeleton`, `Alert`, `BottomNav`, `AppHeader`)
  - `src/components/layout/` (structural layouts: `AdminShell`)
- `src/lib/` (general utilities)
  - `src/lib/cn.ts` (Tailwind class-joining utility helper)
  - `src/lib/env.ts` (Zod environment variable schema validation)
  - `src/lib/env.server.ts` (Server-only environment helper for privileged values)
  - `src/lib/auth/` (Authentication, access, profile sync, and service-role utilities)
  - `src/lib/admin/access-grants.ts` (Server actions for super-admin staff access grant management)
  - `src/lib/audit/log.ts` (Server-only audit log writer)
  - `src/lib/i18n.ts` (Lightweight translation helper)
  - `src/lib/supabase/`
    - `src/lib/supabase/client.ts` (Supabase client-side browser helper)
    - `src/lib/supabase/server.ts` (Supabase server-side helper using async cookies)
- `src/i18n/`
  - `src/i18n/he.json` (Hebrew UI resource file, no Hebrew code strings exist in JS/JSX)
  - `src/i18n/en.json` (English translation reference and fallbacks)
- `src/types/` (types folder containing generated database types)
  - `src/types/supabase.ts` (Generated TypeScript types from local schema)
- `src/features/` (feature-grouped modules)
  - `dashboard/`
    - `src/features/dashboard/queries.ts` (Dashboard server-side queries)
    - `src/features/dashboard/types.ts` (Dashboard TypeScript definitions)
  - `students/`
    - `src/features/students/queries.ts` (Students server-side queries)
    - `src/features/students/types.ts` (Students TypeScript definitions)
    - `src/features/students/actions.ts` (Students Server Actions)
  - `announcements/`
    - `src/features/announcements/queries.ts` (Announcements server-side queries)
    - `src/features/announcements/admin-queries.ts` (Admin announcements server-side queries)
    - `src/features/announcements/types.ts` (Announcements TypeScript definitions)
    - `src/features/announcements/actions.ts` (Announcements Server Actions)
    - `src/features/announcements/admin-actions.ts` (Admin announcements Server Actions)
  - `calendar/`, `admin/`, `auth/`, `notifications/`
- `supabase/` (initialized configuration and migration folder)
  - `supabase/migrations/20260707111701_initial_schema_and_rls.sql`
  - `supabase/migrations/20260707115303_staff_access_grants.sql`
  - `supabase/seeds/dev_seed.sql` (reviewed local development seed; enabled for local `supabase db reset`)
- `scripts/`
  - `scripts/check-no-hebrew-in-code.mjs` (Enforcement scanner script)
- `.env.example` (environment variables template)
  - Includes `BOOTSTRAP_SUPER_ADMIN_EMAILS` for first-run admin bootstrap.
- `docs/design/` (UX design foundation)
  - `docs/design/01_PRODUCT_UX_OVERVIEW.md`
  - `docs/design/02_MOBILE_STAFF_APP_WIREFRAMES.md`
  - `docs/design/03_STUDENT_CARD_UX.md`
  - `docs/design/04_ADMIN_DESKTOP_UX.md`
  - `docs/design/05_VISUAL_SYSTEM_DIRECTION.md`
- `docs/parallel/`
  - `docs/parallel/CLAUDE_APP_SHELL_HANDOFF.md`
  - `docs/parallel/CLAUDE_BASE_COMPONENTS_HANDOFF.md`
  - `docs/parallel/CLAUDE_UI_FOUNDATION_HANDOFF.md`
  - `docs/parallel/GEMINI_DEV_SEED_HANDOFF.md`
  - `docs/parallel/GPT_ANNOUNCEMENTS_READ_V1_HANDOFF.md`
  - `docs/parallel/GPT_DASHBOARD_V1_HANDOFF.md`
  - `docs/parallel/GPT_DEV_SEED_REVIEW_HANDOFF.md`
  - `docs/parallel/GPT_SEED_ACTIVATION_HANDOFF.md`
  - `docs/parallel/GPT_STUDENT_MESSAGE_COMPOSER_V1_HANDOFF.md`
  - `docs/parallel/GPT_STUDENT_MESSAGE_SOFT_DELETE_V1_HANDOFF.md`
  - `docs/parallel/GPT_PROJECT_STATUS_MUTATION_V1_HANDOFF.md`
  - `docs/parallel/GPT_EMOTIONAL_STATUS_MUTATION_V1_HANDOFF.md`
  - `docs/parallel/GPT_STUDENT_GOALS_MUTATION_V1_HANDOFF.md`
  - `docs/parallel/GPT_STUDENTS_READONLY_V1_HANDOFF.md`
  - `docs/parallel/GPT_FOLLOW_STUDENT_V1_HANDOFF.md`
  - `docs/parallel/GPT_STUDENT_PHOTO_UPLOADS_V1_HANDOFF.md`
  - `docs/parallel/GPT_STUDENT_PHOTO_SECURITY_HARDENING_HANDOFF.md`
  - `docs/parallel/GPT_ADMIN_DESKTOP_SHELL_V1_HANDOFF.md`
  - `docs/parallel/GPT_ADMIN_ANNOUNCEMENTS_V1_HANDOFF.md`

## Database foundation status

The initial Supabase migration `supabase/migrations/20260707111701_initial_schema_and_rls.sql` is verified locally.

The migration defines:
- Required extension: `pgcrypto`.
- Enums: `app_role`, `traffic_light_status`, `goal_status`, `student_message_tag`, `announcement_target_type`, `event_visibility`, `weekday`.
- Core tables: `school_years`, `profiles`, `profile_roles`, `student_groups`, `group_mentors`, `students`, `projects`, `student_masters`, `student_emotional_statuses`, `student_goals`, `student_messages`, `followed_students`, `announcements`, announcement target/read tables, `calendar_events`, `calendar_event_groups`, `learning_groups`, `learning_group_target_groups`, `push_subscriptions`, `notifications`, `webhook_endpoints`, `webhook_deliveries`, and `audit_logs`.
- Reusable `updated_at` trigger function and triggers on all tables with `updated_at`.
- Security definer permission helpers for active staff checks, role checks, mentor/master relationship checks, project/emotional/goal/photo authorization checks, announcement visibility, and calendar event visibility.
- RLS enabled on all app tables.
- Initial RLS policies for staff read access, relationship-based updates, announcement acknowledgement, calendar/learning group management, push subscriptions, notifications, webhook administration, and audit log visibility.
- Views: `current_student_project_statuses` and `latest_student_emotional_statuses`.

The second migration `supabase/migrations/20260707115303_staff_access_grants.sql` is verified locally.

It defines:

- `staff_access_grants`: pre-approved staff email grants.
- `staff_access_grant_roles`: roles attached to each grant.
- RLS policies allowing only super admins to manage grants.
- Authenticated grants matching the existing RLS approach.

The third migration `supabase/migrations/20260708184000_student_photos.sql` is verified locally.

It defines:
- A private storage bucket `student-photos` with a 5MB size limit and allowed MIME types (`image/jpeg`, `image/png`, `image/webp`).
- Storage object RLS policies allowing active staff to read/select photos, and authorized staff (verified by `current_user_can_manage_student_photo`) to insert/update/delete objects.
- A table-level RLS update policy on `public.students` allowing authorized staff to update the student row (dropped in the fourth migration).

The fourth migration `supabase/migrations/20260708190500_harden_student_photo_updates.sql` is verified locally.

It defines:
- Drops the broad `Authorized staff can update student photos on student row` policy on `public.students`.
- Creates a secure security definer RPC function `public.update_student_photo_path(target_student_id uuid, new_photo_path text)` which restricts updates strictly to the `photo_url` column, validates active user permissions, and enforces that the image path matches the specific student's directory (`students/{studentId}/...`).
- Grants execute access on the RPC exclusively to the `authenticated` role.

## Auth and access-control status

Google OAuth, protected app routes, and first-run access control are implemented.

Files created or changed:

- `src/proxy.ts`: Next.js 16 Proxy route protection.
- `src/app/(public)/login/page.tsx`: Google sign-in page.
- `src/app/(public)/access-denied/page.tsx`: Wrong-domain or invalid-auth page.
- `src/app/(public)/access-pending/page.tsx`: Valid-domain inactive profile page.
- `src/app/auth/callback/route.ts`: Supabase OAuth callback, domain validation, profile sync, and access redirects.
- `src/app/auth/sign-out/route.ts`: Sign-out route.
- `src/app/(app)/dashboard/page.tsx`: Protected dashboard shell moved from `/`.
- `src/app/page.tsx`: Root redirect based on auth/access state.
- `src/lib/auth/access.ts`: Email normalization and domain checks.
- `src/lib/auth/admin.ts`: Server-only service-role Supabase client.
- `src/lib/auth/profile.ts`: OAuth profile sync, access grants, role assignment, and bootstrap flow.
- `src/lib/auth/session.ts`: Current server-side access state helper.

Access model:

- Google OAuth is required.
- `GOOGLE_ALLOWED_DOMAIN` is enforced on callback and protected routing.
- Valid-domain users without activation get inactive profiles and no roles.
- Active staff access requires `profiles.is_active = true` and at least one `profile_roles` row.
- Active `staff_access_grants` can activate first OAuth login and copy grant roles into `profile_roles`.
- `BOOTSTRAP_SUPER_ADMIN_EMAILS` can activate allowed-domain first-run users with `super_admin` and `manager` roles.
- Wrong-domain users are signed out during callback and redirected to access denied.
- Protected routes use `src/proxy.ts`, matching the current Next.js 16 convention.

## Staff access grant management status

The first super-admin-only access grant management surface is implemented at:

- `/admin/access-grants`

Implemented files:

- `src/app/(app)/admin/access-grants/page.tsx`: Server-rendered grant list, create form, and edit forms.
- `src/lib/admin/access-grants.ts`: Server actions for grant create/update, role replacement, active toggles, and audit logging.
- `src/lib/audit/log.ts`: Privileged audit log helper using the server-only service-role client.
- `src/lib/auth/roles.ts`: Shared typed app role list for forms.
- `src/app/(app)/dashboard/page.tsx`: Adds a minimal super-admin-only link to grant management.

Access enforcement:

- `src/proxy.ts` requires an authenticated active staff session for `/admin/access-grants`.
- The page checks `current_user_is_super_admin` before rendering grant data.
- Each server action repeats the super-admin check before performing mutations.
- Mutations use the server-only service-role client; the service-role key is not exposed to client code.
- Direct table access still goes through existing RLS, where only super admins can manage grant tables.

Audit logging:

- Grant actions write to `audit_logs` through a privileged server-only helper.
- Audited actions include `staff_access_grant.created`, `staff_access_grant.updated`, `staff_access_grant.roles_updated`, `staff_access_grant.deactivated`, and `staff_access_grant.activated`.

## UI foundation status

Base UI components and semantic design tokens are implemented.

Status:
- Semantic design tokens were added in `src/app/globals.css` using Tailwind v4 CSS-based token configuration.
- Base UI components were added under `src/components/ui/`: `Card`, `ListRow`, `StatusBadge`, `EmptyState`, `Skeleton`, `Alert`, `BottomNav`, and `AppHeader`.
- The Toast system was deferred; the inline `Alert` component was implemented instead for early feedback messaging.
- An internal component showcase route exists at `/dev/ui` (accessible under the protected app route group).
- `BottomNav` matches the five conceptual navigation slots: Dashboard (`/dashboard`), Today (`/today`), Students (`/students`), Announcements (`/announcements`), and More (`/more`).
- `StatusBadge` uses both a unique glyph shape (e.g., circle-check, triangle, octagon) and text labels, ensuring color is never used as the sole conveyor of status information.

## App shell status

The layout and navigation shell integration is complete.

Status:
- `BottomNav` is rendered in the protected app layout (`src/app/(app)/layout.tsx`) as a persistent element for staff-facing mobile routes. It is conditionally hidden on admin routes.
- `AppHeader` is rendered per-page to support individual screen actions, custom titles, and back link navigation affordances in the mobile staff app.
- `/today`, `/students`, `/announcements`, and `/more` exist as protected placeholder routes returning placeholder content via the i18n layer.
- Protected features `/dashboard`, `/admin/access-grants`, and `/dev/ui` build successfully inside the new app shell.
- `/admin/*` routes use the desktop-first `AdminShell` (`src/components/layout/AdminShell.tsx`) featuring a logical direction-aware (RTL-ready) side navigation panel, top headers, back links to the staff dashboard, and a collapsible menu drawer for responsive mobile layout viewports.
- `/admin/access-grants` is visually integrated into the new admin shell, styling outer spacing dynamically and validating super-admin session authorization.
- Real dashboard data queries and status aggregations are implemented in Dashboard v1.

## Dashboard v1 status

Personal dashboard display of live, security-scoped data is implemented.

Status:
- `/dashboard` now reads real Supabase data using the normal request-scoped Supabase server client, completely avoiding the service-role client.
- All reads are anchored by checking the authenticated user session via `supabase.auth.getUser()`.
- Existing database RLS policies filter announcement and calendar event visibility naturally based on the session.
- Implemented sections:
  - Required acknowledgements (announcements requiring read acknowledgement that the user has not read yet).
  - Recent announcements (compact list of recent news).
  - Today at Chamama (calendar events overlapping the current local day).
  - This week (upcoming calendar events starting in the next 7 days).
  - Followed students count (v1 summary card linking to the students tab).
  - Super-admin access-grants shortcut (visible only to users with `super_admin` role).
- Deferred features:
  - Calendar event detail viewing and editing/creation (deferred to future calendar management task).
  - Live followed-student change feed.
  - Bottom navigation activity badges.
- Access enforcement:
  - Anonymous `/dashboard` requests are protected by routing middleware and redirect to `/login`.
  - Authenticated browser smoke testing should still be performed locally once Google OAuth credentials or mock authentication methods are established.

## Student card status

Student search page and detailed student cards with message posting, project status updates, emotional status updates, and goal management are implemented.

Status:
- `/students` displays active student list with full name, group, and current project details, supporting ILIKE name search filtering.
- `/students/[studentId]` shows the identity, follow state, group mentors, contacts, current project, masters, emotional status, goals, and recent messages list.
- Authenticated active staff members can add new update messages to a student card via the mounted `<MessageComposer>` form.
- Message inserts use the standard request-scoped Supabase server client and respect database Row-Level Security (RLS) policies.
- Message soft deletion is implemented: users can soft-delete their own messages, and super admins can soft-delete any message. Deletions are performed under the RLS model.
- Successfully created and deleted messages write secure audit logs (`student_message.created` and `student_message.deleted`).
- Authorized project masters assigned to the current project can update the project traffic-light status from the Current project section.
- Managers can update project traffic-light status because the existing schema helper `current_user_can_update_student_project` explicitly includes `current_user_is_manager_or_super_admin`.
- Super admins can update any project traffic-light status through the same existing schema/RLS authorization path.
- Project status updates use the normal request-scoped Supabase client, update only `projects.status` and updater metadata, and write secure audit logs (`project.status_updated`).
- No project-status migration was added; Project Status Mutation v1 uses the existing `projects.status` field, `traffic_light_status` enum, current-project model, and RLS helper/policy.
- Authorized active group mentors can update the emotional traffic-light status from the Emotional status section.
- Counselors can update emotional traffic-light status because the existing schema helper `current_user_can_update_student_emotional_status` explicitly includes `current_user_has_role('counselor')`.
- Managers can update emotional traffic-light status because the same existing schema helper explicitly includes `current_user_is_manager_or_super_admin`.
- Super admins can update any student's emotional traffic-light status through the same existing schema/RLS authorization path.
- Emotional status updates append a new `student_emotional_statuses` history row (status and `created_by` only) through the normal request-scoped Supabase client and write secure audit logs (`student_emotional_status.updated`) containing only status transition metadata.
- Emotional free-text notes remain hidden and are not editable in Emotional Status Mutation v1; the mutation never reads or writes the `note` column.
- No emotional-status migration was added; Emotional Status Mutation v1 uses the existing `student_emotional_statuses` append-only table, `traffic_light_status` enum, `latest_student_emotional_statuses` view, and the existing insert RLS policy/helper.
- Authorized active group mentors can create student goals and update goal status from the Goals section.
- Managers and super admins can manage goals because the existing schema helper `current_user_can_update_student_goals` explicitly includes `current_user_is_manager_or_super_admin`.
- Counselors cannot manage goals; the existing schema helper does not include the counselor role, matching the RBAC matrix.
- Goal mutations update goals in place through the normal request-scoped Supabase client, touch only intentionally exposed columns (`title` and `description` on create, `status` and `updated_by` on update), and write secure audit logs (`student_goal.created` and `student_goal.updated`).
- Goal archiving works through the existing `goal_status` enum value `archived`; archived goals are filtered out of the student card. Hard goal deletion (manager/super-admin-only RLS) and goal title/description editing remain deferred.
- No goals migration was added; Student Goals Mutation v1 uses the existing `student_goals` table, `goal_status` enum, and the existing insert/update RLS policies/helper.
- Active staff can follow and unfollow students on their student cards. The follow state is scoped to the current user's profile and uses the existing `followed_students` schema and RLS policies (no database migration was added). Following/unfollowing performs idempotent inserts/deletes, writes secure audit logs (`student_follow.created` and `student_follow.deleted`), and revalidation refreshes both the student card and the dashboard followed-student count.
- Authorized group mentors, managers, and super admins can upload or replace a student's profile photo from the student card using the `<PhotoUploadForm>` component. Photos are stored in a private Supabase Storage bucket (`student-photos`) and retrieved dynamically via secure signed URLs. Photo updates write secure audit logs (`student_photo.updated`) and are secure and column-safe: direct table-level update policies on `public.students` are disabled, and updates are restricted strictly to the `photo_url` column via a secure RPC helper (`update_student_photo_path`) validating user permissions and expected storage paths. Advanced image cropping, image moderation, and bulk photo import remain deferred.
- Anonymous requests to `/students` or `/students/[studentId]` redirect to `/login`.
- Deferred features:
  - Message editing.
  - Permanent message deletion.
  - Realtime updates on the message stream.
  - Emotional free-text notes viewing/editing surface.
  - Goal title/description editing, hard deletion, and primary/central goal management.
  - Student project title/master assignment editing.
  - Student status push notifications.

## Announcements read and management v1 status

Personal announcements reading path, read acknowledgements, and administrator management compose workflows are implemented.

Status:
- `/announcements` lists recent RLS-visible announcements, indicating their pinned status and acknowledgement state.
- `/announcements/[announcementId]` displays one RLS-visible announcement's details (title, body, author name, published date, and confirmation status).
- Acknowledgement-required announcements can be acknowledged by the current authenticated user via an interactive confirmation button.
- Both read queries and acknowledgement write actions use the normal server Supabase client (`createClient()`) to respect database Row-Level Security (RLS) policies; the service-role client is completely avoided.
- Dashboard required acknowledgement rows now link to the respective announcement detail flow.
- `/admin/announcements` allows managers and super admins (or leadership role holders) to view a list/table of active announcements, see read acknowledgement progress counters, and delete announcements they manage.
- Dynamic checkbox selectors allow targeting: all staff, specific roles (strictly validated against database `app_role` enum values: `'staff'`, `'mentor'`, `'master'`, `'counselor'`, `'leadership'`, `'manager'`, and `'super_admin'`; the invalid role `'teacher'` was removed), and specific learning groups (fetched dynamically from `student_groups`).
- Announcements can be composed with custom settings like pinned status (`is_pinned`) and acknowledgement requirements (`requires_acknowledgement`).
- Deletion is fully protected by RLS delete policies (restricted to managers and super admins) and audited via `announcement.deleted` audit logs.
- Creation is protected by RLS insert policies (restricted to leadership or above) and audited via `announcement.created` audit logs.
- RLS database queries and mutations are verified through transaction-rollback SQL probes covering creation permissions, normal staff restriction, invalid role rejection, group targeting, and manager-only delete policies.
- Anonymous requests to `/announcements`, `/announcements/[announcementId]`, or `/admin/announcements` redirect to `/login`.
- Deferred features:
  - Announcement inline editing/updating.
  - Draft mode and scheduled publishing (deferred as they are not supported by seed schemas).
  - Push notification delivery (V1 does not implement push notifications).
  - Rich text formatting (beyond plain text area) and attachments upload.

## UX design foundation status

Parallel Claude design planning added documentation under `docs/design/`.

The design package covers:

- Product UX overview and main flows.
- Mobile staff app wireframes.
- Student card UX.
- Desktop admin UX.
- Visual system direction.

The parallel handoff is stored at `docs/parallel/CLAUDE_UI_FOUNDATION_HANDOFF.md`.

These files are documentation-only and did not change application code, migrations, or i18n files.

## Development seed status

A reviewed local development seed exists at:

- `supabase/seeds/dev_seed.sql`

The parallel Gemini, review, and activation handoffs are stored at:

- `docs/parallel/GEMINI_DEV_SEED_HANDOFF.md`
- `docs/parallel/GPT_DEV_SEED_REVIEW_HANDOFF.md`
- `docs/parallel/GPT_SEED_ACTIVATION_HANDOFF.md`

The seed is now enabled in `supabase/config.toml` under `[db.seed]`:

```toml
sql_paths = ["./seeds/dev_seed.sql"]
```

Local `supabase db reset` now automatically loads `supabase/seeds/dev_seed.sql` after migrations.

Status:
- `supabase/seeds/dev_seed.sql` was reviewed and fixed.
- Manual execution of the seed file after `supabase db reset` passed successfully.
- Automatic loading via `supabase db reset` passed successfully.
- Direct `auth.users` inserts are compatible with the current local Supabase Auth schema for local development/profile FK seeding.
- Client password sign-in for mock auth users has not been validated/tested.

## Latest seed activation validation results

Commands run:

```bash
supabase db reset
npm run check:no-hebrew-in-code
npm run lint
npm run build
git diff --check
```

Results:

- `supabase db reset` passed and automatically loaded `supabase/seeds/dev_seed.sql`.
- Spot-check SQL after reset confirmed `profiles` 8, `profile_roles` 15, `students` 6, `student_groups` 2, `projects` 6, `announcements` 2, `calendar_events` 2, `staff_access_grants` 8, and `audit_logs` 0.
- `npm run check:no-hebrew-in-code` passed.
- `npm run lint` passed.
- `npm run build` passed.
- `git diff --check` passed.

## Latest validation results

We ran local validations and checks on Windows 10:

1. **Supabase Local Services**: Started successfully with `supabase start`.
2. **Database Schema & Migrations**: Succeeded cleanly using `supabase db reset`, verifying SQL syntax and table generation.
3. **Database TypeScript Type Generation**: Succeeded and saved at `src/types/supabase.ts` with explicit UTF-8 encoding to prevent parser warnings.
4. **Hebrew Character Enforcement Scanner**: Added `scripts/check-no-hebrew-in-code.mjs` and configured `"check:no-hebrew-in-code"` script in `package.json`. Resolved all hardcoded Hebrew text inside `src/app/page.tsx` by migrating them into translation dictionary files. Scanner runs and passes with `exit 0` (no violations found).
5. **Code Style & Compilation Checks**:
   - `npm run lint` - Passed cleanly.
   - `npm run build` - Production bundle build with Next.js Turbopack succeeded.
   - `git diff --check` - Passed without whitespace issues.

## Latest auth task validation results

Commands run:

```bash
supabase db reset
supabase gen types typescript --local | Out-File -Encoding utf8 src/types/supabase.ts
npm run check:no-hebrew-in-code
npm run lint
npm run build
git diff --check
```

Results:

- `supabase db reset` passed and applied both migrations. Supabase warned that `supabase/seed.sql` does not exist.
- Type generation passed and updated `src/types/supabase.ts`.
- `npm run check:no-hebrew-in-code` passed.
- `npm run lint` passed.
- `npm run build` passed.
- `git diff --check` passed.

## Latest access grant management validation results

Commands run:

```bash
supabase db reset
supabase gen types typescript --local | Out-File -Encoding utf8 src/types/supabase.ts
npm run check:no-hebrew-in-code
npm run lint
npm run build
git diff --check
```

Results:

- `supabase db reset` passed and applied both migrations. Supabase warned that `supabase/seed.sql` does not exist.
- Type generation passed and updated `src/types/supabase.ts`.
- `npm run check:no-hebrew-in-code` passed.
- `npm run lint` passed.
- `npm run build` passed.
- `git diff --check` passed.

## Latest student goals mutation validation results

Commands run:

```bash
supabase db reset
supabase gen types typescript --local | Out-File -Encoding utf8 src/types/supabase.ts
npm run check:no-hebrew-in-code
npm run lint
npm run build
git diff --check
```

Results:

- `supabase db reset` passed and loaded `supabase/seeds/dev_seed.sql`.
- Type generation passed; `src/types/supabase.ts` was regenerated with no changes because no migration was added.
- `npm run check:no-hebrew-in-code` passed.
- `npm run lint` passed.
- `npm run build` passed.
- `git diff --check` passed with line-ending normalization warnings only.
- Anonymous `GET /students/55000000-0000-0000-0000-000000000001` returned `307` to `/login`.
- Rollback-only database RLS probes confirmed: unrelated staff goal insert denied, counselor goal insert denied, manager goal insert allowed, super admin goal insert allowed, unrelated staff goal update changed 0 rows, manager goal update changed 1 row, and a manager update spoofing another user's `updated_by` denied by the update policy's with-check clause.
- The seeded mentor assignment starts on `2026-09-01`, so it is not active on `2026-07-08` and the unmodified mentor probes were denied. Rollback-only probes that temporarily moved that assignment start date earlier confirmed an active group mentor can insert a goal and update a goal's status; the transactions were rolled back and the seed state remained unchanged.
- Authenticated browser smoke testing of the mutation was not completed because the local login UI is Google-only and the seeded email/password users do not create usable Supabase auth sessions for the protected app. Server-side build checks and database authorization probes passed.

## Latest emotional status mutation validation results

Commands run:

```bash
supabase db reset
supabase gen types typescript --local | Out-File -Encoding utf8 src/types/supabase.ts
npm run check:no-hebrew-in-code
npm run lint
npm run build
git diff --check
```

Results:

- `supabase db reset` passed and loaded `supabase/seeds/dev_seed.sql`.
- Type generation passed; `src/types/supabase.ts` was regenerated with no changes because no migration was added.
- `npm run check:no-hebrew-in-code` passed.
- `npm run lint` passed.
- `npm run build` passed.
- `git diff --check` passed with line-ending normalization warnings only.
- Anonymous `GET /students/55000000-0000-0000-0000-000000000001` returned `307` to `/login`.
- Rollback-only database RLS probes confirmed: unrelated staff insert denied, counselor insert allowed, manager insert allowed, super admin insert allowed, and a counselor insert spoofing another user's `created_by` denied.
- The seeded mentor assignment starts on `2026-09-01`, so it is not active on `2026-07-08` and the unmodified mentor probe was denied. A rollback-only probe that temporarily moved that assignment start date earlier confirmed an active group mentor can insert an emotional status row; the transaction was rolled back and the seed state remained unchanged.
- Authenticated browser smoke testing of the mutation was not completed because the local login UI is Google-only and the seeded email/password users do not create usable Supabase auth sessions for the protected app. Server-side build checks and database authorization probes passed.

## Latest project status mutation validation results

Commands run:

```bash
supabase db reset
supabase gen types typescript --local | Out-File -Encoding utf8 src/types/supabase.ts
npm run check:no-hebrew-in-code
npm run lint
npm run build
git diff --check
```

Results:

- `supabase db reset` passed and loaded `supabase/seeds/dev_seed.sql`.
- Type generation passed and refreshed `src/types/supabase.ts`.
- `npm run check:no-hebrew-in-code` passed.
- `npm run lint` passed.
- `npm run build` passed.
- `git diff --check` passed with line-ending normalization warnings only.
- Anonymous `GET /students/55000000-0000-0000-0000-000000000001` returned `307` to `/login`.
- Rollback-only database RLS probes confirmed normal staff changed 0 project rows, manager changed 1 row, and super admin changed 1 row.
- The seeded master assignment starts on `2026-09-01`, so it is not active on `2026-07-08` and changed 0 rows under the unmodified seed. A rollback-only probe that temporarily moved that assignment start date earlier confirmed an active current-project master can change 1 project row; the transaction was rolled back and the seed state remained unchanged.
- Authenticated browser smoke testing of the mutation was not completed because the local login UI is Google-only and the seeded email/password users do not create usable Supabase auth sessions for the protected app. Server-side build checks and database authorization probes passed.

Remaining Google OAuth setup:

- Create Google OAuth credentials outside the repo.
- Configure local Supabase Google provider with the client id and secret.
- Add `http://127.0.0.1:54321/auth/v1/callback` as the local Google OAuth redirect URI.
- Add local `.env.local` values for Supabase URL, anon key, service-role key, app URL, allowed domain, and optional bootstrap emails.

## Current product decisions

- Staff-only app.
- Mobile-first staff experience.
- Desktop-first admin experience.
- Google institutional sign-in.
- All staff can view all student cards.
- All staff can add messages to student cards.
- Users can delete their own messages.
- Super admins can delete any message.
- Students belong to groups.
- Each group has two mentors.
- Mentor permissions derive from active group assignment.
- Students can have multiple masters in exceptional cases.
- One current project per student for now.
- Goals are staff-visible only for now.
- Future goal sync with student app should be possible.
- App is source of truth for calendar events.
- Google Calendar is outbound sync only.
- Announcements can require read acknowledgement.
- Daily reminders are required.
- No draft mode in first version.
- Permissions by role and group/layer are required.
- Future archive by school year is required.
- Only managers and super admins can export.

## Current documentation status

Created/maintained docs for:
- Product requirements.
- Architecture.
- Data model draft.
- RBAC.
- AI collaboration protocol.
- Implementation backlog.
- Local Supabase workflow.
- i18n/language rules.
- API/webhooks.
- Security/privacy/audit.
- Decision log.
- Hand-off files and Hebrew character scanner scripts.
- UX design foundation docs under `docs/design/`.
- Parallel handoffs under `docs/parallel/`.

## Next recommended tasks

1. **Authenticated browser smoke test for dashboard/students/announcements/messages/status/goal/follow/photo/admin shell/announcements management**: Configure Google OAuth credentials or establish a local test session, sign in, and verify live RLS-restricted dashboard widgets, student searches, announcement acknowledgements, student card message posting, soft deletion, project status updates, emotional status updates, goal management, follow/unfollow updates, student photo uploads, the admin layout navigation sidebar, and announcements creation/deletion/targeting.
2. **Goal editing/deletion follow-up**: Add goal title/description editing, hard deletion or archive management for managers/super admins, and primary/central goal handling.
3. **Notification delivery & bottom-nav badges**: Implement push notification delivery and bottom navigation activity badges.
4. **Calendar management**: Build the admin-facing calendar view switcher (Day/Week/Month/Year-Gantt), drag-and-drop slots editing, and Google Calendar sync indicators.
