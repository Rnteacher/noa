# GPT Staff App Redesign V1 Feedback Fixes Handoff

Four follow-up passes after `docs/29_STAFF_APP_REDESIGN_V1.md` and its parallel handoff — full rationale in `docs/30_STAFF_APP_REDESIGN_V1_FEEDBACK_FIXES.md`.

> **Correction**: Section 2's "Round 2" claim that React `cache()` closes cross-request session-refresh races is **incorrect** — `cache()` only dedupes within a single request/invocation and cannot coordinate `src/proxy.ts`'s middleware with a page render, separate tabs, or separate requests. Round 3 corrected the diagnosis and fixed the actual bugs (dropped cookie attributes on redirect, missing CDN no-cache headers, RPC-error misclassification, `getUser()`→`getClaims()`). Round 4 then **removed `cache()` from `createClient()` entirely** (not just retained it as a caveated dedup) and gated the diagnostic logging behind `AUTH_DIAGNOSTICS_ENABLED`. Round 3's residual-risk finding was also reframed: it was observed only under an intentionally extreme 15-second local expiry stress test (Supabase recommends 5+ minutes), and its relevance to production is unknown — it is not grounds for adding a distributed lock or similar infrastructure preemptively. See `docs/30_STAFF_APP_REDESIGN_V1_FEEDBACK_FIXES.md` §"Round 3" and §"Round 4" for the full writeup.

---

## 1. Round 1: direct feedback (A–H)

| Item | Fix |
|---|---|
| A — Icon fidelity | `BottomNav.tsx` icons rewritten as inline SVG using the mockup's exact path data (re-fetched via Design MCP `get_file`), replacing lucide-react approximations. |
| B — Session loss | Diagnosed as `getMessagesFeed()` running two independent-client `getUser()` calls in `Promise.all`; fixed by sequencing. **Superseded by Round 2's deeper fix — see below.** |
| C — Can't reach admin | `getCurrentProfileSummary()` now also returns `isManagerOrSuperAdmin`; Settings shows a general admin shortcut to `/admin/groups` for managers (previously only super-admins had any entry point into `/admin/*` at all, despite managers having real RLS access there). |
| D — Push notification config | Investigated; already fully implemented and working (`PushSubscriptionControls.tsx`). No code change. If broken in production, most likely a missing `NEXT_PUBLIC_VAPID_PUBLIC_KEY` env var on the deploy platform — outside this repo's visibility. |
| E — Settings logo | Replaced with static text "אפליקציית נעה - גרסה 0.1" in `ThemeSwitcher.tsx`. |
| F — School emblem missing | Added to `AppHeader.tsx`'s large-title header (mockup's spec: 30px, end side, next to title). Found and fixed a second broken-asset bug (empty SVG fill style, same issue as the two logo SVGs from the original pass) by inlining the emblem as JSX with `currentColor` instead of shipping another static-file color fix. |
| G — תלמיד→חניך | Confirmed the mockup's own source already uses "חניכים" (an inconsistency from the original pass, not just a fresh ask). Replaced all 36 occurrences in `he.json`. `en.json` left as-is. |
| H — Student card tabs | New `StudentCardTabs.tsx` client component: "פרטים" (overview: contact, project, emotional status, comments), "מטרות" (goals, read-only), "עדכון פרטים" (all edit forms consolidated). Same underlying data/permissions, no schema change. |

## 2. Round 2: production session-loss root cause

Ronen reported the session-loss symptom was broader than what Round 1 fixed — it hit Settings → any tab, and the Notifications page specifically, not just Messages.

**First follow-up (necessary but insufficient)**: `AdminShell.tsx`'s desktop sidebar renders ~7 links at once; Next's default prefetching fires a background request per visible link, each hitting the auth middleware independently. Added `prefetch={false}` everywhere in `AdminShell.tsx` (matching the pattern `BottomNav.tsx` already used) and on the two new Settings admin links.

**Actual root cause**: `src/lib/supabase/server.ts`'s `createClient()` created a fresh Supabase client on every call, and nearly every query function in the app calls it independently. The SDK serializes concurrent auth calls *within one client instance* but has no cross-instance coordination — so any two `getUser()`-triggering calls happening around the same moment (whether within one page, across middleware vs. a page, or between unrelated concurrent requests) can race on refreshing the same single-use refresh token when the access token is near expiry. This is why it wasn't confined to any one page.

**Fix**: wrapped `createClient()` in React's `cache()`, memoizing it per-request so every call in a given request shares one client instance:

```ts
export const createClient = cache(async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(/* ... */);
});
```

This closes the whole bug class rather than patching individual instances. The Round-1 `getMessagesFeed()` sequential-await workaround was reverted to `Promise.all` since it's now safe.

**Why it wasn't caught locally**: reproducing requires the access token to actually be near its ~1hr expiry at request time. Every verification session in both rounds used a freshly-minted token (via the GoTrue password-grant harness), so there was nothing to refresh and nothing to race on — invisible under fresh-token conditions no matter how many concurrent clients exist.

**Round 3's local expiry test, correctly framed**: tested with `supabase/config.toml`'s `jwt_expiry` temporarily set to 15 seconds (restored afterward). A single request past-expiry refreshed correctly; multiple close-together requests occasionally hit `refresh_token_already_used`. This was an intentionally extreme stress test — Supabase recommends not running expiry below 5 minutes — and at 15 seconds essentially every request attempts a refresh, manufacturing far more collisions than production's ~1hr cycle would. **The relevance of this finding to production is unknown**; it does not by itself justify new coordination infrastructure.

## 2a. Round 4: pre-deploy closeout

- **`cache()` removed from `src/lib/supabase/server.ts` entirely.** `createClient()` is now a plain uncached `async function` — a generic factory shared by Server Components, Server Actions, and Route Handlers should not depend on a React-render-scoped primitive, regardless of comment caveats. The one real duplicate-client case (`getMessagesFeed()`) now explicitly creates one client and passes it into `getAnnouncements()`/`getNotifications()` (both accept an optional shared-client parameter; still create their own when called standalone elsewhere).
- **Diagnostic logging gated**: `[proxy-auth]` logs now write nothing unless the server-only `AUTH_DIAGNOSTICS_ENABLED` env var is `"true"` (added to `src/lib/env.ts` and `.env.example`). Logged fields unchanged and still privacy-safe.
- **`BottomNav.tsx`'s deferred fetch re-verified**: cleanup cancels the pending timer and guards against post-unmount state updates; `shouldFetch` still only fires on first mount or Messages/Notifications transitions, not every navigation; the component never renders on `/admin/*` routes at all. Comment reworded to state this is a mitigation, not a fix for refresh races.
- **Next step, not new infrastructure**: commit, deploy, and monitor the corrected Proxy/cookie flow through a real production token-refresh window. If `refresh_token_already_used` appears in production logs, correlate by request ID, confirm `Set-Cookie` was sent and used by the next request, identify any stale/delayed request, and confirm same domain/deployment — only then consider coordination infrastructure. Never key logs or locks using raw refresh tokens.

---

## 3. Verification

- `npx tsc --noEmit`, `npm run lint`, `npm run check:no-hebrew-in-code`, `npm run build` — all pass clean after every change, both rounds.
- Live browser walkthrough (fresh authenticated session, throwaway local manager profile, deleted afterward): Settings → Notifications → Admin (`/admin/groups`) → Calendar, all working with no session loss under fresh-token conditions. Student card's 3 tabs (Overview/Goals/Edit) all render and function correctly, including the edit forms in the new "עדכון פרטים" tab.
- A working screenshot (unlike the prior pass, where the Browser pane's screenshot tool was unavailable) confirmed the bottom-nav icons and header emblem render correctly in dark theme.
- **Not verified**: the actual production "kicked out near token expiry" moment could not be force-reproduced in this environment (see "why it wasn't caught locally" above). The fix addresses the documented mechanism directly but has not been confirmed against a real long-lived production session.

## 4. Files changed (cumulative, all rounds)

- `src/components/ui/BottomNav.tsx`, `src/components/ui/AppHeader.tsx`
- `src/features/messages/queries.ts`, `src/features/announcements/queries.ts`, `src/features/notifications/queries.ts`, `src/features/profile/queries.ts`
- `src/app/(app)/settings/page.tsx`, `src/components/settings/ThemeSwitcher.tsx`
- `src/i18n/he.json`, `src/i18n/en.json`
- `src/app/(app)/students/[studentId]/page.tsx` (modified), `src/app/(app)/students/[studentId]/StudentCardTabs.tsx` (new)
- `src/components/layout/AdminShell.tsx`
- `src/proxy.ts`, `src/lib/auth/session.ts`, `src/lib/auth/access.ts`, `src/app/page.tsx`
- `src/lib/supabase/server.ts` — `cache()` removed entirely (Round 4)
- `src/lib/env.ts`, `.env.example` — `AUTH_DIAGNOSTICS_ENABLED` (Round 4)

Nothing was committed by this session — Ronen has been committing changes himself between rounds (confirmed via `git log`: `7642d5a design change`, `c34e483 design change fix` predate this pass).

## 5. Deferred / open items

- **Immediate next step is commit + deploy + monitor**, not new infrastructure — see the Round 4 diagnostic playbook above if `refresh_token_already_used` appears in production logs.
- Push notification config (D) should be re-checked against production's actual VAPID env vars — can't be verified from this environment.
- Human visual pass against the mockup is still outstanding (per `docs/29_STAFF_APP_REDESIGN_V1.md`'s original next-step recommendation) — this pass's verification was functional/behavioral plus one screenshot spot-check, not a full side-by-side visual comparison.
- `AUTH_DIAGNOSTICS_ENABLED` should be turned back off once the production monitoring window is complete.
