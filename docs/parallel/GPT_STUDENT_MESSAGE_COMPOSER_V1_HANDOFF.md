# GPT Student Card Message Composer V1 Handoff

## Summary

Implemented Student Card Message Composer v1.

Routes:
- `/students/[studentId]` (now contains the message composer next to the read-only messages block)

The implementation utilizes request-scoped server clients and respects database Row-Level Security (RLS) entirely, avoiding service-role client bypasses.

## Files changed/created

- `src/features/students/actions.ts` (created server action to insert new student messages and write audit log)
- `src/app/(app)/students/[studentId]/MessageComposer.tsx` (created client-side form composer component)
- `src/app/(app)/students/[studentId]/page.tsx` (mounted MessageComposer component on page)
- `src/i18n/en.json` & `src/i18n/he.json` (added translation keys)
- `docs/parallel/GPT_STUDENT_MESSAGE_COMPOSER_V1_HANDOFF.md` (this handoff file)

## Server action behavior

- `createStudentMessage(studentId, body, tag, isImportant)`:
  - Trim input body and validate length (max 2000 characters).
  - Verify target student exists and is active/visible to user.
  - Insert new message row via request-scoped server client (RLS check matches active staff authorization).
  - Triggers `writeAuditLog` for action `student_message.created` with new row details.
  - Revalidate paths: `/students/[studentId]`.

## RLS/session approach

- Normal request-scoped Supabase client is initialized via `src/lib/supabase/server.ts`.
- Reads and writes check `supabase.auth.getUser()` to tie query constraints and policies to the logged-in user.
- Middleware handles redirects of anonymous requests on `/students/[studentId]` to `/login`.

## Composer UI behavior

- Contains input textarea for body, selection box for tag (mapped to allowed schema values), and checkbox toggle for `isImportant`.
- Handled via `useTransition` to prevent double submission and show a loading spinner on the submit button.
- Handles server actions errors gracefully.

## Audit logging behavior

- Triggers `writeAuditLog` securely from server code with action type `student_message.created` using privileged service role helper.

## Deferred items

- Message editing or deletion.
- Realtime page updates.
- Student goal or status mutations.
- Push/notification triggers.

## Validation results

- Database reset and migrations verified.
- TypeScript, linter, and Turbopack builds passed cleanly.
