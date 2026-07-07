# Handoff — Claude Base Components (UI Foundation Implementation)

## Summary

First implementation pass of the UI foundation from `docs/design/05_VISUAL_SYSTEM_DIRECTION.md`: semantic design tokens in the Tailwind v4 theme layer, a small base component kit under `src/components/ui/`, the navigation/status i18n labels they need, and an internal component showcase at `/dev/ui`.

No migrations, seed data, auth logic, or access-grants server actions were touched. Existing screens (`/dashboard`, `/admin/access-grants`) were **not** migrated to the new kit — that is a follow-up task.

## Files changed

### Created

- `src/components/ui/Card.tsx`
- `src/components/ui/ListRow.tsx`
- `src/components/ui/StatusBadge.tsx`
- `src/components/ui/EmptyState.tsx`
- `src/components/ui/Skeleton.tsx`
- `src/components/ui/Alert.tsx`
- `src/components/ui/BottomNav.tsx`
- `src/components/ui/AppHeader.tsx`
- `src/components/ui/index.ts` (barrel re-exports)
- `src/lib/cn.ts` (tiny conditional class-join helper; no new dependency)
- `src/app/(app)/dev/ui/page.tsx` (internal component showcase)
- `docs/parallel/CLAUDE_BASE_COMPONENTS_HANDOFF.md` (this file)

### Modified

- `src/app/globals.css` — semantic design tokens (see below).
- `src/i18n/he.json` / `src/i18n/en.json` — added `nav.more`, `nav.main`, `common.back`, `status.positive`, `status.caution`, `status.critical`.

## Design tokens (`src/app/globals.css`)

The project uses Tailwind CSS v4, so there is no `tailwind.config.ts`; tokens live in CSS as `:root` variables mapped through `@theme inline`, generating semantic utilities:

- Surfaces: `bg-surface`, `bg-surface-raised`, `bg-surface-sunken` (warm neutral family).
- Text: `text-ink`, `text-ink-secondary`, `text-ink-muted`.
- Borders: `border-line`.
- Interactive accent: `accent`, `accent-strong`, `accent-soft`, `on-accent` — a calm blue, deliberately distinct from the traffic-light hues.
- Traffic-light statuses: `status-positive` / `status-caution` / `status-critical`, each with a `-soft` tint for badge/alert backgrounds.

Dark appearance is handled by swapping the raw `:root` values under `prefers-color-scheme: dark`, so components built on tokens need no `dark:` variants. The legacy `--background` / `--foreground` variables now alias the new tokens so pre-existing screens keep working. The body font stack now routes through `--font-sans` with Hebrew-capable system fallbacks.

## Components added

1. **Card** — soft raised container; optional title/description header; spacing/rounding per the "soft cards on a quiet background" direction.
2. **ListRow** — title, subtitle, `leading`/`trailing` slots, optional `href`. With `href` the entire row is a single `next/link` target with hover + inset focus ring and a ≥56px touch height. Uses only logical/direction-agnostic utilities (`text-start`, flex + `gap`).
3. **StatusBadge** — semantic variants `positive` / `caution` / `critical` (never raw status strings inside the component). Each variant pairs color with a distinct glyph shape (circle-check / triangle-alert / octagon-alert) so color never carries meaning alone. `label` is a required caller-translated string; `hideLabel` collapses to glyph-only while keeping the label as `sr-only` text (dot-style usage in list rows). Sizes `sm` / `md`.
4. **EmptyState** — icon → headline → optional hint → optional single action, matching the shared empty-state vocabulary.
5. **Skeleton / SkeletonText / SkeletonCircle** — pulse placeholders, `aria-hidden`, `motion-reduce:animate-none`.
6. **Alert** — inline feedback with `info` / `success` / `warning` / `danger` variants; `role="alert"` for warning/danger, `role="status"` otherwise. Feedback variants intentionally share hues with accent/status tokens per doc 05 (same hue, different usage context).
7. **BottomNav** — client component (uses `usePathname` for active state). Five slots: Dashboard (`/dashboard`), Today (`/today`), Students (`/students`), Announcements (`/announcements`), More (`/more`). Labels from i18n; `aria-current="page"` on the active tab; safe-area bottom padding; active tab colored with the interactive accent (not green, so it never reads as a status).
8. **AppHeader** — sticky compact header with title, optional back link (icon flips via `rtl:-scale-x-100`), and an end-side `trailing` slot.

## i18n keys added

| Key | Hebrew | English |
|---|---|---|
| `nav.more` | more-tab label | "More" |
| `nav.main` | nav aria-label | "Main navigation" |
| `common.back` | back-affordance label | "Back" |
| `status.positive` | on-track status label | "On track" |
| `status.caution` | needs-attention label | "Needs attention" |
| `status.critical` | needs-intervention label | "Needs intervention" |

## Design decisions

1. **Tokens live in CSS, not a Tailwind config** — Tailwind v4's `@theme inline` is this project's token layer; component code uses only semantic utility names, no raw color values.
2. **Interactive accent is blue** — doc 05 requires the accent to never masquerade as a status. The existing dashboard uses emerald (green) as its accent; the kit deliberately breaks from that (see deviations).
3. **ListRow supports `href` only, not `onClick`** — keeps it a server component. Interactive rows needing client handlers can compose the same slots inside a client wrapper later; foundation stays simple.
4. **StatusBadge takes a translated `label` prop** — the component maps variants to visuals only; text stays in the i18n layer at call sites.
5. **RTL safety via logical utilities** — `text-start`, flex `gap`, `divide-y`, and `rtl:` flips for directional icons; no `left`/`right`/`ml`/`mr` utilities anywhere in the kit.
6. **Showcase page placed under `(app)`** — `src/proxy.ts` protects every non-public route, so `/dev/ui` requires an authenticated active staff session with zero extra routing logic. It renders static examples from existing `mock.*` keys, independent of seed data.

## Deviations from doc 05

1. **Accent color vs. existing screens:** the kit's blue accent follows doc 05, but the existing dashboard/access-grants screens still use emerald as their interactive color. Migrating them is out of scope here; until then the app shows two accents.
2. **Typeface:** doc 05 calls for one Hebrew-Latin family. Geist (current font) has no Hebrew subset; Hebrew currently falls back to system fonts via the updated `--font-sans` stack. Selecting and loading a proper Hebrew webfont (e.g., Noto Sans Hebrew / Heebo / Assistant) is deferred.
3. **Dark mode is implemented, not just "kept possible":** doc 05 targets light-only for v1, but the existing codebase already ships `dark:` styles, so the token layer includes dark values to stay consistent with current behavior.

## Deferred items

1. **Toast system** — implemented `Alert` (inline) instead, as permitted by the task. A toast/queue system needs a client-side provider and belongs with the first interactive mutations.
2. **BottomNav badges** (unread/acknowledgement counts) — needs the data layer.
3. **BottomSheet** — listed in doc 05's vocabulary; not part of this task's required set.
4. **Hebrew webfont selection** (see deviations).
5. **Migration of existing screens** (`/dashboard`, `/admin/access-grants`) onto the kit and tokens.
6. **Routes referenced by BottomNav** (`/today`, `/students`, `/announcements`, `/more`) do not exist yet; links 404 until those screens are built (per task instructions to use the route hrefs now).

## Validation results

- `npm run check:no-hebrew-in-code` — passed.
- `npm run lint` — passed.
- `npm run build` — passed (includes `/dev/ui` route).
- `git diff --check` — passed.
