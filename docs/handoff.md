# Handoff - DB-001 Initial Supabase schema and RLS

## Summary

Created the initial Supabase baseline migration for the Chamama Staff App. The migration defines the core relational schema, enums, indexes, constraints, updated timestamp triggers, security definer permission helpers, RLS policies, and two simple views for current project status and latest emotional status.

## Files changed

- `supabase/migrations/20260707111701_initial_schema_and_rls.sql`: Added the initial schema, helper functions, views, grants, and RLS policies.
- `docs/12_CURRENT_STATE.md`: Updated database foundation status, validation results, blocked commands, and next recommended tasks.
- `docs/11_DECISION_LOG.md`: Added decisions for role naming, announcement target mode, learning group time enforcement, column-sensitive update handling, and audit log writes.
- `docs/handoff.md`: Replaced the previous handoff with this task handoff.

## Decisions made

- Used the explicit task role enum: `staff`, `mentor`, `master`, `counselor`, `leadership`, `manager`, and `super_admin`.
- Added `announcements.target_type` so `all_staff` targeting is represented directly while role, group, and user targets remain normalized.
- Enforced the learning group 11:30-13:30 window at the database level.
- Kept audit log inserts out of normal client RLS policies so audit writes can come from service-role flows or future RPC functions.
- Left column-sensitive mutations, especially student photo updates and message soft deletion, for future RPC/server actions because RLS is row-level and cannot fully constrain changed columns by itself.

## Tests/checks run

```bash
supabase db reset
npm run lint
npm run build
supabase gen types typescript --local > src/types/supabase.ts
git diff --check
```

Result:

- `supabase db reset` failed because local Supabase is not running: `supabase start is not running.`
- `npm run lint` passed.
- `npm run build` passed.
- Type generation failed because local Supabase is not running: `supabase start is not running.`
- `git diff --check` passed.

## Documentation updated

- `docs/12_CURRENT_STATE.md`
- `docs/11_DECISION_LOG.md`
- `docs/handoff.md`

## Known risks

- The migration has not been replayed against a running local Supabase database yet.
- RLS policies provide the initial row-level foundation, but critical writes still need server-side mutation wrappers to enforce column-level changes and audit logging.
- The earlier RBAC/data model drafts use some older role/table wording; the migration follows the newer explicit task brief and records that decision.

## Open questions

- Should group-targeted announcements and events be visible only to group mentors/masters, or to every active staff member because all staff can view all student cards?
- Should managers be able to maintain school years and core student records directly, or should those remain super-admin-only except through future import flows?

## Recommended next task

Start local Supabase, run `supabase db reset`, review generated schema/RLS in Studio, generate TypeScript types, then implement RPC/server actions for student message soft deletion with audit logging and student photo updates.
