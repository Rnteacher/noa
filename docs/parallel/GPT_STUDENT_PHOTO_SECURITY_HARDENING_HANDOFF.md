# GPT Student Photo Security Hardening Handoff

## Files changed

- `supabase/migrations/20260708190500_harden_student_photo_updates.sql` (new)
- `src/features/students/actions.ts`
- `docs/12_CURRENT_STATE.md`
- `docs/handoff.md`
- `docs/parallel/GPT_STUDENT_PHOTO_SECURITY_HARDENING_HANDOFF.md` (new)

## Vulnerability assessment of the previous policy

Yes, the previous table-level update policy was vulnerable. Because Row-Level Security in PostgreSQL operates at the row level rather than the column level by default, granting a user `UPDATE` privileges on `public.students` using the `current_user_can_manage_student_photo(id)` criteria meant that the authorized photo manager could update any other field of that student's row (such as `first_name`, `last_name`, `phone`, `group_id`, or `is_active`) via direct client API calls.

## Migration added

`supabase/migrations/20260708190500_harden_student_photo_updates.sql` has been added. 

It accomplishes the following:
1. Drops the broad `Authorized staff can update student photos on student row` update policy on `public.students`.
2. Creates the security definer RPC helper function `public.update_student_photo_path(target_student_id uuid, new_photo_path text)`.
3. Restricts execute permission on the function exclusively to the `authenticated` role.

## Final photo update mechanism

- Photos are uploaded to private storage under paths matching `students/{studentId}/profile.{extension}` using the request-scoped Supabase client.
- The update of the student's `photo_url` column in the database is executed by calling the `update_student_photo_path` RPC function.
- The RPC function operates as a security definer, performing the following checks:
  1. Enforces user session authentication.
  2. Enforces user authorization via `current_user_can_manage_student_photo`.
  3. Validates that the provided `new_photo_path` belongs exclusively to the target student's folder (`students/{target_student_id}/...`) to prevent pointing a student's photo URL to another student's uploaded file.
  4. Restricts modifications solely to the `photo_url` column.

## Storage policy status

Storage remains private and secure:
- Read access is allowed for any active staff member.
- Write access (insert, update, delete) is allowed only for staff members who pass the `current_user_can_manage_student_photo` helper based on matching path tokens.

## RLS / Column safety probe results

All test cases in the verification script `photo_hardening_probes.sql` passed:
1. **Case A**: Authorized photo manager can write storage objects (PASSED).
2. **Case B**: Authorized photo manager can update photo field through the approved RPC path (PASSED).
3. **Case C**: Authorized photo manager **cannot** update the student row directly (PASSED - proves the direct table policy was successfully removed).
4. **Case D**: Authorized photo manager **cannot** use the RPC path to update with a path belonging to another student (PASSED - regex check validated).
5. **Case E**: Unauthorized staff cannot update student photo or execute the RPC (PASSED).
6. **Case F**: Storage write policies still block unauthorized writes (PASSED).

## Documentation files updated

- `docs/12_CURRENT_STATE.md`
- `docs/handoff.md`
- `docs/parallel/GPT_STUDENT_PHOTO_SECURITY_HARDENING_HANDOFF.md`

## Validation results

- `supabase db reset`: Succeeded.
- `supabase gen types typescript --local`: Succeeded.
- `npm run check:no-hebrew-in-code`: Passed.
- `npm run lint`: Passed with 0 warnings/errors.
- `npm run build`: Succeeded with 0 compilation errors.
- `git diff --check`: Passed.
- Security Probes: Executed successfully with full rollback.
