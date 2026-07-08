# GPT Notifications & Badges V1 Handoff

## Files Changed

- `supabase/migrations/20260708234000_notifications_system.sql` (new)
- `supabase/migrations/20260708235000_harden_notifications_rpc.sql` (new)
- `src/features/notifications/queries.ts` (new)
- `src/features/notifications/actions.ts` (new)
- `src/app/(app)/notifications/page.tsx` (new)
- `src/app/(app)/notifications/MarkNotificationReadButton.tsx` (new)
- `src/app/(app)/notifications/MarkAllNotificationsReadButton.tsx` (new)
- `src/app/(app)/more/page.tsx`
- `src/app/(app)/dashboard/page.tsx`
- `src/components/ui/BottomNav.tsx`
- `src/features/students/actions.ts`
- `src/i18n/en.json`
- `src/i18n/he.json`
- `docs/12_CURRENT_STATE.md`
- `docs/handoff.md`
- `docs/parallel/GPT_NOTIFICATIONS_BADGES_V1_HANDOFF.md` (new)

## Database & Schema Mappings

- **Migration 1 (System)**: Added `20260708234000_notifications_system.sql` which created the base in-app notifications schema helper.
- **Migration 2 (Hardened RPC)**: Added `20260708235000_harden_notifications_rpc.sql` which:
  - Dropped the original 4-argument notification function signature (removing the spoofable `custom_body` parameter).
  - Re-implemented the `create_student_change_notification` security-definer PL/pgSQL function to prevent spoofing, fake event injection, and notification spamming.
- **Push Subscriptions**: Web Push subscription management (`push_subscriptions` table) remains fully deferred. No browser push workers or VAPID configurations were introduced.

## Security & RPC Safety Model

* **Original Vulnerability**: The original RPC accepted any `actor_id` and a `custom_body` parameter, allowing potential client-side spoofing of who did the change and custom message spamming.
* **Hardened Security Model**:
  1. **Session Presence**: Enforces `auth.uid()` is not null.
  2. **Spoof Protection**: Enforces `actor_id = auth.uid()`.
  3. **Active Staff Validation**: Verifies `public.current_user_is_active_staff()` is true.
  4. **Student Activity Check**: Verifies the target student exists and `is_active = true`.
  5. **Event Allowlist**: Strictly validates `event_type` against:
     - `'student_message.created'`, `'project.status_updated'`, `'student_emotional_status.updated'`, `'student_goal.created'`, `'student_goal.updated'`, `'student_goal.deleted'`, `'student_photo.updated'`.
  6. **Privacy Enforcement**: Generates titles/bodies internally using hardcoded, privacy-safe safe templates (e.g. emotional updates omit note details and status colors).
  7. **Per-Event Caller Authorization**: Enforces role/relationship checks using existing schema permission helpers:
     - `project.status_updated`: Checks `public.current_user_can_update_student_project`.
     - `student_emotional_status.updated`: Checks `public.current_user_can_update_student_emotional_status`.
     - `student_goal.created`/`updated`: Checks `public.current_user_can_update_student_goals`.
     - `student_goal.deleted`: Restricted strictly to manager or super admin (`public.current_user_is_manager_or_super_admin`).
     - `student_photo.updated`: Checks `public.current_user_can_manage_student_photo`.
- **Read & Mark Read Bounds**: Table select and update RLS policies restrict queries strictly to `profile_id = auth.uid()`.

## UI Navigation & Badges

- **Dashboard Integration**: The Bell header icon on the dashboard links directly to `/notifications`.
- **More Integration**: `/more` page displays a notification card displaying the live unread count and routing to `/notifications`.
- **Bottom-Nav Badge**: Mobile navigation polls `getUnreadNotificationCountAction` on path changes, overlaying a red badge on the `More` tab item if `count > 0` (handling `99+` formatting).
- **Feed Page**: Dynamic listing displaying read vs unread indicators, read toggle buttons, view student card redirect links, and a header button to mark all as read.

## Verification Results

- `npm run check:no-hebrew-in-code`: Passed successfully.
- `npm run lint`: Passed with 0 errors/warnings.
- `npm run build`: Production compilation and typecheck succeeded.
- `git diff --check`: Passed with no whitespace errors.
- **SQL Rollback Probes**: Ran database tests against postgres container:
  - Legitimate followed-student change creates notifications for followers (excluding actor and muted).
  - Spoofed actor ID attempts reject with `Unauthorized: Actor ID spoofing detected`.
  - Unsupported event type attempts reject with `InvalidEvent: Unsupported event type`.
  - Unauthorized event attempts (e.g. staff deleting goal) reject with `Unauthorized: Caller lacks permissions`.
  - Privacy safeguards verified (notes and status colors are completely hidden).
  - RLS read and update boundaries protect users from cross-user notification reading or updates.
