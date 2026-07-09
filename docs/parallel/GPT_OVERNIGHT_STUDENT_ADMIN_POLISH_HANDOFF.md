# GPT Overnight Student/Admin Polish Handoff

This overnight task ran in four sequential phases, each validated (build, lint, Hebrew scanner, `git diff --check`, and rollback-only database probes) before moving to the next.

## 1. Phases completed

All four phases completed successfully; none were stopped or skipped.

1. Phase 0 — Repository safety check.
2. Phase 1 — Primary/central student goal management v1.
3. Phase 2 — Student message editing v1.
4. Phase 3 — Admin audit log viewer v1.
5. Phase 4 — Documentation and final consistency pass (this handoff).

## 2. Files changed

**Phase 0 (no changes):**
- Confirmed `git status --short` was clean before starting; all prior task work (calendar, learning groups, notifications, goal edit/delete) was already committed on `master`. No pre-existing dirty files were found or touched.

**Phase 1 (primary goals):**
- `supabase/migrations/20260709000000_student_goal_primary.sql` (new)
- `src/features/students/actions.ts` (added `setPrimaryStudentGoal`)
- `src/app/(app)/students/[studentId]/SetPrimaryGoalButton.tsx` (new)
- `src/app/(app)/students/[studentId]/page.tsx` (mounted the button)
- `src/i18n/en.json`, `src/i18n/he.json`
- `src/types/supabase.ts` (regenerated)

**Phase 2 (message editing):**
- `supabase/migrations/20260709010000_student_message_editing.sql` (new)
- `src/features/students/actions.ts` (added `updateStudentMessage`)
- `src/app/(app)/students/[studentId]/MessageEditForm.tsx` (new)
- `src/app/(app)/students/[studentId]/page.tsx` (mounted the form, added `canEditAny`/`isOwnMessage`/`canEdit` logic to `MessageRow`)
- `src/i18n/en.json`, `src/i18n/he.json` (also backfilled two pre-existing missing keys: `students.messages.notFound`, `students.messages.invalidTag`)

**Phase 3 (admin audit log viewer):**
- `src/features/admin/audit-queries.ts` (new)
- `src/app/(app)/admin/audit/page.tsx` (new)
- `src/components/layout/AdminShell.tsx` (added enabled Audit log nav item)
- `src/i18n/en.json`, `src/i18n/he.json`

**Phase 4 (documentation):**
- `docs/12_CURRENT_STATE.md`
- `docs/handoff.md`
- `docs/parallel/GPT_OVERNIGHT_STUDENT_ADMIN_POLISH_HANDOFF.md` (this file)

## 3. Migrations added

Two minimal, additive migrations were added. Both were proven with `supabase db reset` (clean apply) and rollback-only SQL probes.

1. **`20260709000000_student_goal_primary.sql`**
   - `create unique index student_goals_one_primary_active_idx on public.student_goals (student_id, school_year_id) where is_primary = true and status <> 'archived'` — enforces at most one primary, non-archived goal per student per school year.
   - `create or replace function public.set_primary_student_goal(target_student_id uuid, target_goal_id uuid) returns void security definer ...` — atomically clears any other non-archived primary goal for that student/school year and promotes the selected goal, touching only `is_primary` and `updated_by`. Independently verifies: active session, active staff, active target student, goal belongs to the student, goal is not archived, and `current_user_can_update_student_goals(target_student_id)`. Grants execute to `authenticated` only.

2. **`20260709010000_student_message_editing.sql`**
   - Adds a second, additive permissive UPDATE policy on `student_messages` ("Authors and super admins can edit student messages") scoped to editing an active message in place (`deleted_at` stays null), leaving the original soft-delete-only UPDATE policy completely untouched. Postgres combines multiple permissive policies for the same command with OR on both `USING` and `WITH CHECK`, so this purely adds the editing case without weakening the existing soft-delete policy.

No migration was needed for Phase 3 (admin audit log viewer) — the existing `audit_logs` table and its existing manager/super-admin-only read RLS policy were already fully sufficient.

## 4. Permission/RLS model by phase

**Phase 1 — primary goals:**
- Active group mentors, managers, and super admins can call `set_primary_student_goal`, matching the existing `current_user_can_update_student_goals` helper used elsewhere for goal management (mentor-of-group OR manager/super-admin). Counselors and unrelated staff cannot.
- Enforced independently inside the RPC (not merely by RLS), since the RPC is `security definer` and performs its own authorization checks before mutating.

**Phase 2 — message editing:**
- Message authors can edit their own active message; super admins can edit any active message. Nobody (including the author) can edit an already soft-deleted message. Nobody can spoof `author_id` while editing.
- Enforced by the new additive RLS policy at the database layer, plus a matching author/super-admin check in the `updateStudentMessage` server action before attempting the update.

**Phase 3 — admin audit log viewer:**
- Read-only: only managers and super admins can view rows, via the existing single RLS SELECT policy (`current_user_is_manager_or_super_admin()`). There is no INSERT/UPDATE/DELETE policy for the `authenticated` role at all — audit rows can only ever be written through the existing privileged server-only `writeAuditLog` helper (service-role client). The admin page itself performs zero mutations and never touches the service-role client.

## 5. Audit behavior

- Phase 1: `student_goal.primary_updated` — before/after data includes the goal id, student id, school year id, title, status, previous/new `is_primary`, and updater.
- Phase 2: `student_message.updated` — before/after data includes the full message row (id, student id, author id, body, tags, importance, timestamps); author/student/`deleted_at` are never part of the writable payload.
- Phase 3: no new audit actions (read-only feature); the viewer simply displays existing audit rows.

## 6. Notification behavior

- Phase 1: reuses the existing allowlisted `student_goal.updated` event type for the `create_student_change_notification` RPC (there is no dedicated "primary changed" event type in the hardened RPC's strict allowlist, and this is the closest semantically-accurate existing type already used for other goal field changes).
- Phase 2: **intentionally deferred.** The hardened notification RPC's event-type allowlist has no entry for message edits, and reusing `student_message.created` would misrepresent the event (implying a brand-new message) and re-notify followers noisily on every edit. Rather than force a semantically wrong reuse, no notification is triggered for message edits; the RPC call was simply omitted with a code comment explaining why.
- Phase 3: not applicable (read-only viewer, no mutation to notify about).

## 7. Deferred items

- Primary goal management: no further deferral beyond what already exists for goals generally (title/description are still editable elsewhere; this feature only adds the primary toggle).
- Message editing: rich text formatting, an `edited_at`/`edited_by` column (relying on the existing `updated_at` trigger instead), and edit notifications (see above).
- Admin audit log viewer: actor filter, date-range filter, pagination beyond the current 100-row cap, and any export/download of audit data.
- Unrelated, pre-existing deferrals carried over unchanged: Web Push/service workers/VAPID, calendar/learning-group drag-and-drop and Google Calendar sync, project title/master assignment editing, permanent message deletion, and realtime message-stream updates.

## 8. Validation results

Commands run once per phase where applicable:

```bash
supabase db reset
supabase gen types typescript --local | Out-File -Encoding utf8 src/types/supabase.ts
npm run check:no-hebrew-in-code
npm run lint
npm run build
git diff --check
```

- **Phase 0:** `git status --short` clean.
- **Phase 1:** `supabase db reset` applied the new migration cleanly; type generation picked up `set_primary_student_goal`. Rollback-only probes confirmed: no pre-existing duplicate primaries in the seed; unrelated staff and counselor denied by the RPC; manager and super admin succeed; an active group mentor (assignment date temporarily moved earlier) succeeds while the unmodified (inactive-today) assignment is denied; setting a new primary clears the previous one for the same student/school year; the partial unique index rejects two active primaries even as superuser; setting an archived goal as primary is rejected by the RPC; an archived goal's stale `is_primary = true` does not block promoting a different active goal. Seed goal rows/statuses/mentor assignment date unchanged after all probes.
- **Phase 2:** `supabase db reset` applied the new migration cleanly. Rollback-only probes confirmed: author edits own active message; unrelated staff cannot; super admin can edit any active message; cannot edit an already-deleted message; cannot spoof `author_id`. **Finding (documented, not fixed):** a pre-existing bug was isolated where a normal author's self-soft-delete fails under real RLS via the exact shipped `deleteStudentMessage` code path, because Postgres requires the post-image row of a plain `UPDATE` to remain visible under a `SELECT` policy, and the only non-super-admin read policy requires `deleted_at IS NULL`. Reproduced with the new edit policy both present and dropped (same result either way), confirming this predates this session. Seed message rows (2) and `deleted_at` state unchanged after all probes.
- **Phase 3:** no migration needed. Rollback-only probes confirmed: manager/super-admin sessions read test rows inserted directly (bypassing RLS, matching the real service-role writer); normal staff/mentor sessions read 0 rows for the identical data (RLS-filtered, not merely absent); both `INSERT` and `DELETE` against `audit_logs` from the `authenticated` role are rejected/no-op. Seed `audit_logs` row count (0) unchanged after probes.
- All phases: `npm run check:no-hebrew-in-code`, `npm run lint`, and `npm run build` passed, with `/admin/audit` registered as a new dynamic route in the final build alongside all pre-existing routes. `git diff --check` passed with line-ending normalization warnings only, every time.
- Anonymous `GET /admin/audit` returned `307` to `/login` against the running production build; `GET /dashboard` and `GET /admin/announcements` were re-checked and also still return `307` (no regression).
- Authenticated browser smoke testing was not performed for any phase, for the same reason documented across every prior task in this project: the local login UI is Google-only and the seeded email/password users do not produce usable Supabase auth sessions for the protected app. Server-side validation, build checks, and database authorization probes passed for all three feature phases.

## 9. Stopped/skipped phases

None. All four phases (0–3) completed as specified; Phase 4 is this documentation pass. The one notable deviation from a literal reading of the brief: Phase 2's spec suggested optionally triggering a notification on message edit "if safe and not noisy" — this was evaluated and explicitly *not* implemented (rather than force-fitting an existing event type), with the reasoning documented above and in `docs/12_CURRENT_STATE.md`. This is a scoped design decision within Phase 2, not a stopped phase.
