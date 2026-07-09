# GPT Student Photo URL Direct-Update Hardening Handoff

This task hardens the database schema by enforcing the path format invariant for student profile photos (`photo_url`) at the database constraint level. This closes a gap where a privileged user could bypass the RPC's formatting checks and write arbitrary invalid paths.

---

## 1. Database Migration & Constraints

- **Migration**: `supabase/migrations/20260709040000_harden_student_photo_url_path.sql`
- **CHECK Constraint**: Added `students_photo_url_format_check` on the `public.students` table:
  ```sql
  alter table public.students
    add constraint students_photo_url_format_check
    check (
      photo_url is null
      or photo_url = ('students/' || id::text || '/profile.webp')
    );
  ```

---

## 2. Blocked Bypasses vs Allowed Inputs

### Blocked
- Any raw `UPDATE public.students SET photo_url = 'invalid_format'` (violates CHECK constraint).
- Any attempt to use another student's ID in the path (e.g. updating student `X` with path `students/Y/profile.webp` fails).
- Any non-webp extension or alternate file names (e.g., `profile.jpg`, `other.webp` fails).

### Allowed
- `photo_url = NULL` (default state).
- `photo_url = 'students/{studentId}/profile.webp'` (matching the optimized WebP v2 upload flow).

---

## 3. Database Validation Probes

Probes were executed via Supabase SQL Client on the local database instance:
- **Null values**: Confirmed updating `photo_url` to `NULL` succeeds.
- **Valid path format**: Confirmed updating `photo_url` to `students/55000000-0000-0000-0000-000000000001/profile.webp` on student `55000000-0000-0000-0000-000000000001` succeeds.
- **Invalid filename format**: Confirmed updating `photo_url` to `students/55000000-0000-0000-0000-000000000001/other.webp` fails with a check constraint violation.
- **Mismatching student ID**: Confirmed updating `photo_url` to `students/55000000-0000-0000-0000-000000000002/profile.webp` on student `55000000-0000-0000-0000-000000000001` fails with a check constraint violation.
- **RPC wrapper check**: The `update_student_photo_path` RPC continues to succeed with valid paths and is protected by the same CHECK constraint on invalid inputs.

---

## 4. App Regression Checks

- **Upload action**: Confirmed `updateStudentPhoto` server action continues to issue identical valid paths (`students/${studentId}/profile.webp`).
- **Storage uploads**: Content type remains `image/webp`.
- **Signed URL display**: Confirmed query loader continues to load signed URLs from `photo_url`.
- **Supabase TypeScript types**: Regenerated under `src/types/supabase.ts` and compiled without errors.

---

## 5. Browser Smoke Verification

- **Status**: Live browser smoke testing is deferred. The application code was not modified (all database interactions use identical paths), and database-level constraint checks were fully verified via direct SQL query execution.

---

## 6. Validation Results

- `npm run check:no-hebrew-in-code` — Pass
- `npm run lint` — Pass
- `npm run build` — Pass
- `git diff --check` — Pass
