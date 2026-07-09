-- Hardens students.photo_url path verification
alter table public.students
  add constraint students_photo_url_format_check
  check (
    photo_url is null
    or photo_url = ('students/' || id::text || '/profile.webp')
  );
