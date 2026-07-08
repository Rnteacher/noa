-- Drop the original signature
drop function if exists public.create_student_change_notification(uuid, uuid, text, text);

-- Create the hardened signature
create or replace function public.create_student_change_notification(
  actor_id uuid,
  target_student_id uuid,
  event_type text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_student_name text;
  v_student_active boolean;
  v_title text;
  v_body text;
  v_deep_link text;
  v_authorized boolean;
begin
  -- 1. Ensure authenticated user is present
  if auth.uid() is null then
    raise exception 'Unauthorized: No active session';
  end if;

  -- 2. Enforce that actor_id matches auth.uid()
  if actor_id != auth.uid() then
    raise exception 'Unauthorized: Actor ID spoofing detected';
  end if;

  -- 3. Verify current user is active staff
  if not public.current_user_is_active_staff() then
    raise exception 'Unauthorized: Caller is not active staff';
  end if;

  -- 4. Verify target student exists and is active
  select is_active, coalesce(first_name || ' ' || last_name, 'Student')
  into v_student_active, v_student_name
  from public.students
  where id = target_student_id;

  if v_student_active is null or not v_student_active then
    raise exception 'NotFound: Student is inactive or does not exist';
  end if;

  -- 5. Validate event type against strict allowlist & perform authorization checks
  v_authorized := false;
  
  if event_type = 'student_message.created' then
    v_authorized := true; -- Active staff can create messages on active student cards
    v_title := 'New update on student card';
    v_body := 'A new message was added for ' || v_student_name || '.';
  
  elsif event_type = 'project.status_updated' then
    if public.current_user_can_update_student_project(target_student_id) then
      v_authorized := true;
    end if;
    v_title := 'Project status updated';
    v_body := 'The current project status was updated for ' || v_student_name || '.';
  
  elsif event_type = 'student_emotional_status.updated' then
    if public.current_user_can_update_student_emotional_status(target_student_id) then
      v_authorized := true;
    end if;
    v_title := 'Emotional status updated';
    v_body := 'Student emotional status was updated for ' || v_student_name || '.';
  
  elsif event_type = 'student_goal.created' then
    if public.current_user_can_update_student_goals(target_student_id) then
      v_authorized := true;
    end if;
    v_title := 'Goal created';
    v_body := 'A new goal was added for ' || v_student_name || '.';
  
  elsif event_type = 'student_goal.updated' then
    if public.current_user_can_update_student_goals(target_student_id) then
      v_authorized := true;
    end if;
    v_title := 'Goal updated';
    v_body := 'A goal status or detail was updated for ' || v_student_name || '.';
  
  elsif event_type = 'student_goal.deleted' then
    if public.current_user_is_manager_or_super_admin() then
      v_authorized := true;
    end if;
    v_title := 'Goal deleted';
    v_body := 'A goal was deleted for ' || v_student_name || '.';
  
  elsif event_type = 'student_photo.updated' then
    if public.current_user_can_manage_student_photo(target_student_id) then
      v_authorized := true;
    end if;
    v_title := 'Photo updated';
    v_body := 'The profile photo was updated for ' || v_student_name || '.';
  
  else
    raise exception 'InvalidEvent: Unsupported event type %', event_type;
  end if;

  if not v_authorized then
    raise exception 'Unauthorized: Caller lacks permissions for event type %', event_type;
  end if;

  v_deep_link := '/students/' || target_student_id::text;

  -- 6. Insert notifications for active followers (excluding actor, excluding muted)
  insert into public.notifications (profile_id, type, title, body, deep_link)
  select fs.profile_id, event_type, v_title, v_body, v_deep_link
  from public.followed_students fs
  join public.profiles p on p.id = fs.profile_id
  where fs.student_id = target_student_id
    and fs.notification_level != 'muted'
    and fs.profile_id != actor_id
    and p.is_active = true;
end;
$$;

-- Grant execute rights to authenticated users
grant execute on function public.create_student_change_notification(uuid, uuid, text) to authenticated;
