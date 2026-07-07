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

## Next recommended tasks

1. **Initial Supabase Schema & RLS Migrations (Recommended next GPT task)**: Create the first migration file defining the database schema, enum values, tables (school_years, profiles, student_groups, students, etc.) and Row Level Security (RLS) policies.
2. **Implement Google OAuth and Protected Routes (Phase 1 task)**: Configure authentication flow restricting access to institutional domains (`GOOGLE_ALLOWED_DOMAIN`).
3. **Automated Hebrew Character Code Scanner**: Implement a script (e.g., `pnpm check:no-hebrew-in-code`) to scan all TS/JS/JSX files and fail if Hebrew characters appear outside of the allowed translation paths.
