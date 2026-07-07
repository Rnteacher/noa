# Handoff — Documentation Sync after Development Seed Review

## Summary

Synchronized the central documentation after reviewing and validating the local development seed. The database, auth logic, access controls, visual wireframes, and seeding resources have been successfully structured and verified.

## Current implemented foundation

- **Google OAuth and Route Protection**: Enforced on authentication callback, routing logic, and session lookups.
- **First-Run Access Control**: Google sign-in restricts access using `GOOGLE_ALLOWED_DOMAIN` and whitelisted staff email grants.
- **Access Grant Management**: `/admin/access-grants` is available for super-admins to manage email permissions, roles, and log audit entries.
- **UX Design Foundation**: Detailed design wireframes and guidelines are available under `docs/design/`.
- **Reviewed Development Seed**: `supabase/seeds/dev_seed.sql` has been fully reviewed and fixed. Manual execution against the local database succeeded cleanly.

## Seed status

- The seed remains **disabled** (not connected to `supabase/config.toml`). Database resets will not load it automatically.
- Direct `auth.users` mock records in the seed are verified to be fully compatible with the current local Supabase Auth schema for profile mapping and testing.
- Client password sign-in has not been tested.

## Files changed

- `docs/12_CURRENT_STATE.md`: Registered the review handoff, updated the seed status, and updated the next recommended task.
- `docs/handoff.md`: Updated to this current handoff summary.

## Decisions made

- No application code changed.
- No migrations changed.
- No translation files changed.
- Local seed config remains disconnected to prevent automatic database load until team approval.

## Tests/checks run

```bash
npm run check:no-hebrew-in-code
npm run lint
npm run build
git diff --check
```

Result:

- `check:no-hebrew-in-code`: Passed.
- `npm run lint`: Passed.
- `npm run build`: Passed.
- `git diff --check`: Passed.

## Known risks

- Seeding direct auth records is validated only for schema/profile compatibility; password auth via client sign-in remains untested.

## Open questions

- None.

## Recommended next task

Activate the reviewed development seed for local db reset, or perform a manual Google OAuth and access-grants smoke test.
