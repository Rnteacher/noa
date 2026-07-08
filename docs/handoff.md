# Handoff - Current Chamama Staff App State

## Summary

The local Chamama Staff App now has the core authenticated staff foundation plus dashboard, student, announcement, message, project-status, emotional-status, student-goal, and follow/unfollow workflows running against the local Supabase schema and seed.

## Current Implemented Foundation

- **Local seed is active**: `supabase/seeds/dev_seed.sql` is enabled through `supabase/config.toml` and loads during `supabase db reset`.
- **OAuth/access grants foundation exists**: Google OAuth routing, protected app access, active profile checks, bootstrap super admin support, and super-admin access grant management are implemented.
- **UI base components and app shell exist**: Design tokens, `Card`, `ListRow`, `StatusBadge`, `EmptyState`, `Skeleton`, `Alert`, `BottomNav`, `AppHeader`, and the protected app shell are in place.
- **Dashboard v1 exists**: `/dashboard` reads live RLS-scoped announcements, acknowledgements, events, followed-student counts, and the super-admin access-grants shortcut.
- **Student search/card exists**: `/students` lists active students and `/students/[studentId]` renders identity, contacts, current project, masters, emotional status, goals, and recent messages.
- **Student message composer exists**: Active staff can add student-card update messages; inserts use request-scoped Supabase clients and audit `student_message.created`.
- **Student message soft delete exists**: Authors can soft-delete their own messages and super admins can soft-delete any message; updates use RLS and audit `student_message.deleted`.
- **Project status mutation v1 exists**: Authorized current-project masters, managers allowed by the existing schema helper, and super admins can update the current project traffic-light status from the student card. The action updates only status/updater metadata and audits `project.status_updated`.
- **Emotional status mutation v1 exists**: Authorized active group mentors, counselors and managers allowed by the existing schema helper, and super admins can update the emotional traffic-light status from the student card. The action appends a new `student_emotional_statuses` history row (status and `created_by` only), never reads or writes the sensitive `note` column, and audits `student_emotional_status.updated`.
- **Student goals mutation v1 exists**: Authorized active group mentors, managers allowed by the existing schema helper, and super admins can create goals and update goal status (including archiving via the `archived` status) from the student card. Counselors are excluded, matching the schema helper and RBAC matrix. The actions touch only intentionally exposed columns and audit `student_goal.created` and `student_goal.updated`.
- **Follow / Unfollow Student v1 exists**: Active staff can follow/unfollow any student directly from the student card. This uses the existing `followed_students` schema and RLS policies (no database migration was added). Following/unfollowing performs idempotent inserts/deletes, writes secure audit logs (`student_follow.created` and `student_follow.deleted`), and revalidation refreshes both the student card and the dashboard followed-student count.
- **Announcements read path and acknowledgement v1 exist**: `/announcements` and `/announcements/[announcementId]` show visible announcements and support read acknowledgement through RLS-safe server actions.

## Follow / Unfollow Student v1 Notes

- **No migration was added**: The implementation uses the existing `followed_students` table (`profile_id`, `student_id`, `notification_level`, `created_at`) and the existing RLS policies which restrict row management to `profile_id = auth.uid()`.
- **Idempotent mutations**: `followStudent` and `unfollowStudent` check row existence before performing inserts/deletes, returning success without error on duplicate requests.
- **UI toggle**: The student card identity header displays the `<FollowButton>` client component, allowing instant follow/unfollow action with visual feedback (accent-filled Bell vs outline BellOff).
- **Audit trail**: Creation and deletion of follow relationships are audited as `student_follow.created` and `student_follow.deleted` using the privileged audit log helper.
- **Dashboard sync**: Following or unfollowing a student revalidates both the student card path and the `/dashboard` path, refreshing the followed-student counter dynamically.

## Next Task Options

- **Authenticated browser smoke test** for dashboard, students, announcements, messages, project status, emotional status, goals, and follow/unfollow mutations.
- **Student photo uploads**.
- **Admin-specific desktop layout shell**.
- **Goal editing/deletion follow-up**.
- **Notification delivery & bottom-nav badges**.
