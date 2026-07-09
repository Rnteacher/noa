# GPT Production Environment Setup Runbook v1 Handoff

## Summary

Created a provider-neutral, fake-data-only production environment setup runbook for the Chamama Staff App. The runbook converts the pilot/production readiness audit into operator steps for hosted Supabase setup, OAuth configuration, hosting setup, RLS smoke verification, backup/restore planning, fake-data verification, and the hard gate before real data import.

No deployment was performed. No Supabase Cloud project or hosting project was created. No real OAuth credentials, production secrets, real student data, import tooling, product features, or Google Calendar sync were added.

## Files changed

- `docs/14_PRODUCTION_ENVIRONMENT_SETUP_RUNBOOK.md`
- `docs/parallel/GPT_PRODUCTION_ENVIRONMENT_SETUP_RUNBOOK_V1_HANDOFF.md`
- `docs/12_CURRENT_STATE.md`
- `docs/handoff.md`

## Runbook sections created

- Purpose, non-goals, operator prerequisites, and approvals before real data.
- Production environment variable matrix.
- Hosted Supabase setup runbook with placeholder CLI commands.
- Schema, RLS, function, view, and storage verification SQL.
- Google OAuth production configuration runbook.
- Provider-neutral hosting setup runbook.
- Hosted fake-data-only RLS smoke probes.
- Backup, restore, and rollback checklist.
- Fake-data pilot verification checklist.
- Real-data import gate.
- Final setup sign-off checklist.

## `.env.example` changes

No `.env.example` change was needed in this task. It already contains placeholder-only entries for active runtime variables, Supabase Google OAuth provider placeholders, Web Push VAPID keys, and deferred Google Calendar variables.

## Remaining open decisions

- Hosting provider.
- Production domain.
- Approved Google Workspace domain.
- Backup/restore owner.
- Incident owner.
- Whether Web Push is included in the first hosted pilot.
- Supabase plan/tier and backup retention.
- Preview deployment OAuth policy.

## Validation results

Preflight:

```bash
git status --short
git log --oneline --all --grep='Add pilot production readiness audit'
npm run build
```

Required validation:

```bash
npm run check:no-hebrew-in-code
npm run lint
npm run build
git diff --check
```

## Known risks

- The runbook has not been exercised against a hosted Supabase project because this task was documentation-only.
- Provider-specific deployment and rollback details remain pending until a host is selected.
- Backup/restore guarantees depend on the selected Supabase plan and must not be assumed from this repo.
- Real-data import remains blocked until every gate in `docs/14_PRODUCTION_ENVIRONMENT_SETUP_RUNBOOK.md` is approved.

## Recommended next task

Hosted Pilot Dry-Run Plan v1: choose placeholder operator inputs, rehearse the runbook against a non-real-data hosted environment only after explicit approval, and record actual results without importing real data.
