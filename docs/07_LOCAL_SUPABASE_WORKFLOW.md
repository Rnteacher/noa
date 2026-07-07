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

Google OAuth in local Supabase requires explicit configuration. Document the exact setup after it works.

Local fallback option for early development:

- Use test users created in Supabase Studio.
- Keep OAuth implementation as a Phase 1 task.

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
