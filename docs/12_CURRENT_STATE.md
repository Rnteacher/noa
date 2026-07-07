# 12 — Current State

## Project phase

Database foundation and codebase guardrails validated. Next.js application, internationalization, local Supabase, and Hebrew character enforcement scanner are fully operational and verified.

## Current stack

- Next.js App Router (v16.2.10)
- TypeScript
- Tailwind CSS
- Lucide React (for UI iconography)
- Zod (for environment validation)
- Supabase SSR (browser and server client helpers configured)
- Local Supabase (initialized & migration applied)
- Custom Hebrew Character Code Scanner (Node.js script)

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
- `src/types/` (types folder containing generated database types)
  - `src/types/supabase.ts` (Generated TypeScript types from local schema)
- `src/features/` (feature-grouped modules)
  - `dashboard/`, `students/`, `announcements/`, `calendar/`, `admin/`, `auth/`, `notifications/`
- `supabase/` (initialized configuration and migration folder)
  - `supabase/migrations/20260707111701_initial_schema_and_rls.sql`
- `scripts/`
  - `scripts/check-no-hebrew-in-code.mjs` (Enforcement scanner script)
- `.env.example` (environment variables template)

## Database foundation status

The initial Supabase migration `supabase/migrations/20260707111701_initial_schema_and_rls.sql` is verified locally.

The migration defines:
- Required extension: `pgcrypto`.
- Enums: `app_role`, `traffic_light_status`, `goal_status`, `student_message_tag`, `announcement_target_type`, `event_visibility`, `weekday`.
- Core tables: `school_years`, `profiles`, `profile_roles`, `student_groups`, `group_mentors`, `students`, `projects`, `student_masters`, `student_emotional_statuses`, `student_goals`, `student_messages`, `followed_students`, `announcements`, announcement target/read tables, `calendar_events`, `calendar_event_groups`, `learning_groups`, `learning_group_target_groups`, `push_subscriptions`, `notifications`, `webhook_endpoints`, `webhook_deliveries`, and `audit_logs`.
- Reusable `updated_at` trigger function and triggers on all tables with `updated_at`.
- Security definer permission helpers for active staff checks, role checks, mentor/master relationship checks, project/emotional/goal/photo authorization checks, announcement visibility, and calendar event visibility.
- RLS enabled on all app tables.
- Initial RLS policies for staff read access, relationship-based updates, announcement acknowledgement, calendar/learning group management, push subscriptions, notifications, webhook administration, and audit log visibility.
- Views: `current_student_project_statuses` and `latest_student_emotional_statuses`.

## Latest validation results

We ran local validations and checks on Windows 10:

1. **Supabase Local Services**: Started successfully with `supabase start`.
2. **Database Schema & Migrations**: Succeeded cleanly using `supabase db reset`, verifying SQL syntax and table generation.
3. **Database TypeScript Type Generation**: Succeeded and saved at `src/types/supabase.ts` with explicit UTF-8 encoding to prevent parser warnings.
4. **Hebrew Character Enforcement Scanner**: Added `scripts/check-no-hebrew-in-code.mjs` and configured `"check:no-hebrew-in-code"` script in `package.json`. Resolved all hardcoded Hebrew text inside `src/app/page.tsx` by migrating them into translation dictionary files. Scanner runs and passes with `exit 0` (no violations found).
5. **Code Style & Compilation Checks**:
   - `npm run lint` - Passed cleanly.
   - `npm run build` - Production bundle build with Next.js Turbopack succeeded.
   - `git diff --check` - Passed without whitespace issues.

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

Created/maintained docs for:
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
- Hand-off files and Hebrew character scanner scripts.

## Next recommended tasks

1. **Google OAuth and Protected Routes (Phase 1 task)**: Configure authentication flow restricting access to institutional domains (`GOOGLE_ALLOWED_DOMAIN`), and implement Next.js middleware for route protection based on authentication and DB profiles.
2. **Local Database Seed Setup**: Add `supabase/seed.sql` containing mock data for local development (profiles, groups, students, announcements, events) to populate the UI.
3. **Implement privileged RPC/server actions for column-sensitive mutations**: Add safe mutations for student photo updates, student message soft deletion with audit logging, and project/emotional/goal updates.
