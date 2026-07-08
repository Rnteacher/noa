# Handoff - Current Chamama Staff App State

## Summary

The local Chamama Staff App now has the core authenticated staff foundation plus dashboard, student, announcement, message, project-status, and emotional-status workflows running against the local Supabase schema and seed.

## Current implemented foundation

- **Local seed is active**: `supabase/seeds/dev_seed.sql` is enabled through `supabase/config.toml` and loads during `supabase db reset`.
- **OAuth/access grants foundation exists**: Google OAuth routing, protected app access, active profile checks, bootstrap super admin support, and super-admin access grant management are implemented.
- **UI base components and app shell exist**: Design tokens, `Card`, `ListRow`, `StatusBadge`, `EmptyState`, `Skeleton`, `Alert`, `BottomNav`, `AppHeader`, and the protected app shell are in place.
- **Dashboard v1 exists**: `/dashboard` reads live RLS-scoped announcements, acknowledgements, events, followed-student counts, and the super-admin access-grants shortcut.
- **Student search/card exists**: `/students` lists active students and `/students/[studentId]` renders identity, contacts, current project, masters, emotional status, goals, and recent messages.
- **Student message composer exists**: Active staff can add student-card update messages; inserts use request-scoped Supabase clients and audit `student_message.created`.
- **Student message soft delete exists**: Authors can soft-delete their own messages and super admins can soft-delete any message; updates use RLS and audit `student_message.deleted`.
- **Project status mutation v1 exists**: Authorized current-project masters, managers allowed by the existing schema helper, and super admins can update the current project traffic-light status from the student card. The action updates only status/updater metadata and audits `project.status_updated`.
- **Emotional status mutation v1 exists**: Authorized active group mentors, counselors and managers allowed by the existing schema helper, and super admins can update the emotional traffic-light status from the student card. The action appends a new `student_emotional_statuses` history row (status and `created_by` only), never reads or writes the sensitive `note` column, and audits `student_emotional_status.updated`.
- **Announcements read path and acknowledgement v1 exist**: `/announcements` and `/announcements/[announcementId]` show visible announcements and support read acknowledgement through RLS-safe server actions.

## Emotional status mutation notes

- No migration was added. The implementation uses the existing append-only `student_emotional_statuses` table, the `traffic_light_status` enum, the `latest_student_emotional_statuses` view, and the existing insert RLS policy backed by `current_user_can_update_student_emotional_status`.
- The v1 UI is a compact selector and submit button in the Emotional status section. Unauthorized users do not see edit controls.
- Emotional free-text notes remain hidden and not editable; goal editing, project title/master assignment editing, photo changes, follow mutations, and notifications remain deferred.

## Next task options

- Authenticated browser smoke test for dashboard, students, announcements, messages, project status updates, emotional status updates, and audit rows.
- Student goals mutation flow.
- Student photo uploads.
- Admin-specific desktop layout shell.
