# GPT Student Message Soft Delete V1 Handoff

## Summary

Implemented Student Message Soft Delete v1.

Routes:
- `/students/[studentId]` (recent messages stream now includes an interactive delete button for authorized users)

## Files changed

- `src/features/students/actions.ts` (added `deleteStudentMessage` server action)
- `src/features/students/queries.ts` (updated message query to filter out soft-deleted rows and copy `author_id`)
- `src/features/students/types.ts` (added `authorId` to `StudentMessage` definition)
- `src/app/(app)/students/[studentId]/DeleteMessageButton.tsx` (created client-side confirmation and deletion button)
- `src/app/(app)/students/[studentId]/page.tsx` (mounted DeleteMessageButton next to messages)
- `src/i18n/en.json` & `src/i18n/he.json` (added translation keys)
- `docs/parallel/GPT_STUDENT_MESSAGE_SOFT_DELETE_V1_HANDOFF.md` (this handoff file)

## Database migrations

No migrations were added. The `student_messages` table already contains the required soft-delete fields:
- `deleted_at timestamptz`
- `deleted_by uuid references profiles(id)`

## Soft-delete behavior

- Standard updates setting `deleted_at = now()` and `deleted_by = auth.uid()` are routed via standard user session clients.
- Queries explicitly filter by `.is('deleted_at', null)` to prevent showing soft-deleted messages in the card.

## Permission model

- Authors are authorized to soft-delete their own messages.
- Users with the `super_admin` role are authorized to soft-delete any message.
- General staff are restricted from deleting messages written by others.

## Audit logging behavior

- Triggers `writeAuditLog` securely from the Server Action with action type `student_message.deleted` containing the before/after details.

## UI behavior

- Eligible messages display a small trash button.
- Clicking the trash button prompts the user via a standard browser confirmation dialog (`window.confirm`).
- Clicking OK starts a React transition, showing a loading indicator, invoking the server action, and refreshing the route cache.

## Deferred items

- Message editing.
- Permanent deletion.
- Realtime delete stream updates.

## Validation results

- Database schema verified.
- TypeScript, linter, and Turbopack builds compile cleanly.
