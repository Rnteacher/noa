-- Enforce at most one primary, non-archived goal per student per school year.
create unique index student_goals_one_primary_active_idx
  on public.student_goals (student_id, school_year_id)
  where is_primary = true and status <> 'archived'::public.goal_status;

-- Atomically promote one goal to primary for its student/school year, clearing
-- any other non-archived primary goal for that same scope in the same transaction.
create or replace function public.set_primary_student_goal(
  target_student_id uuid,
  target_goal_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_goal_student_id uuid;
  v_school_year_id uuid;
  v_goal_status public.goal_status;
begin
  if auth.uid() is null then
    raise exception 'Unauthorized: No active session';
  end if;

  if not public.current_user_is_active_staff() then
    raise exception 'Unauthorized: Caller is not active staff';
  end if;

  if not exists (
    select 1 from public.students
    where id = target_student_id and is_active = true
  ) then
    raise exception 'NotFound: Student is inactive or does not exist';
  end if;

  select student_id, school_year_id, status
  into v_goal_student_id, v_school_year_id, v_goal_status
  from public.student_goals
  where id = target_goal_id;

  if v_goal_student_id is null then
    raise exception 'NotFound: Goal does not exist';
  end if;

  if v_goal_student_id != target_student_id then
    raise exception 'Invalid: Goal does not belong to the target student';
  end if;

  if v_goal_status = 'archived'::public.goal_status then
    raise exception 'Invalid: Cannot set an archived goal as primary';
  end if;

  if not public.current_user_can_update_student_goals(target_student_id) then
    raise exception 'Unauthorized: Caller cannot manage goals for this student';
  end if;

  update public.student_goals
  set is_primary = false,
      updated_by = auth.uid()
  where student_id = target_student_id
    and school_year_id = v_school_year_id
    and status <> 'archived'::public.goal_status
    and is_primary = true
    and id != target_goal_id;

  update public.student_goals
  set is_primary = true,
      updated_by = auth.uid()
  where id = target_goal_id;
end;
$$;

grant execute on function public.set_primary_student_goal(uuid, uuid) to authenticated;
