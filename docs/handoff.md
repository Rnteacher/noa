# Handoff — Documentation Sync after Student Message Soft Delete v1

## Summary

Synchronized the central documentation after implementing Student Message Soft Delete v1, which allows authenticated active staff members to soft delete their own updates, and super admins to soft delete any update on a student's card.

## Current implemented foundation

- **Local Seed is Active**: The database is fully populated with mock English-only records for all entities.
- **Google OAuth / Access Grants Foundation**: Secure route protection, OAuth redirection, and whitelisted activation mechanics are verified.
- **UI Base Components, Design Tokens, and App Shell**: Core components (Card, ListRow, StatusBadge, EmptyState, Skeleton, Alert, BottomNav, AppHeader) and semantic CSS design tokens exist. The protected app shell layout (`src/app/(app)/layout.tsx`) hosts the persistent `BottomNav`.
- **Dashboard v1 Integration**: `/dashboard` displays live data including required acknowledgements, recent announcements, events for today/this week, and followed student counts. It queries Supabase via request-scoped server clients under the RLS model.
- **Student Search & Detailed Student Card**: `/students` supports search by first/last name, listing active students with their group and project details. `/students/[studentId]` renders a detailed card showing identity, mentors/masters, contacts, current project, emotional status, goals, and recent messages list.
- **Student Card Message Composer v1**: `/students/[studentId]` mounts an interactive `<MessageComposer>` component allowing authenticated active staff to add new messages/updates. Message insertion is governed by RLS (avoiding service-role client) and triggers a secure audit log write (`student_message.created`).
- **Student Message Soft Delete v1**: Active staff can soft-delete their own messages, and super admins can soft-delete any message. Triggers a secure audit log write (`student_message.deleted`). Soft-deleted messages are hidden from the recent message stream.
- **Announcements Read Path & Acknowledgement v1**: `/announcements` displays active, RLS-targeted announcements. `/announcements/[announcementId]` displays metadata and the full announcement body, and provides an interactive confirmation button for acknowledgement-required posts. All operations respect RLS policies and use Server Actions for writes.

## Files changed

- `docs/12_CURRENT_STATE.md`: Registered student message deletion client component, registered `GPT_STUDENT_MESSAGE_SOFT_DELETE_V1_HANDOFF.md`, updated the Student card status section, and updated the recommended tasks list.
- `docs/handoff.md`: Replaced with this updated handoff summary.

## Decisions made

- No database migrations or seed files were changed. The existing `deleted_at` and `deleted_by` columns on the `student_messages` table were used.
- Standard request-scoped client calls with RLS security are used for soft deletes.
- Message editing and permanent message deletion remain deferred.
- The audit log write runs securely in the Server Action using the privileged helper.

## Tests/checks run

```bash
supabase db reset
supabase gen types typescript --local
npm run check:no-hebrew-in-code
npm run lint
npm run build
git diff --check
```

Result:

- `supabase db reset`: Passed and automatically loaded `supabase/seeds/dev_seed.sql`.
- `supabase gen types typescript --local`: Executed to synchronize schema type bindings.
- `check:no-hebrew-in-code`: Passed.
- `npm run lint`: Passed.
- `npm run build`: Passed.
- `git diff --check`: Passed.

## Next recommended tasks

- **Authenticated browser smoke test for dashboard/students/announcements/messages**: Configure Google OAuth credentials or establish a local test session, sign in, and verify live RLS-restricted dashboard widgets, student searches, announcement acknowledgements, student card message posting, and soft deletion workflows.
- **Student goals/status mutation flows**: Implement editing and creation flows for student goals, project status, and emotional status from the student card interface.
- **Student photo uploads**: Add mutations and storage triggers to manage student photos.
- **Admin-specific layout shell**: Implement a desktop-first sidebar layout for administration routes (e.g., access grants) to separate them from the mobile-first staff layout shell.
