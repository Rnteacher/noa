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
  - `src/app/(app)/dev/ui/page.tsx` (protected base UI component showcase route)
- `src/components/` (UI elements and layouts)
  - `src/components/ui/` (base components: `Card`, `ListRow`, `StatusBadge`, `EmptyState`, `Skeleton`, `Alert`, `BottomNav`, `AppHeader`)
- `src/lib/` (general utilities)
  - `src/lib/cn.ts` (Tailwind class-joining utility helper)
  - `src/lib/env.ts` (Zod environment variable schema validation)
  - `src/lib/env.server.ts` (Server-only environment helper for privileged values)
  - `src/lib/auth/` (Authentication, access, profile sync, and service-role utilities)
  - `src/lib/admin/access-grants.ts` (Server actions for super-admin staff access grant management)
  - `src/lib/audit/log.ts` (Server-only audit log writer)
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
  - `supabase/migrations/20260707115303_staff_access_grants.sql`
  - `supabase/seeds/dev_seed.sql` (reviewed local development seed; enabled for local `supabase db reset`)
- `scripts/`
  - `scripts/check-no-hebrew-in-code.mjs` (Enforcement scanner script)
- `.env.example` (environment variables template)
  - Includes `BOOTSTRAP_SUPER_ADMIN_EMAILS` for first-run admin bootstrap.
- `docs/design/` (UX design foundation)
  - `docs/design/01_PRODUCT_UX_OVERVIEW.md`
  - `docs/design/02_MOBILE_STAFF_APP_WIREFRAMES.md`
  - `docs/design/03_STUDENT_CARD_UX.md`
  - `docs/design/04_ADMIN_DESKTOP_UX.md`
  - `docs/design/05_VISUAL_SYSTEM_DIRECTION.md`
- `docs/parallel/`
  - `docs/parallel/CLAUDE_BASE_COMPONENTS_HANDOFF.md`
  - `docs/parallel/CLAUDE_UI_FOUNDATION_HANDOFF.md`
  - `docs/parallel/GEMINI_DEV_SEED_HANDOFF.md`
  - `docs/parallel/GPT_DEV_SEED_REVIEW_HANDOFF.md`
  - `docs/parallel/GPT_SEED_ACTIVATION_HANDOFF.md`

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

The second migration `supabase/migrations/20260707115303_staff_access_grants.sql` is verified locally.

It defines:

- `staff_access_grants`: pre-approved staff email grants.
- `staff_access_grant_roles`: roles attached to each grant.
- RLS policies allowing only super admins to manage grants.
- Authenticated grants matching the existing RLS approach.

## Auth and access-control status

Google OAuth, protected app routes, and first-run access control are implemented.

Files created or changed:

- `src/proxy.ts`: Next.js 16 Proxy route protection.
- `src/app/(public)/login/page.tsx`: Google sign-in page.
- `src/app/(public)/access-denied/page.tsx`: Wrong-domain or invalid-auth page.
- `src/app/(public)/access-pending/page.tsx`: Valid-domain inactive profile page.
- `src/app/auth/callback/route.ts`: Supabase OAuth callback, domain validation, profile sync, and access redirects.
- `src/app/auth/sign-out/route.ts`: Sign-out route.
- `src/app/(app)/dashboard/page.tsx`: Protected dashboard shell moved from `/`.
- `src/app/page.tsx`: Root redirect based on auth/access state.
- `src/lib/auth/access.ts`: Email normalization and domain checks.
- `src/lib/auth/admin.ts`: Server-only service-role Supabase client.
- `src/lib/auth/profile.ts`: OAuth profile sync, access grants, role assignment, and bootstrap flow.
- `src/lib/auth/session.ts`: Current server-side access state helper.

Access model:

- Google OAuth is required.
- `GOOGLE_ALLOWED_DOMAIN` is enforced on callback and protected routing.
- Valid-domain users without activation get inactive profiles and no roles.
- Active staff access requires `profiles.is_active = true` and at least one `profile_roles` row.
- Active `staff_access_grants` can activate first OAuth login and copy grant roles into `profile_roles`.
- `BOOTSTRAP_SUPER_ADMIN_EMAILS` can activate allowed-domain first-run users with `super_admin` and `manager` roles.
- Wrong-domain users are signed out during callback and redirected to access denied.
- Protected routes use `src/proxy.ts`, matching the current Next.js 16 convention.

## Staff access grant management status

The first super-admin-only access grant management surface is implemented at:

- `/admin/access-grants`

Implemented files:

- `src/app/(app)/admin/access-grants/page.tsx`: Server-rendered grant list, create form, and edit forms.
- `src/lib/admin/access-grants.ts`: Server actions for grant create/update, role replacement, active toggles, and audit logging.
- `src/lib/audit/log.ts`: Privileged audit log helper using the server-only service-role client.
- `src/lib/auth/roles.ts`: Shared typed app role list for forms.
- `src/app/(app)/dashboard/page.tsx`: Adds a minimal super-admin-only link to grant management.

Access enforcement:

- `src/proxy.ts` requires an authenticated active staff session for `/admin/access-grants`.
- The page checks `current_user_is_super_admin` before rendering grant data.
- Each server action repeats the super-admin check before performing mutations.
- Mutations use the server-only service-role client; the service-role key is not exposed to client code.
- Direct table access still goes through existing RLS, where only super admins can manage grant tables.

Audit logging:

- Grant actions write to `audit_logs` through a privileged server-only helper.
- Audited actions include `staff_access_grant.created`, `staff_access_grant.updated`, `staff_access_grant.roles_updated`, `staff_access_grant.deactivated`, and `staff_access_grant.activated`.

## UI foundation status

Base UI components and semantic design tokens are implemented.

Status:
- Semantic design tokens were added in `src/app/globals.css` using Tailwind v4 CSS-based token configuration.
- Base UI components were added under `src/components/ui/`: `Card`, `ListRow`, `StatusBadge`, `EmptyState`, `Skeleton`, `Alert`, `BottomNav`, and `AppHeader`.
- The Toast system was deferred; the inline `Alert` component was implemented instead for early feedback messaging.
- An internal component showcase route exists at `/dev/ui` (accessible under the protected app route group).
- `BottomNav` matches the five conceptual navigation slots: Dashboard (`/dashboard`), Today (`/today`), Students (`/students`), Announcements (`/announcements`), and More (`/more`).
- `StatusBadge` uses both a unique glyph shape (e.g., circle-check, triangle, octagon) and text labels, ensuring color is never used as the sole conveyor of status information.

## UX design foundation status

Parallel Claude design planning added documentation under `docs/design/`.

The design package covers:

- Product UX overview and main flows.
- Mobile staff app wireframes.
- Student card UX.
- Desktop admin UX.
- Visual system direction.

The parallel handoff is stored at `docs/parallel/CLAUDE_UI_FOUNDATION_HANDOFF.md`.

These files are documentation-only and did not change application code, migrations, or i18n files.

## Development seed status

A reviewed local development seed exists at:

- `supabase/seeds/dev_seed.sql`

The parallel Gemini, review, and activation handoffs are stored at:

- `docs/parallel/GEMINI_DEV_SEED_HANDOFF.md`
- `docs/parallel/GPT_DEV_SEED_REVIEW_HANDOFF.md`
- `docs/parallel/GPT_SEED_ACTIVATION_HANDOFF.md`

The seed is now enabled in `supabase/config.toml` under `[db.seed]`:

```toml
sql_paths = ["./seeds/dev_seed.sql"]
```

Local `supabase db reset` now automatically loads `supabase/seeds/dev_seed.sql` after migrations.

Status:
- `supabase/seeds/dev_seed.sql` was reviewed and fixed.
- Manual execution of the seed file after `supabase db reset` passed successfully.
- Automatic loading via `supabase db reset` passed successfully.
- Direct `auth.users` inserts are compatible with the current local Supabase Auth schema for local development/profile FK seeding.
- Client password sign-in for mock auth users has not been validated/tested.

## Latest seed activation validation results

Commands run:

```bash
supabase db reset
npm run check:no-hebrew-in-code
npm run lint
npm run build
git diff --check
```

Results:

- `supabase db reset` passed and automatically loaded `supabase/seeds/dev_seed.sql`.
- Spot-check SQL after reset confirmed `profiles` 8, `profile_roles` 15, `students` 6, `student_groups` 2, `projects` 6, `announcements` 2, `calendar_events` 2, `staff_access_grants` 8, and `audit_logs` 0.
- `npm run check:no-hebrew-in-code` passed.
- `npm run lint` passed.
- `npm run build` passed.
- `git diff --check` passed.

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

## Latest auth task validation results

Commands run:

```bash
supabase db reset
supabase gen types typescript --local | Out-File -Encoding utf8 src/types/supabase.ts
npm run check:no-hebrew-in-code
npm run lint
npm run build
git diff --check
```

Results:

- `supabase db reset` passed and applied both migrations. Supabase warned that `supabase/seed.sql` does not exist.
- Type generation passed and updated `src/types/supabase.ts`.
- `npm run check:no-hebrew-in-code` passed.
- `npm run lint` passed.
- `npm run build` passed.
- `git diff --check` passed.

## Latest access grant management validation results

Commands run:

```bash
supabase db reset
supabase gen types typescript --local | Out-File -Encoding utf8 src/types/supabase.ts
npm run check:no-hebrew-in-code
npm run lint
npm run build
git diff --check
```

Results:

- `supabase db reset` passed and applied both migrations. Supabase warned that `supabase/seed.sql` does not exist.
- Type generation passed and updated `src/types/supabase.ts`.
- `npm run check:no-hebrew-in-code` passed.
- `npm run lint` passed.
- `npm run build` passed.
- `git diff --check` passed.

Remaining Google OAuth setup:

- Create Google OAuth credentials outside the repo.
- Configure local Supabase Google provider with the client id and secret.
- Add `http://127.0.0.1:54321/auth/v1/callback` as the local Google OAuth redirect URI.
- Add local `.env.local` values for Supabase URL, anon key, service-role key, app URL, allowed domain, and optional bootstrap emails.

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
- UX design foundation docs under `docs/design/`.
- Parallel handoffs under `docs/parallel/`.

## Next recommended tasks

1. **Manual Google OAuth and grant-management smoke test**: Configure Google OAuth credentials locally, sign in as a bootstrap super admin, visit `/admin/access-grants`, create a grant, and verify audit log rows.
2. **Activate the reviewed development seed for local db reset**: Enable automatic seeding on database resets by configuring the seed file or settings.
3. **Wire AppHeader and BottomNav into the protected app shell and dashboard**: Integrate the newly created base header and navigation tabs into the main application layout shell.
4. **Implement privileged RPC/server actions for column-sensitive mutations**: Add safe mutations for student photo updates, student message soft deletion with audit logging, and project/emotional/goal updates.
