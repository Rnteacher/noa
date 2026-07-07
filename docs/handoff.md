# Handoff - Local Development Seed Activation

## Summary

Activated the reviewed local development seed for automatic local database resets.

## Current state

- `supabase/config.toml` now points `[db.seed].sql_paths` to `./seeds/dev_seed.sql`.
- `supabase db reset` automatically loads `supabase/seeds/dev_seed.sql` after migrations.
- The canonical seed file remains `supabase/seeds/dev_seed.sql`; no `supabase/seed.sql` copy was created.
- No migrations, application UI code, or i18n files were changed.
- Seed data remains fake, deterministic, English-only local development data.

## Validation performed

- `supabase db reset` passed and printed `Seeding data from supabase/seeds/dev_seed.sql`.
- Spot-check SQL after reset confirmed:
  - `profiles`: 8
  - `profile_roles`: 15
  - `students`: 6
  - `student_groups`: 2
  - `projects`: 6
  - `announcements`: 2
  - `calendar_events`: 2
  - `staff_access_grants`: 8
  - `audit_logs`: 0
- `npm run check:no-hebrew-in-code` passed.
- `npm run lint` passed.
- `npm run build` passed.
- `git diff --check` passed.

## Remaining risks

- Client password sign-in for seeded mock auth users has not been tested.
- Direct `auth.users` seed rows remain a local-development-only strategy.

## Next recommended tasks

1. Manual Google OAuth and grant-management smoke test.
2. Design tokens and base components.
3. Privileged RPC/server actions for sensitive mutations.
