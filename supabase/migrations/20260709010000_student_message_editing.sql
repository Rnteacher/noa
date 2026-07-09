-- The existing "Authors and super admins can soft delete student messages" policy's
-- WITH CHECK requires deleted_at is not null, so it only ever permits soft-deletion.
-- Add a second, additive permissive UPDATE policy scoped to editing an active message
-- in place (deleted_at stays null). Postgres combines multiple permissive policies for
-- the same command with OR on both USING and WITH CHECK, so this purely adds the
-- editing case without weakening the existing soft-delete policy.
create policy "Authors and super admins can edit student messages"
  on public.student_messages for update to authenticated
  using (
    deleted_at is null
    and (
      public.current_user_is_super_admin()
      or author_id = auth.uid()
    )
  )
  with check (
    deleted_at is null
    and (
      public.current_user_is_super_admin()
      or author_id = auth.uid()
    )
  );
