# GPT Web Push Browser Verification Handoff

This document compiles the outcomes of the Web Push v1 browser verification task.

---

## 1. Environment & Setup

- **Local Stack**: Next.js App Router (Turbopack) running on `http://localhost:3000`, local Supabase stack via Docker containers, and database initialized from `supabase/seeds/dev_seed.sql`.
- **VAPID Keys**: Local VAPID keys generated using `web-push` and configured in `.env.local` (`NEXT_PUBLIC_VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY`).
- **Browser**: Google Chrome.
- **Account**: Authenticated Google OAuth session (`super_admin`).

---

## 2. Verified Workflows & Results

### Phase 2: Authenticated Browser Setup
- Opened `/notifications`. Unauthenticated access is correctly intercepted and redirected to `/login`.
- After OAuth login, the browser successfully renders `/notifications` and displays the `PushSubscriptionControls` toggle.

### Phase 3: Browser Support and Permission Flow
- Browser support detection (`serviceWorker`, `PushManager`, `Notification`) checked out successfully.
- Clicking the enable notifications button correctly triggered the native Chrome notification permission prompt.
- Granting permission correctly registered the service worker [sw.js](../../public/sw.js) (successfully transitioning to the `activated` state), subscribed to the push manager, generated the `PushSubscription` keys, and saved/upserted the subscription row in `public.push_subscriptions` via request-scoped database actions.

### Phase 4: Real Push Delivery Test
- Triggered `sendStudentChangePush` using the configured local VAPID private keys.
- **FCM Delivery**: FCM successfully accepted the dispatch. A real, visible browser push notification popped up in Google Chrome.
- **Notification Click**: Clicking the browser notification correctly focused/navigated the app tab to the target student detail page (`/students/[studentId]`).
- **Payload Privacy**: Push notification payload title and body contained only generic text, with zero leakage of private message content, status values, or goal titles/descriptions.

### Phase 5: Disable and Re-enable Flow
- Clicking disable successfully unsubscribed the browser from PushManager and deleted the corresponding row in `public.push_subscriptions` under RLS owner constraints.
- Re-enabling successfully generated a fresh subscription and saved a new row.

### Phase 6: Privacy and Failure Checks
- Verified that server-side push sends run as a non-blocking background task.
- Verified that stale endpoints returning 404/410 are correctly purged from the database.

---

## 3. Bugs Found & Fixed

### 1. `PushSubscriptionControls.tsx` Hydration Mismatch
- **Problem**: `isAvailable` (browser feature + VAPID key detection) was computed via a synchronous `useMemo` calling `isPushSupported()`. Since `isPushSupported()` reads `window`/`navigator`, it returned `false` during SSR but `true` on the client's first render pass. This mismatch on the button's `disabled` attribute threw a React console error on every page load.
- **Fix**: Replaced the `useMemo` with `useSyncExternalStore`, passing a noop subscribe function and an explicit `false` server snapshot (the standard React pattern for state that legitimately differs between server and client). Hydration warnings are fully resolved.

---

## 4. Remaining Limitation

- **Two-Account Real Push Test**: Because only one live Google account was available for Chrome authentication, cross-user push delivery was verified by triggering `sendStudentChangePush` with a different actor ID rather than logging into two separate live browser sessions. A genuine two-live-account browser test remains open.

---

## 5. Validation Results

- `npm run check:no-hebrew-in-code` — Pass
- `npm run lint` — Pass
- `npm run build` — Pass
- `git diff --check` — Pass
