# GPT Dashboard V1 Handoff

## Files Changed

- `src/app/(app)/dashboard/page.tsx`
- `src/features/dashboard/queries.ts`
- `src/features/dashboard/types.ts`
- `src/i18n/en.json`
- `src/i18n/he.json`
- `docs/parallel/GPT_DASHBOARD_V1_HANDOFF.md`

## Data Sources Queried

Dashboard v1 reads through the normal request-scoped Supabase server client:

- `profiles`: current active staff profile.
- `announcements`: recent RLS-visible announcements.
- `announcement_reads`: current user's read acknowledgements.
- `calendar_events`: RLS-visible events for today and the next 7 days.
- `followed_students`: current user's followed-student count.
- `current_user_is_super_admin`: controls the existing access-grants shortcut.

## RLS And Session Approach

- Uses `createClient()` from `src/lib/supabase/server.ts`.
- Does not use the service-role client.
- Calls `supabase.auth.getUser()` to anchor dashboard reads to the current authenticated session.
- Queries are intentionally run through normal Supabase table/RPC APIs so existing RLS policies filter announcement and calendar visibility.
- If no session or active profile is available, the page renders a safe inline alert instead of throwing.

## Sections Implemented

- Required acknowledgements: RLS-visible acknowledgement-required announcements that the current user has not read yet.
- Announcements: compact recent announcement list.
- Today at Chamama: RLS-visible calendar events overlapping the current local day.
- This week: RLS-visible calendar events starting in the next 7 days.
- My followed students: count-only v1 summary linking to the students tab.
- Existing super-admin access-grants shortcut remains available for super admins.

## Deferred Dashboard Items

- Announcement detail and acknowledgement mutation flow.
- Full announcements module.
- Calendar event detail/editing.
- Student search and student cards.
- Followed-student change feed.
- Bottom navigation badges.
- Client password sign-in validation for seeded mock auth users.

## Manual Check

`supabase db reset` loaded the seed automatically and the dashboard builds.

Local route check:

- Started the Next.js dev server.
- Requested `/dashboard` without a session.
- Confirmed the protected route redirects to `/login`.

An authenticated browser smoke test was not completed because local Google OAuth credentials were not available in this task, and seeded mock password sign-in failed against the local Supabase Auth API. This keeps the previously documented risk unchanged.

## Validation Results

- `supabase db reset`: passed and loaded `supabase/seeds/dev_seed.sql`.
- `npm run check:no-hebrew-in-code`: passed.
- `npm run lint`: passed.
- `npm run build`: passed.
- `git diff --check`: passed.
