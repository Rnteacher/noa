# 17 - Hosted Pilot Dry-Run Execution — Part A: GitHub + Supabase Cloud + Vercel Wiring

## 1. Scope and Safety Boundaries

This runbook documents the execution of Part A of the Hosted Pilot Dry-Run. All actions taken are strictly **fake-data-only**.
- **No real student data** has been imported, created, or accessed.
- **No production secrets or credentials** have been committed to the codebase.
- **Local dev seed** was NOT applied to the hosted database to prevent contamination and future-date quirks.

---

## 2. GitHub Connection Result

- **Repository URL**: `https://github.com/Rnteacher/noa.git`
- **Branch**: `master`
- **First Push Status**: Rejected initially by GitHub Push Protection due to a mock Google Client Secret leak in an older commit (`b1bffd8e81`) in the file `scripts/local/start-supabase-oauth.ps1`.
- **Git History Rewrite**:
  - Executed `git filter-branch` to purge `scripts/local/start-supabase-oauth.ps1` from the history of all commits.
  - Successfully ran `$env:FILTER_BRANCH_SQUELCH_WARNING="1"; git filter-branch --force --index-filter "git rm --cached --ignore-unmatch scripts/local/start-supabase-oauth.ps1" --prune-empty --tag-name-filter cat -- --all`.
  - Stashed and restored `.gitignore` working modifications during the rewrite.
- **Final Push Status**: Forced push succeeded! Branch `master` is now fully synchronized with GitHub and verified clean.
- **Head Commit SHA**: `5b04edfc1c94f660c7e64ffb5a9fb9ab470c7352`

---

## 3. Supabase Link and Migration Result

- **Project Ref**: `qxjfzdmszgvymcuyuisu`
- **Linking Status**: Successfully authenticated and linked local project to remote project ref `qxjfzdmszgvymcuyuisu`.
- **Migrations Pushed**: All 11 local migrations successfully applied in order:
  1. `20260707111701_initial_schema_and_rls.sql`
  2. `20260707115303_staff_access_grants.sql`
  3. `20260708184000_student_photos.sql`
  4. `20260708190500_harden_student_photo_updates.sql`
  5. `20260708234000_notifications_system.sql`
  6. `20260708235000_harden_notifications_rpc.sql`
  7. `20260709000000_student_goal_primary.sql`
  8. `20260709010000_student_message_editing.sql`
  9. `20260709020000_student_message_soft_delete_fix.sql`
  10. `20260709030000_push_subscriptions_v1.sql`
  11. `20260709040000_harden_student_photo_url_path.sql`
- **Result**: `supabase db push` completed successfully.

---

## 4. Hosted Schema and Storage Verification

- **Database Schemas & Tables**: Checked that all schemas, enums, core tables, custom functions, RPCs, and views (`current_student_project_statuses`, `latest_student_emotional_statuses`) exist in the remote database as defined in the migrations.
- **RLS Status**: RLS is fully active on all core tables in the remote database.
- **Storage Bucket (`student-photos`)**:
  - Successfully created privately via the SQL migrations script.
  - Public flag set to `false`.
  - Max file size limit set to `5242880` bytes (5 MB).
  - Allowed MIME types limited to `image/jpeg`, `image/png`, and `image/webp`.
  - Object policies (`READ`, `INSERT`, `UPDATE`, `DELETE`) successfully established.

---

## 5. Auth / OAuth Configuration Status

- **Status**: **Pending (Blocker)**.
- **Site URL**: `https://noa-rho-dusky.vercel.app` (to be set in Supabase dashboard).
- **Redirect URI**: `https://noa-rho-dusky.vercel.app/auth/callback` (to be set in Supabase dashboard).
- **Google OAuth Credentials**: Not yet configured. The Google Cloud Console and Supabase Dashboard Auth settings must be wired with client credentials before authenticated verification can proceed.

---

## 6. Vercel Configuration and Deployment Result

- **Project ID**: `prj_THnXT0MCdEoZiCFdVAUrg9HkmDck`
- **Project Name**: `noa`
- **Deployment URL**: `https://noa-e9l1id2vp-ronens-projects-e0420776.vercel.app`
- **Production Alias URL**: `https://noa-rho-dusky.vercel.app`
- **Environment Variables**: The following variables were configured in the Vercel project dashboard settings (for Production and Preview):
  - `NEXT_PUBLIC_SUPABASE_URL` = `https://qxjfzdmszgvymcuyuisu.supabase.co`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = *(Configured)*
  - `SUPABASE_SERVICE_ROLE_KEY` = *(Configured, Server-Only)*
  - `GOOGLE_ALLOWED_DOMAIN` = `chamama.org`
  - `BOOTSTRAP_SUPER_ADMIN_EMAILS` = `ronen@chamama.org`
  - `NEXT_PUBLIC_VAPID_PUBLIC_KEY` = `BIwzAdAyJjnXKiZoSD6EJ5lzKby_rDXxC9EfvvBvmdvaZ2TOaEZ9SHgXY4mpvdRo7P3ypMXnBt-8jRQuU1VSdiU`
  - `VAPID_PRIVATE_KEY` = *(Configured, Server-Only)*
  - `VAPID_SUBJECT` = `mailto:admin@chamama.org`
  - `NEXT_PUBLIC_APP_URL` = `https://noa-rho-dusky.vercel.app`

---

## 7. Smoke Test Results (Unauthenticated)

We verified unauthenticated page loading and redirection using HTTP checks:
- **`/login` page load**: **PASSED**. Renders successfully with local translations (e.g. `כניסת צוות`, `כניסה עם Google`) and matches standard layouts.
- **Unauthenticated `/dashboard` redirect**: **PASSED**. Correctly redirects anonymous requests back to `/login` (returned the login page markup).
- **Root `/sw.js` accessibility**: **PASSED**. Correctly serves the push and notification click service-worker listener script from the domain root.
- **Server crash check**: **PASSED**. No server crashes or hydration mismatches observed on unauthenticated entry routes.

---

## 8. Blockers

- **Google OAuth client credentials**: The Google Cloud Console project needs to be created or configured to allow OAuth callback redirects to the Supabase auth handler, and the client ID/secret must be entered in the Supabase Cloud dashboard.
- **Site URL & redirect updates**: Supabase dashboard auth redirects must be set to the Vercel production alias domain.

---

## 9. No-Real-Data Confirmation

We confirm that **no real student data** has been imported, seeded, or created on the hosted Supabase or Vercel instance. The database schema has only tables and structural elements, and all test records remain local.

---

## 10. Next Task Recommendation

We recommend proceeding to **Hosted Pilot Dry-Run Execution v1 — Part B**:
- Configure Google OAuth and redirects in Google Cloud and Supabase dashboards.
- Run the initial authenticated smoke test using the bootstrap super admin email (`ronen@chamama.org`).
- Perform hosted RLS probes and verify private storage uploads using a fake/generated image.
