# GPT Announcements Read Path + Acknowledgement V1 Handoff

## Summary

Implemented Announcements Read Path and Acknowledgement v1.

Routes:
- `/announcements` (lists RLS-visible announcements, indicating pinned and acknowledgement states)
- `/announcements/[announcementId]` (displays single announcement details, along with metadata and the acknowledgement action)

The implementation utilizes request-scoped server clients and respects database Row-Level Security (RLS) entirely, avoiding service-role client bypasses.

## Files changed/created

- `src/app/(app)/announcements/page.tsx` (lists announcements with layout details)
- `src/app/(app)/announcements/[announcementId]/page.tsx` (detail layout)
- `src/app/(app)/announcements/[announcementId]/AcknowledgeButton.tsx` (interactive confirm button component)
- `src/features/announcements/queries.ts` (announcement queries for list & detail views)
- `src/features/announcements/types.ts` (TypeScript types for the feature)
- `src/features/announcements/actions.ts` (secure Server Action to insert read confirmations)
- `src/app/(app)/dashboard/page.tsx` (modified list items to link to detail page)
- `src/i18n/en.json` & `src/i18n/he.json` (added translation strings)

## Data sources queried

- `announcements`: reads RLS-visible announcements and filters out expired ones automatically using Postgres policies.
- `announcement_reads`: queries read confirmations for target announcements relative to the active session user.
- `profiles`: retrieves author profile names via relation join `profiles:author_id(full_name)`.

## RLS/session approach

- Normal request-scoped Supabase client is initialized via `src/lib/supabase/server.ts`.
- Reads and writes check `supabase.auth.getUser()` to tie query constraints and policies to the logged-in user.
- Middleware handles redirects of anonymous requests on `/announcements` and `/announcements/[announcementId]` to `/login`.

## Server action behavior

- `acknowledgeAnnouncement(announcementId)` is a secure Server Action (`'use server'`).
- Defensive checks: It verifies that the target announcement exists, is visible under current RLS rules, and actually requires read confirmation.
- Idempotency: Uses standard Postgres `ON CONFLICT` constraints via `.upsert()` (conflict on `announcement_id,profile_id`), allowing repetitive requests without duplication or database error.
- Cache invalidation: Triggers `revalidatePath` on `/dashboard`, `/announcements`, and `/announcements/[announcementId]` to keep state synchronized instantly.

## Deferred items

- Announcement composer interface (creation, editing, targeting config).
- Notification system push trigger flows.
- Expiration scheduling adjustments.
- Bulk read reports for administrators.

## Validation results

- Database reload and schema migrations passed cleanly.
- Static type checks, eslint checks, and production Turbopack builds passed without errors.
