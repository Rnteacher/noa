# Handoff - Current Chamama Staff App State

## Summary

The local Chamama Staff App now has the core authenticated staff foundation plus dashboard, student, announcement, message, project-status, emotional-status, student-goal, follow/unfollow, student-photo, admin layout shell, admin announcement management, and admin calendar management workflows running against the local Supabase schema, storage bucket, and seed.

## Current Implemented Foundation

- **Local seed is active**: `supabase/seeds/dev_seed.sql` is enabled through `supabase/config.toml` and loads during `supabase db reset`.
- **OAuth/access grants foundation exists**: Google OAuth routing, protected app access, active profile checks, bootstrap super admin support, and super-admin access grant management are implemented.
- **UI base components exist**: Design tokens, `Card`, `ListRow`, `StatusBadge`, `EmptyState`, `Skeleton`, `Alert`, `BottomNav`, `AppHeader`, and protected app shell layouts are in place.
- **Staff mobile shell exists**: `/dashboard`, `/today`, `/students`, `/announcements`, and `/more` render protected app pages using the persistent mobile `BottomNav` layout.
- **Admin desktop shell v1 exists**: `/admin/*` routes are detected by a path-aware protected layout wrapper (`src/app/(app)/layout.tsx`) and render the desktop-first `AdminShell` component (`src/components/layout/AdminShell.tsx`) featuring a logical direction-aware (RTL-ready) side navigation panel, top headers, back links to the staff app, and a collapsible menu drawer for mobile viewports. The Calendar nav item is now enabled and links to `/admin/calendar`.
- **Dashboard v1 exists**: `/dashboard` reads live RLS-scoped announcements, acknowledgements, events, followed-student counts, and the super-admin access-grants shortcut.
- **Student search/card exists**: `/students` lists active students and `/students/[studentId]` renders identity, contacts, current project, masters, emotional status, goals, and recent messages.
- **Student message composer exists**: Active staff can add student-card update messages; inserts use request-scoped Supabase clients and audit `student_message.created`.
- **Student message soft delete exists**: Authors can soft-delete their own messages and super admins can soft-delete any message; updates use RLS and audit `student_message.deleted`.
- **Project status mutation v1 exists**: Authorized current-project masters, managers allowed by the existing schema helper, and super admins can update the current project traffic-light status from the student card. The action updates only status/updater metadata and audits `project.status_updated`.
- **Emotional status mutation v1 exists**: Authorized active group mentors, counselors and managers allowed by the existing schema helper, and super admins can update the emotional traffic-light status from the student card. The action appends a new `student_emotional_statuses` history row (status and `created_by` only), never reads or writes the sensitive `note` column, and audits `student_emotional_status.updated`.
- **Student goals mutation v1 exists**: Authorized active group mentors, managers allowed by the existing schema helper, and super admins can create goals, edit title/details, and update goal status (including archiving via the `archived` status) from the student card. Managers and super admins can hard-delete goals through the existing delete RLS policy. Counselors are excluded, matching the schema helper and RBAC matrix. The actions touch only intentionally exposed columns and audit `student_goal.created`, `student_goal.updated`, `student_goal.details_updated`, and `student_goal.deleted`.
- **Follow/Unfollow Student v1 exists**: Active staff can follow/unfollow any student directly from the student card. Following/unfollowing performs idempotent inserts/deletes, writes secure audit logs (`student_follow.created` and `student_follow.deleted`), and revalidation refreshes both the student card and the dashboard followed-student count.
- **Student Photo Uploads v1 exists (security hardened)**: Authorized active group mentors, managers, and super admins can upload or replace a student's profile photo from the student card. Photos are stored in a private Supabase Storage bucket (`student-photos`) and retrieved dynamically via secure signed URLs. Photo updates are column-safe: direct table-level update policies on `public.students` are disabled, and updates are restricted to the `photo_url` column via a secure RPC helper (`update_student_photo_path`) validating user permissions and expected storage paths.
- **Staff-facing announcements read and acknowledgement exist**: `/announcements` and `/announcements/[announcementId]` show visible announcements and support read acknowledgement through RLS-safe server actions.
- **Admin announcement management v1 exists**: `/admin/announcements` allows managers and super admins (or leadership role holders, for creation) to view an active announcements list/table, read acknowledgement progress counters, compose and publish new announcements (pinned state, target roles, target student groups, requires acknowledgement), and delete announcements they manage. Creation/deletion are RLS-safe and write secure audit logs (`announcement.created`, `announcement.deleted`).
- **Admin calendar management v1 exists**: `/admin/calendar` lets managers and super admins list events (with today/week/month/upcoming filters), create events, edit events inline, and delete events, using the existing `calendar_events`/`calendar_event_groups` schema and RLS (no migration added). Group targeting is supported when visibility is `groups`. Mutations audit `calendar_event.created`, `calendar_event.updated`, and `calendar_event.deleted`, and revalidate both `/admin/calendar` and `/dashboard` so dashboard calendar sections reflect changes. Google Calendar sync, recurrence, drag-and-drop, and the full Day/Week/Year-Gantt view switcher remain deferred.
- **Notification delivery & bottom-nav badges v1 exists (Hardened)**: Student card updates automatically dispatch in-app notifications to active followers of the student (excluding the change actor). The database function `create_student_change_notification` is security-hardened against direct client calls, fake actor ID spoofing, unauthorized notification creation, and event spamming, enforcing active staff status, active student validation, strict event type allowlists, and per-event caller authorization checks. Generates privacy-preserving text formatting internally (hides emotional note/color, raw message body, and goal descriptions). `/notifications` lists user's notifications. Unread notifications display distinct styling and can be marked as read individually or in bulk. Mobile `BottomNav` overlays unread notification badges on the `More` tab item. Web Push delivery remains deferred.

## Student card status details

See `docs/12_CURRENT_STATE.md` ("Student card status") for the full breakdown of emotional status, goals, follow, and photo mutation behavior and deferred items.

## Admin calendar management notes

- No migration was added. The implementation uses the existing `calendar_events` table, `calendar_event_groups` junction table, and `event_visibility` enum exactly as defined in the initial migration.
- A real Postgres RLS + `RETURNING` interaction was discovered and worked around at the application layer: `calendar_events`' SELECT policy re-queries the table by id inside a security-definer function, which cannot see a row the same `INSERT`/`UPDATE` statement just wrote. The server actions avoid chaining `.select()` after insert/update on this table (generating the id client-side for create) instead of bypassing RLS.
- Deferred: Google Calendar sync, recurrence, drag-and-drop, the Day/Week/Year-Gantt view switcher, and event push notifications.

## Next task options

- Authenticated browser smoke test for dashboard, students, announcements, messages, project status updates, emotional status updates, goal management, follow/unfollow, student photo uploads, the admin shell/announcements management, calendar management, and notifications.
- Primary/central goal follow-up after uniqueness is enforced or otherwise guaranteed.
- Web Push delivery and push subscription management.
- Calendar management follow-up: view switcher (Day/Week/Month/Year-Gantt), drag-and-drop, recurrence, Google Calendar outbound sync indicators.
- Learning groups weekly editor (`/admin/learning-groups`).
