# GPT Emotional Status Mutation V1 Handoff

## Files changed

- `src/features/students/actions.ts`
- `src/features/students/queries.ts`
- `src/features/students/types.ts`
- `src/app/(app)/students/[studentId]/page.tsx`
- `src/app/(app)/students/[studentId]/EmotionalStatusForm.tsx` (new)
- `src/i18n/en.json`
- `src/i18n/he.json`
- `docs/12_CURRENT_STATE.md`
- `docs/handoff.md`
- `docs/parallel/GPT_EMOTIONAL_STATUS_MUTATION_V1_HANDOFF.md`

## Migration status

No migration was added. The implementation uses the existing append-only `student_emotional_statuses` table, the `traffic_light_status` enum values (`green`, `yellow`, `red`), the `latest_student_emotional_statuses` view, and the existing insert RLS policy, which requires `created_by = auth.uid()` and `current_user_can_update_student_emotional_status(student_id)`.

## Emotional status mutation behavior

`updateEmotionalStatus(studentId, newStatus)` is a dedicated server action using the normal request-scoped Supabase client. It requires an authenticated active staff session, validates the UUID input and enum value, verifies the student is active, verifies authorization, short-circuits when the latest status already equals the requested status, inserts a new history row containing only `student_id`, `status`, and `created_by`, revalidates `/students/[studentId]`, and returns translation-key errors. Emotional statuses are appended as history rows, never updated in place; there is no update RLS policy on the table.

## Permission model

- Active group mentors of the student's group can update emotional status (verified against an active `group_mentors` assignment for the student's group).
- Counselors can update emotional status because the existing schema helper `current_user_can_update_student_emotional_status` explicitly includes `current_user_has_role('counselor')`.
- Managers can update emotional status because the same existing schema helper explicitly includes `current_user_is_manager_or_super_admin`.
- Super admins can update any student's emotional status through the same schema/RLS authorization path.
- General staff, masters, and leadership-only users do not see the edit form and are rejected by the server action and by RLS.
- The server action checks both the schema helper RPC and the explicit role/relationship, and the database insert policy enforces the same rule independently.

## Privacy decision about emotional notes

Emotional free-text notes are sensitive and are fully excluded from this v1. The student card query selects only `status` and `created_at` from the latest-status view, the mutation inserts no `note` value and never selects the `note` column, the returned student card type contains no note field, there is no notes textarea, and audit entries contain only status transition metadata.

## Audit logging behavior

Successful status changes write `student_emotional_status.updated` to `audit_logs` using the existing privileged server-only audit helper. The audit entry records the previous latest status metadata (id, student id, status, timestamp) as before-data and the inserted row (id, student id, status, creator, timestamp) as after-data. Notes are never included.

## UI behavior

The Emotional status section shows the existing traffic-light `StatusBadge` (or the empty state) to all viewers. Authorized users also see a compact status selector and submit button rendered by the `EmotionalStatusForm` client component; it also renders when the student has no emotional status yet so an authorized user can set the first one. The component calls the server action, shows localized success/error feedback, and refreshes the route so the badge reflects the new status after revalidation. Unauthorized users see no disabled controls.

## Deferred emotional/student-card items

- Emotional free-text notes viewing/editing surface and its narrower authorization model.
- Student goals mutation flow.
- Student photo uploads.
- Project title/master assignment editing.
- Status-change notifications and message-stream system lines.
- Follow/unfollow mutation.
- Emotional status history timeline view.

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
- Rollback-only RLS probes: unrelated staff insert denied, counselor insert allowed, manager insert allowed, super admin insert allowed, and a counselor insert spoofing another user's `created_by` denied.
- Seeded mentor note: the seeded mentor assignment starts on `2026-09-01`, so it is not active on `2026-07-08`; the unmodified mentor probe was denied. A rollback-only probe that temporarily moved that assignment start date earlier confirmed an active group mentor insert was allowed, then rolled back. The seed row count and assignment date were verified unchanged after all probes.
- Authenticated browser mutation smoke testing was not completed because local login is Google-only and the seeded email/password accounts do not create usable Supabase auth sessions for the protected app. Server-side validation, database authorization probes, and build checks passed.
