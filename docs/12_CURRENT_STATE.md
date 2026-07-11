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
  - `src/app/(app)/students/[studentId]/GoalDetailsForm.tsx` (per-goal title/details edit client component)
  - `src/app/(app)/students/[studentId]/DeleteGoalButton.tsx` (manager/super-admin goal deletion client component)
  - `src/app/(app)/students/[studentId]/SetPrimaryGoalButton.tsx` (set-as-primary goal client component)
  - `src/app/(app)/students/[studentId]/MessageEditForm.tsx` (inline student message edit client component)
  - `src/app/(app)/students/[studentId]/FollowButton.tsx` (student follow/unfollow client component)
  - `src/app/(app)/students/[studentId]/PhotoUploadForm.tsx` (student photo upload client component)
  - `src/app/(app)/announcements/page.tsx` (announcements list page)
  - `src/app/(app)/announcements/[announcementId]/page.tsx` (announcement detail and acknowledgement page)
  - `src/app/(app)/admin/announcements/page.tsx` (admin announcements list page)
  - `src/app/(app)/admin/announcements/AnnouncementForm.tsx` (admin announcement creation client form)
  - `src/app/(app)/admin/announcements/DeleteAnnouncementButton.tsx` (admin announcement deletion client button)
  - `src/app/(app)/admin/calendar/page.tsx` (admin calendar views router page)
  - `src/app/(app)/admin/calendar/CalendarWorkspace.tsx` (admin calendar workspace client wrapper)
  - `src/app/(app)/admin/calendar/CalendarViewSwitcher.tsx` (admin calendar layout switcher component)
  - `src/app/(app)/admin/calendar/CalendarDateNavigator.tsx` (admin calendar navigation control component)
  - `src/app/(app)/admin/calendar/CalendarViews.tsx` (admin calendar day/week/month layout panels)
  - `src/app/(app)/admin/calendar/RescheduleModal.tsx` (calendar event reschedule date/time client modal)
  - `src/app/(app)/admin/calendar/CalendarEventForm.tsx` (reusable create/edit calendar event client form)
  - `src/app/(app)/admin/calendar/CalendarEventRow.tsx` (calendar event table row with inline edit toggle)
  - `src/app/(app)/admin/calendar/DeleteCalendarEventButton.tsx` (calendar event deletion client button)
  - `src/app/(app)/admin/learning-groups/page.tsx` (admin learning groups views router page)
  - `src/app/(app)/admin/learning-groups/LearningGroupsWorkspace.tsx` (admin learning groups workspace client wrapper)
  - `src/app/(app)/admin/learning-groups/LearningGroupsViewSwitcher.tsx` (admin learning groups layout switcher component)
  - `src/app/(app)/admin/learning-groups/LearningGroupsTimetable.tsx` (admin learning groups timetable layout panel)
  - `src/app/(app)/admin/learning-groups/LearningGroupRescheduleModal.tsx` (learning group reschedule weekday/time client modal)
  - `src/app/(app)/admin/learning-groups/LearningGroupForm.tsx` (reusable create/edit learning group client form)
  - `src/app/(app)/admin/learning-groups/LearningGroupRow.tsx` (learning group table row with inline edit toggle)
  - `src/app/(app)/admin/learning-groups/ArchiveLearningGroupButton.tsx` (learning group archive/deactivate client button)
  - `src/app/(app)/admin/audit/page.tsx` (admin audit log viewer router page)
  - `src/app/(app)/admin/audit/AuditLogFilters.tsx` (admin audit log filters client component)
  - `src/app/(app)/admin/audit/AuditLogPagination.tsx` (admin audit log pagination client component)
  - `src/app/api/admin/audit/export/route.ts` (admin audit logs CSV export route handler)
  - `src/app/(app)/more/page.tsx` (more tools route page)
  - `src/app/(app)/notifications/page.tsx` (notifications feed page)
  - `src/app/(app)/notifications/PushSubscriptionControls.tsx` (push subscription enable/disable toggle client component)
  - `src/app/(app)/notifications/MarkNotificationReadButton.tsx` (mark single notification read client button component)
  - `src/app/(app)/notifications/MarkAllNotificationsReadButton.tsx` (mark all notifications read client button component)
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
  - `calendar/`
    - `src/features/calendar/admin-queries.ts` (Admin calendar server-side queries)
    - `src/features/calendar/admin-actions.ts` (Admin calendar Server Actions)
  - `learning-groups/`
    - `src/features/learning-groups/types.ts` (shared admin learning group types and weekday constants)
    - `src/features/learning-groups/admin-queries.ts` (Admin learning groups server-side queries)
    - `src/features/learning-groups/admin-actions.ts` (Admin learning groups Server Actions)
  - `notifications/`
    - `src/features/notifications/queries.ts` (Notifications server-side queries)
    - `src/features/notifications/actions.ts` (Notifications Server Actions)
    - `src/features/notifications/push-actions.ts` (Push subscription save/delete Server Actions)
    - `src/features/notifications/send-push.ts` (Server-side Web Push notification dispatcher utility using web-push)
  - `admin/`
    - `src/features/admin/audit-queries.ts` (Admin audit log read-only server-side queries)
  - `auth/`
- `supabase/` (initialized configuration and migration folder)
  - `supabase/migrations/20260707111701_initial_schema_and_rls.sql`
  - `supabase/migrations/20260707115303_staff_access_grants.sql`
  - `supabase/migrations/20260708184000_student_photos.sql`
  - `supabase/migrations/20260708190500_harden_student_photo_updates.sql`
  - `supabase/migrations/20260708234000_notifications_system.sql`
  - `supabase/migrations/20260708235000_harden_notifications_rpc.sql`
  - `supabase/migrations/20260709000000_student_goal_primary.sql`
  - `supabase/migrations/20260709010000_student_message_editing.sql`
  - `supabase/migrations/20260709020000_student_message_soft_delete_fix.sql`
  - `supabase/migrations/20260709030000_push_subscriptions_v1.sql`
  - `supabase/migrations/20260709040000_harden_student_photo_url_path.sql`
  - `supabase/seeds/dev_seed.sql` (reviewed local development seed; enabled for local `supabase db reset`)
- `scripts/`
  - `scripts/check-no-hebrew-in-code.mjs` (Enforcement scanner script)
- `public/`
  - `public/sw.js` (service worker for Web Push notifications)
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
  - `docs/parallel/GPT_STUDENT_GOAL_EDIT_DELETE_V1_HANDOFF.md`
  - `docs/parallel/GPT_STUDENTS_READONLY_V1_HANDOFF.md`
  - `docs/parallel/GPT_FOLLOW_STUDENT_V1_HANDOFF.md`
  - `docs/parallel/GPT_STUDENT_PHOTO_UPLOADS_V1_HANDOFF.md`
  - `docs/parallel/GPT_STUDENT_PHOTO_SECURITY_HARDENING_HANDOFF.md`
  - `docs/parallel/GPT_ADMIN_DESKTOP_SHELL_V1_HANDOFF.md`
  - `docs/parallel/GPT_ADMIN_ANNOUNCEMENTS_V1_HANDOFF.md`
  - `docs/parallel/GPT_ADMIN_CALENDAR_V1_HANDOFF.md`
  - `docs/parallel/GPT_ADMIN_LEARNING_GROUPS_V1_HANDOFF.md`
  - `docs/parallel/GPT_NOTIFICATIONS_BADGES_V1_HANDOFF.md`
  - `docs/parallel/GPT_OVERNIGHT_STUDENT_ADMIN_POLISH_HANDOFF.md`
  - `docs/parallel/GPT_STUDENT_MESSAGE_SOFT_DELETE_RLS_FIX_HANDOFF.md`
  - `docs/parallel/GPT_AUTHENTICATED_BROWSER_SMOKE_TEST_HANDOFF.md`
  - `docs/parallel/GPT_MANUAL_VERIFICATION_LEFTOVERS_HANDOFF.md`
  - `docs/parallel/GPT_WEB_PUSH_V1_HANDOFF.md`
  - `docs/parallel/GPT_WEB_PUSH_BROWSER_VERIFICATION_HANDOFF.md`
  - `docs/parallel/GPT_ADMIN_CALENDAR_VIEWS_V2_HANDOFF.md`
  - `docs/parallel/GPT_ADMIN_LEARNING_GROUPS_TIMETABLE_V2_HANDOFF.md`
  - `docs/parallel/GPT_ADMIN_AUDIT_LOG_VIEWER_V2_HANDOFF.md`
  - `docs/parallel/GPT_STUDENT_PHOTO_OPTIMIZATION_V2_HANDOFF.md`
  - `docs/parallel/GPT_STUDENT_PHOTO_URL_HARDENING_HANDOFF.md`
  - `docs/parallel/GPT_ADMIN_CALENDAR_DRAG_RESCHEDULE_V1_HANDOFF.md`
  - `docs/parallel/GPT_ADMIN_LEARNING_GROUPS_RESCHEDULE_V1_HANDOFF.md`
  - `docs/parallel/GPT_MANUAL_VERIFICATION_LEFTOVERS_CLOSEOUT_HANDOFF.md`

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
- The `AdminShell` Calendar, Learning groups, and Audit log nav items are now enabled and link to `/admin/calendar`, `/admin/learning-groups`, and `/admin/audit`. Remaining placeholders (Students, Groups, Users, Import/Export, Settings) stay muted and non-clickable.
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

Student search page and detailed student cards with message posting/editing, project status updates, emotional status updates, and goal management (including primary/central goal selection) are implemented.

Status:
- `/students` displays active student list with full name, group, and current project details, supporting ILIKE name search filtering.
- `/students/[studentId]` shows the identity, follow state, group mentors, contacts, current project, masters, emotional status, goals, and recent messages list.
- Authenticated active staff members can add new update messages to a student card via the mounted `<MessageComposer>` form.
- Message inserts use the standard request-scoped Supabase server client and respect database Row-Level Security (RLS) policies.
- Message soft deletion is implemented: users can soft-delete their own messages, and super admins can soft-delete any message. Deletions are performed under the RLS model.
- Successfully created and deleted messages write secure audit logs (`student_message.created` and `student_message.deleted`).
- **Student message editing v1 is implemented.** The existing UPDATE RLS policy on `student_messages` only permitted soft-deletion (its `WITH CHECK` required `deleted_at IS NOT NULL`), so a new, additive, minimal migration (`supabase/migrations/20260709010000_student_message_editing.sql`) adds a second permissive UPDATE policy ("Authors and super admins can edit student messages") scoped to editing an active message in place (`deleted_at` stays null), leaving the original soft-delete policy untouched. Postgres combines multiple permissive policies for the same command with OR on both `USING` and `WITH CHECK`, so this purely adds the editing case. Message authors can edit their own active message; super admins can edit any active message; nobody can edit an already soft-deleted message. The `updateStudentMessage` action updates only `body`, `tags`, and `is_important` (author/student/deleted_at are untouched and cannot be spoofed), validates body length and tag enum, and audits `student_message.updated`. There is no `edited_at`/`edited_by` column; the table's existing `updated_at` trigger timestamp is relied on instead, and the audit log's `actorId` distinguishes an editor from the original author when a super admin edits someone else's message. Notifications are intentionally deferred for edits: the hardened `create_student_change_notification` RPC's event-type allowlist has no entry for message edits, and reusing `student_message.created` would misrepresent the event and re-notify followers as if it were brand new. The `<MessageEditForm>` client component renders an always-visible inline edit form (matching the existing goal-details-edit convention) below each message the current user is authorized to edit.
- **Student message self-soft-delete RLS issue resolved.** An issue was discovered during message editing work where normal non-super-admin authors were blocked from soft-deleting their own messages due to PostgreSQL post-update RLS select visibility checks. This is now fully fixed by `20260709020000_student_message_soft_delete_fix.sql`, which adds a narrow `SELECT` policy allowing active staff authors to read their own messages regardless of `deleted_at`. This satisfies PostgreSQL's post-update RLS visibility requirements, while unrelated staff still cannot read deleted messages, and deleted messages remain excluded from the normal student card query.
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
- Authorized goal managers can edit goal title and description from the Goals section. The detail edit action updates only `title`, `description`, and `updated_by`, and writes `student_goal.details_updated`.
- Managers and super admins can hard-delete goals because the existing `student_goals` delete RLS policy explicitly restricts delete to `current_user_is_manager_or_super_admin()`. Deletions are confirmed in the UI and audit `student_goal.deleted` with before-data.
- Goal mutations update goals in place through the normal request-scoped Supabase client, touch only intentionally exposed columns (`title` and `description` on create/edit, `status` and `updated_by` on status update), and write secure audit logs (`student_goal.created`, `student_goal.updated`, `student_goal.details_updated`, and `student_goal.deleted`).
- Goal archiving works through the existing `goal_status` enum value `archived`; archived goals are filtered out of the student card.
- No goals migration was added; Student Goals Mutation v1 uses the existing `student_goals` table, `goal_status` enum, and the existing insert/update RLS policies/helper.
- **Primary/central goal management v1 is implemented.** A new minimal migration (`supabase/migrations/20260709000000_student_goal_primary.sql`) adds a partial unique index (`student_goals_one_primary_active_idx` on `(student_id, school_year_id)` where `is_primary = true and status <> 'archived'`) enforcing at most one primary, non-archived goal per student per school year, plus a security-definer RPC `public.set_primary_student_goal(target_student_id, target_goal_id)` that atomically clears any other non-archived primary goal for that scope and promotes the selected goal, updating only `is_primary` and `updated_by`. The RPC independently verifies an active session, active staff, an active target student, that the goal belongs to the student, that the goal is not archived, and `current_user_can_update_student_goals` before mutating. The `<SetPrimaryGoalButton>` client component shows a "Set as primary" action on each non-primary goal for authorized goal managers (active group mentors, managers, super admins); the action audits `student_goal.primary_updated` and reuses the existing allowed `student_goal.updated` notification event type (a dedicated event type does not exist in the hardened notification RPC's allowlist).
- Active staff can follow and unfollow students on their student cards. The follow state is scoped to the current user's profile and uses the existing `followed_students` schema and RLS policies (no database migration was added). Following/unfollowing performs idempotent inserts/deletes, writes secure audit logs (`student_follow.created` and `student_follow.deleted`), and revalidation refreshes both the student card and the dashboard followed-student count.
- **Student photo upload optimization v2 is implemented and browser/manual-verified.** Authorized group mentors, managers, and super admins can upload or replace a student's profile photo. Before uploading, the image is optimized browser-side via canvas center-cropping, resized to a square 512x512 pixels, and converted to WebP (`image/webp`) at quality 0.82. The server action enforces a strict 1MB size limit (down from 5MB) and accepts only the optimized `image/webp` type. Files are stored in a private bucket (`student-photos`) under the path `students/${studentId}/profile.webp` and resolved via secure signed URLs. Updates write secure audit logs (`student_photo.updated`) via the secure definer RPC helper `update_student_photo_path`, which also validates that the new path is scoped to `students/{target_student_id}/`. Advanced interactive cropping, image moderation, and bulk photo imports remain deferred.
  - **Real manual browser test performed**: since automated tooling cannot supply an arbitrary local file to a native OS file picker, the user personally selected two different real images (a large JPEG, then a PNG) on Alice Smith's student card in an authenticated super_admin session. Both uploads succeeded end-to-end: the stored object was verified directly (`students/55000000-0000-0000-0000-000000000001/profile.webp`, `content_type: image/webp`, sizes 22458 and 28096 bytes — both well under the 1MB limit), the WebP header was parsed directly to confirm exact 512x512 pixel dimensions, `students.photo_url` pointed to the expected path, the signed-URL `<img>` on the student card visibly updated after each upload, and both produced correct `student_photo.updated` audit rows.
  - **Negative paths verified live** (via in-browser JS-constructed `File` objects, bypassing the OS picker for repeatable testing): an invalid file type (`.txt`), a 41MB oversized valid JPEG, a corrupted non-decodable "image", and a simulated `canvas.toBlob` failure (a real browser-conversion-failure path) were all rejected with the correct clean, localized error message, no network upload occurred in any case (confirmed via unchanged storage object version), the file input was disabled during processing and correctly re-enabled afterward, and the form recovered cleanly after every failure.
  - **Security/RLS verified with rollback-only SQL probes**: an unrelated staff member (no mentor/manager/super_admin relationship to the student) is correctly denied by `current_user_can_manage_student_photo` and a direct `UPDATE students SET photo_url = ...` from that same role affects 0 rows (blocked by RLS). No service-role client is used anywhere in the upload path. The `student-photos` bucket is confirmed private (`storage.buckets.public = false`) and an anonymous direct object download returns 400.
  - **Hardening**: A path-bypass gap discovered during the manual photo upload verification (where a privileged manager/super_admin session could bypass the RPC path-format validation via a direct raw `UPDATE` to the table) has been resolved by `20260709040000_harden_student_photo_url_path.sql`. The `students_photo_url_format_check` database-level CHECK constraint enforces that `photo_url` is either `NULL` or matches exactly `students/{studentId}/profile.webp`. Unauthorized staff remains blocked by RLS, and privileged roles can now only write valid `photo_url` values.
- Anonymous requests to `/students` or `/students/[studentId]` redirect to `/login`.
- Deferred features:
  - Permanent message deletion.
  - Realtime updates on the message stream.
  - Emotional free-text notes viewing/editing surface.
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
- **Bug found and fixed during the authenticated browser smoke test:** `createAnnouncementAction` chained `.select('id').single()` immediately after the `announcements` insert. `announcements`' SELECT RLS policy (`current_user_can_read_announcement`) re-queries the table by id inside a security-definer function, which cannot see a row the same `INSERT` statement just wrote (the same root cause as the calendar_events RLS/RETURNING finding). This made announcement creation fail with a generic RLS error for every user, including super admins, in the live browser test. Fixed by generating the announcement id client-side with `crypto.randomUUID()` and no longer chaining `.select()` after the insert; verified working end-to-end afterward (create, role/group targeting, acknowledgement, delete).
- Anonymous requests to `/announcements`, `/announcements/[announcementId]`, or `/admin/announcements` redirect to `/login`.
- Deferred features:
  - Announcement inline editing/updating.
  - Draft mode and scheduled publishing (deferred as they are not supported by seed schemas).
  - Push notification delivery (V1 does not implement push notifications).
  - Rich text formatting (beyond plain text area) and attachments upload.

## Notification delivery & bottom-nav badges v1 status

In-app notifications are delivered to staff members who follow specific students when those students' cards are updated.

Status:
- Updates on student cards (message creation, project status, emotional status, goal creation/modification/deletion, photo changes) trigger server actions that execute the database function `create_student_change_notification`.
- The database function `create_student_change_notification` is security-hardened against direct client calls, fake actor ID spoofing, unauthorized notification creation, and event spamming, enforcing active staff status, active student validation, strict event type allowlists, and per-event caller authorization checks.
- Notifications are RLS-visible only to their recipient (`profile_id = auth.uid()`).
- Privacy guidelines are strictly followed: message notifications, emotional status updates, goal mutations, and photo updates are generic and omit sensitive details (no raw message body, no emotional note/color, no goal details).
- Actor who makes the change is automatically excluded from notification delivery.
- `/notifications` lists recent notifications for the current authenticated user.
- Unread status is indicated with distinct borders/colors and a blue badge.
- Interactive client buttons permit marking a single notification or all notifications as read under `useTransition`.
- Mobile BottomNav displays a numeric unread badge overlay on the `More` tab item by dynamically fetching counts.
- `/more` page displays a notification card displaying the live unread count and routing to `/notifications`.
- Dashboard header Bell icon routes to `/notifications`.
- Web Push delivery and push subscription management v1 is implemented:
  - `push_subscriptions` supports one row per browser endpoint, multiple devices per profile, `expiration_time`, and `updated_at`.
  - Active authenticated staff can insert/update/delete only their own push subscriptions through normal request-scoped Supabase clients and RLS.
  - Managers and super admins have no special direct RLS read/delete access to other users' subscriptions.
  - `/notifications` mounts compact browser notification controls that detect support, show permission state, request permission only after a user click, register `/sw.js`, save the current browser subscription, and disable/unsubscribe the current device.
  - `/more` includes a compact browser-notifications link back to `/notifications`.
  - Server-side push sending is best-effort and non-blocking after the in-app notification RPC succeeds. Failures are logged and never fail the original student-card mutation.
  - Push payloads are generic and privacy-preserving: no raw message body, emotional status value/color/note, or goal title/description is sent to the browser push service.
  - VAPID configuration uses `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, and `VAPID_SUBJECT`; missing keys disable push without breaking the app build.
  - Stale Web Push subscriptions returning 404/410 are deleted from the privileged server-only delivery path.
  - Push subscription create/delete audit events are intentionally not written in v1 to avoid noisy audit rows and any risk of storing raw subscription material; subscription CRUD remains protected by RLS and validated server-side.
  - Full browser push display and click verification (permission prompt, subscription saving, actual push popup, notification click focusing, and disable/re-enable) has been completed against a real authenticated Google OAuth session and a real Chrome browser. See "Latest Web Push browser verification results" below for details, including a real-world FCM delivery delay observed (not a code defect) and one real bug found and fixed in `PushSubscriptionControls.tsx`.

## Admin calendar management v2 and rescheduling v1 status

The calendar workspace is upgraded to v2 and rescheduling v1 at:

- `/admin/calendar`

Status:

- No migration was added. The implementation uses the existing `calendar_events` table, `calendar_event_groups` junction table, and `event_visibility` enum (`all_school`, `groups`, `staff_only`, `leadership_only`) exactly as defined in the initial migration.
- Managers and super admins can create, update, and delete calendar events, because the RLS insert/update/delete policies on `calendar_events` explicitly check `current_user_is_manager_or_super_admin()`. No other role can mutate calendar events.
- **Multiple Views**: Upgraded the interface to support **List**, **Day**, **Week**, and **Month** views.
  - **List view** displays upcoming/today/week/month table rows (retaining the v1 inline edit forms).
  - **Day view** shows all-day events at the top and timed events sorted chronologically by time slots.
  - **Week view** shows columns for all 7 days of the week, with event details and inline edit/delete.
  - **Month view** renders a 35/42-day calendar block where clicking a day navigates to that day's Day view.
- **URL Query Parameters**: The calendar state is driven dynamically by `view=list|day|week|month` and `date=YYYY-MM-DD` parameters. Navigator controls support Prev, Today, and Next shifting (by 1 day, 7 days, or 1 month based on the active view).
- **Rescheduling v1**: Added support for managers and super admins to reschedule existing events from the Day, Week, and Month views via a responsive `RescheduleModal` dialog — not full visual drag-and-drop, which remains deferred. In Day and Week views, a reschedule button (`CalendarDays` icon) on each event card opens the modal. In Month view, clicking an event's mini-card directly opens the modal (clicking elsewhere in the day cell still navigates to Day view). The modal lets the user pick a target date and time (time picker is disabled/hidden for all-day events). It preserves the event duration, target groups, visibility, and description. Successful rescheduling writes `calendar_event.rescheduled` audit logs.
- **Database Validation**: Security and business logic constraints were verified via rollback-only SQL probes (`calendar_reschedule_probes.sql`). Manager/super_admin updates succeed, unauthorized staff updates affect 0 rows, and invalid ranges (end-before-start) are rejected by the database constraint.
- **Browser/manual verification completed** (closeout pass) against a real authenticated Google OAuth session (super_admin). A temporary timed event was created, rescheduled to a later time the same day via the Week-view reschedule button (UI updated immediately, correct `calendar_event.rescheduled` audit row with before/after `starts_at`/`ends_at`), then rescheduled to the next day (duration preserved; Day view for the old date correctly showed no events; Day view for the new date correctly showed the event at the moved time; second audit row confirmed). A temporary 2-day all-day event was created and rescheduled to a new date: the modal's time input was confirmed hidden for all-day events, the event remained all-day after the move, and the 2-day duration was preserved. Month view: clicking an event's mini-card opens the reschedule modal without navigating to Day view (event bubbling correctly suppressed via `stopPropagation`), while clicking empty grid space still navigates to Day view for that date. Negative/security checks: submitting a reschedule for an event deleted out from under the open modal (simulating a stale/invalid target) produced a clean localized "event could not be loaded" error with no crash and no console errors; an end-before-start update is still rejected by the `calendar_events_time_order` CHECK constraint; a staff-only (non-manager) role's direct update affects 0 rows under RLS; the server action uses only the request-scoped client (no service-role path) and never chains `.select()` after the update. No application bugs were found. All temporary test events were deleted afterward and the table was confirmed back to the original 2 seeded events. **Automation note (not an app defect)**: in this pass, coordinate/ref-based clicks from the browser automation tool intermittently failed to reach the reschedule/cancel buttons' React handlers (the click registered on the DOM but no state update occurred); invoking the same `onClick` handlers directly always worked correctly and produced the results described above. This is a tooling-interaction quirk of the automated test session, not a reproducible defect in the app's own event handling.
- **Sidebar Integration**: The right sidebar dynamically switches between creating new events and editing selected events from any of the view grids, canceling back to create mode cleanly.
- **Sync Indicators**: Displays a read-only sync icon showing **Synced** (green check icon) if `google_calendar_event_id` is present, and **Not Synced** (gray alert icon) if absent.
- **RLS/RETURNING workaround:** Maintained the Postgres RLS `RETURNING` workaround (generating IDs client-side, never chaining `.select()` after write actions). All mutations go through the request-scoped Supabase client.
- Audit logging: successful mutations write `calendar_event.created`, `calendar_event.updated`, `calendar_event.deleted`, and `calendar_event.rescheduled` through the existing privileged server-only audit helper.
- Revalidation: all actions revalidate both `/admin/calendar` and `/dashboard` routes.
- **Hydration Fix**: Weekday labels are retrieved from `he.json` (`t('admin.calendar.day_0')` to `day_6`), removing any Hebrew characters from implementation code files to pass Hebrew character scanning.
- Deferred: outbound Google Calendar Sync API integration, recurrence rule mutation support, full visual drag-and-drop slots editing, and Year/Gantt view panels.
- **Authenticated browser smoke test completed** against a real Google OAuth session (super_admin). Verified live: all 8 required URL/param combinations (`view=list|day|week|month`, invalid `view=bad`, invalid `date=bad`, and a `date` value in a different month) render with no console errors and fall back safely on invalid input; Prev/Today/Next all update the URL correctly; clicking a Month-view day cell navigates to Day view for that date; create/edit/delete of a same-day timed event correctly reflected across List, Day, Week, and Month views and on the dashboard's Today/This Week cards, with no RLS/`RETURNING` regression in server logs. Edge cases verified live: an existing seeded multi-day event (spanning 3 days) renders correctly on every relevant day in both Week and Month grids with no grid overflow; a newly created all-day event renders in the separate all-day section of Day view; a newly created group-targeted event shows the target group name; an event spanning a month boundary (Jul 30 - Aug 1) correctly appears on the relevant cells in both the July and August month grids; the sync indicator was confirmed to show "Synced" only when `google_calendar_event_id` is set and "Not synced" otherwise, in Day/Week/Month views (the List view's `CalendarEventRow` intentionally has no sync indicator — it is the preserved legacy v1 row component and was not extended in v2). All test events created for this pass were deleted afterward and verified back to the original 2 seeded events.
- **Bug found and fixed: RTL date-range label displayed in reversed visual order.** `CalendarDateNavigator.tsx`'s week/day/month label span had no explicit `dir`, so under the page's `dir="rtl"` context the browser's Unicode bidi algorithm rendered a two-part numeric range like `"5.7 - 11.7.2026"` visually as `"1.7.2026 - 5.7"` (correct DOM text, reversed visual order) for any range containing a hyphen-joined start/end pair — confirmed by comparing the raw DOM text content against the rendered screenshot. Fixed by adding `dir="ltr"` to that span, since the date/time tokens themselves are always LTR-formatted regardless of UI locale. Verified fixed live: the same week now renders in the correct visual order.

## Admin learning groups timetable views v2 and rescheduling v1 status

The learning groups workspace is upgraded to v2 and rescheduling v1 at:

- `/admin/learning-groups`

Status:

- No migration was added. The implementation uses the existing `learning_groups` table, `learning_group_target_groups` junction table, and `weekday` enum exactly as defined in the initial migration.
- Managers and super admins can create, update, archive/deactivate, and hard-delete learning groups under the RLS policies.
- **Multiple Views**: Upgraded the interface to support **Timetable** (default) and **List** views.
  - **List view** displays active learning groups in table rows, preserving the legacy v1 inline edit forms and archive buttons.
  - **Timetable view** displays weekly columns (Sunday to Saturday) containing learning group cards sorted chronologically. Each card shows the title, time window, room, leader, target group names, and status badge.
- **URL Query Parameters**: driven by `view=timetable|list`, `weekday=all|sunday|...`, and `state=active|inactive|all`. Toggling view or filters updates both layouts dynamically.
- **Rescheduling v1**: Added support for managers and super admins to reschedule existing learning groups from the Timetable view via a responsive `LearningGroupRescheduleModal` dialog. Clicking the reschedule button (icon `CalendarDays`) on any timetable card opens the dialog to select a target weekday and a new starts_at time slot. It automatically computes the new ends_at time keeping the group duration constant, displays a preview of the resulting range, and enforces that the new range remains inside the 11:30–13:30 activity window. Successful reschedule updates write `learning_group.rescheduled` audit logs.
- **Database validation**: Security and business logic constraints were verified via rollback-only SQL probes (`learning_groups_reschedule_probes.sql`). Manager/super_admin updates succeed, unauthorized staff updates affect 0 rows, and invalid ranges or out-of-window times are rejected by database CHECK constraints (`learning_groups_time_order`, `learning_groups_standard_window`).
- **Browser/manual verification completed** (closeout pass) against a real authenticated Google OAuth session (super_admin). A temporary group (no leader, no room) was created on Sunday and rescheduled to a later time the same weekday: the timetable card moved to the new time and, with a second temporary group added at an earlier time, chronological sort within the day was confirmed correct; List view showed the same new weekday/time. The group was then rescheduled to Wednesday: it disappeared from the Sunday column and appeared in Wednesday's, with duration preserved; the `weekday=sunday`/`weekday=wednesday`/`state=all` filters all behaved correctly afterward. Boundary case: moving the group to exactly 12:30–13:30 (the window's upper edge) succeeded. Negative paths: an out-of-window move (13:00 start, computed 14:00 end) produced a clean localized error and left the row unchanged; rescheduling a group deleted out from under the open modal produced a clean "could not be loaded" error with no crash; rollback-only SQL probes reconfirmed a staff-only role's direct update affects 0 rows and an end-before-start update is rejected by the `learning_groups_time_order` CHECK constraint. Regression checks: create, edit (from a timetable card), and archive all still work correctly, and groups with no leader/no room continue to render their fallback placeholders. Three `learning_group.rescheduled` audit rows were confirmed with before/after data limited to `id`/`title`/`weekday`/`starts_at`/`ends_at`. No application bugs were found. All temporary test groups were deleted afterward and the table was confirmed back to the single original seeded group.
- **Sidebar Integration**: The right sidebar dynamically switches between creating new learning groups and editing selected learning groups from either the List table rows or the Timetable cards. Clicking "Cancel" reverts the form back to create mode.
- Audit logging: successful mutations write `learning_group.created`, `learning_group.updated`, `learning_group.archived`, and `learning_group.rescheduled` through the existing privileged server-only audit helper, capturing before/after group metadata and target group ids where relevant.
- Revalidation: all actions revalidate both `/admin/learning-groups` and `/dashboard` routes.
- Deferred: full visual drag-and-drop timetable editing, outbound Google Calendar sync, group capacity/roster management, and school-year picker.
- **Authenticated browser smoke test completed** against a real Google OAuth session (super_admin). All 8 required URL/param combinations (`view=timetable|list`, invalid `view=bad`, `weekday=all&state=active`, `weekday=monday`, `state=inactive`, and `view=list&weekday=all&state=all`) rendered with no console errors; invalid `view` fell back safely to `timetable`. The Timetable/List switcher, and the `weekday`/`state` filters, were confirmed to apply identically to both views. Full create/edit/archive mutation flow was verified live: a temporary group appeared correctly in both Timetable (under the correct weekday/time) and List views, editing from a Timetable card correctly pre-populated the sidebar and propagated changes to both views, archiving correctly flipped `is_active` and was reflected correctly by all three state filters, and `learning_group.created`/`.updated`/`.archived` all appeared correctly in the audit log. Edge cases verified live: a group starting exactly at 11:30 and ending exactly at 13:30 (the boundary of the allowed window) saved successfully; a group with a time outside the 11:30-13:30 window was correctly rejected server-side with a clean error message (`errorTimeWindow`) even after removing the client-side HTML `min`/`max` constraints, confirming defense-in-depth; an end-before-start submission was likewise cleanly rejected (`errorEndBeforeStart`); groups with no leader and no room rendered correctly with their respective fallback text; and three groups on the same weekday with different times sorted chronologically correctly in both views. All temporary test groups were deleted afterward and the table was verified back to its original single seeded row.
- **Documentation correction (not a code bug)**: the prior handoff doc for this feature claimed the Timetable view "collapses Friday/Saturday if empty." Live testing confirmed the actual implementation (`LearningGroupsTimetable.tsx`) always renders all 7 weekday columns unconditionally, showing a `-` placeholder for empty days; there is no collapsing logic in the code. This is not a functional defect (nothing crashes or shows incorrect data) and was left as-is per this task's explicit no-new-features scope; the prior doc's inaccurate claim is corrected here instead of adding new collapsing behavior.
- Mobile/stacked layout (`grid-cols-1` below the `md` breakpoint) was confirmed by code inspection to use the same responsive Tailwind pattern already visually verified working in the Admin Calendar Views v2 browser test; live viewport resizing was not reliably reproducible in this automated browser session, so it was not independently re-verified pixel-for-pixel in this pass.

## Admin audit log viewer v2 status

An interactive investigation panel with pagination and filters is implemented at:

- `/admin/audit`

Status:

- No migration was added. The implementation uses the existing `audit_logs` table exactly as defined in the initial migration (`id`, `actor_id`, `action`, `entity_type`, `entity_id`, `before_data` jsonb, `after_data` jsonb, `created_at`) and its existing RLS policy.
- Only managers and super admins can view the audit log, because the only SELECT RLS policy on `audit_logs` is `"Managers and super admins can read audit logs"` (`current_user_is_manager_or_super_admin()`). Client insertions, updates, and deletions remain blocked.
- **Investigation Filters**: driven by URL GET parameters:
  - `action`: distinct actions.
  - `entityType`: distinct entity types.
  - `actorId`: dropdown list showing active staff profiles with their full name and email.
  - `fromDate`: inclusive starting date.
  - `toDate`: inclusive ending date (safely converted to exclusive next-day boundary in query).
- **Pagination**: offset range pagination using `.range()` on Supabase queries. Supported sizes: 25, 50, and 100. Previous/Next buttons disable at page boundaries.
- **Controlled CSV Export**: Route handler `GET /api/admin/audit/export` checks user session and role. Streams CSV content dynamically in-memory (no local disk files) for up to 1000 matching rows. Excludes sensitive JSON columns (`before_data`, `after_data`) for user privacy. Dispatches an `audit_log.exported` audit event.
- Before/after JSON metadata is shown behind collapsed `<details>` disclosure elements per row.
- The `AdminShell` Audit log nav item is enabled and links to `/admin/audit`.
- Deferred: none (actor filters, date-range filters, pagination, and CSV export are fully implemented).
- **Authenticated browser smoke test completed** against a real Google OAuth session (super_admin). Verified live: rows render with actor name/email, before/after JSON stays collapsed by default and expands correctly, and the default page size is 50. All filters (action, entity type, actor, from-date, to-date, and combined) were tested live and correctly narrowed results via URL query params, resetting to page 1; invalid/malformed params (`actorId=not-a-uuid`, `fromDate=garbage`, `page=abc`, `pageSize=999`) did not crash and fell back to safe defaults. Pagination was tested with a real 28-row dataset (generated via real create/delete actions through the existing calendar feature, not direct inserts) at all three page sizes: page size 25 correctly showed 2 pages with correct Prev/Next boundary disabling and state preserved across navigation; page sizes 50 and 100 correctly showed all rows on a single page. CSV export was verified both unfiltered and filtered: returns the documented columns (Date, Actor Name, Actor Email, Action, Entity Type, Entity ID) with no raw `before_data`/`after_data`, correctly respects the active filter, and dispatches `audit_log.exported` with only `{filters, rowCount}` (never exported row contents) — confirmed directly in the database. The 1000-row export cap was verified by code inspection only (`.limit(1000)`), not by generating 1000+ real rows. RLS/security was verified with rollback-only SQL probes directly against the local Postgres container: a normal active-staff role sees 0 audit rows and cannot INSERT/UPDATE/DELETE (all blocked by RLS), while a manager role correctly sees all rows, matching the live super_admin browser session. An anonymous request to `/api/admin/audit/export` was correctly intercepted by the app's auth middleware before reaching the route handler; a live 403 test from a second, authenticated-but-non-manager real browser session was not performed (no second live account available), but the underlying RPC/RLS guard the route depends on was independently confirmed to correctly deny non-privileged roles.
- **Bug found and fixed**: the `toDate` filter (in both `getAdminAuditLogs` and the CSV export route) computed its exclusive next-day upper bound via `new Date(`${toDate}T00:00:00`)` — a string with no `Z`/offset, which Node parses as **local server time**, then converted back to UTC via `.toISOString()`. On this server (`Asia/Jerusalem`, UTC+3), this silently shifted the boundary earlier by the timezone offset, so filtering `toDate` to "today" (or any date) incorrectly excluded real rows created earlier that same day — confirmed live: `toDate=2026-07-09` showed 0 of 28 real today rows, while `toDate=2026-07-10` (one day later) correctly showed all 28. `fromDate` was unaffected, since it builds its UTC boundary directly as a string without going through local-time `Date` parsing. Fixed in both files by computing the boundary entirely in UTC via `Date.UTC(year, month - 1, day + 1)`, with no local-timezone-sensitive parsing at any point. Verified fixed live: the same `toDate` values now return the correct row counts.

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

## Latest admin calendar management validation results

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

- `supabase db reset` passed and loaded `supabase/seeds/dev_seed.sql`. No migration was added, so this was a sanity re-check rather than a required step.
- Type generation passed; `src/types/supabase.ts` showed no diff, confirming no schema drift.
- `npm run check:no-hebrew-in-code` passed.
- `npm run lint` passed.
- `npm run build` passed, with `/admin/calendar` registered as a dynamic route alongside the existing routes.
- `git diff --check` passed with line-ending normalization warnings only.
- Anonymous `GET /admin/calendar`, `GET /dashboard`, and `GET /admin/announcements` all returned `307` to `/login` against the production build (confirming the new route is protected and existing routes still compile/serve without regression).
- Rollback-only database RLS probes confirmed: unrelated staff insert denied, leadership-only insert denied (leadership is not manager/super admin), manager insert with group targeting succeeded and inserted exactly one `calendar_event_groups` row, super admin update (no `RETURNING`) succeeded, unrelated staff update and delete affected 0 rows, a mentor could not delete another event's target-group rows, and an end-before-start insert was rejected by the `calendar_events_time_order` check constraint even for an authorized manager.
- A rollback-only probe also confirmed a manager-created `all_school`-visibility event for "today" is readable by an unrelated staff member using the exact date-range predicate the dashboard query uses, verifying the dashboard regression path end-to-end at the database level.
- Seed event/group-link row counts were verified unchanged after all probes (2 events, 1 group link).
- Authenticated browser smoke testing of the mutation flows was not completed because the local login UI is Google-only and the seeded email/password users do not create usable Supabase auth sessions for the protected app. Server-side validation, build checks, and database authorization probes passed.

## Latest admin learning groups validation results

Commands run:

```bash
npm run check:no-hebrew-in-code
npm run lint
npm run build
git diff --check
```

Results:

- No migration was added, so `supabase db reset` and Supabase type generation were not required for this task.
- `npm run check:no-hebrew-in-code` passed.
- `npm run lint` passed.
- `npm run build` passed, with `/admin/learning-groups` registered as a dynamic route alongside the existing admin routes.
- `git diff --check` passed with line-ending normalization warnings only.
- Rollback-only database RLS probes confirmed: manager insert succeeded, manager title/description update succeeded, manager target-link replacement succeeded, manager archive via `is_active = false` succeeded, super admin update succeeded, and manager hard delete is allowed by the existing broad manager/super-admin RLS policy.
- Rollback-only database RLS probes also confirmed: mentor update changed 0 rows, mentor hard delete changed 0 rows, mentor insert was denied by RLS (`42501`), counselor update changed 0 rows, plain staff archive changed 0 rows, and plain staff insert was denied by RLS (`42501`).
- Rollback-only constraint probes confirmed authorized manager inserts outside the 11:30-13:30 window and with `ends_at <= starts_at` are rejected by database check constraints (`23514`).
- Seed learning group state stayed unchanged after probes: 1 learning group, 1 target link, title `Software Development Lab`, and `is_active = true`.
- Authenticated browser smoke testing of the mutation flows was not completed because the local login UI is Google-only and the seeded email/password users do not create usable Supabase auth sessions for the protected app. Server-side build checks and database authorization probes passed.

## Latest overnight student/admin polish validation results

This overnight task implemented three features in sequence (primary/central goal management, student message editing, and an admin audit log viewer), each validated independently before moving to the next.

Commands run (once per phase where applicable):

```bash
supabase db reset
supabase gen types typescript --local | Out-File -Encoding utf8 src/types/supabase.ts
npm run check:no-hebrew-in-code
npm run lint
npm run build
git diff --check
```

Results:

- Phase 0 (repository safety check): `git status --short` was clean before starting; all prior task work was already committed on `master`. No pre-existing dirty files.
- Phase 1 (primary goals): `supabase db reset` applied the new `20260709000000_student_goal_primary.sql` migration cleanly; type generation picked up the new `set_primary_student_goal` RPC. Rollback-only probes confirmed: no duplicate primary goals existed in the seed before adding the constraint; unrelated staff and counselor sessions are denied by the RPC; manager and super admin sessions succeed; an active group mentor (with the seeded assignment date temporarily moved earlier) succeeds while the unmodified (inactive-today) assignment is denied; setting a new primary correctly clears the previous primary for the same student/school year; the partial unique index rejects a direct attempt to create two active primaries even as superuser; attempting to set an archived goal as primary is rejected by the RPC; and an archived goal's stale `is_primary = true` does not block promoting a different active goal (confirming the index correctly excludes archived rows from the uniqueness scope). Seed goal rows, statuses, and the mentor assignment date were verified unchanged after all probes.
- Phase 2 (message editing & soft-delete fix): `supabase db reset` applied both `20260709010000_student_message_editing.sql` (additive UPDATE policy) and `20260709020000_student_message_soft_delete_fix.sql` (additive SELECT policy) migrations cleanly. Rollback-only probes confirmed: an author can edit their own active message; unrelated staff cannot; a super admin can edit any active message; a message that is already soft-deleted cannot be edited; and an author cannot spoof `author_id` while editing. Probes also confirmed the soft-delete RLS fix: normal authors can now successfully soft-delete their own active student messages; unrelated staff cannot soft-delete another's message; super admins can soft-delete any message; unrelated staff cannot read deleted messages; authors can read their own deleted messages; and seed state remains completely unchanged.
- Phase 3 (admin audit log viewer): no migration was needed (existing schema/RLS already sufficient). Rollback-only probes confirmed: a manager and a super admin session can read audit rows inserted directly (bypassing RLS, matching how the real service-role writer inserts) while a normal staff or mentor session reads 0 rows for the identical data (RLS-filtered, not merely absent); and both an `INSERT` and a `DELETE` against `audit_logs` from the `authenticated` role are rejected/no-op, confirming the table remains write-only-via-service-role and read-only-via-RLS for managers/super admins. Seed `audit_logs` row count (0) was verified unchanged after probes.
- `npm run check:no-hebrew-in-code`, `npm run lint`, and `npm run build` all passed after every phase, with `/admin/audit` registered as a new dynamic route alongside all previously existing routes in the final build.
- `git diff --check` passed after every phase with line-ending normalization warnings only.
- Anonymous `GET /admin/audit` returned `307` to `/login` against the running production build, alongside re-confirmed `307` redirects for `/dashboard` and `/admin/announcements` (no regression).
- Authenticated browser smoke testing was not completed because the local login UI is Google-only and the seeded email/password users do not create usable Supabase auth sessions for the protected app, matching every prior task in this project. Server-side validation, build checks, and database authorization probes passed for all three phases.

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

## Latest student goal edit/delete validation results

Commands run:

```bash
npm run check:no-hebrew-in-code
npm run lint
npm run build
git diff --check
```

Results:

- No migration was added, so `supabase db reset` and type regeneration were not required for this follow-up.
- `npm run check:no-hebrew-in-code` passed.
- `npm run lint` passed.
- `npm run build` passed.
- `git diff --check` passed with line-ending normalization warnings only.
- Rollback-only database RLS probes confirmed: an active group mentor can update goal title/description, unrelated staff cannot update, counselor cannot update, manager can update, and super admin can update.
- Rollback-only delete probes confirmed: an active group mentor cannot hard-delete goals, while manager and super admin can hard-delete goals through the existing delete RLS policy.
- Seed state was verified unchanged after probes: 4 goals remained, goal `45000000-0000-4000-8000-000000000001` kept title `Complete Next.js layout`, and mentor assignment `42000000-0000-4000-8000-000000000001` kept `active_from = 2026-09-01`.
- Authenticated browser smoke testing was not completed because the local login UI is Google-only and the seeded email/password users do not create usable Supabase auth sessions for the protected app. Server-side validation, build checks, and database authorization probes passed.

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

## Latest authenticated browser smoke test results

A full authenticated-browser smoke test was performed for the first time against a real Google OAuth session (`ronen@chamama.org`, active with `super_admin` + `manager` roles via the seeded/bootstrap access model), using local Supabase services and a locally running Next.js server.

Results, by area:

- **Auth and shell**: Anonymous `/dashboard` redirected to `/login`. Google OAuth login (already completed by the user) produced a working authenticated session. `/dashboard` rendered correctly. The staff mobile `BottomNav` appeared on staff routes; `/admin/*` routes rendered via `AdminShell` with no staff `BottomNav`. Sign-out (`/auth/sign-out`) correctly cleared the session and redirected to `/login`; a subsequent `/dashboard` request also redirected to `/login`, confirming the session was fully cleared. Wrong-domain rejection was not re-tested live (no non-institutional Google test account was available); this path was already covered by the existing code review of `src/app/auth/callback/route.ts` and `src/proxy.ts`.
- **Dashboard**: recent announcements, empty "Today"/"This week" states, followed-student count, the notification bell (linking to `/notifications`), and the super-admin access-grants shortcut all rendered and linked correctly. A newly created calendar event correctly appeared in both "Today" and "This week" after creation (see Calendar below).
- **Students**: `/students` list rendered with correct status indicators; search (via the submit button) correctly filtered results. The student card rendered identity, contacts, current project, emotional status, goals, messages, follow toggle, and the photo upload control.
- **Student messages**: adding, editing, and soft-deleting a message all worked and were reflected immediately in the UI; the deleted message correctly disappeared from the card. Corresponding audit rows (`student_message.created`, `.updated`, `.deleted`) were confirmed in `/admin/audit`.
- **Project status**: updating project status worked, the badge updated after revalidation, and the change was auditable.
- **Emotional status**: the mutation itself worked correctly at the database level (a new history row was appended with the real current timestamp, and the change was correctly excluded from the actor's own notifications while a pre-existing follower was correctly notified with no sensitive details in the notification text). However, the on-screen badge did **not** visually update to the new status — see "known test-environment limitation" below; this is not a code defect.
- **Goals**: create, edit (title/description), status change, delete, and setting a goal as primary all worked correctly and were independently confirmed against the database; the primary-goal uniqueness constraint (only one primary goal shown at a time) was confirmed visually.
- **Follow and notifications**: following/unfollowing Alice Smith worked (confirmed via the UI toggle state and the database `followed_students` row). In this pass, the full notification pipeline was rigorously verified by inspecting the database directly: every mutation performed during this test (message, project status, emotional status, goal actions) correctly generated a notification for a pre-existing seeded follower (`mentor.one`, not the test actor), with generic, privacy-safe text (no message body, no emotional color/value, no goal title/description), and the acting user never received a notification for their own actions. A genuine two-account, real-time cross-user notification click-test was completed later in the Manual Verification Leftovers Closeout pass with two real accounts — see that section above for full detail.
- **Photo upload**: fully browser/manual-verified in a dedicated later pass (real JPEG and PNG uploads by the user, correct WebP/512x512/under-1MB output, correct audit rows, and negative-path/security checks). See "Student photo upload optimization v2" above for full detail.
- **Announcements**: `/announcements`, announcement detail, and the acknowledgement flow all worked. Creating an announcement from `/admin/announcements` initially failed with a genuine bug (see "Bugs found and fixed" below); after the fix, create (with "requires acknowledgement"), acknowledge, and delete all worked correctly and were confirmed against the database.
- **Calendar**: `/admin/calendar` initially failed to render at all due to a genuine bug (see below). After the fix, create, edit, delete, and dashboard reflection (a same-day event appearing in "Today"/"This week") all worked correctly and were confirmed against the database.
- **Learning groups**: `/admin/learning-groups` create (including target-group selection), edit, and archive all worked correctly and were confirmed against the database. Filters rendered correctly.
- **Admin audit log viewer**: `/admin/audit` rendered real audit rows for every mutation performed during this test, the action/entity-type filters worked correctly, and before/after JSON details expanded correctly.
- **Regression routes**: `/today`, `/more`, and `/admin/access-grants` all rendered without errors.

### Bugs found and fixed

1. **`/admin/calendar` did not render at all (server runtime crash) for every user.** `src/app/(app)/admin/calendar/page.tsx` passed a plain server-defined `formatDateTime` function as a prop to the `CalendarEventRow` client component. Next.js disallows passing plain functions from a Server Component to a Client Component. Fixed by moving `formatDateTime` to be defined locally inside `CalendarEventRow.tsx` instead of passed as a prop. Verified: the page now renders, and create/edit/delete/dashboard-reflection all work.
2. **Admin announcement creation failed for every user, including super admins**, with a generic "Failed to create announcement" error. `createAnnouncementAction` chained `.select('id').single()` immediately after inserting into `announcements`. `announcements`' SELECT RLS policy re-queries the table by id inside a security-definer function, which cannot see a row the same `INSERT` statement just wrote (the identical root cause as the pre-existing, already-documented calendar_events RLS/`RETURNING` finding — this exact fix pattern had already been applied to `calendar_events` in an earlier task but was never applied to `announcements`). Fixed by generating the announcement id client-side with `crypto.randomUUID()` and no longer chaining `.select()` after the insert. Verified: creation (including "requires acknowledgement"), acknowledgement, and deletion now all work correctly. As a precaution, `src/features/learning-groups/admin-actions.ts` and the rest of `src/features/announcements/actions.ts` were checked for the same anti-pattern and found already safe (both already generate ids client-side / never chain `.select()` after insert/update).

### Latest manual verification leftovers status

Following the automated browser smoke test, the remaining manual leftovers were verified via code review and database-level validation:
- **Student photo upload and URL hardening**: fully browser/manual-verified in a later dedicated pass (the user personally selected two real images). The previously identified direct-update bypass gap is resolved by `20260709040000_harden_student_photo_url_path.sql` which adds a CHECK constraint on `photo_url` matching NULL or the valid WebP path. See "Student photo upload optimization v2" earlier in this document for details. No longer a leftover.
- **Wrong-domain Google rejection**: fully browser/manual-verified in the Manual Verification Leftovers Closeout pass with a real non-`chamama.org` Google account in a separate real Chrome profile — the callback rejected the login, redirected to `/access-denied` with the correct localized message, created no profile row, cleared the session (confirmed by `/dashboard` redirecting to `/login` afterward), and logged no console errors. No longer a leftover. See `docs/parallel/GPT_MANUAL_VERIFICATION_LEFTOVERS_CLOSEOUT_HANDOFF.md`.
- **Two-account notification**: fully browser/manual-verified in the Manual Verification Leftovers Closeout pass with two real accounts (`ronen@chamama.org` as actor, `studio@chamama.org` as recipient) in two separate real browser sessions — the recipient received a privacy-safe in-app notification and push notification, the `/more` badge updated, clicking navigated to the correct student card, marking read updated the unread count, and the actor received zero self-notifications. No longer a leftover.

### Known test-environment limitation (not a code defect)

The `latest_student_emotional_statuses` "current status" view orders competing history rows purely by `created_at desc`. The dev seed's rows are dated in the future relative to the actual local system clock (school year starting September 2026, while the real local/system date during this test was July 2026). A newly inserted emotional-status row therefore always has an earlier `created_at` than the seeded row and is correctly, but confusingly, "outranked" by it in the "latest status" view/badge until real time passes September 2026. The mutation, permission model, and audit/notification trail are all confirmed correct at the database level; only the visual "latest" badge is affected, and only in this specific local/test timing condition. No code or seed change was made for this, since editing global seed dates would be a large, risky change that could invalidate other tasks' already-documented, date-dependent RLS test scenarios (e.g., "mentor assignment not yet active" checks).

### Validation commands run

```bash
npm run check:no-hebrew-in-code
npm run lint
npm run build
git diff --check
```

All four passed (line-ending warnings only on `git diff --check`). No schema changes were made during this task, so `supabase db reset` and type regeneration were not required.

## Latest Web Push v1 validation results

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

- `supabase db reset` passed and applied `supabase/migrations/20260709030000_push_subscriptions_v1.sql`.
- Type generation passed and refreshed `src/types/supabase.ts`.
- `npm run check:no-hebrew-in-code`, `npm run lint`, and `npm run build` passed.
- `git diff --check` passed with line-ending warnings only.
- Rollback-only RLS probes confirmed: active staff can insert/update/read/delete their own push subscription; inserting a subscription for another profile is rejected; users cannot read or delete another user's subscription; managers have no special subscription visibility; duplicate endpoints are rejected by the unique constraint; seed `push_subscriptions` row count remained 0 after rollback.
- Browser smoke status (superseded, see below): the in-app browser redirected unauthenticated `/notifications` to `/login` as expected. A seeded local email/password login attempt returned invalid credentials, matching the existing auth-test limitation. Because no authenticated in-app browser session and no interactive push permission grant were available in this context, the push controls, permission prompt, saved browser subscription, real push display, notification click focusing, and disable/re-enable flow were not fully browser-verified at that time.

## Latest Web Push browser verification results

A full authenticated-browser verification pass was completed against a real Google OAuth session (super_admin role) and a real Chrome browser, with local VAPID keys configured in `.env.local`.

- **Browser support detection**: `serviceWorker`, `PushManager`, and `Notification` all detected correctly; `Notification.permission` was `default` before any click (no unsolicited prompt).
- **Permission flow**: clicking "enable notifications" triggered the native Chrome permission popup only after a real user click; the user granted it manually (native browser-chrome popups cannot be clicked by automation tooling). `Notification.permission` became `granted`.
- **Subscription**: `/sw.js` registered (`activated` state), a real `PushSubscription` was created via `pushManager.subscribe()`, and a `push_subscriptions` row was saved with the correct `profile_id`, a real FCM `endpoint`, `p256dh_key`, and `auth_key`, verified directly in the database.
- **Real push delivery**: since only one live Google account was available, a different real seeded actor (`mentor.one@example.test`, not the recipient) was used to exercise `sendStudentChangePush` directly (same production function, real VAPID keys, real `web-push` package) against the saved subscription. FCM accepted the payload (HTTP 201) and the browser displayed a real, visible push notification after a real-world network delay of roughly 10-15 seconds (an FCM delivery-latency characteristic of this environment, not a code defect). Clicking the notification correctly focused/navigated the app to `/students/[studentId]`, confirmed live by the user.
- **Disable/re-enable**: disabling removed both the browser `PushSubscription` and the `push_subscriptions` row; re-enabling created a fresh row. Both verified directly against the database.
- **Privacy and failure checks**: confirmed the payload contains only generic title/body text (no raw message body, emotional status, or goal details); confirmed actor-exclusion and muted-follower exclusion by directly exercising the same recipient-resolution filter `sendStudentChangePush` uses; confirmed a stale (410 Gone) subscription is deleted by the same delete-on-404/410 branch the production code uses. All test follow/subscription rows created for this verification were cleaned up afterward.
- **Bug found and fixed**: `PushSubscriptionControls.tsx` computed `isAvailable` (browser feature + VAPID-key detection) via a synchronous `useMemo` that called `isPushSupported()` during render. Since `isPushSupported()` reads `window`/`navigator`, it returned `false` during SSR but `true` on the client's very first render pass, producing a real, reproducible React hydration mismatch on the enable button's `disabled` attribute (confirmed via console errors on every page load before the fix). Fixed by switching to `useSyncExternalStore` with an explicit `false` server snapshot, which is the standard pattern for values that legitimately differ between server and client. Verified fixed: no hydration warning on repeated fresh navigations after the fix, `npm run lint` passes (an initial fix using `useEffect` + `setState` was rejected by the `react-hooks/set-state-in-effect` lint rule and replaced with the `useSyncExternalStore` approach).

## Latest Admin Calendar Views v2 browser verification results

- Authenticated browser smoke test performed against a real Google OAuth session (super_admin). Full scope and results are described under "Admin calendar management v2 status" above.
- **Bug found and fixed**: RTL date-range label in `CalendarDateNavigator.tsx` rendered in reversed visual order due to a missing `dir="ltr"` on a numeric range string inside an RTL context. Fixed with a one-line `dir="ltr"` addition; verified fixed live.
- Validation commands run after the fix: `npm run check:no-hebrew-in-code`, `npm run lint`, `npm run build`, `git diff --check` — all passed (a pre-existing trailing-whitespace line in this file, unrelated to the calendar fix, was also trimmed to keep `git diff --check` clean). No new migrations were needed.
- All test calendar events created during this pass were deleted afterward; the `calendar_events` table was verified to match its original 2-row seeded state.

## Latest Student Photo URL Hardening verification results

- `supabase db reset` successfully applied the migration `20260709040000_harden_student_photo_url_path.sql` adding the CHECK constraint.
- Type generation successfully updated `src/types/supabase.ts`.
- Direct SQL database probes confirmed:
  - Raw `UPDATE students SET photo_url = NULL` remains valid.
  - Raw `UPDATE students SET photo_url = 'students/{student_id}/profile.webp'` succeeds.
  - Raw updates with mismatching student ID in the path (e.g. `students/{wrong_id}/profile.webp` on student `X`) violate the constraint and are rejected.
  - Raw updates with invalid filenames/extensions (e.g. `students/{id}/other.webp`, `students/{id}/profile.jpg`) violate the constraint and are rejected.
  - RPC calls via `update_student_photo_path` are fully protected by this check constraint and fail on invalid formats.
- Validation checks run after type generation: `npm run check:no-hebrew-in-code`, `npm run lint`, `npm run build`, `git diff --check` — all passed cleanly.

## Latest Manual Verification Leftovers Closeout results

A dedicated pass closed out the five remaining manual-only verification items using two real Google accounts and two separate real Chrome browser profiles side-by-side (full detail in `docs/parallel/GPT_MANUAL_VERIFICATION_LEFTOVERS_CLOSEOUT_HANDOFF.md`). All five are now fully closed with live evidence; no application code bugs were found.

- **Wrong-domain Google OAuth rejection**: a real non-`chamama.org` Google account, signed in via a separate Chrome profile with no cached app session, was rejected correctly — redirected to `/access-denied` with the correct message, no `profiles` row created, session cleared (confirmed via a subsequent `/dashboard` request redirecting to `/login`), no console errors.
- **Cross-user in-app notification/badge test**: two real accounts (`ronen@chamama.org` as actor, `studio@chamama.org` as recipient, the latter an active `staff`-only profile with no manager/super_admin role) were used. A temporary student message from the actor produced a privacy-safe notification and `/more` badge update for the recipient, correct click-navigation to the student card, and a correct unread-count drop after marking read — all confirmed live by the recipient and cross-checked directly against the database. The actor received zero notifications for their own action.
- **Genuine two-account Web Push test**: the same recipient account enabled push and received a real FCM push notification (real `push_subscriptions` row with a genuine FCM endpoint), confirmed to correctly focus the target student card on click.
- **Live 403 audit export test**: the same non-manager `staff`-only account, navigating directly to `/api/admin/audit/export`, received a plain "Forbidden" response with no CSV download; direct database read confirmed zero `audit_log.exported` rows exist (none were written for the denied request).
- **Learning Groups mobile viewport spot-check**: manually confirmed at a real narrow (~375-390px) viewport — Timetable view, List view, and an open reschedule modal all render and behave correctly, with no problematic overflow and all controls (filters, reschedule, edit, archive) reachable.
- **Environment artifact (not a code bug)**: an HTTP 431 "Request Header Fields Too Large" occurred once in the recipient's browser on the first attempted action, caused by accumulated stale cookies against `localhost:3000` from that browser's own long testing history. Clearing cookies for `localhost:3000` resolved it immediately and permanently for the rest of the pass. Code review of `src/lib/supabase/server.ts` and `src/lib/supabase/client.ts` confirmed both use the standard `@supabase/ssr` cookie adapter with no custom or oversized cookie writes — nothing in the application's own code is responsible for the header bloat.
- Cleanup: the temporary test message was soft-deleted by its author; the recipient's follow relationship and push subscription were left active at the user's request (real, harmless app state, not test pollution).
- Validation: `npm run check:no-hebrew-in-code`, `npm run lint`, `npm run build`, `git diff --check` — all passed cleanly. No source code was changed in this pass.

## Next recommended tasks

1. **Calendar management follow-up**: Build drag-and-drop slots editing, recurrence rules interpretation, and outbound Google Calendar Sync API integration. Calendar Views v2 (List/Day/Week/Month view switcher, date navigator, and sync indicators) is fully implemented and browser-verified.
2. **Learning groups follow-up**: none for Reschedule v1 or Timetable Views v2 themselves — both are fully implemented and browser-verified (button/modal interaction, not drag-and-drop; see "Admin learning groups timetable views v2 and rescheduling v1 status" above). Remaining deferred scopes: full visual drag-and-drop weekly timetable editing, Google Calendar sync indicators, notifications, capacity/roster management, and school-year selection.
3. **Manual verification leftovers**: none remaining. OAuth wrong-domain Google account rejection and cross-user real-time notification/badge testing were both fully closed with live evidence in the Manual Verification Leftovers Closeout pass. Student photo upload is also no longer a leftover (fully browser/manual-verified with real images — see "Student photo upload optimization v2" above).
4. **Two-account real push test**: none remaining. A genuine two-live-account push delivery test was completed in the Manual Verification Leftovers Closeout pass — a real second account received a real FCM push notification and clicking it correctly focused the target student card.
5. **Learning groups mobile viewport re-check**: none remaining. A real manual mobile-viewport check (~375-390px) was completed in the Manual Verification Leftovers Closeout pass covering Timetable view, List view, and an open reschedule modal — no visual issues found.
6. **Admin audit log viewer**: no further work needed. Actor filters, date-range filters, pagination, and CSV export are all fully implemented and now browser-verified (including RLS/security probes); the live 403 test against the export API from a real non-manager account is also now closed (see the Manual Verification Leftovers Closeout pass).
7. **Student photo URL hardening**: no further work needed. The database check constraint successfully blocks all direct-update bypasses and secures the `photo_url` path format invariant.

## Latest Pilot / Production Readiness Audit v1 results

`docs/13_PILOT_PRODUCTION_READINESS.md` now captures the first concrete pilot/production readiness checklist. The conclusion is that the app is ready for production-environment preparation, but not ready for real student data until hosted Supabase, production hosting, production OAuth, private storage, backups, and hosted RLS smoke tests are verified with fake or bootstrap-only data.

Scope boundaries preserved:

- No deployment was performed.
- No Supabase Cloud project was created.
- No real student data was added.
- No production secrets were changed.
- Google Calendar sync remains deferred.
- No new product feature was implemented.

The audit also updated `.env.example` with placeholder-only names for active runtime variables, Supabase Google OAuth provider configuration, Web Push VAPID keys, and deferred Google Calendar credentials.

Updated recommended next task:

1. **Production Environment Setup Runbook v1**: Convert `docs/13_PILOT_PRODUCTION_READINESS.md` into an exact, fake-data-only runbook for hosted Supabase setup, hosting environment configuration, OAuth redirect verification, production RLS smoke probes, backup/restore review, and rollback steps. Do not deploy or import real data unless explicitly approved.

## Latest Production Environment Setup Runbook v1 results

`docs/14_PRODUCTION_ENVIRONMENT_SETUP_RUNBOOK.md` now provides the exact fake-data-only operator runbook for setting up and verifying a hosted pilot/production-like environment. It covers hosted Supabase setup, environment variable mapping, production Google OAuth configuration, provider-neutral hosting setup, hosted RLS smoke probes, backup/restore/rollback checks, fake-data pilot verification, and the hard real-data import gate.

Scope boundaries preserved:

- No deployment was performed.
- No Supabase Cloud project was created.
- No hosting project was created.
- No real OAuth credentials or production secrets were configured.
- No real student data was added or imported.
- Google Calendar sync remains deferred.
- No new product feature was implemented.
- RLS and normal app-flow boundaries were not changed.

`.env.example` did not need changes in this task because it already contains placeholder-only entries for the current runtime variables, Supabase Google OAuth provider placeholders, Web Push VAPID keys, and deferred Google Calendar variables.

Updated recommended next task:

1. **Hosted Pilot Dry-Run Plan v1**: After explicit approval, rehearse `docs/14_PRODUCTION_ENVIRONMENT_SETUP_RUNBOOK.md` against a hosted fake-data-only environment and record actual setup/verification results. Do not import real data.

## Latest Hosted Pilot Dry-Run Plan v1 results

`docs/15_HOSTED_PILOT_DRY_RUN_PLAN.md` now provides the fake-data-only rehearsal plan for executing the hosted setup runbook later. It includes placeholder-only inputs, execution checkpoints, evidence collection, fake-data workflow verification, hosted RLS probes, failure/rollback rules, and a go/no-go report template.

No hosted dry run has been executed yet.

Scope boundaries preserved:

- No Supabase Cloud project was created.
- No hosting project was created.
- No deployment was performed.
- No real OAuth credentials or production secrets were configured.
- No real student data was used or imported.
- Google Calendar sync remains deferred.
- No import tooling or product feature was added.
- RLS and service-role boundaries were not changed.
- `.env.example` did not need changes.

Updated recommended next task:

1. **Hosting provider decision memo**: Choose the hosting provider, production-like domain, preview URL policy, rollback mechanism, and operational owner before approving Hosted Pilot Dry-Run Execution v1.

## Latest Vercel + Supabase Hosting Decision Memo v1 results

`docs/16_VERCEL_SUPABASE_HOSTING_DECISION.md` now establishes the default pilot hosting path on Vercel and hosted Supabase Cloud. It evaluates Next.js 16 Edge runtime compatibility, Server Actions, env var scopes, browser service-worker setup (`/sw.js`), and database configuration (RLS, private buckets, backups, and migration strategies).

Scope boundaries preserved:
- No deployment was performed.
- No Supabase Cloud project was created.
- No Vercel project was created.
- No real OAuth credentials or production secrets were configured.
- No real student data was used or imported.
- Google Calendar sync remains deferred.
- No import tooling or product feature was added.
- RLS, custom middleware (`src/proxy.ts`), and service-role boundaries were not changed.
- `.env.example` did not need changes.

Updated recommended next task:

1. **Hosted Pilot Dry-Run Execution Prep v1**: Select the production-like dry-run domain, choose the Supabase pricing/backup tier, and assign operational owners before executing the dry run.

## Latest Hosted Pilot Dry-Run Execution v1 — Part A results

`docs/17_HOSTED_PILOT_DRY_RUN_EXECUTION_PART_A.md` documents the initial execution steps for wiring the local repository to GitHub, linking/migrating hosted Supabase, setting up environment variables, and deploying to Vercel.
- GitHub connection succeeded on the `master` branch (a Google OAuth credentials leak blocker in an older commit was successfully purged using `git filter-branch` history rewriting).
- Linked to hosted project `qxjfzdmszgvymcuyuisu` and applied all 11 database migrations via `supabase db push`. Verified that core enums, tables, functions, views, RLS policies, and the private `student-photos` storage bucket were successfully created.
- Wired Vercel configuration env vars and completed the first production deploy to `https://noa-rho-dusky.vercel.app`.
- Unauthenticated smoke tests passed (login renders, anonymous `/dashboard` redirects, and `/sw.js` is served from root). Google OAuth credentials setup remains the only blocker for authenticated testing.

Scope boundaries preserved:
- No real student data was used or imported.
- No production secrets or credentials were committed to the repository.
- Local dev seed was not applied to the hosted database.
- Google Calendar sync remains deferred.
- No new application features were introduced.

Updated recommended next task:

1. **Hosted Pilot Dry-Run Execution v1 — Part B**: Configure Google OAuth and redirects, perform authenticated smoke tests, run hosted RLS/security probes, check signed storage uploads, and complete the go/no-go report.

## Latest Hosted Pilot Dry-Run Execution v1 — Part B results

`docs/18_HOSTED_PILOT_DRY_RUN_EXECUTION_PART_B.md` documents the final verification and testing steps completed on the live hosted pilot environment:
- Google OAuth is fully configured and verified using the institutional account `ronen@chamama.org`, which was successfully bootstrapped with both `super_admin` and `manager` roles during profile synchronization.
- Hosted database RLS and security checks passed (anonymous access is blocked, unauthorized users see 0 rows, manager has access). Direct public access to the private `student-photos` storage bucket is successfully denied (status 400).
- Student photo uploads are fully functional. Browser-side crop/compression produces a 56 KB WebP image stored privately at `students/55000000-0000-0000-0000-000000000001/profile.webp` and renders via signed URLs. `student_photo.updated` audit log row was written.
- Web Push notifications enabled and verified, registering a subscription row in `public.push_subscriptions`.
- CSV Audit export verified and logs `audit_log.exported` action with row count details.
- Go/No-Go report completed and recommends proceeding to plan real-data import.

Scope boundaries preserved:
- No real student data was used or imported.
- No secrets or credentials were committed to the repository or recorded in documentation.
- VAPID keys were successfully rotated and verified.
- Google Calendar sync remains deferred.
- No new application features were introduced.

Updated recommended next task:

1. **Pilot Real-Data Import Plan v1**: Create a detailed design, data mapping scheme, import scripts/workflows, and security/privacy safeguards to prepare for the ingestion of real student records, keeping the actual import blocked.

## Latest Hosted Performance Baseline and Bottleneck Audit v1 results

`docs/19_HOSTED_PERFORMANCE_BASELINE_AND_BOTTLENECK_AUDIT.md` records the first hosted performance baseline after Part B.

Key findings:

- Hosted performance is not acceptable for real-data planning yet. The fake student card took `4.53-6.66 s` on first/full navigations and produced approximately `10.05 s` reload signals; dashboard first/full navigations took `2.67-3.62 s`.
- Vercel functions are deployed in `iad1` while Supabase is in `ap-northeast-2`/Seoul (`icn1` on Vercel). This intercontinental function-to-database path is the primary bottleneck hypothesis.
- Safe hosted `EXPLAIN ANALYZE` reads completed in approximately `0.08-0.81 ms`; database execution is not currently slow.
- The proxy and pages repeat auth/access checks. The fake student-card document path reaches approximately 24 hosted Auth/PostgREST/Storage calls before client-side background work.
- The staff bottom navigation refetches unread count on every pathname and default link prefetch generated additional protected route traffic in Vercel logs.
- Most requested indexes already exist. No index, migration, RLS policy, feature, or source code was changed.
- Client bundles were approximately `117-153 KB` JS plus `55 KB` CSS per audited route in the local production build; hydration is secondary to region and request count.

Scope boundaries preserved:

- No real student data was used or imported.
- No secrets were committed or recorded.
- RLS and security checks were not weakened.
- No service-role client was used for normal app flows.
- Only documentation was added or updated.

Updated recommended next task:

1. **Performance Fixes v1**: Run a reversible Vercel `icn1` region experiment, reduce protected-route prefetch/background work, remove duplicate student-card auth/role calls, and re-measure before any real-data import plan or index migration.
