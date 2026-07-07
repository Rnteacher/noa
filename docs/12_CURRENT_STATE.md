# 12 — Current State

## Project phase

Project scaffold initialized. Next.js application structure, internationalization, and local Supabase integration patterns are configured.

## Current stack

- Next.js App Router (v16.2.10)
- TypeScript
- Tailwind CSS
- Lucide React (for UI iconography)
- Zod (for environment validation)
- Supabase SSR (browser and server client helpers configured)
- Local Supabase (initialized)

## Scaffold structure created

- `src/app/` (with root layout, page routing, and RTL configuration)
- `src/components/` (empty placeholder for UI elements)
- `src/lib/` (general utilities)
  - `src/lib/env.ts` (Zod environment variable schema validation)
  - `src/lib/i18n.ts` (Lightweight translation helper)
  - `src/lib/supabase/`
    - `src/lib/supabase/client.ts` (Supabase client-side browser helper)
    - `src/lib/supabase/server.ts` (Supabase server-side helper using async cookies)
- `src/i18n/`
  - `src/i18n/he.json` (Hebrew UI resource file, no Hebrew code strings exist in JS/JSX)
  - `src/i18n/en.json` (English translation reference and fallbacks)
- `src/types/` (empty placeholder for database/domain types)
- `src/features/` (feature-grouped modules)
  - `dashboard/`, `students/`, `announcements/`, `calendar/`, `admin/`, `auth/`, `notifications/`
- `supabase/` (initialized configuration folder)
- `.env.example` (environment variables template)

## Commands run

1. `npx -y create-next-app@latest temp-app --ts --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm --yes` (Scaffolding Next.js in temp folder)
2. Files moved and merged to the root directory, followed by cleanup of `temp-app`.
3. `npm install @supabase/supabase-js @supabase/ssr zod lucide-react` (Dependency additions)
4. `supabase init` (Supabase local folder setup)
5. `npm run lint` (Lint verification - passed clean)
6. `npm run build` (Next.js production build compilation - compiled successfully with Turbopack)

## Current product decisions

- Staff-only app.
- Mobile-first staff experience.
- Desktop-first admin experience.
- Google institutional sign-in.
- All staff can view all student cards.
- All staff can add messages to student cards.
- Users can delete their own messages.
- Super admins can delete any message.
- Students belong to groups.
- Each group has two mentors.
- Mentor permissions derive from active group assignment.
- Students can have multiple masters in exceptional cases.
- One current project per student for now.
- Goals are staff-visible only for now.
- Future goal sync with student app should be possible.
- App is source of truth for calendar events.
- Google Calendar is outbound sync only.
- Announcements can require read acknowledgement.
- Daily reminders are required.
- No draft mode in first version.
- Permissions by role and group/layer are required.
- Future archive by school year is required.
- Only managers and super admins can export.

## Current documentation status

Created initial docs for:

- Product requirements.
- Architecture.
- Data model draft.
- RBAC.
- AI collaboration protocol.
- Implementation backlog.
- Local Supabase workflow.
- i18n/language rules.
- API/webhooks.
- Security/privacy/audit.
- Decision log.

## Database foundation status

Created the initial Supabase migration:

- `supabase/migrations/20260707111701_initial_schema_and_rls.sql`

The migration defines:

- Required extension: `pgcrypto`.
- Enums: `app_role`, `traffic_light_status`, `goal_status`, `student_message_tag`, `announcement_target_type`, `event_visibility`, `weekday`.
- Core tables: `school_years`, `profiles`, `profile_roles`, `student_groups`, `group_mentors`, `students`, `projects`, `student_masters`, `student_emotional_statuses`, `student_goals`, `student_messages`, `followed_students`, `announcements`, announcement target/read tables, `calendar_events`, `calendar_event_groups`, `learning_groups`, `learning_group_target_groups`, `push_subscriptions`, `notifications`, `webhook_endpoints`, `webhook_deliveries`, and `audit_logs`.
- Reusable `updated_at` trigger function and triggers on all tables with `updated_at`.
- Security definer permission helpers for active staff checks, role checks, mentor/master relationship checks, project/emotional/goal/photo authorization checks, announcement visibility, and calendar event visibility.
- RLS enabled on all app tables.
- Initial RLS policies for staff read access, relationship-based updates, announcement acknowledgement, calendar/learning group management, push subscriptions, notifications, webhook administration, and audit log visibility.
- Views: `current_student_project_statuses` and `latest_student_emotional_statuses`.

RLS is implemented as an initial database-level foundation. Some column-sensitive mutations, especially student photo updates and student message soft deletion, still need server actions or RPC functions so the app can constrain exactly which columns may change and write audit records in the same transaction.

## Latest commands run

```bash
supabase db reset
npm run lint
npm run build
supabase gen types typescript --local > src/types/supabase.ts
git diff --check
```

Results:

- `supabase db reset` did not run because local Supabase is not running: `supabase start is not running.`
- `npm run lint` passed.
- `npm run build` passed.
- Type generation did not run because local Supabase is not running: `supabase start is not running.`
- `git diff --check` passed.

## Commands still needed

After starting local Supabase, run:

```bash
supabase start
supabase db reset
supabase gen types typescript --local > src/types/supabase.ts
npm run lint
npm run build
```

## Next recommended tasks

1. **Run and review the initial Supabase migration locally**: Start Supabase, run `supabase db reset`, inspect the generated schema and RLS policies, and generate TypeScript database types.
2. **Implement privileged RPC/server actions for column-sensitive mutations**: Add safe mutations for student photo updates, student message soft deletion with audit logging, and project/emotional/goal updates.
3. **Implement Google OAuth and Protected Routes (Phase 1 task)**: Configure authentication flow restricting access to institutional domains (`GOOGLE_ALLOWED_DOMAIN`).
4. **Automated Hebrew Character Code Scanner**: Implement a script (e.g., `pnpm check:no-hebrew-in-code`) to scan all TS/JS/JSX files and fail if Hebrew characters appear outside of the allowed translation paths.
