# GPT Student Goal Edit/Delete V1 Handoff

## Files changed

- `src/features/students/actions.ts`
- `src/features/students/queries.ts`
- `src/features/students/types.ts`
- `src/app/(app)/students/[studentId]/page.tsx`
- `src/app/(app)/students/[studentId]/GoalDetailsForm.tsx`
- `src/app/(app)/students/[studentId]/DeleteGoalButton.tsx`
- `src/i18n/en.json`
- `src/i18n/he.json`
- `docs/12_CURRENT_STATE.md`
- `docs/handoff.md`
- `docs/parallel/GPT_STUDENT_GOAL_EDIT_DELETE_V1_HANDOFF.md`

## Migration status

No migration was added. The implementation uses the existing `student_goals` table, `goal_status` enum, `current_user_can_update_student_goals` helper, and the existing RLS insert/update/delete policies.

## Goal editing behavior

`updateStudentGoalDetails(studentId, goalId, title, description)` validates IDs, title presence and length, optional description length, active staff session, active student, goal ownership by student, and existing goal-management authorization. It updates only `title`, `description`, and `updated_by`, then revalidates `/students/[studentId]`.

## Goal deletion behavior

`deleteStudentGoal(studentId, goalId)` is exposed only when the current user is manager or super admin. It verifies active staff, active student, manager/super-admin role, and goal ownership before hard deleting the goal through the normal request-scoped Supabase client. The UI uses a confirmation prompt before calling the action.

## Primary/central goal decision

Primary goal management remains deferred. The schema includes `student_goals.is_primary`, but there is no unique index or constraint enforcing one primary goal per student, so this follow-up does not add a UI-only primary toggle.

## Permission model

- Active group mentors, managers, and super admins can edit goal title/description because the existing goal-management helper permits mentors and manager/super-admin users.
- Managers and super admins can hard-delete goals because the existing delete policy explicitly checks `current_user_is_manager_or_super_admin()`.
- Mentors cannot hard-delete goals.
- Counselors, unrelated staff, masters, and leadership-only users are not goal managers and cannot edit or delete goals.

## Audit logging behavior

- Successful title/description edits write `student_goal.details_updated` with before/after goal snapshots.
- Successful hard deletes write `student_goal.deleted` with before-data.
- Audit writes use the existing privileged server-only audit helper; audit failures are logged without failing the user-facing mutation.

## UI behavior

Authorized goal managers see a compact per-goal title/details form under each active goal, alongside the existing status selector. Managers and super admins also see a delete button. Unauthorized users see read-only goal rows with no disabled controls.

## Validation results

Commands run:

```bash
npm run check:no-hebrew-in-code
npm run lint
npm run build
git diff --check
```

Results:

- No migration was added, so `supabase db reset` and type regeneration were not required for this follow-up.
- `npm run check:no-hebrew-in-code`: Passed.
- `npm run lint`: Passed.
- `npm run build`: Passed.
- `git diff --check`: Passed with line-ending normalization warnings only.
- Rollback-only RLS probes: active mentor updated title/description 1 row, unrelated staff updated 0 rows, counselor updated 0 rows, manager updated 1 row, and super admin updated 1 row.
- Rollback-only delete probes: active mentor deleted 0 rows, manager deleted 1 row, and super admin deleted 1 row.
- Seed state remained unchanged after probes: 4 goals remained, the first seed goal title stayed `Complete Next.js layout`, and the first seed mentor assignment stayed `active_from = 2026-09-01`.
- Authenticated browser smoke testing was not completed because local login is Google-only and the seeded email/password accounts do not create usable Supabase auth sessions for the protected app.
