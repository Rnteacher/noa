# 30 — Staff App Redesign v1: Feedback Fixes

This document covers four follow-up passes after `docs/29_STAFF_APP_REDESIGN_V1.md` shipped: (1) a round of 8 items of direct user feedback (A–H) after using the redesigned app, (2) a first attempt at the resulting session-loss bug report that turned out to be an incorrect diagnosis, (3) a corrected root-cause investigation and real fix, and (4) a pre-deploy closeout that removed a remaining risky dependency, gated new diagnostics, and corrected overstated claims from round 3.

---

## Round 1 — Direct feedback (A–H)

Ronen's feedback after using the redesigned app, verbatim intent preserved:

- **A. Icon fidelity** — bottom-nav icons didn't match the mockup's custom glyphs.
- **B. Session loss (settings → messages)** — navigating from Settings to Messages required logging in again.
- **C. Can't reach admin** — "not possible to log in to the backend management system."
- **D. Notification/push config** — "not possible to configure the notifications and the browser push notifications."
- **E. Settings logo** — remove the logo image below the theme picker; replace with "אפליקציית נעה - גרסה 0.1".
- **F. School logo missing** — the emblem shown in the mockup should appear in the running app.
- **G. Terminology** — replace "תלמיד/תלמידים" (student/students) with "חניך/חניכים" (camper/campers) throughout.
- **H. Student card tabs** — reorganize the student detail page into tabs: overview (group, track, project, emotional state, comments), a separate goals tab, and a separate "update details" tab.

### A — Icon fidelity

Re-fetched the mockup's `.dc.html` source directly via the Design MCP (`get_file`) to read the literal inline SVG path data for each bottom-nav icon, rather than approximating with the closest `lucide-react` icon. `src/components/ui/BottomNav.tsx`'s 4 icons (Messages/Calendar/Students/Settings) were rewritten as small inline SVG components using the mockup's exact `<path>`/`<circle>`/`<rect>` data. The Messages-tab row icons (announcement speech-bubble, update concentric-circles, pinned star) were already an exact match from the original pass — confirmed by re-reading the mockup source, not changed.

### B — Session loss (round 1 diagnosis — later superseded, see Round 2)

Initial diagnosis: `src/features/messages/queries.ts`'s `getMessagesFeed()` ran `getAnnouncements()` and `getNotifications()` in `Promise.all`, and each of those independently calls `createClient()` (a fresh Supabase client) + `auth.getUser()`. Two concurrent `getUser()` calls on two independent clients can race on refreshing the same single-use refresh token if the access token happens to be near expiry — one refresh wins, the other invalidates the session. Fixed at the time by sequencing the two calls instead of running them in parallel.

**This was a real bug and a correct fix for that one call site, but it was not the actual root cause** — see Round 2.

### C — Can't reach admin

Two separate issues, both fixed:

1. **Missing entry point.** The only Settings-tab link into `/admin/*` was gated on `isSuperAdmin` (`current_user_is_super_admin`), but most of `/admin/*`'s actual RLS and page-level checks use the broader `current_user_is_manager_or_super_admin`. A `manager`-role account — not `super_admin` — had no way to discover `/admin` from the UI at all, despite having real access to it. Confirmed the old pre-redesign dashboard had the exact same narrow gating (not a regression introduced by the redesign, but never correct either). Fixed: `src/features/profile/queries.ts`'s `getCurrentProfileSummary()` now also returns `isManagerOrSuperAdmin` (via the RPC), and `src/app/(app)/settings/page.tsx` shows a general "ניהול מערכת" shortcut to `/admin/groups` for any manager/super-admin, keeping the existing super-admin-only "ניהול הרשאות כניסה" (`/admin/access-grants`) shortcut separate.
2. **Prefetch-triggered session invalidation** (see Round 2 — this was the actual "kicks me out" mechanism for admin navigation specifically, on top of the missing entry point).

### D — Notification/push configuration

Investigated and found the feature already fully implemented and working: `src/app/(app)/notifications/PushSubscriptionControls.tsx` correctly detects browser support, permission state (default/granted/denied), registers `/sw.js`, and saves/deletes the push subscription via existing server actions. Verified live: in a fresh browser session the component correctly showed "ההתראות חסומות" (blocked) matching the sandbox's actual denied permission state, with no console errors. If this isn't working in Ronen's production environment, the most likely cause is a missing `NEXT_PUBLIC_VAPID_PUBLIC_KEY` (and matching private key) environment variable on the deployment platform — that's a per-environment secret outside this repo's or this session's visibility, not something fixable in code. No code change was made for D.

### E — Settings logo → app name/version text

`src/components/settings/ThemeSwitcher.tsx`: replaced the theme-appropriate logo `<img>` beneath the theme-picker card with static text reading "אפליקציית נעה - גרסה 0.1" (`settings.appVersion` i18n key). The now-unused `settings.logoAlt` key was removed from both `he.json`/`en.json`.

### F — School emblem missing from the app

The mockup places a small (30px) emblem icon at the end side of every tab-root header, next to the title — this had never been implemented; `public/emblem.svg` existed (fetched during the original redesign pass) but was never referenced anywhere in the app. Added directly to `src/components/ui/AppHeader.tsx`'s `variant="large"` header. **A second asset-fidelity bug was found**: like the two logo SVGs found broken during the original pass, `emblem.svg`'s exported `<style>` block was empty (no `fill` rule for its `.cls-1` class), which would render as an invisible-or-solid-black icon depending on browser default. Rather than write a second broken-asset color fix, the emblem was inlined directly as JSX SVG with `fill="currentColor"` (`text-ink` + `opacity-80`), which is also more correct than a static file for a 4-theme app since it adapts automatically instead of needing separate light/dark asset variants.

### G — תלמיד/תלמידים → חניך/חניכים

Confirmed the mockup's own source (re-fetched via Design MCP) already uses "חניכים" throughout (bottom-nav label, students-count label, section labels) — the original redesign pass had used the app's pre-existing "תלמיד" terminology instead of matching the mockup, an inconsistency worth fixing regardless of this being explicitly requested. Replaced all 36 occurrences in `src/i18n/he.json` via an ordered two-pass substring replace (plural "תלמידים"→"חניכים" first, then remaining singular "תלמיד"→"חניך", so the plural doesn't get double-mangled) — this correctly handles Hebrew's prefixed/construct forms (e.g. "התלמיד"→"החניך") since Hebrew definite-article/preposition prefixes attach directly to the word with no infix. Verified each resulting string by re-grepping — all read grammatically correct. `en.json`'s English "student"/"students" was intentionally left unchanged (not the target of the request, and not proven to even be a live locale in this single-locale app).

### H — Student card tabs

`src/app/(app)/students/[studentId]/page.tsx` was a single long scrolling page (contact info, project, emotional status, goals with inline edit forms, messages, message composer, all stacked). Restructured into 3 tabs in a new client component, `src/app/(app)/students/[studentId]/StudentCardTabs.tsx`, while keeping the identity header (avatar, name, group, track/layer, mentors, follow button, photo upload) above the tabs as before:

- **פרטים (Overview, default tab)**: contact info, current project (read-only summary + status badge + assigned masters), emotional status (read-only summary + badge), comments/messages list, and the message composer.
- **מטרות (Goals)**: read-only goals list (title, description/status, primary badge).
- **עדכון פרטים (Update details)**: every edit form that used to be inlined throughout the page — project status update, emotional status update, and full goal management (add/edit/status/set-primary/delete) — consolidated in one place, each section conditionally rendered per the existing permission flags (`canUpdateStatus`, `canUpdateEmotionalStatus`, `canManageGoals`, `canDeleteGoals`) with no change to the underlying authorization logic.

"Group" and "track/major" map onto the two fields the schema already has for this (`student_groups.name`, e.g. "Robotics League", and `student_groups.layer`, e.g. "Tenth") — no new column or migration was needed or added; this is a read-only display/IA change only, same permission model and same underlying queries (`getStudentCard`) as before.

---

## Round 2 — Production session-loss root cause (deeper investigation)

After Round 1 shipped, Ronen reported the "kicks me out" symptom was **broader** than the two spots fixed so far: it also happened navigating Settings → any other tab (not just Messages), and on the Notifications page specifically. This ruled out the Round-1 diagnosis (a single Promise.all in one query function) as the actual root cause and pointed at something systemic.

### First follow-up fix: AdminShell link prefetching

`src/components/layout/AdminShell.tsx`'s desktop sidebar renders ~7 nav links simultaneously (access-grants, calendar, learning-groups, announcements, groups, audit, import-export). Next.js's default link-prefetching fires a background request for every visible link, and each one passes through `src/proxy.ts` (the auth middleware), which independently creates a Supabase client and calls `getUser()`. A burst of ~7 near-simultaneous prefetch requests, if the access token happens to be near expiry at that moment, can race on refreshing the same single-use refresh token — the same failure mode as the Round-1 Messages bug, but at the middleware level instead of within one page's query functions. Fixed by adding `prefetch={false}` to every `Link` in `AdminShell.tsx` (sidebar, mobile drawer — same JSX is reused for both — and the "back to staff" footer/header links), matching the pattern `BottomNav.tsx` already used, plus the two new admin-shortcut links added in Round 1's item C on `src/app/(app)/settings/page.tsx`.

This reduced the frequency of the bug but, per Ronen's next report, did not eliminate it — because it wasn't the actual root cause either, just another instance of the same symptom-producing pattern.

### The actual root cause

`src/lib/supabase/server.ts`'s `createClient()` created a **brand-new Supabase client instance on every single call**, and nearly every query/action function in the codebase calls it independently (`getAnnouncements`, `getNotifications`, `getCurrentProfileSummary`, `getStudentList`, `getCalendarFeedData`, etc. — this was already true before the redesign, not something the redesign introduced). Each client instance has its own internal auth lock; the Supabase JS SDK does serialize concurrent `getUser()`/refresh calls made *on the same client instance*, but has no way to coordinate across *separate* instances. So any page — or even the middleware vs. a page's own query, or two unrelated concurrent requests hitting the middleware — that ends up making more than one `getUser()`-triggering call around the same moment the access token needs refreshing can race, exactly like the two symptom instances found and patched in Round 1 and the AdminShell follow-up. This explains why the bug wasn't confined to Messages or Admin: it could manifest on essentially any page, including Notifications, purely depending on token-expiry timing.

**Fix applied at the time**: wrapped `createClient()` in React's `cache()` (`src/lib/supabase/server.ts`).

> **Correction (Round 3, below): this claim was wrong.** React's `cache()` only memoizes within a single Server Component render pass / Server Action invocation / Route Handler invocation. It is invalidated at the boundary of each request and cannot coordinate `src/proxy.ts`'s middleware invocation with a later page-render invocation, two browser tabs, two unrelated concurrent requests, or two separate Server Action calls — those are genuinely separate executions with no shared memory. `cache()` was a real, harmless optimization for the *specific* `getMessagesFeed()` case (two queries in the *same* page render sharing one client), but it did not and could not close the cross-request race, and this section previously overstated that it did. See Round 3 for the actual fix and for what `cache()` is retained for.

**Why this wasn't caught locally**: reproducing the bug requires the access token to actually be near its ~1-hour expiry at the moment of the request. Every local verification session in this repo (both rounds) used a freshly-issued token (via the GoTrue password-grant + cookie-injection harness), so there was never anything to refresh, and therefore never anything to race on. This remained true in Round 3 even with the real fix in place, for the same reason — see Round 3's local-testing methodology.

---

## Round 3 — Corrected root cause and real fix

Ronen (via a detailed, technically precise brief) corrected the Round 2 claim above: React `cache()` cannot and does not coordinate `src/proxy.ts`'s middleware invocation with a page's render invocation, separate browser requests, or separate Server Action calls — it is request/invocation-scoped only. This correction was verified directly against the installed library source (not taken on faith) and is accurate. This round redid the investigation from the actual auth code and the installed `@supabase/ssr@0.12.0` / `@supabase/supabase-js@2.110.0` source, rather than from inference.

### Confirmed bugs, found by reading the installed library types/docs directly

1. **`redirectWithCookies` in `src/proxy.ts` dropped cookie attributes.** It read full `ResponseCookie` objects (`sourceResponse.cookies.getAll()`, which include `path`/`httpOnly`/`secure`/`sameSite`/`maxAge`) but forwarded only `.name`/`.value` (`response.cookies.set(cookie.name, cookie.value)`). Every redirect that followed a token refresh (login→calendar, →access-denied, →access-pending) re-issued the refreshed auth cookie without those attributes. Fixed by forwarding the full cookie object (`response.cookies.set(cookie)`), which `NextResponse`'s cookie jar accepts directly.
2. **The required CDN no-cache headers were never set.** `@supabase/ssr@0.12.0`'s `setAll` callback signature is `setAll(cookiesToSet, headers)` — the second `headers` argument carries `Cache-Control: private, no-cache, no-store, must-revalidate, max-age=0` / `Expires: 0` / `Pragma: no-cache`, specifically so a response that just set fresh auth cookies is never cached by a CDN/edge layer and replayed to a later request. `src/proxy.ts`'s `setAll(cookiesToSet)` declared only one parameter, silently dropping this. This app is deployed on Vercel, which has an edge/CDN layer local dev doesn't — this is the leading candidate for why the symptom was production-only and correlated with longer-lived sessions (only manifests once an actual refresh occurs). Fixed by accepting and applying `headers` to the response.
3. **`current_user_is_active_staff` RPC errors were silently treated as "not active staff."** `const { data: isActiveStaff } = await supabase.rpc(...)` never inspected `error`; a transient DB/network failure produced `data: null` and fell through to an `/access-pending` redirect — misclassifying an operational failure as a real access decision. Fixed by checking `error` first and, on a genuine RPC error, passing the request through untouched (no redirect, no sign-out) rather than guessing at an access state. The same pattern existed in `src/lib/auth/session.ts`'s `getCurrentAccessState()` (used by the root `/` page) and was fixed the same way, adding a `lookup_error` state to `AppAccessState` that `src/app/page.tsx` renders as a non-destructive inline message instead of a redirect.
4. **`getUser()` instead of `getClaims()`.** This project's session tokens use asymmetric (ES256) signing — confirmed by decoding a real locally-issued JWT header. `getClaims()` verifies locally via WebCrypto/JWKS instead of a network round-trip to the Auth server on every single middleware-covered request, and still transparently refreshes first if the token is near/at expiry. Switched `src/proxy.ts` to `getClaims()`.

### Additional practical mitigation

`src/components/ui/BottomNav.tsx`'s unread-count `useEffect` fired a separate Server Action (`getUnreadNotificationCountAction`) on nearly every navigation into/out of Messages or Notifications — a second, code-controlled authenticated request racing the page's own navigation request. Deferred it by 400ms so the primary navigation's own middleware pass (which refreshes and persists the cookie if needed) completes first in the common case.

### `cache()` in `src/lib/supabase/server.ts`: corrected and retained as option B

Per the brief's explicit instruction, chose **option B**: `cache()` is retained, but only as a within-invocation dedup optimization (confirmed `createClient()` is called from Server Components, Server Actions, and Route Handlers — `cache()` is safe as a dedup in all three, since Next.js scopes it per-invocation in each case). The comment in the file was rewritten to state plainly what it does and does not do, and to point at `src/proxy.ts` as the actual authoritative refresh point. Session correctness no longer depends on `cache()` in any way — it is a pure micro-optimization now.

### Deterministic local near-expiry test — results, honestly reported

Per the brief's explicit requirement not to declare success on a fresh-token walkthrough alone, ran a real expiry test: temporarily set `supabase/config.toml`'s `jwt_expiry` to 15 seconds (restored to 3600 afterward, confirmed via `git diff --stat` showing no residual change), restarted the local stack, signed in via the GoTrue password-grant harness, and exercised the protected routes.

**What worked**: a single authenticated request, in isolation, past-expiry, correctly triggers `getClaims()`'s internal refresh and succeeds — confirmed via the new structured proxy logs (`claimsOk: true`, `cookiesWritten: 1`, `reason: "allowed"`). A genuinely anonymous request still redirects to `/login`; an inactive profile still lands on `/access-pending`, not `/login` — both reconfirmed after all changes.

**What still failed under this test, stated plainly and without overreading it**: firing multiple authenticated requests close together in time — both a synthetic `Promise.all` burst of 6 requests, and a sequential click-through (Settings → Admin → back to Calendar, several seconds apart, real link clicks, single tab) — occasionally produced `refresh_token_already_used` errors, which correctly (per the fixes above) log as `claims_error` but still redirect to `/login`.

**`jwt_expiry=15` seconds was an intentionally extreme stress test, not a realistic scenario.** Supabase's own guidance is not to run production expiry below five minutes; at 15 seconds, the SDK's refresh margin means *every single request* — including the app's own incidental background ones — attempts a refresh, manufacturing far more collision opportunities than production's ~1-hour cycle would ever produce. A residual risk was observed only under this intentionally unrealistic 15-second expiry stress test. **Its relevance to production is unknown** — it has not been observed, reproduced, or ruled out under production's actual ~1-hour expiry, and this local result does not by itself prove anything about production behavior in either direction. The dominant production-specific factor this round found and fixed (missing CDN no-cache headers) can't be exercised at all in local dev, which has no CDN layer — so a clean 15-second-expiry test would not, on its own, prove the production symptom is gone even if it fully passed, and a failure under it does not by itself prove the production symptom persists either.

**Bottom line**: the four confirmed, real bugs above are fixed and verified. Whether any collision risk remains observable in production is an open question that requires production log observation, not a conclusion this local test can settle. See "Next steps" below for the concrete, non-speculative diagnostic path if `refresh_token_already_used` is seen in production after this deploy — new coordination infrastructure should only be considered after that diagnostic evidence, not proposed preemptively from a 15-second local stress test.

---

## Round 4 — Pre-deploy closeout

A final pass before commit/deploy, correcting scope and framing issues in Round 3 rather than changing the underlying diagnosis:

1. **`cache()` removed from `src/lib/supabase/server.ts` entirely.** Round 3 retained it as a "within-invocation dedup optimization"; on review, a generic factory shared by Server Components, Server Actions, and Route Handlers should not depend on a React-render-scoped primitive at all, regardless of how the comment caveats it — the risk of a future reader missing the caveat and relying on it for correctness outweighs the minor dedup benefit. `createClient()` is now a plain uncached `async function`, matching the standard Supabase Next.js helper shape. The one real duplicate-client case this covered — `getMessagesFeed()` calling `getAnnouncements()` and `getNotifications()`, each of which used to call `createClient()` independently — is now handled explicitly instead of implicitly: `getMessagesFeed()` creates one client and passes it into both (`getAnnouncements(supabase)` / `getNotifications(supabase)`, both now take an optional client parameter, defaulting to creating their own when called standalone, which is how `/notifications` and `/messages/[id]` still use them). No other page was found to have the same pattern.
2. **Diagnostic logging gated behind `AUTH_DIAGNOSTICS_ENABLED`.** The `[proxy-auth]` logs added in Round 3 now write nothing unless this server-only env var (no `NEXT_PUBLIC_` prefix) is explicitly set to `"true"` — added to `src/lib/env.ts` and documented in `.env.example`. Logged fields are unchanged and remain privacy-safe (request ID, pathname, method, cookie-chunk count, claims outcome, normalized error code, cookies-written count, response type, redirect pathname, reason) — never cookie values, tokens, JWT contents, headers, emails, or user IDs.
3. **The Round 3 residual-risk framing was overstated and has been corrected above** — see the rewritten paragraphs at the end of Round 3. It no longer asserts the collision is "inherent" or "definitely not an application bug," and no longer proposes a distributed lock as the assumed next step from a single 15-second local stress test.
4. **`BottomNav.tsx`'s deferred fetch re-verified**, not just re-described: the cleanup function cancels the pending `setTimeout` and sets an `active = false` guard so no state update can happen after unmount or a subsequent pathname change; the `shouldFetch` condition still only fires on first mount or transitions into/out of `/messages`/`/notifications`, not on every navigation; `BottomNav` structurally never renders on `/admin/*` routes (the app layout renders `AdminShell` instead), so this effect never runs there. The code comment was reworded to state this is a mitigation that reduces collision odds, not a claim that it resolves refresh races.

---

## Files changed (all rounds, cumulative — none committed by this session; see git log for what Ronen has committed himself between rounds)

- `src/components/ui/BottomNav.tsx` — icons rewritten as inline SVG (A); deferred unread-count fetch, reworded as a mitigation not a fix (Round 3/4).
- `src/features/messages/queries.ts` — creates one client and passes it into `getAnnouncements`/`getNotifications` explicitly (Round 4).
- `src/features/announcements/queries.ts`, `src/features/notifications/queries.ts` — `getAnnouncements`/`getNotifications` accept an optional shared client (Round 4).
- `src/features/profile/queries.ts` — added `isManagerOrSuperAdmin` (C).
- `src/features/announcements/queries.ts`, `src/features/notifications/queries.ts` — `getAnnouncements`/`getNotifications` accept an optional shared client (Round 4); replaced duplicate page-level `getUser()` calls with `getClaims()` (Round 5).
- `src/features/profile/queries.ts` — added `isManagerOrSuperAdmin` (C); replaced duplicate page-level `getUser()` calls with `getClaims()` (Round 5).
- `src/app/(app)/settings/page.tsx` — general admin shortcut, `prefetch={false}` on both admin links (C, Round 2); disabled prefetch on notifications and sign-out Links (Round 5).
- `src/components/settings/ThemeSwitcher.tsx` — logo → version text (E).
- `src/components/ui/AppHeader.tsx` — inlined emblem SVG on large-variant headers (F).
- `src/i18n/he.json`, `src/i18n/en.json` — חניך/חניכים rename (G); new keys for E/C/H; `common.temporaryError` (Round 3).
- `src/app/(app)/students/[studentId]/page.tsx`, new `src/app/(app)/students/[studentId]/StudentCardTabs.tsx` — tabbed layout (H).
- `src/components/layout/AdminShell.tsx` — `prefetch={false}` on all nav links (Round 2).
- `src/proxy.ts` — `getClaims()` instead of `getUser()`, full-cookie-object redirects, CDN no-cache header propagation, RPC-error passthrough instead of misclassification, structured logging gated behind `AUTH_DIAGNOSTICS_ENABLED` (Round 3/4); classified and passed through background claims errors (Round 5).
- `src/lib/auth/session.ts`, `src/lib/auth/access.ts` — same RPC-error-vs-access-decision fix as proxy, for the root-page fallback path (Round 3).
- `src/app/page.tsx` — renders a non-destructive message on `lookup_error` instead of guessing a redirect (Round 3).
- `src/lib/supabase/server.ts` — `cache()` removed entirely; plain uncached factory (Round 4).
- `src/lib/env.ts`, `.env.example` — `AUTH_DIAGNOSTICS_ENABLED` (Round 4).
- `src/features/groups/admin-queries.ts`, `src/features/notifications/actions.ts` — replaced duplicate page-level `getUser()` calls with `getClaims()` (Round 5).

---

## Round 5 — Production Logout Bug Fixes (Settings & Background Auth Classification)

This round resolves the production logout bug where background request collisions (e.g. Settings rendering Link prefetches, BottomNav unread count Server Action, and page-level getUser() calls) raced on token refreshes and forced destructive redirects to `/login`.

### 1. Disabled Settings notification prefetch
Added `prefetch={false}` to both Links to `/notifications` on `src/app/(app)/settings/page.tsx`, as well as to the `/auth/sign-out` Link. This prevents hover or viewport-based prefetch requests from firing background auth checks.

### 2. Stopped BottomNav's initial-mount background auth request
Removed `prevPath === null` as an automatic reason to fetch unread notification counts in `src/components/ui/BottomNav.tsx`. Unread count fetches now only run when explicitly navigating into or out of `/messages` or `/notifications`, preventing background auth requests on load of `/settings`, `/calendar`, or other unrelated routes.

### 3. Classified and passed through background claims failures in `src/proxy.ts`
Implemented `isBackgroundAuthRequest(request)` in `src/proxy.ts` to identify Link/RSC prefetches, Server Actions, RSC data requests, and other non-document background requests based on headers (`RSC`, `Next-Router-Prefetch`, `Next-Router-State-Tree`, `Next-Action`, `Purpose`, `Sec-Purpose`, `Accept`). 
On `claimsError` (or `!claimsData`), if the request arrived with an auth cookie and is classified as a background request:
* The middleware passes the request through safely (`NextResponse.next()`) instead of redirecting to `/login`.
* Refreshed cookies and headers are preserved.
* The event is logged under the distinct reason `background_claims_error`.
* Destructive redirects to `/login` are restricted strictly to top-level HTML/document navigations. Protected mutations and data reads continue to be blocked at the RLS/authorization level.

### 4. Reduced page-level Auth-server calls via `getClaims()`
Replaced `supabase.auth.getUser()` with `supabase.auth.getClaims()` and extracted `userId = claimsData?.claims?.sub` in:
* `src/features/profile/queries.ts` (`getCurrentProfileSummary`)
* `src/features/notifications/queries.ts` (`getUnreadNotificationCount`, `getNotifications`)
* `src/features/groups/admin-queries.ts` (`getAdminGroupsData`)
* `src/features/notifications/actions.ts` (`markNotificationRead`, `markAllNotificationsRead`)
This completely avoids unnecessary duplicate network calls to the Auth server, leveraging local cryptographic JWT verification and leaving user ID filtering safe under RLS.

---

## Next steps

**Commit, deploy, and monitor the corrected Proxy/cookie flow through a real production token-refresh window.** That is the immediate next step — not new infrastructure.

If `refresh_token_already_used` appears in production logs after deploying (with `AUTH_DIAGNOSTICS_ENABLED=true` set for the monitoring window), the diagnostic path is:

1. Correlate requests by the logged request ID.
2. Confirm whether the successful refresh response actually sent `Set-Cookie` (check response headers, not just the log's `cookiesWritten` count).
3. Confirm the browser used the new cookie on the following request (not the stale one).
4. Identify any stale/delayed request that used the previous cookie after a newer one was already issued.
5. Confirm the requests in question hit the same production domain and the same deployment (not a stale/previous deployment still receiving traffic, or a domain/subdomain mismatch on cookies).
6. Only consider coordination infrastructure (e.g. a distributed lock) after those facts are proven from real production evidence — not proposed preemptively from the local 15-second stress test in Round 3.

Do not key logs or any future locking mechanism using raw refresh tokens.

Other outstanding items:
- Item D (push notification config) should be re-checked against production specifically for the `NEXT_PUBLIC_VAPID_PUBLIC_KEY`/`VAPID_PRIVATE_KEY`/`VAPID_SUBJECT` environment variables — not verifiable from this environment.
- The human visual pass against the mockup (recommended as a next step in `docs/29_STAFF_APP_REDESIGN_V1.md`) is still outstanding.
- `AUTH_DIAGNOSTICS_ENABLED` should be turned back off (or left unset) once the production monitoring window above is complete — it's a diagnostic tool for this investigation, not permanent infrastructure.
