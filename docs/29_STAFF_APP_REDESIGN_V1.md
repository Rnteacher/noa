# 29 — Staff App Redesign v1

This document tracks the implementation of a new visual direction and navigation structure for the Chamama staff app, sourced from a Claude Design mockup Ronen authored ("עיצוב מחדש עם תפריט תחתון" / "Redesign with bottom menu", project `f2664526-8c42-4b3d-a774-9a517faf1034`, file `Staff App Redesign.dc.html`), imported live via the Claude Design MCP (`list_files`/`get_file`, not screenshots or manual transcription).

---

## 1. Problem statement

The staff mobile app's visual language and 5-tab navigation (Dashboard/Today/Students/Announcements/More) predated a new design Ronen created directly in Claude Design. That mockup specifies: a 4-tab structure (Messages/Calendar/Students/Settings), an iOS-card visual language (18px-radius cards, icon-wrap rows, avatar-with-initials), a real 4-theme switcher (light/dark/warm/violet, user-selected and persisted — not just automatic OS dark mode), and Heebo typography. The admin desktop shell (a separate, older, hardcoded-color surface) was in scope for a token-level reskin so the same theme choice applies everywhere, even though the mockup itself only shows the mobile phone frame.

---

## 2. Source design and import method

Read directly from the Design MCP: `get_project` confirmed the project, `list_files` returned `Staff App Redesign.dc.html` plus 3 SVG assets (`emblem.svg`, `logo-dark-text.svg`, `logo-light-text.svg`) and `support.js`; `get_file` returned the full `.dc.html` source (a React-like component with inline style objects, a `THEMES` object, and mock data arrays) and the 3 SVGs. All implementation decisions below were derived from reading that source directly, not from a screenshot or a paraphrase.

One asset-fidelity issue was found and fixed during import: both logo SVGs' `<defs><style>` blocks were empty in the exported file (the `.cls-1` class had no color rule), which would have rendered as an invisible-text or solid-black-box logo. Inferred the intended colors from the file-naming convention and the mockup's own theme-conditional usage (`isDarkTheme ? logo-light-text.svg : logo-dark-text.svg`): `logo-dark-text.svg` = dark (near-black, left as SVG default) glyphs for light-ish themes, transparent artboard rect; `logo-light-text.svg` = white glyphs for the dark theme, transparent artboard rect. Both written to `public/`.

---

## 3. Theme system

`src/app/globals.css` was rewritten from a single `prefers-color-scheme: dark` media-query block to 4 explicit `[data-theme="..."]` attribute blocks (`light` = also the `:root` default, `dark`, `warm`, `violet`), with every color value taken directly from the mockup's `THEMES` object (`bg`→`--surface`, `cardBg`→`--surface-raised`, `divider`→`--line`, `ink`/`inkSecondary`/`inkMuted`, `accent`/`accentSoft`) plus two new tokens the mockup needed (`--tab-bar-bg` for the translucent nav bar, `--shadow-card` for the two-layer card shadow, exposed as a `.chm-card-shadow` utility class). Status colors (positive/caution/critical) are intentionally identical across all 4 themes, matching the mockup's own theme-independent `STATUS_META`.

**Correctness fix applied during this pass, not originally planned**: switching dark-mode detection from `prefers-color-scheme` to an explicit `data-theme` attribute silently broke every pre-existing `dark:` Tailwind class in the codebase (46 files), since Tailwind's default `dark:` variant only understands the OS media query. Fixed by adding `@custom-variant dark (&:where([data-theme="dark"], [data-theme="dark"] *));` to `globals.css`, which redefines `dark:` app-wide to key off the same explicit theme choice — restoring correctness for every file without needing to touch each one individually.

`src/lib/theme.ts` defines the theme id list/type and the `chm-theme` cookie name. `src/app/layout.tsx` reads that cookie server-side (`next/headers` `cookies()`) and sets `data-theme` directly on the server-rendered `<html>` element — no client-side flash-of-wrong-theme on load, unlike a typical client-only theme script. The body font moved from Geist to Heebo (`next/font/google`, weights 400–800, hebrew+latin subsets); Geist Mono was kept for existing tabular/monospace uses elsewhere in the app.

`src/components/settings/ThemeSwitcher.tsx` (client component) renders the 4 swatch buttons plus the theme-appropriate logo underneath (both driven by one shared `useState`, so the logo swaps instantly when a swatch is tapped, not just on next page load); on click it sets `document.documentElement.dataset.theme` directly and writes the `chm-theme` cookie (1-year `max-age`, no server round-trip needed for a pure display preference).

---

## 4. Navigation restructure

Confirmed with Ronen before building (this was a genuine product decision, not something to infer): collapse 5 tabs into the mockup's 4 (Messages/Calendar/Students/Settings), redistributing Dashboard's content into the other tabs, and merging Announcements with the existing student-update Notifications feed into one unified Messages list.

- `src/components/ui/BottomNav.tsx` — 4 items (`/messages`, `/calendar`, `/students`, `/settings`), unread-count badge moved from the old `/more` tab to `/messages` (where notifications now surface).
- `/dashboard`, `/today`, `/announcements`, `/more` route folders and `src/features/dashboard/{queries,types}.ts` were deleted once their content was fully migrated. `/calendar` is the new default landing route (matches the mockup's `defaultTab: 'calendar'`) — repointed everywhere a `/dashboard` redirect or link existed: `src/proxy.ts` (post-auth redirect), `src/app/auth/callback/route.ts`, `src/app/page.tsx`, `src/components/layout/AdminShell.tsx` (both the mobile-header home icon and the sidebar "back to staff" link), and every admin page's "back to dashboard" link.
- Every `revalidatePath('/dashboard')` call across server actions was repointed to whichever new tab actually displays that data now (`/calendar` for calendar-event mutations in `features/calendar/admin-actions.ts` and `google-sync-actions.ts`; `/messages` for announcement mutations in `features/announcements/{actions,admin-actions}.ts` and notification-read actions in `features/notifications/{actions,push-actions}.ts`; `/settings` for push-subscription actions), or removed outright where the underlying data (e.g. the old dashboard's followed-student count) has no home in the new IA and was never re-added. This was a real correctness fix, not cosmetic — without it, mutations would have silently stopped invalidating the Next.js cache for the pages that actually show their results.

---

## 5. Messages tab (new unified feed)

`src/features/messages/queries.ts` — `getMessagesFeed()` calls the existing `getAnnouncements()` and `getNotifications()` queries (unchanged, no new tables) and merges them into one date-sorted array (`kind: 'announcement' | 'update'`), matching the mockup's `MESSAGES_DATA` shape exactly: announcement rows show a caution badge only while `requires_acknowledgement && !acknowledged` (matching the mockup's example, not literal fidelity to every historical ack state); update rows show a small accent unread-dot instead of the mockup's illustrative "importance" badge, since the real `notifications` table has no importance/severity concept to honor — inventing one would have been fabricating business logic rather than reading it off the data model.

`src/app/(app)/messages/page.tsx` (large-title header, one card, icon-wrap rows with pinned-star and unread-dot treatment lifted directly from the mockup's inline SVGs) plus `src/app/(app)/messages/[announcementId]/page.tsx` + `AcknowledgeButton.tsx` (moved from the old `/announcements/[announcementId]`, logic unchanged).

---

## 6. Calendar tab

`getDashboardData()` was split: `src/features/calendar-feed/queries.ts`'s `getCalendarFeedData()` extracts just the today/week `calendar_events` queries (identical SQL/logic to the old dashboard, no behavior change). `src/app/(app)/calendar/page.tsx` (replaces the old `/today` placeholder) renders the mockup's "היום בחממה" (time-chip rows) and "השבוע" (day-chip rows) cards, with a large-title header showing today's date as a subtitle — the one tab where the mockup's `isCalendarTab` conditional adds that subtitle.

---

## 7. Students tab

Restyled in place (route unchanged): pill-shaped search bar (icon + input in a `cardBg` pill, matching the mockup's `searchWrap`), the new shared `Avatar` component (rounded-13px square initials) replacing inline avatar markup, and the mockup's plain 10px status dot replacing the old icon-in-badge trailing indicator. Search functionality (server-side `?q=` form submit) is unchanged — the mockup's own client-side live-filter behavior wasn't replicated, since this is a Server Component page by existing convention, not a client-filtered list.

---

## 8. Settings tab

`src/features/profile/queries.ts`'s `getCurrentProfileSummary()` (new, minimal — `full_name` + super-admin flag) backs `src/app/(app)/settings/page.tsx` (replaces `/more`): profile card (large circular initials avatar, greeting, school name), the same notification link-rows the old `/more` page had (unchanged destinations), the `ThemeSwitcher` card, the theme-appropriate logo, and a full-width red sign-out row. The old dashboard's super-admin `/admin/access-grants` shortcut was preserved here (conditionally rendered), since Settings is now the closest equivalent surface to where it used to live.

---

## 9. Shared UI primitives

- `Card.tsx` — radius bumped to the mockup's 18px, switched from a bordered `shadow-sm` to the new borderless two-layer `chm-card-shadow`.
- `AppHeader.tsx` — added a `variant="large"` mode (30px/800 title, optional subtitle, non-sticky) for the 4 tab roots, alongside the existing compact sticky/back-button mode used on sub-pages (student detail, message detail, notifications).
- New `Avatar.tsx` (initials, `sm`/`md`/`lg` sizes) replacing duplicated inline avatar markup across Students/Settings.

**Real bug found and fixed while building these**: `Card`'s existing `className` merge helper (`cn()` in `src/lib/cn.ts`) is a plain string-concatenation join, not a Tailwind-conflict-resolving merge (no `tailwind-merge`). Passing `className="p-0"` to override the card's built-in `p-4` padding — the approach initially used on the Messages/Calendar/Students cards — does not reliably win in the generated CSS cascade (both `p-4` and `p-0` end up present; whichever Tailwind happens to generate later wins, not source order). Fixed by adopting the codebase's own pre-existing convention instead (already used on the old dashboard/students/announcements pages): wrap dense row lists in a `-mx-4 -my-4` div to visually cancel the card's own padding, rather than trying to override it.

---

## 10. Admin desktop shell reskin

`AdminShell.tsx` and every file under `src/app/(app)/admin/**` (34 files) hardcoded raw `zinc-*`/`emerald-*`/`amber-*` Tailwind classes with manual `dark:` pairs — a completely separate, older styling system from the token-based one the mobile app already used. Migrated onto the shared semantic tokens via a scripted, word-boundary-safe find/replace (`bg-surface(-raised/-sunken)`, `text-ink(-secondary/-muted)`, `border-line`, `bg-accent`/`text-accent`/`bg-accent-soft` for active-nav/primary actions, `bg-status-caution(-soft)` for warnings), applied uniformly to both the plain and `dark:`-prefixed forms of each class (safe/inert duplication where both resolve to the same token — no structural JSX risk from string-level substitution). This was verified live: switching to dark theme in Settings immediately re-themes `/admin/groups`' sidebar and body to the exact same computed colors as the mobile app (confirmed via computed-style inspection, not just visual impression). A handful of non-standard, already-inert shade classes the codebase had accumulated over time (`zinc-750`, `zinc-850`, `emerald-455`, etc. — not part of Tailwind's real color scale, so they were already generating no CSS at all) were folded into the nearest real token rather than preserved.

Card/panel corner-radius alignment with the new rounder mockup aesthetic was **not** done for admin — out of scope for a token-correctness pass, and the mockup has no desktop reference to match against.

---

## 11. i18n and incidental fixes

- Added `nav.messages`, `settings.*` (theme labels, school name, logo alt, profile-initial fallback), `messages.*` (empty state, generic update subtitle) to `he.json`/`en.json`.
- Removed 16 keys that became genuinely dead after the route restructure (`nav.dashboard`, `nav.today`, all `placeholder.*` keys, several `dashboard.*` keys never referenced outside the deleted dashboard page) — confirmed dead via a zero-usage grep before deleting, not assumed.
- **Real bug found and fixed**: `src/app/(app)/notifications/page.tsx` and its two button components referenced `primary-*`/`neutral-*` Tailwind classes that were never defined anywhere in this codebase's token system (no `--color-primary-*` exists in `globals.css`) — meaning the unread-notification highlight, the "mark all read" button, and the "view" link had been rendering with **zero** styling (default browser black-on-transparent) since whenever they were written, regardless of theme. Fixed by mapping them onto the real `accent`/`surface-sunken` tokens.
- A Hebrew-literal-in-code violation (`'ח'` as a hardcoded profile-avatar fallback initial) was caught by `npm run check:no-hebrew-in-code` and moved into `he.json`/`en.json` as `settings.profileInitialFallback`.

---

## 12. Verification

`npx tsc --noEmit`, `npm run check:no-hebrew-in-code`, `npm run lint`, `npm run build`, `npm run test:calendar` (53/53, unaffected), `npm run validate:import -- docs/import/examples`, and `git diff --check` all pass clean.

Browser-verified live against a throwaway local manager profile (deleted afterward): all 4 tabs load with real seeded data and correct routes; theme switching in Settings applies instantly and persists across a full page navigation via the cookie (confirmed server-rendered on the very next request, no flash); computed CSS values were checked directly rather than relied on visually — e.g. dark theme's `--accent` resolved to exactly `#409cff` and body background to `rgb(0, 0, 0)`, matching the mockup's literal values; `/admin/groups` was confirmed to pick up the same theme change with correct computed sidebar/text colors, and its actual functionality (group list rendering) was unaffected by the token migration; RTL (`dir="rtl"`) and Hebrew (`lang="he"`) were confirmed intact throughout.

**One disclosed verification gap**: the Browser pane's screenshot tool timed out repeatedly this session (a tool/environment issue — `get_page_text`, `read_page`, `read_console_messages`, and `javascript_tool` all worked normally throughout, so this wasn't a page-rendering problem). Verification relied on those text/DOM/computed-style checks instead of visual screenshots. This is disclosed rather than papered over; the underlying checks performed are arguably more precise (exact hex/rgb values against the mockup's literal spec) but a human has not yet visually eyeballed the running app against the mockup side-by-side.

---

## 13. Known limitations / explicit non-goals

- Admin desktop card/panel corner radii were not bumped to match the new rounder mobile aesthetic (token-correctness only, no new admin-specific visual design).
- The Messages tab's "importance" badge concept from the mockup's illustrative data was not implemented for real notifications (no such field exists on the `notifications` table); an unread-dot is shown instead.
- Students tab search remains server-submitted (`?q=` form), not the mockup's implied live client-side filter.
- No RLS, migrations, or server-action business logic changed anywhere in this pass — visual/IA layer only.

---

## 14. Next steps

Nothing was committed as part of this pass. A human visual pass against the running app (ideally once the screenshot tool issue clears) is the natural next step before considering this fully closed out.
