# Handoff - AUTH-001 Google OAuth and protected routes

## Summary

Implemented Google OAuth entry points, protected route routing, first-run staff access control, access-grant database tables, bootstrap super admin support, and server-only profile sync utilities. Moved the existing staff shell to `/dashboard` and made `/` redirect based on the current access state.

## Files changed

- `.gitignore`: Added an exception so `.env.example` can be version-controlled while real env files stay ignored.
- `.env.example`: Added `BOOTSTRAP_SUPER_ADMIN_EMAILS`.
- `supabase/migrations/20260707115303_staff_access_grants.sql`: Added staff access grants, grant roles, indexes, trigger, RLS, and grants.
- `src/types/supabase.ts`: Regenerated local Supabase database types.
- `src/proxy.ts`: Added Next.js 16 Proxy route protection.
- `src/app/page.tsx`: Replaced the dashboard shell with auth-state redirects.
- `src/app/(app)/dashboard/page.tsx`: Moved the existing dashboard shell here.
- `src/app/(public)/login/page.tsx`: Added Google sign-in page.
- `src/app/(public)/access-denied/page.tsx`: Added access denied page.
- `src/app/(public)/access-pending/page.tsx`: Added access pending page.
- `src/app/auth/callback/route.ts`: Added OAuth callback, domain validation, profile sync, and redirect handling.
- `src/app/auth/sign-out/route.ts`: Added sign-out route.
- `src/lib/env.ts`: Restricted to client-safe environment values.
- `src/lib/env.server.ts`: Added server-only environment helper and service-role key guard.
- `src/lib/auth/access.ts`: Added email/domain access helpers.
- `src/lib/auth/admin.ts`: Added server-only service-role Supabase client factory.
- `src/lib/auth/profile.ts`: Added OAuth profile sync, grants, bootstrap roles, and pending profile handling.
- `src/lib/auth/session.ts`: Added server-side current access state helper.
- `src/lib/supabase/server.ts`: Updated session-refresh wording for Proxy.
- `src/i18n/he.json`: Added auth UI strings.
- `src/i18n/en.json`: Added auth UI strings.
- `docs/03_DATA_MODEL_DRAFT.md`: Documented staff access grant tables.
- `docs/04_RBAC_MATRIX.md`: Added super-admin grant management permission.
- `docs/07_LOCAL_SUPABASE_WORKFLOW.md`: Added local Google OAuth setup instructions.
- `docs/11_DECISION_LOG.md`: Logged access grant, bootstrap, pending profile, and Proxy decisions.
- `docs/12_CURRENT_STATE.md`: Updated auth/access status, validation results, and next tasks.
- `docs/handoff.md`: Replaced with this handoff.

## Decisions made

- Used access grants as the normal first-run activation path.
- Added `BOOTSTRAP_SUPER_ADMIN_EMAILS` for first-run super admin access after Google OAuth and allowed-domain validation.
- Created inactive pending profiles for valid-domain users without grants, bootstrap entries, or existing active roles.
- Used `src/proxy.ts` because Next.js 16.2.10 documents Proxy as the current request-interception convention and deprecates `middleware.ts`.
- Kept `SUPABASE_SERVICE_ROLE_KEY` in a server-only module and only used it for OAuth callback profile/grant synchronization.

## Tests/checks run

```bash
supabase db reset
supabase gen types typescript --local | Out-File -Encoding utf8 src/types/supabase.ts
npm run check:no-hebrew-in-code
npm run lint
npm run build
git diff --check
```

Result:

- `supabase db reset`: Passed. Applied both migrations. Warned that `supabase/seed.sql` does not exist.
- Type generation: Passed and updated `src/types/supabase.ts`.
- `npm run check:no-hebrew-in-code`: Passed.
- `npm run lint`: Passed.
- `npm run build`: Passed.
- `git diff --check`: Passed.

## Documentation updated

- `docs/03_DATA_MODEL_DRAFT.md`
- `docs/04_RBAC_MATRIX.md`
- `docs/07_LOCAL_SUPABASE_WORKFLOW.md`
- `docs/11_DECISION_LOG.md`
- `docs/12_CURRENT_STATE.md`
- `docs/handoff.md`

## Known risks

- Google OAuth was implemented and compiled, but a browser OAuth smoke test still requires real local Google OAuth credentials.
- `BOOTSTRAP_SUPER_ADMIN_EMAILS` is powerful and should be removed or tightly controlled after first production admin setup.
- No admin UI exists yet for creating `staff_access_grants`; this currently requires SQL, seed/import, or future server actions.

## Open questions

- Should bootstrap also create a durable `staff_access_grants` row for auditability, or remain env-only?
- Should grant activation consume or deactivate a grant after first use, or should grants remain reusable for account recovery?

## Recommended next task

Assign to Gemini or GPT: configure and smoke test local Google OAuth end to end, then build a super-admin-only staff access grant management action or admin screen.
