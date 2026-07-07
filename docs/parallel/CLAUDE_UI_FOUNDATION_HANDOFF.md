# Handoff — Claude UI Foundation (Design & UX Planning)

## Summary

This parallel task produced the UX and visual design foundation for the Chamama Staff App: a product-level UX overview, text wireframes for all core mobile staff screens, a detailed student card UX specification, desktop admin UX layouts, and a visual system direction. It is a **documentation-only** task: no application code, migrations, or translation files were touched, and the `/admin/access-grants` surface (owned by a parallel implementation task) was left untouched and is referenced as context only.

## Files created

- `docs/design/01_PRODUCT_UX_OVERVIEW.md` — main user flows: dashboard, today, week, student search, student card, messages, follows, announcements, read acknowledgement, push entry points, admin areas; plus cross-cutting UX rules.
- `docs/design/02_MOBILE_STAFF_APP_WIREFRAMES.md` — low-fidelity text wireframes for login, dashboard, today, week, student search, student card, announcement detail, and notification settings; each with header / primary content / sticky actions / empty / error / loading states, plus shared mobile patterns.
- `docs/design/03_STUDENT_CARD_UX.md` — block-by-block student card spec: identity, contacts, project status, emotional status, goals, message stream, follow, and a permission-aware action matrix; includes sensitivity rules and the safe push payload pattern.
- `docs/design/04_ADMIN_DESKTOP_UX.md` — desktop layouts for annual calendar/gantt, learning groups weekly editor, announcements management, student management, CSV import/export; access grants covered as context only; shared admin frame and cross-cutting admin rules.
- `docs/design/05_VISUAL_SYSTEM_DIRECTION.md` — layout principles, spacing scale approach, typography direction, mobile navigation, card style, semantic status color tokens (no CSS values), accessibility patterns, and the shared empty/loading/error vocabulary.
- `docs/parallel/CLAUDE_UI_FOUNDATION_HANDOFF.md` — this handoff.

## Key UX decisions

1. **RTL-first, logical direction only.** All layouts are specified in start/end terms; directional icons flip. This must be enforced at the component level (logical CSS properties), not per-screen.
2. **Bottom tab bar with five slots** (Dashboard · Today · Students · Announcements · More); Today and Week share one tab via a segmented switch; detail screens push over the tab bar.
3. **Dashboard is a triage surface** with a fixed section order; acknowledgement-required announcements always occupy the top slot and never disappear until acknowledged; empty sections collapse rather than render placeholders.
4. **Student card is one scrollable page** ordered identity → contacts (collapsed) → project → emotional → goals → messages, with the message composer pinned at the bottom. Status changes post system lines into the message stream, making status history socially visible.
5. **Hide-don't-disable for permissions, with one exception:** statuses always render read-only for everyone; only edit affordances are conditional. The card spec includes a per-viewer action matrix mirroring the RBAC matrix.
6. **Emotional notes are sensitive; status colors are not.** Colors are staff-visible everywhere; free-text emotional notes are restricted to the roles that can edit emotional status and are excluded from stream, standard exports, and all pushes.
7. **Safe push payload pattern:** no student names, no message bodies, no status colors in any payload — generic type-of-update text plus an authenticated deep link. Every push lands one tap from its subject.
8. **Traffic-light system never relies on color alone:** each status pairs color with a glyph and accessible label; the interactive accent color is deliberately distinct from green/red.
9. **Admin uses side panels over modals,** optimistic UI with visible rollback for drag interactions, pessimistic UI for destructive/permission-changing actions, and consequence notes when mentor/master assignments change permission effects.
10. **CSV import is a preview-first stepper** (upload → validate → per-row status → apply), and sensitive export sets sit behind an explicit divider with extra confirmation and audit notice.
11. **Skeletons over spinners; three-tier error model** (inline / toast / full-screen); the UI never fakes success — failed optimistic updates roll back visibly.
12. **No draft mode for announcements in v1** (per product decisions); corrections flow through expire + duplicate-as-new, which the admin table makes easy.

## Risks

1. **Calendar drag interactions (admin) are the highest implementation-complexity area** — recurrence scope editing, drag/resize with rollback, and the year/gantt view. A calendar library evaluation (fullcalendar vs. alternatives) should happen before committing to the interaction spec.
2. **Emotional-notes access split** (color public to staff, note restricted) needs a schema/RLS review to confirm the current `student_emotional_statuses` model can enforce column-level or row-level narrowing; the UX assumes it can.
3. **Push preference granularity** (per-type toggles + daily reminder time) exceeds what the current `push_subscriptions`/`notifications` tables may model; verify before building the settings screen.
4. **Followed-student "recent updates" on the dashboard** implies a change-feed query (new messages, status changes since last seen) that does not exist yet; naive implementations could be slow.
5. **RTL correctness is easy to regress** — recommend a lint/review convention against physical direction utilities early, before many components exist.
6. **The Today|Week segmented-tab decision** trades one nav slot for a two-level pattern; validate with real users early since it is cheap to change now and expensive later.

## Suggested next implementation tasks

1. **Design tokens + base components:** Tailwind theme tokens (semantic colors, spacing, type styles per doc 05), then StatusBadge, Card, ListRow, BottomNav, BottomSheet, Toast, Skeleton, EmptyState — the shared vocabulary everything else consumes.
2. **Staff app shell:** bottom tab bar, push-over screen pattern, header pattern, RTL verification.
3. **Dashboard v1** (sections: acknowledgements, announcements, today, week) against seeded data — requires the `supabase/seed.sql` task already listed in `docs/12_CURRENT_STATE.md`.
4. **Student search + student card read-only view,** then the message stream + composer, then permission-gated status/goal editors (in that order — read paths first).
5. **Announcements:** list, detail, acknowledgement loop, then the composer for management roles.
6. **Admin calendar spike:** evaluate calendar libraries against the doc 04 interaction requirements before scheduling the calendar epic.

## Files intentionally not touched

- All application code under `src/` (including `src/app/(app)/admin/access-grants/**` and `src/lib/admin/access-grants.ts`, owned by the parallel access-grants task).
- All migrations under `supabase/migrations/`.
- `src/i18n/he.json` and `src/i18n/en.json`.
- `docs/12_CURRENT_STATE.md` and `docs/handoff.md`.
- All other existing docs under `docs/` (00–12) — read as inputs only.

## Validation

- `git diff --check` — run on the working tree; no whitespace errors. No build was run because no code was changed.
