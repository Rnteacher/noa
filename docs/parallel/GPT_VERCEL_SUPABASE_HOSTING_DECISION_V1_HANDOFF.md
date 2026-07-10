# GPT Vercel + Supabase Hosting Decision V1 Handoff

This document summarizes the outcomes of the Vercel + Supabase Hosting Decision Memo v1 task.

---

## 1. Files Changed

- `docs/16_VERCEL_SUPABASE_HOSTING_DECISION.md` [NEW] — Created the core decision memo selecting Vercel + hosted Supabase as the default pilot hosting path, evaluating features (Next.js 16 App Router, Server Actions, Edge middleware `proxy.ts`, `/sw.js` root service worker serving), env var mapping, preview branch URL safety policies, custom domain needs, rollback parameters, and operational ownership assignment.
- `docs/12_CURRENT_STATE.md` [MODIFY] — Registered the memo and decision details.
- `docs/handoff.md` [MODIFY] — Merged the updates into the handoff log.
- `.env.example` [NO CHANGE] — Did not change, as the placeholder-only variables already align with the env var mapping matrix.

---

## 2. Selected Hosting Path & Decisions

- **Decision**: Selected **Vercel** (for app hosting) and **hosted Supabase Cloud** (for database, Auth, and Storage) for the pilot environment.
- **Dry-run Target**: Fake-data-only production-like hosted environment. Real student data remains strictly **blocked**.
- **Preview Branch Policy**: Option A (safer) — Disable OAuth testing on arbitrary preview branch URLs; restrict all authenticated testing to one fixed production-like URL.
- **Remaining Decisions**:
  1. Production-like dry-run domain name selection.
  2. Supabase Cloud pricing tier choice to ensure backup retention.
  3. Assigning the Incident Owner, Backup Owner, and Technical Operator.
  4. Project Owner sign-off to execute the dry run.

---

## 3. Validation Results

- `npm run check:no-hebrew-in-code` — Pass
- `npm run lint` — Pass
- `npm run build` — Pass
- `git diff --check` — Pass (line-ending warnings only)

---

## 4. Recommended Next Task

We recommend:
- **Hosted Pilot Dry-Run Execution Prep v1** — to select the actual domain names, Supabase pricing tier, and operational owners so the dry-run rehearsal is fully defined before launching the execution.
