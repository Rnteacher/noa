# GPT Follow Student V1 Handoff

## Files changed

- `src/features/students/actions.ts`
- `src/app/(app)/students/[studentId]/page.tsx`
- `src/app/(app)/students/[studentId]/FollowButton.tsx` (new)
- `src/i18n/en.json`
- `src/i18n/he.json`
- `docs/12_CURRENT_STATE.md`
- `docs/handoff.md`
- `docs/parallel/GPT_FOLLOW_STUDENT_V1_HANDOFF.md` (new)

## Migration status

No migration was added. The implementation uses the existing `followed_students` table (`profile_id`, `student_id`, `notification_level`, `created_at`) and the existing RLS policies which restrict row management to `profile_id = auth.uid()`.

## Follow/unfollow behavior

- `followStudent(studentId)`: requires an authenticated active staff session, validates the UUID student ID, verifies that the target student exists and is active, checks if already followed (returns success idempotently if yes), inserts the follow row, writes an audit log, and revalidates `/students/[studentId]` and `/dashboard`.
- `unfollowStudent(studentId)`: requires an authenticated active staff session, validates the UUID student ID, verifies that the target student exists and is active, checks if followed (returns success idempotently if no), deletes the follow row, writes an audit log, and revalidates `/students/[studentId]` and `/dashboard`.
- Both actions use the request-scoped Supabase client, respecting Row-Level Security (RLS).

## Permission model

- Any active staff member who can view a student card can follow or unfollow that student.
- RLS insert/delete policies on `followed_students` verify that `profile_id = auth.uid()` and that the user is active staff.

## Audit logging behavior

- Following a student writes a `student_follow.created` audit log.
- Unfollowing a student writes a `student_follow.deleted` audit log.
- Both use the privileged server-only audit logging helper.

## UI behavior

- The student card identity header displays the `<FollowButton>` client component instead of the static state badge.
- The button displays an outline BellOff and "Follow" when not followed, and a filled Bell and "Following" with accent styling when followed.
- The button is responsive and uses `useTransition` to handle database mutations smoothly, refreshing the layout and the dashboard counters upon completion.
- Inline validation error feedback is rendered if the server action fails.

## Deferred notification/follow items

- Push notification delivery based on student updates.
- Custom notification preferences interface.
- Bottom navigation activity badges.
- Live followed-student change feed on the dashboard.

## Validation results

All quality check scripts and test probes ran and passed successfully:
- `supabase db reset`: Passed and loaded the developer seed.
- `supabase gen types typescript --local`: Passed with updated types.
- `npm run check:no-hebrew-in-code`: Passed with no Hebrew characters found in codebase.
- `npm run lint`: Passed with 0 errors/warnings.
- `npm run build`: Production compilation and typecheck succeeded.
- `git diff --check`: Passed.
- Database RLS Probes: A PL/pgSQL database verification probe verified that Mentor One can follow/unfollow their own rows, is blocked from doing so on behalf of Mentor Two, and anonymous users are blocked. The SELECT policy successfully filters rows so Mentor One cannot query Mentor Two's follow row. All transactions rolled back cleanly, leaving database seed intact.
