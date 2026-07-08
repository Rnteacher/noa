-- Create student-photos private storage bucket
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'student-photos',
  'student-photos',
  false,
  5242880, -- 5MB limit
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = false,
  file_size_limit = 5242880,
  allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

-- Storage policies for student-photos bucket
create policy "Active staff can read student photos"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'student-photos'
    and public.current_user_is_active_staff()
  );

create policy "Authorized staff can insert student photos"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'student-photos'
    and (regexp_split_to_array(name, '/'))[1] = 'students'
    and public.current_user_can_manage_student_photo(
      (regexp_split_to_array(name, '/'))[2]::uuid
    )
  );

create policy "Authorized staff can update student photos"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'student-photos'
    and (regexp_split_to_array(name, '/'))[1] = 'students'
    and public.current_user_can_manage_student_photo(
      (regexp_split_to_array(name, '/'))[2]::uuid
    )
  )
  with check (
    bucket_id = 'student-photos'
    and (regexp_split_to_array(name, '/'))[1] = 'students'
    and public.current_user_can_manage_student_photo(
      (regexp_split_to_array(name, '/'))[2]::uuid
    )
  );

create policy "Authorized staff can delete student photos"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'student-photos'
    and (regexp_split_to_array(name, '/'))[1] = 'students'
    and public.current_user_can_manage_student_photo(
      (regexp_split_to_array(name, '/'))[2]::uuid
    )
  );

-- Update policy on public.students to allow authorized staff to update student photo_url
create policy "Authorized staff can update student photos on student row"
  on public.students for update to authenticated
  using (public.current_user_can_manage_student_photo(id))
  with check (public.current_user_can_manage_student_photo(id));
