-- Drop the broad student update policy
drop policy if exists "Authorized staff can update student photos on student row" on public.students;

-- Create security definer RPC for updating student photo path
create or replace function public.update_student_photo_path(
  target_student_id uuid,
  new_photo_path text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- 1. Check authentication
  if auth.uid() is null then
    raise exception 'Not authenticated' using errcode = '42501';
  end if;

  -- 2. Verify permissions
  if not public.current_user_can_manage_student_photo(target_student_id) then
    raise exception 'Forbidden' using errcode = '42501';
  end if;

  -- 3. Validate path starts with students/{target_student_id}/ (enforcing format and path containment)
  if new_photo_path is not null and new_photo_path !~ ('^students/' || target_student_id::text || '/') then
    raise exception 'Invalid photo path format' using errcode = '22023';
  end if;

  -- 4. Update only the photo_url field
  update public.students
  set photo_url = new_photo_path,
      updated_at = now()
  where id = target_student_id;
end;
$$;

-- Grant execute permissions to authenticated role
revoke all on function public.update_student_photo_path(uuid, text) from public;
grant execute on function public.update_student_photo_path(uuid, text) to authenticated;
