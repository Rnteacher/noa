# GPT Project Status Mutation V1 Handoff

## Files changed

- `src/features/students/actions.ts`
- `src/features/students/queries.ts`
- `src/features/students/types.ts`
- `src/app/(app)/students/[studentId]/page.tsx`
- `src/app/(app)/students/[studentId]/ProjectStatusForm.tsx`
- `src/i18n/en.json`
- `src/i18n/he.json`
- `docs/12_CURRENT_STATE.md`
- `docs/handoff.md`
- `docs/parallel/GPT_PROJECT_STATUS_MUTATION_V1_HANDOFF.md`

## Migration status

No migration was added. The implementation uses the existing `projects.status` column, `traffic_light_status` enum values (`green`, `yellow`, `red`), `projects.is_current`, `student_masters`, and the existing project update RLS policy/helper.

## Project status mutation behavior

`updateProjectStatus(studentId, projectId, newStatus)` is a dedicated server action. It requires an authenticated active staff session, validates UUID inputs and enum values, verifies the student is active, verifies the project belongs to the student and is current, verifies authorization, updates only `projects.status` plus `updated_by`, revalidates `/students/[studentId]`, and returns translation-key errors.

## Permission model

- Current-project masters can update status only when they have an active `student_masters` assignment for that specific project.
- Managers can update project status because the existing schema helper `current_user_can_update_student_project` explicitly includes `current_user_is_manager_or_super_admin`.
- Super admins can update project status through the same schema/RLS authorization path.
- General staff, mentors, counselors, and leadership-only users do not see the edit form and are rejected by the server action.

## Audit logging behavior

Successful status changes write `project.status_updated` to `audit_logs` using the existing privileged server-only audit helper. The audit entry includes the project row before and after the status update.

## UI behavior

The Current project section shows the existing traffic-light `StatusBadge` to all viewers. Authorized users also see a compact status selector and submit button. The client component calls the server action, shows localized success/error feedback, and refreshes the route so the badge reflects the new status after revalidation.

## Deferred project/student-card items

- Emotional status mutation flow.
- Student goals mutation flow.
- Project title editing.
- Project master assignment editing.
- Status-change notifications.
- Follow/unfollow mutation.
- Student photo uploads.

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
- Type generation: Passed and refreshed `src/types/supabase.ts`.
- `npm run check:no-hebrew-in-code`: Passed.
- `npm run lint`: Passed.
- `npm run build`: Passed.
- `git diff --check`: Passed with line-ending normalization warnings only.
- Anonymous student-card request: `GET /students/55000000-0000-0000-0000-000000000001` returned `307` to `/login`.
- Rollback-only RLS probes: normal staff updated 0 project rows, manager updated 1 row, super admin updated 1 row.
- Seeded master note: the seeded assignment starts on `2026-09-01`, so it is not active on `2026-07-08`; the unmodified master probe updated 0 rows. A rollback-only probe that temporarily moved that assignment start date earlier confirmed an active current-project master updated 1 row, then rolled back.
- Authenticated browser mutation smoke testing was not completed because local login is Google-only and the seeded email/password accounts did not create usable Supabase auth sessions for the protected app.
