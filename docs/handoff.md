# Handoff - Current Chamama Staff App State

## Summary

The local Chamama Staff App now has the core authenticated staff foundation plus dashboard, student, announcement, message, project-status, emotional-status, student-goal (including primary/central selection), follow/unfollow, student-photo, admin layout shell, admin announcement management, admin calendar management, admin learning groups weekly editor, in-app notifications/badges, and a read-only admin audit log viewer workflows running against the local Supabase schema, storage bucket, and seed.

## Current Implemented Foundation

- **Local seed is active**: `supabase/seeds/dev_seed.sql` is enabled through `supabase/config.toml` and loads during `supabase db reset`.
- **OAuth/access grants foundation exists**: Google OAuth routing, protected app access, active profile checks, bootstrap super admin support, and super-admin access grant management are implemented.
- **UI base components exist**: Design tokens, `Card`, `ListRow`, `StatusBadge`, `EmptyState`, `Skeleton`, `Alert`, `BottomNav`, `AppHeader`, and protected app shell layouts are in place.
- **Staff mobile shell exists**: `/dashboard`, `/today`, `/students`, `/announcements`, and `/more` render protected app pages using the persistent mobile `BottomNav` layout.
- **Admin desktop shell v1 exists**: `/admin/*` routes are detected by a path-aware protected layout wrapper (`src/app/(app)/layout.tsx`) and render the desktop-first `AdminShell` component (`src/components/layout/AdminShell.tsx`). The Calendar, Learning groups, and Audit log nav items are now enabled and link to `/admin/calendar`, `/admin/learning-groups`, and `/admin/audit`.
- **Dashboard v1 exists**: `/dashboard` reads live RLS-scoped announcements, acknowledgements, events, followed-student counts, and the super-admin access-grants shortcut.
- **Student search/card exists**: `/students` lists active students and `/students/[studentId]` renders identity, contacts, current project, masters, emotional status, goals, and recent messages.
- **Student message composer and editing exist**: Active staff can add student-card update messages; message authors can edit their own active message, and super admins can edit any active message, via a new additive RLS policy (details below). Inserts/edits use request-scoped Supabase clients and audit `student_message.created` / `student_message.updated`.
- **Student message soft delete exists**: Authors can soft-delete their own messages and super admins can soft-delete any message; updates use RLS and audit `student_message.deleted`. **Known issue (found this session, not yet fixed):** a normal author's self-soft-delete currently fails under real RLS enforcement — see "Known issues" below.
- **Project status mutation v1 exists**: Authorized current-project masters, managers allowed by the existing schema helper, and super admins can update the current project traffic-light status from the student card. The action updates only status/updater metadata and audits `project.status_updated`.
- **Emotional status mutation v1 exists**: Authorized active group mentors, counselors and managers allowed by the existing schema helper, and super admins can update the emotional traffic-light status from the student card. The action appends a new `student_emotional_statuses` history row (status and `created_by` only), never reads or writes the sensitive `note` column, and audits `student_emotional_status.updated`.
- **Student goals mutation v1 exists (create/status/details/delete/primary)**: Authorized active group mentors, managers allowed by the existing schema helper, and super admins can create goals, edit title/details, update goal status (including archiving), and set a goal as primary/central for its student and school year. Managers and super admins can hard-delete goals. Counselors are excluded, matching the schema helper and RBAC matrix. Actions audit `student_goal.created`, `student_goal.updated`, `student_goal.details_updated`, `student_goal.deleted`, and `student_goal.primary_updated`.
- **Follow/Unfollow Student v1 exists**: Active staff can follow/unfollow any student directly from the student card. Following/unfollowing performs idempotent inserts/deletes, writes secure audit logs (`student_follow.created` and `student_follow.deleted`), and revalidation refreshes both the student card and the dashboard followed-student count.
- **Student Photo Uploads v1 exists (security hardened)**: Authorized active group mentors, managers, and super admins can upload or replace a student's profile photo from the student card. Photos are stored in a private Supabase Storage bucket (`student-photos`) and retrieved dynamically via secure signed URLs. Photo updates are column-safe: direct table-level update policies on `public.students` are disabled, and updates are restricted to the `photo_url` column via a secure RPC helper (`update_student_photo_path`) validating user permissions and expected storage paths.
- **Staff-facing announcements read and acknowledgement exist**: `/announcements` and `/announcements/[announcementId]` show visible announcements and support read acknowledgement through RLS-safe server actions.
- **Admin announcement management v1 exists**: `/admin/announcements` allows managers and super admins (or leadership role holders, for creation) to view an active announcements list/table, read acknowledgement progress counters, compose and publish new announcements, and delete announcements they manage. Creation/deletion are RLS-safe and write secure audit logs (`announcement.created`, `announcement.deleted`).
- **Admin calendar management v1 exists**: `/admin/calendar` lets managers and super admins list events (with today/week/month/upcoming filters), create events, edit events inline, and delete events, using the existing `calendar_events`/`calendar_event_groups` schema and RLS (no migration added). Mutations audit `calendar_event.created`, `calendar_event.updated`, and `calendar_event.deleted`, and revalidate both `/admin/calendar` and `/dashboard`.
- **Admin learning groups weekly editor v1 exists**: `/admin/learning-groups` lets managers and super admins list weekly learning groups (weekday and active/archived filters), create groups, edit groups inline, and archive/deactivate groups, using the existing schema and RLS (no migration added). Mutations audit `learning_group.created`, `learning_group.updated`, and `learning_group.archived`.
- **Notification delivery & bottom-nav badges v1 exists (Hardened)**: Student card updates automatically dispatch in-app notifications to active followers of the student (excluding the change actor), through a security-hardened database function enforcing active staff status, active student validation, strict event type allowlists, and per-event caller authorization checks. Privacy-preserving text formatting hides emotional note/color, raw message body, and goal descriptions. `/notifications` lists notifications; unread ones can be marked read individually or in bulk; mobile `BottomNav` overlays an unread badge on the `More` tab. Web Push delivery remains deferred.
- **Admin audit log viewer v1 exists**: `/admin/audit` gives managers and super admins a read-only view of recent `audit_logs` rows (action/entity-type filters, expandable before/after JSON), using the existing table and its existing manager/super-admin-only read RLS policy. No migration was added; the page performs no mutations at all and never uses the service-role client.

## Student card status details

See `docs/12_CURRENT_STATE.md` ("Student card status") for the full breakdown of message editing, emotional status, goals (including primary selection), follow, and photo mutation behavior and deferred items.

## Admin calendar and learning groups notes

- No migration was added for either feature. Both use their existing tables/RLS from the initial migration.
- A real Postgres RLS + `RETURNING` interaction was discovered and worked around at the application layer for calendar events: `calendar_events`' SELECT policy re-queries the table by id inside a security-definer function, which cannot see a row the same `INSERT`/`UPDATE` statement just wrote. The server actions avoid chaining `.select()` after insert/update on this table instead of bypassing RLS.
- Learning groups: managers and super admins can manage groups through the existing `current_user_is_manager_or_super_admin()` RLS policy; the UI archives/deactivates groups instead of hard deleting them, though hard delete remains possible at the RLS layer.
- Deferred for both: Google Calendar sync, drag-and-drop editing, and richer calendar/timetable views. Learning groups also defer capacity/roster management and school-year selection.

## Primary/central goal management notes (new this session)

- A new minimal migration (`supabase/migrations/20260709000000_student_goal_primary.sql`) adds a partial unique index enforcing at most one primary, non-archived goal per student per school year, plus a security-definer RPC `set_primary_student_goal` that atomically clears the previous primary and promotes the selected goal, restricted to the `is_primary`/`updated_by` columns and independently re-checking authorization.
- Active group mentors, managers, and super admins can set a goal as primary via the `<SetPrimaryGoalButton>` control; the action audits `student_goal.primary_updated`.

## Student message editing notes (new this session)

- The existing UPDATE RLS policy on `student_messages` only permitted soft-deletion (its `WITH CHECK` required `deleted_at IS NOT NULL`). A new, additive, minimal migration (`supabase/migrations/20260709010000_student_message_editing.sql`) adds a second permissive UPDATE policy scoped to editing an active message in place, leaving the original soft-delete policy untouched (Postgres ORs multiple permissive policies).
- Message authors can edit their own active message; super admins can edit any active message; nobody can edit an already-deleted message. Only `body`, `tags`, and `is_important` are updated; the action audits `student_message.updated`. Notifications are deferred for edits since the hardened notification RPC has no allowlisted event type for them.

## Known issues (found this session, not fixed — out of scope)

- **Self-soft-delete for student messages is broken for normal authors.** While investigating message-editing RLS, we found that a non-super-admin author's soft-delete of their own message fails under real RLS enforcement via the exact shipped code path (a plain `UPDATE` without `RETURNING`). Postgres requires the post-image row of an `UPDATE` to remain visible under at least one applicable `SELECT` policy; after soft-deletion, the only non-super-admin `SELECT` policy (`deleted_at IS NULL`) no longer matches. Confirmed via multiple isolated SQL probes; this predates this session's changes (reproduced with the new edit policy both present and removed). Recommended fix: add a `SELECT` policy letting authors read their own messages regardless of `deleted_at`, or move soft-delete to a security-definer RPC.

## Next task options

- Authenticated browser smoke test for dashboard, students, announcements, messages (including editing), project status updates, emotional status updates, goal management (including primary selection), follow/unfollow, student photo uploads, the admin shell/announcements/calendar/learning-groups management, notifications, and the audit log viewer.
- Fix the self-soft-delete RLS issue described above.
- Web Push delivery and push subscription management.
- Calendar management follow-up: view switcher (Day/Week/Month/Year-Gantt), drag-and-drop, recurrence, Google Calendar outbound sync indicators.
- Learning groups follow-up: drag-and-drop/full timetable editing, Google Calendar sync indicators, notifications, capacity/roster management, and school-year selection.
- Admin audit log viewer follow-up: actor and date-range filters, pagination beyond 100 rows, and an audited export path if needed.
