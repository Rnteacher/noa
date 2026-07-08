# GPT Students Read-only V1 Handoff

## Summary

Implemented Student Search and read-only Student Card v1.

Routes:

- `/students`
- `/students/[studentId]`

The implementation uses the normal server Supabase client from `src/lib/supabase/server.ts`. It does not use a service-role client and does not perform mutations.

## Files changed

- `src/app/(app)/students/page.tsx`
- `src/app/(app)/students/[studentId]/page.tsx`
- `src/features/students/queries.ts`
- `src/features/students/types.ts`
- `src/i18n/en.json`
- `src/i18n/he.json`
- `docs/parallel/GPT_STUDENTS_READONLY_V1_HANDOFF.md`

## Search behavior

- Reads `q` from URL search params.
- Uses a simple GET form with `name="q"`.
- Searches active students by first name or last name.
- Shows a compact list with student name, group, and current project title/status when available.
- Links each result to `/students/[studentId]`.

## Student card sections

- Identity and group.
- Follow state, read-only.
- Mentors.
- Contact information.
- Current project and masters.
- Emotional status color/state and timestamp.
- Goals.
- Recent active messages.
- Read-only notice.

Emotional status notes are intentionally hidden in this version because the design docs treat notes as sensitive and the current v1 card does not implement a separate notes authorization surface.

## RLS and auth

- Queries require an authenticated active staff user.
- Reads go through the normal server Supabase client, so current RLS policies apply.
- No service-role client was introduced.
- No writes or server actions were added.

## Route smoke checks

Unauthenticated requests were checked locally:

- `GET /students` returned `307` to `/login`.
- `GET /students/10000000-0000-4000-8000-000000000001` returned `307` to `/login`.

Authenticated UI smoke testing was not completed because local Google OAuth is not available in this environment and mock-user password sign-in has not been validated.

## Validation

- `supabase db reset` passed; it loaded `supabase/seeds/dev_seed.sql` automatically.
- `npm run check:no-hebrew-in-code` passed.
- `npm run lint` passed.
- `npm run build` passed.
- `git diff --check` passed with line-ending warnings only.

## Remaining risks

- The search is intentionally simple and does not yet support full-name token matching.
- Client-side authenticated route review remains pending until a local sign-in path is available.
- Follow controls and edit/update flows are deferred.
