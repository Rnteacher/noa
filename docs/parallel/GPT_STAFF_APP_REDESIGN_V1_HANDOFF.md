# GPT Staff App Redesign V1 Handoff

Implements the visual direction and 4-tab navigation from Ronen's Claude Design mockup ("עיצוב מחדש עם תפריט תחתון", project `f2664526-8c42-4b3d-a774-9a517faf1034`, file `Staff App Redesign.dc.html`), imported live via the Claude Design MCP — full rationale and per-tab detail in `docs/29_STAFF_APP_REDESIGN_V1.md`.

---

## 1. Architecture decision

- **Theme system**: 4 explicit themes (light/dark/warm/violet) via a `data-theme` attribute on `<html>`, replacing `prefers-color-scheme`-only dark mode. Server-rendered from a cookie (no flash), client-switchable without a page reload.
- **Navigation**: mockup's 4 tabs (Messages/Calendar/Students/Settings) replace the previous 5 (Dashboard/Today/Students/Announcements/More) — confirmed with the user as an explicit product decision before building, not inferred.
- **Admin reskin**: token-only migration (no new admin-specific visual design), so the same theme choice applies to both mobile and desktop surfaces.
- No new UI/theme library — hand-rolled throughout, matching this repo's established all-hand-built-UI convention.

---

## 2. Files Changed

**New:**
- `src/lib/theme.ts` — theme id list/type, cookie name.
- `src/components/settings/ThemeSwitcher.tsx` — 4-swatch picker + synced logo, client component.
- `src/components/ui/Avatar.tsx` — shared initials-avatar component.
- `src/features/messages/{types,queries}.ts` — merges `getAnnouncements()` + `getNotifications()` into one feed.
- `src/features/calendar-feed/{types,queries}.ts` — extracted today/week event queries from the old dashboard queries.
- `src/features/profile/queries.ts` — minimal current-profile summary for the Settings card.
- `src/app/(app)/messages/{page.tsx,[announcementId]/{page.tsx,AcknowledgeButton.tsx}}` — new Messages tab + moved announcement-detail route.
- `src/app/(app)/calendar/page.tsx` — new Calendar tab (replaces `/today`).
- `src/app/(app)/settings/page.tsx` — new Settings tab (replaces `/more`).
- `public/emblem.svg`, `public/logo-dark-text.svg`, `public/logo-light-text.svg` — written from the Design project's assets (with a fill-color fix — see §5).

**Modified:**
- `src/app/globals.css` — full theme-token rewrite + `@custom-variant dark` redefinition (see §5) + FullCalendar CSS vars aligned to tokens.
- `src/app/layout.tsx` — Heebo font, server-side theme-cookie read.
- `src/components/ui/{Card,AppHeader}.tsx`, `index.ts` — new card radius/shadow, `AppHeader` large-title variant, `Avatar` export.
- `src/components/ui/BottomNav.tsx` — rewritten to the 4 new tabs.
- `src/components/layout/AdminShell.tsx` + all 34 files under `src/app/(app)/admin/**` — migrated off raw `zinc-*`/`emerald-*`/`amber-*` classes onto the shared semantic tokens.
- `src/app/(app)/students/page.tsx` — pill search bar, `Avatar`, plain status dot.
- `src/app/(app)/notifications/page.tsx`, `MarkNotificationReadButton.tsx`, `MarkAllNotificationsReadButton.tsx` — fixed the undefined `primary-*`/`neutral-*` class bug (see §5).
- `src/proxy.ts`, `src/app/auth/callback/route.ts`, `src/app/page.tsx` — post-auth redirect target `/dashboard` → `/calendar`.
- `src/features/{students,notifications,learning-groups,calendar,announcements}/{actions,admin-actions}.ts`, `src/features/calendar/google-sync-actions.ts`, `src/features/notifications/push-actions.ts` — `revalidatePath('/dashboard')`/`'/more'`/`'/announcements'` repointed to whichever new route actually renders that data now (or removed where nothing does).
- `src/i18n/{he,en}.json` — new keys for the new screens, 16 dead keys removed.

**Deleted:**
- `src/app/(app)/{dashboard,today,announcements,more}/` (all route files) and `src/features/dashboard/{queries,types}.ts` — content fully migrated first, confirmed via `tsc`/`build` before and after removal.

---

## 3. Verification Results

### Automated

- `npx tsc --noEmit` — Pass.
- `npm run check:no-hebrew-in-code` — Pass (one violation found and fixed mid-pass — see §5).
- `npm run lint` — Pass, 0 warnings/errors.
- `npm run build` — Pass; final route list confirmed correct (`/calendar`, `/messages`, `/messages/[announcementId]`, `/settings`, `/students`, `/students/[studentId]`, all `/admin/*` unchanged; no `/dashboard`/`/today`/`/announcements`/`/more`).
- `npm run test:calendar` — Pass, 53/53 (unrelated to this pass, confirms no regression).
- `npm run validate:import -- docs/import/examples` — Pass (unrelated, confirms no regression).
- `git diff --check` — Pass (line-ending warnings only, pre-existing repo convention).

### Browser verification

Performed against a throwaway local manager profile (`noa.smoketest@chamama.org`, deleted afterward), authenticated via the same GoTrue-password-grant + cookie-injection technique used in the prior Noa Annual Gantt Pilot v1 closeout session.

**Confirmed working, live:**
- All 4 tabs (`/messages`, `/calendar`, `/students`, `/settings`) load with real seeded data and the correct BottomNav routes (`read_page` confirmed exactly `/messages`, `/calendar`, `/students`, `/settings` as the 4 nav links).
- Messages tab renders the seeded announcement correctly through the new merged-feed query.
- Students tab renders all 6 seeded students with the new `Avatar` initials style.
- Settings tab renders the profile card, both notification link-rows, the theme-picker card (all 4 theme labels present), and the sign-out row.
- **Theme switching**: clicking the "dark" swatch immediately set `data-theme="dark"` on `<html>`, updated `document.body`'s computed background to `rgb(0, 0, 0)` and `--accent` to `#409cff` (both exact mockup values), and wrote the `chm-theme=dark` cookie — all confirmed via direct `getComputedStyle`/`document.cookie` inspection, not visual impression.
- **Persistence**: navigating to a fresh route (`/calendar`) after the switch re-rendered with `data-theme="dark"` already applied server-side (cookie correctly read in `layout.tsx`), no flash back to light.
- **Admin shell theming**: navigating to `/admin/groups` while dark theme was active showed the sidebar's computed background as `rgb(28, 28, 30)` (`#1c1c1e`, exactly `--surface-raised` for dark) and body text as `rgb(245, 245, 247)` (`#f5f5f7`, exactly `--ink` for dark) — confirming the token migration correctly cascades to admin. The groups list itself still rendered correctly with real data, confirming the token migration didn't break admin functionality.
- RTL (`dir="rtl"`) and Hebrew (`lang="he"`) confirmed intact on `<html>` throughout.
- No console errors at any point (`read_console_messages` checked with `onlyErrors: true`).

**Not verified via screenshot**: the Browser pane's `computer` screenshot action timed out on every attempt this session (an environment/tool issue — every non-visual interaction on the same pages worked normally throughout, including `get_page_text`, `read_page`, and `javascript_tool`). Verification relied on those text/DOM/computed-style checks instead. This is a real, disclosed gap in what was literally seen rendered pixel-for-pixel, not a claim that the visuals are unverified — the computed-style checks are arguably more precise than a visual scan (exact hex values against the mockup's literal spec), but a human has not yet eyeballed the running app side-by-side with the mockup.

All test data (the throwaway manager profile) was deleted afterward.

---

## 4. Bugs found and fixed during this pass

1. **`dark:` Tailwind variant silently broken app-wide by the theme-system change**: switching from `prefers-color-scheme` to an explicit `data-theme` attribute meant Tailwind's default `dark:` variant (which only understands the OS media query) stopped matching anything, breaking every pre-existing `dark:`-styled element in 46 files. Caught before it could ship as a regression; fixed with a single `@custom-variant dark` redefinition in `globals.css` rather than touching 46 files individually.
2. **`Card` `className` override didn't reliably work**: `src/lib/cn.ts` is plain string concatenation, not a Tailwind-conflict-resolving merge — passing `className="p-0"` to override the card's built-in `p-4` doesn't reliably win in the generated CSS cascade. Fixed by switching to this codebase's own pre-existing `-mx-4 -my-4` wrapper convention (already used on the pages this redesign touched) instead of introducing a new, fragile override pattern.
3. **Notifications page used undefined `primary-*`/`neutral-*` Tailwind classes**: no `--color-primary-*` token has ever existed in this codebase's `globals.css`, meaning the unread-notification highlight, "mark all read" button, and "view" link had been rendering completely unstyled (default browser colors) regardless of theme, pre-dating this redesign. Fixed by mapping them onto the real `accent`/`surface-sunken` tokens.
4. **Design-asset SVG fill colors missing on import**: both logo SVGs' `<style>` blocks were empty as returned by the Design MCP (`.cls-1` had no color rule) — would have rendered as invisible text or a solid black box. Inferred and applied the correct colors from the file-naming convention and the mockup's own theme-conditional usage (see `docs/29_STAFF_APP_REDESIGN_V1.md` §2).
5. **`next/image` blocks SVG by default**: initially used `next/image` for the theme-appropriate logo; Next.js's built-in Image Optimization API refuses to serve SVGs unless `images.dangerouslyAllowSVG` is explicitly set (a deliberate security default). Rather than loosen that app-wide security setting for one small static logo, switched to a plain `<img>` tag — which is also what the source mockup itself uses.
6. **Hebrew literal in code**: a hardcoded `'ח'` fallback initial in the new Settings page tripped `check:no-hebrew-in-code`; moved into `he.json`/`en.json` as `settings.profileInitialFallback`.
7. **Dead `revalidatePath` calls pointing at routes that no longer exist**: every `revalidatePath('/dashboard')`/`'/more'`/`'/announcements'` call across ~8 server-action files was either repointed to the new route that actually renders the affected data, or removed where nothing does anymore (e.g. the old dashboard's followed-student count, which has no home in the new IA). Left unfixed, these would have silently stopped invalidating the Next.js cache for the pages users are actually looking at.

---

## 5. Deferred / Known Limitations

- Admin desktop panel/card corner radii were not bumped to match the new rounder mobile aesthetic — token-correctness only, no new admin visual composition was designed (the mockup has no desktop reference).
- Messages tab shows an unread-dot instead of the mockup's illustrative "importance" badge for student-update rows, since the real `notifications` table has no importance/severity field to honor.
- Students tab search remains server-submitted (`?q=` form), not the mockup's implied client-side live filter.
- No RLS, migrations, or server-action business logic changed — visual/IA layer only.
- A human visual pass against the running app (screenshot tooling permitting) has not yet happened; all verification above is DOM/computed-style-based.
