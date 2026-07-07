# Handoff - Documentation sync after parallel work

## Summary

Updated the central project documentation after merging parallel work. The current project state now records the implemented Google OAuth/protected route foundation, the super-admin staff access grant management surface, the UX design documentation package, and the draft development seed.

## Current implemented foundation

- Google OAuth routes and protected routing exist.
- First-run access control exists through staff access grants and bootstrap super admin emails.
- `/admin/access-grants` exists as the first super-admin-only grant management surface.
- Grant mutations are server-side and audit logged.

## Parallel work now recorded

- UX design foundation docs were added under `docs/design/`.
- Claude's UI foundation handoff is stored at `docs/parallel/CLAUDE_UI_FOUNDATION_HANDOFF.md`.
- A draft local development seed was added at `supabase/seeds/dev_seed.sql`.
- Gemini's seed handoff is stored at `docs/parallel/GEMINI_DEV_SEED_HANDOFF.md`.

## Seed status

The draft seed is not enabled. It remains disconnected from `supabase/config.toml`, so `supabase db reset` will not automatically run `supabase/seeds/dev_seed.sql`.

The seed includes draft `auth.users` rows and needs review against the local Supabase Auth schema before activation.

## Files changed

- `docs/12_CURRENT_STATE.md`: Added UX design foundation status, parallel handoff references, draft seed status, and updated next tasks.
- `docs/handoff.md`: Replaced with this current sync handoff.

## Decisions made

- No application code was changed.
- No migrations were changed.
- No i18n files were changed.
- The draft dev seed remains disabled until reviewed.
- `docs/07_LOCAL_SUPABASE_WORKFLOW.md` already used `SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_SECRET`, so it was not changed.

## Tests/checks run

```bash
npm run check:no-hebrew-in-code
npm run lint
npm run build
git diff --check
```

Result:

- `npm run check:no-hebrew-in-code`: Passed.
- `npm run lint`: Passed.
- `npm run build`: Passed.
- `git diff --check`: Passed with Windows line-ending normalization warnings only.

## Known risks

- The draft development seed includes direct `auth.users` inserts and may need adjustment before it can run safely on local Supabase.
- The design docs are planning artifacts; implementation still needs design tokens and shared components.

## Open questions

- Should the draft seed be activated by copying it to `supabase/seed.sql`, or should `supabase/config.toml` be updated after review?
- Should the current local starter script containing OAuth environment variables be moved to an untracked example template before the repo is shared?

## Recommended next task

Review `supabase/seeds/dev_seed.sql`, especially the draft `auth.users` inserts, then decide how to activate local seed data.
