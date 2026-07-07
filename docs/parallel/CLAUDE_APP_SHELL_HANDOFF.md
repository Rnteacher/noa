# Handoff — Claude App Shell (Header + Bottom Nav Integration)

## Summary

Wired the base UI kit into the protected application area: a shared `(app)` layout now owns the persistent `BottomNav`, each staff-facing screen renders its own `AppHeader`, and the four missing tab routes exist as protected i18n-only placeholder pages. `/dashboard`, `/admin/access-grants`, and `/dev/ui` all still build and render inside the shell.

No migrations, seed data, auth logic, RLS/SQL, or access-grants server actions were touched.

## Files changed

### Created

- `src/app/(app)/layout.tsx` — shared protected app shell.
- `src/app/(app)/today/page.tsx` — placeholder tab page.
- `src/app/(app)/students/page.tsx` — placeholder tab page.
- `src/app/(app)/announcements/page.tsx` — placeholder tab page.
- `src/app/(app)/more/page.tsx` — placeholder tab page.
- `docs/parallel/CLAUDE_APP_SHELL_HANDOFF.md` (this file).

### Modified

- `src/app/(app)/dashboard/page.tsx` — swapped its inline header for `AppHeader` (bell action moved to the header's `trailing` slot with a logical `end-2` badge offset), removed its private non-navigating bottom nav in favor of the shared shell, and merged its two wrapper divs into one `max-w-md` column. Mock content sections are untouched.
- `src/app/(app)/dev/ui/page.tsx` — removed its own `BottomNav` render (now provided by the layout) and fitted its root to the shell (`flex-1` instead of `min-h-screen` + bottom padding).
- `src/i18n/he.json` / `src/i18n/en.json` — five placeholder keys (see below).

## Layout strategy

**Nav in the layout, headers in the pages.**

- `src/app/(app)/layout.tsx` renders a `min-h-screen` flex column with `pb-20` (clears the ~64px fixed tab bar plus breathing room) around `{children}`, then `BottomNav` as a sibling. The layout imposes **no width constraint**, so the desktop-first `/admin/access-grants` page keeps its `max-w-5xl` layout unchanged; mobile-first pages apply their own centered `max-w-md` column.
- `AppHeader` is rendered **per page**, not in the layout: titles differ per screen, the dashboard header carries a custom trailing action (notification bell), and future push-over detail screens (student card, announcement detail) will need back affordances and different header content. A layout-level header would immediately need per-page escape hatches.

## Routes added

- `/today`
- `/students`
- `/announcements`
- `/more`

Each is a server component under the `(app)` group, protected automatically by `src/proxy.ts` (every non-public route requires an authenticated active-staff session). Each renders `AppHeader` (title from `nav.*` keys) plus an `EmptyState` with a tab-appropriate icon and a "coming soon" description — no data queries.

## Components integrated

- `BottomNav` — once, in the `(app)` layout; active-tab state comes from `usePathname` inside the component. Slots: `/dashboard`, `/today`, `/students`, `/announcements`, `/more`.
- `AppHeader` — on `/dashboard` (title + bell trailing action), on the four placeholder pages (title only), and already on `/dev/ui` from the previous task.
- `EmptyState` — placeholder content on the four new pages.

## i18n keys added

| Key | Purpose |
|---|---|
| `placeholder.comingSoon` | Shared placeholder headline ("Coming soon") |
| `placeholder.today` | Today-tab placeholder description |
| `placeholder.students` | Students-tab placeholder description |
| `placeholder.announcements` | Announcements-tab placeholder description |
| `placeholder.more` | More-tab placeholder description |

Page titles reuse the existing `nav.*` keys; no navigation/accessibility keys were missing (`nav.main`, `common.back` already exist from the base-components task).

## Deliberately deferred

1. **Admin shell:** `/admin/access-grants` currently renders inside the same shell, so the mobile tab bar also appears there. Harmless (the page keeps its full-width desktop layout and the shell adds only bottom padding), but the design docs call for a desktop side-nav admin frame — that belongs to a future admin-layout task, likely as a separate route group.
2. **Push-over behavior for detail screens** (tab bar hidden under student card / announcement detail) — no such screens exist yet; the pattern is documented in the wireframes.
3. **BottomNav badges** (unread/acknowledgement counts) — needs the data layer.
4. **Dashboard visual migration:** the dashboard's mock content sections still use direct zinc/emerald classes rather than the semantic tokens; only its wrapper, header, and nav were touched, per the task scope.
5. **Dashboard bell action** is still a non-functional mock button, as before.

## Validation results

- `npm run check:no-hebrew-in-code` — passed.
- `npm run lint` — passed.
- `npm run build` — passed; route list includes `/dashboard`, `/admin/access-grants`, `/dev/ui`, `/today`, `/students`, `/announcements`, `/more`.
- `git diff --check` — passed.
