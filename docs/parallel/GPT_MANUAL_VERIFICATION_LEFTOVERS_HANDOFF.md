# GPT Manual Verification Leftovers Handoff

This document compiles the outcomes of verifying the manual leftovers from the authenticated browser smoke test:
1. Real student photo upload flow.
2. Wrong-domain Google account rejection validation.
3. Cross-user two-account notifications.

---

## 1. Environment & Setup

- **Local Stack**: Next.js App Router (Turbopack) running on `http://localhost:3000`, local Supabase stack via Docker containers, and the initial schema seeded from `supabase/seeds/dev_seed.sql`.
- **Environment Variables**: Confirmed configured:
  - `GOOGLE_ALLOWED_DOMAIN` restricting logins to a specific organization domain.
  - `BOOTSTRAP_SUPER_ADMIN_EMAILS` initializing the signed-in allowed-domain user as `super_admin`.

---

## 2. Verified Workflows & Results

### Phase 1: Real Student Photo Upload Verification

- **Code Review**:
  - Inspected client-side [PhotoUploadForm.tsx](../../src/app/(app)/students/[studentId]/PhotoUploadForm.tsx) and server action [actions.ts](../../src/features/students/actions.ts#L1439-L1603).
  - Confirmed Zod/Regex UUID validation on `studentId`.
  - Confirmed file type restriction to `['image/jpeg', 'image/png', 'image/webp']` and file size restriction to `5MB` on both client and server.
  - Confirmed the storage destination uses the private `student-photos` bucket at path `students/{studentId}/profile.[ext]`.
  - Confirmed student profile update is restricted strictly to the `photo_url` column and uses the secure security-definer RPC `update_student_photo_path` to bypass table-level write access while verifying caller permissions (`current_user_can_manage_student_photo`).
  - Confirmed generation of private signed URLs (3600s) for viewing in [queries.ts](../../src/features/students/queries.ts#L456-L466).
  - Confirmed `student_photo.updated` audit log logging.
- **Verification Status**:
  - Code review, storage policies, and RPC checks are verified and correct.
  - **Manual-only**: A live browser file upload of a real photo remains manual-only (cannot be executed by the assistant due to browser access boundaries).

### Phase 2: Wrong-Domain Google Rejection Verification

- **Code Review**:
  - Inspected the OAuth callback route [route.ts](../../src/app/auth/callback/route.ts#L36-L39) and the helper `isEmailDomainAllowed` in [access.ts](../../src/lib/auth/access.ts#L27-L32).
  - The callback extracts the authenticated user's email domain, matching it strictly against `GOOGLE_ALLOWED_DOMAIN`.
  - If a domain mismatch occurs, the route calls `await supabase.auth.signOut()`, destroying the temporary OAuth session, and redirects immediately to `/access-denied`.
  - No active profiles or role memberships are created for the rejected account.
  - Protected app shell routes correctly redirect to `/login` for unauthenticated requests.
- **Verification Status**:
  - Callback flow, sign-out destruction, and `/access-denied` routing are verified via code review.
  - **Manual-only**: A live browser OAuth sign-in using an external, non-institutional Google account remains manual-only.

### Phase 3: Two-Account Notification Verification

- **Database-level Verification**:
  - The notification trigger, actor exclusion, muted follow filters, and RLS policies were fully verified in the previous session using transaction-rollback SQL probes.
  - Inspected the notifications query and component structure. Unread notification counts are fetched dynamically on mount and route transition, updating the bottom navigation badge and the `/more` menu.
  - **Privacy Enforcement**: Generates titles/bodies internally using hardcoded templates, omitting note details, status colors, and goal description bodies.
  - **RLS Boundary**: SELECT and UPDATE policies on `public.notifications` restrict operations solely to the owner (`profile_id = auth.uid()`).
- **Verification Status**:
  - Database trigger pipeline, RLS read/update boundaries, and generic template privacy are verified.
  - **Manual-only**: A live browser multi-user flow (User B mutating a student card, and User A seeing a live badge update/click) remains manual-only.

---

## 3. Bugs & Defers

- **Bugs Found**: None.
- **Bugs Fixed**: None required.
- **Deferred Items**: Web Push notifications, push subscriptions, and service worker/VAPID integrations remain deferred to future phases.

---

## 4. Validation Results

- `npm run check:no-hebrew-in-code`: Passed (no Hebrew in implementation files).
- `npm run lint`: Passed with 0 errors/warnings.
- `npm run build`: Production compilation and typecheck succeeded.
- `git diff --check`: Passed with no whitespace errors.
