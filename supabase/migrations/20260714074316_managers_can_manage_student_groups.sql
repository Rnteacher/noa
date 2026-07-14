-- Managers currently cannot manage student_groups/group_mentors: the write
-- policies on these two tables were left at super_admin-only while the
-- equivalent calendar_events/calendar_event_groups policies already allow
-- managers. The Noa Annual Gantt Pilot v1 admin/groups surface needs
-- managers to create/edit/archive groups and assign mentors, so align these
-- two tables with the existing calendar_events manager policy pattern.
--
-- Rollback: recreate both policies with current_user_is_super_admin()
-- in place of current_user_is_manager_or_super_admin().

drop policy if exists "Super admins can manage student groups" on public.student_groups;

create policy "Managers and super admins can manage student groups"
  on public.student_groups for all to authenticated
  using (public.current_user_is_manager_or_super_admin())
  with check (public.current_user_is_manager_or_super_admin());

drop policy if exists "Super admins can manage group mentors" on public.group_mentors;

create policy "Managers and super admins can manage group mentors"
  on public.group_mentors for all to authenticated
  using (public.current_user_is_manager_or_super_admin())
  with check (public.current_user_is_manager_or_super_admin());
