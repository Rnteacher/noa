# GPT Student Photo Uploads V1 Handoff

## Files changed

- `supabase/migrations/20260708184000_student_photos.sql` (new)
- `src/features/students/types.ts`
- `src/features/students/queries.ts`
- `src/features/students/actions.ts`
- `src/app/(app)/students/[studentId]/page.tsx`
- `src/app/(app)/students/[studentId]/PhotoUploadForm.tsx` (new)
- `src/i18n/en.json`
- `src/i18n/he.json`
- `docs/12_CURRENT_STATE.md`
- `docs/handoff.md`
- `docs/parallel/GPT_STUDENT_PHOTO_UPLOADS_V1_HANDOFF.md` (new)

## Migration status

A database migration was added: `supabase/migrations/20260708184000_student_photos.sql`.

It establishes:
1. A private storage bucket `student-photos` with a 5MB size limit and allowed MIME types (`image/jpeg`, `image/png`, `image/webp`).
2. Storage policies restricting select/read access to active staff, and insert/update/delete access to users authorized by the `current_user_can_manage_student_photo` helper.
3. A table update policy on `public.students` allowing authorized users to update the student row.

## Storage bucket and policy model

- **Bucket**: `student-photos` (private, `public = false`).
- **Object Read Policy**: Available to any active staff member.
- **Object Write Policy**: Evaluates the object name path `students/{studentId}/profile.{ext}`, extracts the `studentId`, and verifies authorization using the `current_user_can_manage_student_photo` helper.

## Photo upload behavior

- `updateStudentPhoto(studentId, formData)`: requires an authenticated active staff session, checks UUID format, verifies that the target student exists and is active, validates the file input presence, validates image MIME type, enforces a 5MB file size limit, uploads the image to the private storage bucket using the request-scoped client, updates the student row `photo_url`, writes an audit log, and revalidates `/students/[studentId]`.

## Permission model

- Authorized group mentors of the student's active group, managers, and super admins can manage (upload or replace) a student's profile photo.
- Other active staff members can only view the student's photo.

## Audit logging behavior

- Modifying a student's photo writes a `student_photo.updated` audit log containing before and after `photo_url` metadata.
- It uses the privileged server-only audit logging helper.

## UI behavior

- The student card identity header displays the student's photo if present (retrieved via server-side signed URL).
- If no photo exists, the student card displays the student's initials as an avatar placeholder.
- If the current user has photo management permissions (`canManagePhoto: true`), the `<PhotoUploadForm>` component renders below the initials/photo, offering a clean, styled camera toggle button.
- Selecting an image triggers client-side size/type checks and automatically starts a transition to call the server action, rendering a loading spinner during execution and inline localized success/error messages upon completion.

## Deferred photo/media items

- Advanced image cropping and rotation tools.
- Automated image moderation and safe-search checks.
- Bulk photo import/export utilities.

## Validation results

All quality check scripts and test probes ran and passed successfully:
- `supabase db reset`: Passed and applied the new migration cleanly.
- `supabase gen types typescript --local`: Passed with updated types.
- `npm run check:no-hebrew-in-code`: Passed with no Hebrew characters found in codebase.
- `npm run lint`: Passed with 0 errors/warnings.
- `npm run build`: Production compilation and typecheck succeeded.
- `git diff --check`: Passed.
- Database Storage RLS Probes: A PL/pgSQL verification script `photo_probes.sql` validated that Mentor One (when active) can update student `photo_url` and upload to storage, general staff members are blocked from doing so, and all actions roll back cleanly.
