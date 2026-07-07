# Handoff - ADMIN-001 Staff access grant management

## Summary

Built the first super-admin-only staff access grant management surface at `/admin/access-grants`. The page lists existing grants, creates grants, edits active state and roles, and writes audit log entries through server-only privileged code.

## Files changed

- `src/app/(app)/admin/access-grants/page.tsx`: Added the super-admin-only grant management page.
- `src/lib/admin/access-grants.ts`: Added server actions for grant create/update, role replacement, active toggles, and audit logging.
- `src/lib/audit/log.ts`: Added server-only audit log helper.
- `src/lib/auth/roles.ts`: Added shared typed app role list.
- `src/app/(app)/dashboard/page.tsx`: Added a minimal super-admin-only link to access grant management.
- `src/i18n/he.json`: Added Hebrew UI strings for access grant management.
- `src/i18n/en.json`: Added English UI strings for access grant management.
- `docs/07_LOCAL_SUPABASE_WORKFLOW.md`: Added Windows OAuth env troubleshooting note.
- `docs/11_DECISION_LOG.md`: Logged the grant mutation and audit model.
- `docs/12_CURRENT_STATE.md`: Updated access grant management status, validation results, and next tasks.
- `docs/handoff.md`: Replaced with this handoff.

## Decisions made

- The admin surface is server-rendered and uses server actions rather than client-side Supabase mutations.
- `/admin/access-grants` requires an active staff session through Proxy and also checks `current_user_is_super_admin` on the page.
- Every mutation repeats the super-admin check before using the service-role client.
- Audit logs are inserted by a server-only helper using the service-role client, never by browser code.
- Role edits replace the selected grant role set from submitted checkbox state.

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

- `docs/07_LOCAL_SUPABASE_WORKFLOW.md`
- `docs/11_DECISION_LOG.md`
- `docs/12_CURRENT_STATE.md`
- `docs/handoff.md`

## Known risks

- The UI and server actions compile, but a browser smoke test still requires a real logged-in super admin session.
- Grant role replacement is implemented as delete then insert inside server action flow, not as a dedicated database RPC transaction.
- Server action errors currently surface through Next.js error handling; there is no inline form error UI yet.

## Open questions

- Should grant role replacement move into a dedicated database RPC for stricter transaction boundaries?
- Should access grant changes also create notifications for newly granted staff later?

## Recommended next task

Configure local Google OAuth, sign in as a bootstrap super admin, smoke test `/admin/access-grants`, and verify that grant mutation audit entries are written.
