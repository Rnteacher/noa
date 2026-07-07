# GPT Seed Activation Handoff

## Files Changed

- `supabase/config.toml`
- `docs/12_CURRENT_STATE.md`
- `docs/handoff.md`
- `docs/parallel/GPT_SEED_ACTIVATION_HANDOFF.md`

## Seed Activation Method

Updated the existing `[db.seed]` section in `supabase/config.toml`:

```toml
sql_paths = ["./seeds/dev_seed.sql"]
```

The seed remains canonical at `supabase/seeds/dev_seed.sql`. No `supabase/seed.sql` copy was created.

## Automatic Reset Result

`supabase db reset` loaded the seed automatically.

Observed CLI output included:

```text
Seeding data from supabase/seeds/dev_seed.sql...
```

## Spot-Check Query Results

After `supabase db reset`, the local database contained:

| Table | Count |
| --- | ---: |
| `profiles` | 8 |
| `profile_roles` | 15 |
| `students` | 6 |
| `student_groups` | 2 |
| `projects` | 6 |
| `announcements` | 2 |
| `calendar_events` | 2 |
| `staff_access_grants` | 8 |
| `audit_logs` | 0 |

`audit_logs` is `0` because the seed does not insert audit log rows.

## Client Password Sign-In

Client password sign-in for seeded mock auth users was not tested in this task.

## Remaining Risks

- Direct `auth.users` seed rows are still local-development-only.
- If seeded password login is needed for local manual testing, validate sign-in through the app and consider whether matching `auth.identities` rows are required for the current local Supabase Auth version.

## Validation Results

- `supabase db reset`: passed and automatically loaded `supabase/seeds/dev_seed.sql`.
- Spot-check SQL queries: passed.
- `npm run check:no-hebrew-in-code`: passed.
- `npm run lint`: passed.
- `npm run build`: passed.
- `git diff --check`: passed.
