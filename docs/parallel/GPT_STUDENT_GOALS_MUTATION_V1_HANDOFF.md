# GPT Student Goals Mutation V1 Handoff

## Files changed

- `src/features/students/actions.ts`
- `src/features/students/queries.ts`
- `src/features/students/types.ts`
- `src/app/(app)/students/[studentId]/page.tsx`
- `src/app/(app)/students/[studentId]/GoalForm.tsx` (new)
- `src/app/(app)/students/[studentId]/GoalStatusForm.tsx` (new)
- `src/i18n/en.json`
- `src/i18n/he.json`
- `docs/12_CURRENT_STATE.md`
- `docs/handoff.md`
- `docs/parallel/GPT_STUDENT_GOALS_MUTATION_V1_HANDOFF.md`

## Migration status

No migration was added. The implementation uses the existing `student_goals` table (`title`, `description`, `status`, `is_primary`, `school_year_id`, `created_by`, `updated_by`, timestamps), the `goal_status` enum values (`active`, `completed`, `paused`, `archived`), and the existing RLS policies: insert requires `created_by = auth.uid()` and `current_user_can_update_student_goals(student_id)`; update requires the same helper plus `updated_by = auth.uid()` in the with-check clause. Goals are updated in place; the table has no soft-delete columns, and `archived` is an enum status.

## Goal mutation behavior

- `createStudentGoal(studentId, title, description)`: requires an authenticated active staff session, validates the UUID and trimmed title (required, max 120 chars) and optional description (max 1000 chars), verifies the student is active, verifies authorization, and inserts a goal with the student's `school_year_id`, default `active` status, and `created_by`/`updated_by` set to the current user. Status and other columns are not accepted from the UI on create.
- `updateStudentGoalStatus(studentId, goalId, newStatus)`: validates UUIDs and the `goal_status` enum value, verifies the goal belongs to the student, verifies authorization, short-circuits when the status is unchanged, and updates only `status` and `updated_by` scoped to the goal id and student id.
- Both actions use the normal request-scoped Supabase client so RLS is enforced independently, revalidate `/students/[studentId]`, and return translation-key errors.
- Archiving a goal is a status change to `archived`; the student card query filters archived goals out, so archiving removes the goal from the card without deleting data.

## Permission model

- Active group mentors of the student's group can create goals and update goal status (verified against an active `group_mentors` assignment for the student's group).
- Managers and super admins can manage goals because the existing schema helper `current_user_can_update_student_goals` explicitly includes `current_user_is_manager_or_super_admin`.
- Counselors cannot manage goals; the schema helper does not include the counselor role, matching the RBAC matrix, and no counselor path was added.
- General staff, masters, and leadership-only users do not see the edit controls and are rejected by the server actions and by RLS.
- The server actions check both the schema helper RPC and the explicit role/relationship through a shared `verifyGoalManagementPermission` helper, and the database policies enforce the same rule independently.

## Audit logging behavior

- Successful creations write `student_goal.created` with the inserted row as after-data.
- Successful status updates write `student_goal.updated` with before/after goal snapshots (id, student id, title, status, primary flag, updater, timestamp).
- Both use the existing privileged server-only audit helper; audit failures are logged without failing the mutation.

## UI behavior

The Goals section shows goal rows (title, description, status/primary chip) to all staff. Authorized users additionally see a compact status selector with a save button under each goal and an add-goal form (title input plus optional details textarea) at the end of the section. The client components call the server actions, show localized success/error feedback, and refresh the route so the card reflects changes after revalidation. Unauthorized users see no disabled controls.

## Implemented vs deferred goal operations

Implemented in v1:

- Goal creation (title plus optional description).
- Goal status updates across the full `goal_status` enum, including archive via `archived`.

Deferred:

- Goal title/description editing.
- Hard goal deletion (RLS allows managers/super admins only; not exposed in v1).
- Primary/central goal management and the locked `visible_to_student` toggle.
- Archived-goals history view.
- Goal-change notifications.

## Validation results

Commands run:

```bash
supabase db reset
supabase gen types typescript --local | Out-File -Encoding utf8 src/types/supabase.ts
npm run check:no-hebrew-in-code
npm run lint
npm run build
git diff --check
```

Results:

- `supabase db reset`: Passed and loaded `supabase/seeds/dev_seed.sql`.
- Type generation: Passed; `src/types/supabase.ts` was regenerated with no changes because no migration was added.
- `npm run check:no-hebrew-in-code`: Passed.
- `npm run lint`: Passed.
- `npm run build`: Passed.
- `git diff --check`: Passed with line-ending normalization warnings only.
- Anonymous student-card request: `GET /students/55000000-0000-0000-0000-000000000001` returned `307` to `/login`.
- Rollback-only RLS probes: unrelated staff goal insert denied, counselor goal insert denied, manager goal insert allowed, super admin goal insert allowed, unrelated staff goal update changed 0 rows, manager goal update changed 1 row, and a manager update spoofing another user's `updated_by` denied by the update policy's with-check clause.
- Seeded mentor note: the seeded mentor assignment starts on `2026-09-01`, so it is not active on `2026-07-08`; the unmodified mentor probes were denied. Rollback-only probes that temporarily moved that assignment start date earlier confirmed an active group mentor insert and status update were allowed, then rolled back. The seed goal count, goal status, and assignment date were verified unchanged after all probes.
- Authenticated browser mutation smoke testing was not completed because local login is Google-only and the seeded email/password accounts do not create usable Supabase auth sessions for the protected app. Server-side validation, database authorization probes, and build checks passed.
