create or replace function public.create_student_change_notification(
  actor_id uuid,
  target_student_id uuid,
  event_type text,
  custom_body text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_student_name text;
  v_title text;
  v_body text;
  v_deep_link text;
begin
  -- Get student full name
  select coalesce(first_name || ' ' || last_name, 'Student')
  into v_student_name
  from public.students
  where id = target_student_id;

  v_deep_link := '/students/' || target_student_id::text;

  -- Formulate notification title and body based on event type
  if event_type = 'student_message.created' then
    v_title := 'New update on student card';
    v_body := 'A new message was added for ' || v_student_name || '.';
  elsif event_type = 'project.status_updated' then
    v_title := 'Project status updated';
    v_body := 'The current project status was updated for ' || v_student_name || '.';
  elsif event_type = 'student_emotional_status.updated' then
    v_title := 'Emotional status updated';
    v_body := 'Student emotional status was updated for ' || v_student_name || '.';
  elsif event_type = 'student_goal.created' then
    v_title := 'Goal created';
    v_body := 'A new goal was added for ' || v_student_name || '.';
  elsif event_type = 'student_goal.updated' then
    v_title := 'Goal updated';
    v_body := 'A goal status or detail was updated for ' || v_student_name || '.';
  elsif event_type = 'student_goal.deleted' then
    v_title := 'Goal deleted';
    v_body := 'A goal was deleted for ' || v_student_name || '.';
  elsif event_type = 'student_photo.updated' then
    v_title := 'Photo updated';
    v_body := 'The profile photo was updated for ' || v_student_name || '.';
  else
    v_title := 'Student card update';
    v_body := 'A change was made on ' || v_student_name || 's card.';
  end if;

  -- If custom_body is provided, override body
  if custom_body is not null then
    v_body := custom_body;
  end if;

  -- Insert notifications for active followers
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

-- Grant execute access on this helper to authenticated users
grant execute on function public.create_student_change_notification(uuid, uuid, text, text) to authenticated;
