# Handoff - Current Chamama Staff App State

## Summary

The local Chamama Staff App now has the core authenticated staff foundation plus dashboard, student, announcement, message, and project-status workflows running against the local Supabase schema and seed.

## Current implemented foundation

- **Local seed is active**: `supabase/seeds/dev_seed.sql` is enabled through `supabase/config.toml` and loads during `supabase db reset`.
- **OAuth/access grants foundation exists**: Google OAuth routing, protected app access, active profile checks, bootstrap super admin support, and super-admin access grant management are implemented.
- **UI base components and app shell exist**: Design tokens, `Card`, `ListRow`, `StatusBadge`, `EmptyState`, `Skeleton`, `Alert`, `BottomNav`, `AppHeader`, and the protected app shell are in place.
- **Dashboard v1 exists**: `/dashboard` reads live RLS-scoped announcements, acknowledgements, events, followed-student counts, and the super-admin access-grants shortcut.
- **Student search/card exists**: `/students` lists active students and `/students/[studentId]` renders identity, contacts, current project, masters, emotional status, goals, and recent messages.
- **Student message composer exists**: Active staff can add student-card update messages; inserts use request-scoped Supabase clients and audit `student_message.created`.
- **Student message soft delete exists**: Authors can soft-delete their own messages and super admins can soft-delete any message; updates use RLS and audit `student_message.deleted`.
- **Project status mutation v1 exists**: Authorized current-project masters, managers allowed by the existing schema helper, and super admins can update the current project traffic-light status from the student card. The action updates only status/updater metadata and audits `project.status_updated`.
- **Announcements read path and acknowledgement v1 exist**: `/announcements` and `/announcements/[announcementId]` show visible announcements and support read acknowledgement through RLS-safe server actions.

## Project status mutation notes

- No migration was added. The implementation uses existing `projects.status`, the `traffic_light_status` enum, `projects.is_current`, `student_masters`, and the `current_user_can_update_student_project` RLS helper/policy.
- The v1 UI is a compact selector and submit button in the Current project section. Unauthorized users do not see edit controls.
- Emotional status editing, goal editing, project title/master assignment editing, and notifications remain deferred.

## Next task options

- Authenticated browser smoke test for dashboard, students, announcements, messages, project status updates, and audit rows.
- Emotional status mutation flow.
- Student goals mutation flow.
- Student photo uploads.
- Admin-specific desktop layout shell.
