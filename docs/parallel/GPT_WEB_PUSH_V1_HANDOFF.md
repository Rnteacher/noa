# GPT Web Push V1 Handoff

## Files changed

- `supabase/migrations/20260709030000_push_subscriptions_v1.sql`
- `src/features/notifications/push-actions.ts`
- `src/features/notifications/send-push.ts`
- `src/app/(app)/notifications/PushSubscriptionControls.tsx`
- `src/app/(app)/notifications/page.tsx`
- `src/app/(app)/more/page.tsx`
- `src/features/students/actions.ts`
- `public/sw.js`
- `src/lib/env.ts`
- `src/lib/env.server.ts`
- `.env.example`
- `src/i18n/en.json`
- `src/i18n/he.json`
- `src/types/supabase.ts`
- `package.json`
- `package-lock.json`
- `docs/12_CURRENT_STATE.md`
- `docs/handoff.md`

## Migration, dependency, and env changes

- Added `expiration_time` and `updated_at` to `public.push_subscriptions`.
- Hardened the push-subscription update policy so updates require the owner and active staff status.
- Added `web-push` and `@types/web-push`.
- Replaced the prior placeholder env naming with `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, and `VAPID_SUBJECT`.
- Missing VAPID values do not fail the app build; the client control reports push as unavailable and the server sender no-ops.

## Subscription model and RLS

- Each active authenticated staff profile can save multiple browser/device subscriptions.
- Endpoint remains globally unique; upsert is by endpoint.
- Subscription registration/deletion uses the normal request-scoped Supabase client and RLS, not service-role.
- Users can read, update, and delete only their own subscriptions.
- Managers and super admins have no direct special RLS visibility into other users' subscriptions.
- Server-side delivery reads subscriptions only from a server-only privileged helper after a student-card in-app notification event succeeds.

## Service worker behavior

- `public/sw.js` handles `push` and `notificationclick`.
- Payload parsing is defensive.
- Default click target is `/notifications`.
- Student-card pushes target `/students/[studentId]`.
- No secrets and no Hebrew strings are present in the worker.

## Push delivery behavior

- Student-card server actions now call a shared notification helper.
- The helper first runs the existing hardened `create_student_change_notification` RPC.
- If that RPC succeeds, `sendStudentChangePush` resolves the same follower model server-side, excluding the actor and muted follows, then sends best-effort Web Push to active subscriptions.
- Push delivery failures are logged and do not fail the original mutation.
- 404/410 push responses delete stale subscriptions.

## Privacy decisions

- Push payloads are generic.
- No raw student message body is sent.
- No emotional status value, color, or note is sent.
- No goal title, description, or details are sent.
- Push subscription create/delete audit events were not added in v1 to avoid noisy audit rows and any risk of recording subscription material.

## Validation results

- `supabase db reset`: passed.
- `supabase gen types typescript --local | Out-File -Encoding utf8 src/types/supabase.ts`: passed.
- `npm run check:no-hebrew-in-code`: passed.
- `npm run lint`: passed.
- `npm run build`: passed.
- `git diff --check`: passed with line-ending warnings only.
- Rollback-only database probes confirmed own insert/update/read/delete, cross-user insert rejection, cross-user read/delete blocking, no manager override, duplicate endpoint rejection, and seed row count unchanged after rollback.

## Browser verification

- In-app browser request to `/notifications` redirected to `/login`, confirming protected-route behavior.
- Seeded local email/password login returned invalid credentials, matching the existing auth-test limitation.
- Full browser push verification was not completed because this context did not have an authenticated in-app browser session with configured VAPID keys and an interactive permission grant.

## Known limitations

- Real browser push display, notification click focusing, disable, and re-enable still need live browser verification.
- Delivery currently mirrors the follower recipient filters in a server helper after the in-app notification RPC succeeds because the existing RPC returns `void`.
- Web Push v1 does not implement notification preference categories or quiet hours.
