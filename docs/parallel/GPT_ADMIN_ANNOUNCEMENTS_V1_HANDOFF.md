# GPT Admin Announcements V1 Handoff

## Files changed

- `src/features/announcements/admin-queries.ts` (new)
- `src/features/announcements/admin-actions.ts` (new)
- `src/app/(app)/admin/announcements/page.tsx` (new)
- `src/app/(app)/admin/announcements/AnnouncementForm.tsx` (new)
- `src/app/(app)/admin/announcements/DeleteAnnouncementButton.tsx` (new)
- `src/components/layout/AdminShell.tsx`
- `src/i18n/en.json`
- `src/i18n/he.json`
- `docs/12_CURRENT_STATE.md`
- `docs/handoff.md`
- `docs/parallel/GPT_ADMIN_ANNOUNCEMENTS_V1_HANDOFF.md` (new)

## Whether a migration was added

- **No migration was added.**
- The existing Supabase schema tables (`public.announcements`, `public.announcement_target_roles`, `public.announcement_target_groups`, `public.announcement_target_users`, and `public.announcement_reads`) and Row-Level Security (RLS) policies are fully sufficient and secure.

## Announcement management behavior

- Managers and super admins can view all manageable announcements and read acknowledgements count in a dense administrative table.
- Administrators can compose and publish new announcements with custom settings: pinned (`is_pinned`) and requires acknowledgement (`requires_acknowledgement`).
- Deletion is supported and fully RLS-restricted.

## Permission model

- **Create**: Allowed for users with role `'leadership'`, `'manager'`, or `'super_admin'` (via `current_user_is_leadership_or_above()`). The author of the announcement must match the authenticated user ID (`author_id = auth.uid()`).
- **Delete**: Restricted to managers and super admins (`current_user_is_manager_or_super_admin()`), fully enforced by the database delete policy on `public.announcements`.
- **Read Progress**: Querying reader counts from `public.announcement_reads` is RLS-restricted to managers and super admins. If a non-manager/non-super-admin queries it, RLS naturally filters out other users' read rows.

## Targeting model

- Supports three target types:
  - `all_staff`: targeted to all active staff.
  - `roles`: targets specific system roles (strictly matching valid `app_role` database enum values: `'staff'`, `'mentor'`, `'master'`, `'counselor'`, `'leadership'`, `'manager'`, `'super_admin'`; the invalid `'teacher'` role was removed) by inserting records into `public.announcement_target_roles`.
  - `groups`: targets specific student learning groups by inserting records into `public.announcement_target_groups` (fetched dynamically from `public.student_groups`).

## Audit logging behavior

- Creating an announcement writes an audit log with action `announcement.created` containing title, target type, is_pinned, requires_acknowledgement, targeted roles, and targeted groups.
- Deleting an announcement writes an audit log with action `announcement.deleted` containing the title and target type before deletion.

## UI behavior

- **Layout Grid**: Side-by-side grid layout on desktop sizes (dense list table on the start side, compose form sticky on the end side) stacking vertically on narrow sizes.
- **Form Controls**: Title text input, message body textarea, target select dropdown, target checkboxes (for roles/groups), configuration checkboxes, and submit button. Includes transitions and loading indicators.
- **Delete Confirmation**: Deletion triggers a confirm dialog. Once accepted, it fires under `useTransition` and refreshes the layout.

## Deferred announcement/notification items

- Inline editing / updating of announcements.
- Draft modes and scheduled publication.
- Push notification delivery sends.
- Rich-text editor formatting and attachment upload.

## Validation results

All quality check scripts ran and passed successfully:
- `npm run check:no-hebrew-in-code`: Passed with no Hebrew characters found in codebase.
- `npm run lint`: Passed with 0 errors/warnings.
- `npm run build`: Production compilation and typecheck succeeded.
- `git diff --check`: Passed with no whitespace errors.
- **Database/RLS transaction-rollback probes**: Passed successfully, verifying:
  1. Leadership creation succeeds.
  2. Normal staff creation is rejected by RLS insert policy.
  3. Invalid role `'teacher'` target value is rejected by database enum type constraints.
  4. Leadership delete is rejected by RLS delete policy.
  5. Manager delete succeeds.
