# Handoff - Current Chamama Staff App State

## Summary

The local Chamama Staff App now has the core authenticated staff foundation plus dashboard, student, announcement, message, project-status, emotional-status, student-goal, follow/unfollow, and student-photo workflows running against the local Supabase schema, storage bucket, and seed.

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
- **Student Photo Uploads v1 exists (Security Hardened)**: Authorized active group mentors, managers, and super admins can upload or replace a student's profile photo from the student card. Photos are stored in a private Supabase Storage bucket (`student-photos`) and retrieved dynamically via secure signed URLs. Photo updates are column-safe: direct table-level update policies on `public.students` are disabled, and updates are restricted to the `photo_url` column via a secure RPC helper (`update_student_photo_path`) validating user permissions and expected storage paths. Advanced image cropping, image moderation, and bulk photo import remain deferred.
- **Announcements read path and acknowledgement v1 exist**: `/announcements` and `/announcements/[announcementId]` show visible announcements and support read acknowledgement through RLS-safe server actions.

## Student Photo Uploads v1 Notes

- **Migrations were added**:
  - `supabase/migrations/20260708184000_student_photos.sql` creates the private storage bucket `student-photos` with a 5MB size limit and allowed MIME types (`image/jpeg`, `image/png`, `image/webp`).
  - `supabase/migrations/20260708190500_harden_student_photo_updates.sql` drops the broad table update policy and replaces it with a security definer RPC helper `public.update_student_photo_path(target_student_id uuid, new_photo_path text)`.
- **Storage policies**: Restricts reads to active staff members and restricts writes (inserts, updates, deletes) to staff members who pass the `current_user_can_manage_student_photo` helper (based on file paths matching `students/{studentId}/{filename}`).
- **Table safety**: No direct update access to student rows is permitted; photo URL updates occur strictly via the RPC function which validates user authorization and path format.
- **UI Toggle**: The student card identity header displays the `<PhotoUploadForm>` component below the student's photo/avatar for authorized users, allowing image selection and automatic upload triggers.
- **Audit trail**: Photo updates are audited as `student_photo.updated` using the privileged audit log helper.

## Next Task Options

- **Authenticated browser smoke test** for dashboard, students, announcements, messages, project status, emotional status, goals, follow/unfollow, and student photo uploads.
- **Admin-specific desktop layout shell**.
- **Goal editing/deletion follow-up**.
- **Notification delivery & bottom-nav badges**.
