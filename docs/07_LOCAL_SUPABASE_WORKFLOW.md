# 07 — Local Supabase Workflow

## Goal

Start locally with Supabase, then move to Supabase Cloud after the product foundation is stable.

## Initial setup

Recommended commands:

```bash
pnpm dlx create-next-app@latest chamama-staff-app --ts --tailwind --eslint --app --src-dir --import-alias "@/*"
cd chamama-staff-app
supabase init
supabase start
```

After `supabase start`, copy the local API URL and anon key into `.env.local`.

## Environment variables

Create `.env.local.example`:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
GOOGLE_ALLOWED_DOMAIN=
BOOTSTRAP_SUPER_ADMIN_EMAILS=
WEB_PUSH_PUBLIC_KEY=
WEB_PUSH_PRIVATE_KEY=
WEB_PUSH_SUBJECT=
```

Do not commit real secrets.

## Migrations

All schema changes must be committed as migrations.

Rules:

- Do not rely on manual Dashboard-only schema changes.
- If using Supabase Studio locally, capture changes into migration files.
- Each migration should be small enough to review.
- RLS policies must be in migrations.
- Seed data must not contain real student data.

## Seed data

Use seed data for reproducible local development:

- Fake users.
- Fake students.
- Fake groups.
- Fake announcements.
- Fake calendar events.
- Fake learning groups.

No real student data in seeds.

## Local auth

Google OAuth in local Supabase requires configuration in both Google Cloud and Supabase.

Local app URL:

```txt
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Application callback route:

```txt
http://localhost:3000/auth/callback
```

Supabase local callback URL for Google OAuth:

```txt
http://127.0.0.1:54321/auth/v1/callback
```

Local setup steps:

1. Create a Google OAuth client in Google Cloud.
2. Add `http://127.0.0.1:54321/auth/v1/callback` as an authorized redirect URI for local Supabase Auth.
3. Start Supabase locally with `supabase start`.
4. Open Supabase Studio at the local Studio URL printed by the CLI.
5. Enable the Google provider under Authentication providers.
6. Add the Google OAuth client id and secret in the local Supabase Auth provider settings.
7. Create `.env.local` from `.env.example`.
8. Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` from `supabase status`.
9. Set `NEXT_PUBLIC_APP_URL=http://localhost:3000`.
10. Set `GOOGLE_ALLOWED_DOMAIN` to the institutional Google Workspace domain.
11. Optionally set `BOOTSTRAP_SUPER_ADMIN_EMAILS` to a comma-separated list of first-run super admin emails.

Never commit real OAuth client secrets, Supabase service-role keys, or production bootstrap email lists.

Access activation:

- Valid-domain users are not automatically active staff.
- A super admin can create a row in `staff_access_grants` and assign roles in `staff_access_grant_roles`.
- On OAuth callback, active grants are copied into `profiles` and `profile_roles`.
- Emails listed in `BOOTSTRAP_SUPER_ADMIN_EMAILS` become active profiles with `super_admin` and `manager` roles after Google OAuth and domain validation.
- Valid-domain users without a grant or bootstrap entry get an inactive profile and are redirected to the access-pending page.

Do not ship without Google OAuth and domain restrictions.

## Storage

Create a bucket for student photos:

- Bucket key: `student-photos`
- Public access: to be decided.
- Preferred: private bucket with signed URLs or authenticated access.

## Type generation

Generate database types after migrations:

```bash
supabase gen types typescript --local > src/lib/supabase/database.types.ts
```

Regenerate after schema changes.

## Moving to cloud later

Checklist:

- Create Supabase Cloud project.
- Link local project to remote.
- Push migrations.
- Configure Google OAuth.
- Configure redirect URLs.
- Configure Storage bucket.
- Configure secrets.
- Configure scheduled reminders.
- Configure production web push.
- Create initial admin users.
- Import real data through the app import flow, not ad-hoc SQL unless approved.

## Production data rule

Real student data should enter the system only after:

- Auth is working.
- RLS is enabled.
- Backups are understood.
- Export is restricted.
- Audit log is active for sensitive actions.
