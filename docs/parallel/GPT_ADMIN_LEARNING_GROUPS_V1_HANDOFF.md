# GPT Admin Learning Groups Weekly Editor V1 Handoff

## Scope

Implemented the first admin-facing weekly learning groups editor at `/admin/learning-groups`.

This task was completed without a migration and without seed/auth-routing changes.

## Files changed

- `src/components/layout/AdminShell.tsx`
- `src/features/learning-groups/types.ts`
- `src/features/learning-groups/admin-queries.ts`
- `src/features/learning-groups/admin-actions.ts`
- `src/app/(app)/admin/learning-groups/page.tsx`
- `src/app/(app)/admin/learning-groups/LearningGroupForm.tsx`
- `src/app/(app)/admin/learning-groups/LearningGroupRow.tsx`
- `src/app/(app)/admin/learning-groups/ArchiveLearningGroupButton.tsx`
- `src/i18n/en.json`
- `src/i18n/he.json`
- `docs/12_CURRENT_STATE.md`
- `docs/handoff.md`
- `docs/parallel/GPT_ADMIN_LEARNING_GROUPS_V1_HANDOFF.md`

## Schema and RLS findings

- `learning_groups` already supports the v1 fields: `title`, `description`, `weekday`, `starts_at`, `ends_at`, `leader_id`, `room`, `active_from`, `active_until`, `is_active`, `created_by`, `updated_by`, timestamps, and `school_year_id`.
- `learning_group_target_groups` supports target `student_groups`.
- Database constraints enforce `ends_at > starts_at`, valid active date range, and the standard 11:30-13:30 learning group window.
- Existing RLS permits active staff to read learning groups and target links.
- Existing RLS permits managers and super admins to manage learning groups and target links through `current_user_is_manager_or_super_admin()`.
- Existing manager/super-admin RLS also permits hard delete. The v1 UI intentionally exposes archive/deactivate instead because the table has `is_active`.

## Behavior implemented

- Managers and super admins can list learning groups with weekday and active/archived/all filters.
- Managers and super admins can create learning groups.
- Managers and super admins can edit learning groups inline.
- Managers and super admins can archive/deactivate active groups through `is_active = false`.
- Target student groups are required and are replaced on update by clearing and reinserting `learning_group_target_groups` rows.
- Optional leader selection reads active `profiles`; selected leaders are validated server-side.
- The current school year is resolved automatically from `school_years.is_current = true` on create.
- The admin nav Learning groups item now links to `/admin/learning-groups`.

## Audit and revalidation

- `learning_group.created`
- `learning_group.updated`
- `learning_group.archived`

All use the existing server-only privileged audit helper and capture before/after metadata plus target group ids where relevant.

All actions revalidate `/admin/learning-groups`.

## Validation

Commands run:

```bash
npm run check:no-hebrew-in-code
npm run lint
npm run build
git diff --check
```

Results:

- No migration was added, so `supabase db reset` and type regeneration were not required.
- Hebrew scanner passed.
- ESLint passed.
- Production build passed and registered `/admin/learning-groups` as a dynamic route.
- `git diff --check` passed with line-ending normalization warnings only.

Rollback-only database probes confirmed:

- Manager insert, update, target-link replacement, archive, and hard delete are permitted by existing RLS.
- Super admin update is permitted by existing RLS.
- Mentor update/delete affect 0 rows and mentor insert is rejected by RLS (`42501`).
- Counselor update affects 0 rows.
- Plain staff archive affects 0 rows and plain staff insert is rejected by RLS (`42501`).
- Invalid early start and end-before-start inserts are rejected by database check constraints (`23514`).
- Seed state remains unchanged after rollback: 1 seed learning group, 1 target link, title `Software Development Lab`, `is_active = true`.

## Deferred

- Drag-and-drop weekly timetable editing.
- Full timetable/day-grid layout.
- Google Calendar sync.
- Notifications for learning group changes.
- Capacity and roster management.
- School-year picker.
