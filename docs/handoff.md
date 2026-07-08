# Handoff - Current Chamama Staff App State

## Summary

The local Chamama Staff App now has the core authenticated staff foundation plus dashboard, student, announcement, message, project-status, emotional-status, student-goal, follow/unfollow, student-photo, and admin layout shell workflows running against the local Supabase schema, storage bucket, and seed.

## Current Implemented Foundation

- **Local seed is active**: `supabase/seeds/dev_seed.sql` is enabled through `supabase/config.toml` and loads during `supabase db reset`.
- **OAuth/access grants foundation exists**: Google OAuth routing, protected app access, active profile checks, bootstrap super admin support, and super-admin access grant management are implemented.
- **UI base components exist**: Design tokens, `Card`, `ListRow`, `StatusBadge`, `EmptyState`, `Skeleton`, `Alert`, `BottomNav`, `AppHeader`, and protected app shell layouts are in place.
- **Staff mobile shell exists**: `/dashboard`, `/today`, `/students`, `/announcements`, and `/more` render protected app pages using the persistent mobile `BottomNav` layout.
- **Admin desktop shell v1 exists**: `/admin/*` routes are detected by a path-aware protected layout wrapper (`src/app/(app)/layout.tsx`) and render the desktop-first `AdminShell` component (`src/components/layout/AdminShell.tsx`) featuring a logical direction-aware (RTL-ready) side navigation panel, top headers, back links to the staff app, and a collapsible menu drawer for mobile viewports.
- **Dashboard v1 exists**: `/dashboard` reads live RLS-scoped announcements, acknowledgements, events, followed-student counts, and the super-admin access-grants shortcut.
- **Student search/card exists**: `/students` lists active students and `/students/[studentId]` renders identity, contacts, current project, masters, emotional status, goals, and recent messages.
- **Student message composer exists**: Active staff can add student-card update messages; inserts use request-scoped Supabase clients and audit `student_message.created`.
- **Student message soft delete exists**: Authors can soft-delete their own messages and super admins can soft-delete any message; updates use RLS and audit `student_message.deleted`.
- **Project status mutation v1 exists**: Authorized current-project masters, managers allowed by the existing schema helper, and super admins can update the current project traffic-light status from the student card. The action updates only status/updater metadata and audits `project.status_updated`.
- **Emotional status mutation v1 exists**: Authorized active group mentors, counselors and managers allowed by the existing schema helper, and super admins can update the emotional traffic-light status from the student card. The action appends a new `student_emotional_statuses` history row (status and `created_by` only), never reads or writes the sensitive `note` column, and audits `student_emotional_status.updated`.
- **Student goals mutation v1 exists**: Authorized active group mentors, managers allowed by the existing schema helper, and super admins can create goals and update goal status (including archiving via the `archived` status) from the student card. Counselors are excluded, matching the schema helper and RBAC matrix. The actions touch only intentionally exposed columns and audit `student_goal.created` and `student_goal.updated`.
- **Follow / Unfollow Student v1 exists**: Active staff can follow/unfollow any student directly from the student card. Following/unfollowing performs idempotent inserts/deletes, writes secure audit logs (`student_follow.created` and `student_follow.deleted`), and revalidation refreshes both the student card and the dashboard followed-student count.
- **Student Photo Uploads v1 exists (Security Hardened)**: Authorized active group mentors, managers, and super admins can upload or replace a student's profile photo from the student card. Photos are stored in a private Supabase Storage bucket (`student-photos`) and retrieved dynamically via secure signed URLs. Photo updates are column-safe: direct table-level update policies on `public.students` are disabled, and updates are restricted to the `photo_url` column via a secure RPC helper (`update_student_photo_path`) validating user permissions and expected storage paths.
- **Staff-facing announcements read and acknowledgement exist**: `/announcements` and `/announcements/[announcementId]` show visible announcements and support read acknowledgement through RLS-safe server actions.
- **Admin announcement management v1 exists (Hardened)**: `/admin/announcements` allows managers and super admins to view active announcements list/table, read acknowledgement progress counters, compose and publish new announcements (pinned state, target roles, target student groups, requires acknowledgement), and delete announcements they manage. Creation/deletion are fully RLS-safe and write secure audit logs (`announcement.created`, `announcement.deleted`). Role targeting strictly maps to valid `app_role` database enum values (`staff`, `mentor`, `master`, `counselor`, `leadership`, `manager`, `super_admin`) and rejects invalid values (like `teacher`). Database/RLS policies are verified via rollback transaction probes.

## Admin-Specific Desktop Layout Shell v1 Notes

- **Least risky path-aware wrapper**: The wrapper detects `/admin` paths in `src/app/(app)/layout.tsx` to conditionally toggle the desktop side navigation shell, completely avoiding risky route-group file moves that would break parallel git branches.
- **Access grants integration**: `/admin/access-grants` uses the new `AdminShell` frame, adapting its padding margins to fit the layout width, and maintains all super-admin session security checks and audit log actions.
- **Desktop Sidebar Navigation**: Displays active links for Access grants and Announcements, and muted, non-clickable placeholders for future admin modules (Calendar, Learning groups, Students, Groups, Users, Import/Export, Settings).
- **RTL Support**: Follows logical CSS direction guidelines (`border-e`, `start-0`, flex positioning), working natively for Hebrew/Arabic layout structures.
- **Mobile Support**: The desktop sidebar collapses on narrow screen sizes into a clean, top-header bar with a toggleable modal overlay drawer.

## Next Task Options

- **Authenticated browser smoke test** for dashboard, students, announcements, messages, project status, emotional status, goals, follow/unfollow, student photo uploads, and the admin layout navigation sidebar/announcements.
- **Goal editing/deletion follow-up**.
- **Notification delivery & bottom-nav badges**.
- **Calendar management** (admin Gantt calendar & slots editor).
