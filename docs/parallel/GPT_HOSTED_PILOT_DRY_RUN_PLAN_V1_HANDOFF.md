# GPT Hosted Pilot Dry-Run Plan v1 Handoff

## Summary

Created a fake-data-only hosted pilot dry-run plan for rehearsing `docs/14_PRODUCTION_ENVIRONMENT_SETUP_RUNBOOK.md` after explicit approval. This task prepared the rehearsal plan only. No hosted project, hosting project, deployment, OAuth configuration, real credential, real data, import tooling, product feature, RLS change, or Google Calendar sync work was performed.

## Files changed

- `docs/15_HOSTED_PILOT_DRY_RUN_PLAN.md`
- `docs/parallel/GPT_HOSTED_PILOT_DRY_RUN_PLAN_V1_HANDOFF.md`
- `docs/12_CURRENT_STATE.md`
- `docs/handoff.md`

## `.env.example` changes

No `.env.example` change was needed. The existing placeholder-only variables already cover the dry-run planning surface.

## Plan sections created

- Purpose and non-goals.
- Required approvals before executing the dry run.
- Placeholder-only dry-run inputs worksheet.
- Step-by-step execution sequence referencing `docs/14_PRODUCTION_ENVIRONMENT_SETUP_RUNBOOK.md`.
- Evidence collection checklist.
- Fake-data verification script.
- Hosted RLS probe plan with rollback-wrapped fake SQL examples.
- Failure handling and rollback rehearsal.
- Go/no-go report template.
- Recommended next task.

## Remaining decisions

- Hosting provider.
- Production-like domain.
- Preview URL policy.
- Approved Google Workspace domain for the dry run.
- Supabase project region and plan/tier.
- Backup retention expectations.
- Technical operator.
- Backup/restore owner.
- Incident owner.
- Data/privacy owner.
- Whether Web Push is included.
- Whether fake photo upload is included.
- Whether a smaller hosted fake-data seed package is needed.

## Validation results

Preflight:

```bash
git status --short
git log --oneline --all --grep='Add production environment setup runbook'
npm run build
```

Required validation:

```bash
npm run check:no-hebrew-in-code
npm run lint
npm run build
git diff --check
```

## Notes

- `.gitignore` was already dirty with only a `.claude/` ignore entry. Per task instruction, it was not touched or staged.
- The dry-run plan explicitly keeps the real-data gate closed.
- The plan recommends a hosting provider decision memo before execution because provider/domain/preview/rollback details are still undecided.

## Recommended next task

Hosting provider decision memo. After a provider, domain, preview policy, rollback mechanism, and operational owner are chosen and execution is explicitly approved, proceed to Hosted Pilot Dry-Run Execution v1.
