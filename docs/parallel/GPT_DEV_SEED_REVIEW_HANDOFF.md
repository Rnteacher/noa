# GPT Dev Seed Review Handoff

## Summary

Reviewed `supabase/seeds/dev_seed.sql` against the current migrations and local Supabase setup.

The seed was edited to make it schema-compatible, deterministic, and more useful for RLS/local-development coverage:

- Replaced invalid staff UUID literals with valid fixed UUIDs.
- Added deterministic IDs to rows that previously relied on generated UUID defaults.
- Replaced `now()` and interval expressions with fixed timestamps.
- Added missing `leadership` and regular `staff` mock users.
- Added a second active mentor assignment for the second student group.
- Preserved English-only fake names, emails, student data, and school data.
- Added local-development-only comments near direct `auth.users` inserts.

## Auth Users Review

Direct `auth.users` inserts are compatible with the current local Supabase Auth schema for this seed's purpose: the seed was manually executed against the local database after `supabase db reset`, and all eight mock auth rows inserted successfully.

This remains a local-development-only strategy. It should not be used for production data, real staff accounts, or real student data. Manual SQL execution validates schema compatibility and profile foreign-key support; it does not validate any production OAuth behavior.

## Manual Execution

Manual execution was performed without connecting the seed to `supabase/config.toml`.

Method used:

```powershell
Get-Content -Raw supabase/seeds/dev_seed.sql | docker exec -i supabase_db_staff-app psql -U postgres -d postgres -v ON_ERROR_STOP=1
```

Result: successful.

Post-load spot checks confirmed:

- 8 mock auth users.
- Role coverage for `staff`, `mentor`, `master`, `counselor`, `leadership`, `manager`, and `super_admin`.
- Both student groups have two active mentors.
- Current projects include green, yellow, and red statuses.
- Announcements include `all_staff` and `roles` targets.

## Remaining Risks

- Direct `auth.users` seeding is validated only for local schema compatibility and local profile foreign keys.
- Client sign-in behavior for these mock password users was not tested in this task.
- If later work requires password sign-in as seeded users, review whether local `auth.identities` rows should also be seeded for the current Supabase Auth version.

## Later Activation Recommendation

Keep the seed disconnected until the team explicitly approves automatic local seeding.

Recommended later activation task:

1. Review whether password sign-in for seeded users is required.
2. If approved, update `supabase/config.toml` `[db.seed]` to load `./seeds/dev_seed.sql`.
3. Run `supabase db reset`.
4. Re-run the full validation suite and local RLS smoke checks.

## Validation Results

- `supabase db reset`: passed; draft seed was not automatically loaded.
- Manual seed execution: passed.
- Seed coverage spot checks: passed.
- `npm run check:no-hebrew-in-code`: passed.
- `npm run lint`: passed.
- `npm run build`: passed.
- `git diff --check`: passed.
