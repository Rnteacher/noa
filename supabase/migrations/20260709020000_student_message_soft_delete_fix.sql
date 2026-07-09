create policy "Authors can read own student messages"
  on public.student_messages for select to authenticated
  using (
    author_id = auth.uid()
    and public.current_user_is_active_staff()
  );
