# Student Message Soft-Delete RLS Fix Handoff

## Root Cause Analysis

In the initial RLS schema, the select policy for student messages restricted visibility to active non-deleted messages (`deleted_at is null` for normal staff members):
```sql
create policy "Active staff can read active student messages"
  on public.student_messages for select to authenticated
  using (
    public.current_user_is_active_staff()
    and deleted_at is null
  );
```
During a soft-delete update, the server action changes `deleted_at` to the current timestamp. Because PostgreSQL checks the post-image row of an `UPDATE` statement to ensure it remains select-visible under an applicable SELECT policy, the update failed under RLS for normal staff authors (whereas it succeeded for super admins, whose SELECT policy has no `deleted_at` constraint).

## Safe RLS Fix

Added migration `20260709020000_student_message_soft_delete_fix.sql` defining an additive SELECT policy:
```sql
create policy "Authors can read own student messages"
  on public.student_messages for select to authenticated
  using (
    author_id = auth.uid()
    and public.current_user_is_active_staff()
  );
```
Since Postgres combines multiple select policies for the same command with an OR condition, this additive policy allows authors to read their own messages even after soft deletion, fulfilling Postgres' post-update visibility check without exposing deleted messages to unrelated staff or modifying update/edit policies.

## Files Changed

- `supabase/migrations/20260709020000_student_message_soft_delete_fix.sql` (new)
- `docs/12_CURRENT_STATE.md`
- `docs/handoff.md`
- `docs/parallel/GPT_STUDENT_MESSAGE_SOFT_DELETE_RLS_FIX_HANDOFF.md` (new)

## Verification & Probe Results

- `npm run check:no-hebrew-in-code`: Passed.
- `npm run lint` & `npm run build`: Succeeded.
- `git diff --check`: Clean (no trailing whitespace).
- **SQL Rollback Probes**: Executed successfully against local Postgres:
  1. Verified message author can successfully soft-delete their own active message.
  2. Verified unrelated staff are blocked from soft-deleting other users' messages (0 rows updated).
  3. Verified super admins can soft-delete any message.
  4. Verified unrelated staff cannot read deleted messages.
  5. Verified authors can read their own deleted messages.
  6. Verified active messages remain visible to active staff, while deleted messages are filtered out of general queries.
