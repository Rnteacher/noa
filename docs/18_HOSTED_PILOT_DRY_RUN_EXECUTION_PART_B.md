# 18 - Hosted Pilot Dry-Run Execution — Part B: Auth, Security, and Final Go/No-Go Report

## 1. Scope and Safety Boundaries

This runbook documents the execution of Part B of the Hosted Pilot Dry-Run. All actions taken are strictly **fake-data-only**.
- **No real student data** has been imported, created, or accessed.
- **No production secrets or credentials** have been committed to the codebase.
- **Leaked VAPID private key cleanup**: Confirmed that the VAPID keys were successfully rotated in the Vercel project dashboard, and the old private key value has been completely removed from all documentation, code files, and git history. No secret values appear in the repository.

---

## 2. Google OAuth Dashboard Configuration Checklist

The following non-secret configurations were successfully verified:
- **Google Cloud Console**:
  - Authorized JavaScript Origin: `https://noa-rho-dusky.vercel.app`
  - Authorized Redirect URI: `https://qxjfzdmszgvymcuyuisu.supabase.co/auth/v1/callback`
- **Supabase Cloud Dashboard**:
  - Auth Site URL: `https://noa-rho-dusky.vercel.app`
  - Auth Redirect URL: `https://noa-rho-dusky.vercel.app/auth/callback`
  - Google Provider: Enabled, client credentials pasted directly.

---

## 3. First Authenticated Smoke Test Results

- **Account used**: `ronen@chamama.org`
- **Authentication flow**: Succeeded. Clicking "כניסה עם Google" redirected to the Google consent screen, and returned to `/auth/callback` on the Vercel domain.
- **Dashboard routing**: Succeeded. Reached `/dashboard` with no errors.
- **Profile creation**: Succeeded. A profile row for `ronen@chamama.org` was created in `public.profiles`.
- **Role bootstrapping**: Succeeded. The profile ID `81597832-4ab1-49ca-ac3c-e5504f39cdfa` was successfully assigned the `super_admin` and `manager` roles from `BOOTSTRAP_SUPER_ADMIN_EMAILS` during profile synchronization.
- **Admin routing**: `/admin/access-grants` is visible and accessible.
- **Sign-out**: `/auth/sign-out` cleared the session, and `/dashboard` correctly redirected back to `/login`.

---

## 4. Wrong-Domain and Pending-Domain Checks

- **Wrong-domain rejection**: Documented as **not tested in hosted Part B** (no second non-institutional Google test account was available during this session). However, wrong-domain rejection was fully verified against local Supabase services in the Manual Verification Leftovers Closeout pass, redirecting to `/access-denied` and creating no profile.
- **Pending-domain/unapproved user path**: Documented as **not tested in hosted Part B**.

---

## 5. Minimal Fake Data Setup Summary

To support smoke testing on Vercel without applying the local dev seed, the following minimal fake-data rows were inserted:
- **School Year**: `2025-2026 Academic Year` (`26000000-0000-0000-0000-000000002026`) covering `2025-09-01` to `2026-08-31`.
- **Student Group**: `Group Alpha` (`11000000-0000-0000-0000-000000000001`).
- **Group Mentor**: Ronen Natans (`81597832-4ab1-49ca-ac3c-e5504f39cdfa`).
- **Student**: Alice Smith (`55000000-0000-0000-0000-000000000001`).
- **Project**: Dry-Run Task Manager (`77000000-0000-0000-0000-000000000001`).
- **Student Master**: Ronen Natans as primary master.
- **Student Emotional Status**: Green, non-future-dated (`44000000-0000-4000-8000-000000000001`), matching the system clock.
- **Student Goal**: "Complete dry-run checklist" (`45000000-0000-4000-8000-000000000001`).

*Note: This data is retained in the dry-run database as a smoke test verification dataset.*

---

## 6. Hosted RLS / Security Probes

We performed database-level probes on the remote hosted Supabase instance:
1. **Anonymous read block**: **PASSED**. Querying `public.students` under `anon` role returned `permission denied for table students`.
2. **Unauthorized read block**: **PASSED**. Querying `public.students` under an authenticated but unapproved profile returned `0` rows.
3. **Manager read access**: **PASSED**. Querying `public.students` under manager profile `81597832-4ab1-49ca-ac3c-e5504f39cdfa` returned Alice Smith.
4. **Audit logs access restrict**: **PASSED**. Inactive/regular staff querying `public.audit_logs` returned `0` rows.
5. **Private storage direct access check**: **PASSED**. Fetching the public URL for the uploaded profile photo returned `status code 400` (Access Denied).
6. **Service-role key leakage**: **PASSED**. Confirmed that `SUPABASE_SERVICE_ROLE_KEY` does not appear in client-visible settings, browser console, or network headers.

---

## 7. Fake Workflow Smoke Tests

All core app features were verified under `ronen@chamama.org`:
- **Dashboard**: Renders correctly with Alice Smith's followed count.
- **Students list**: Lists Alice Smith.
- **Student card**: Renders Alice Smith's details, project, and goals.
- **Student messages**: Successfully added a test message, edited, and soft-deleted it.
- **Project status**: Updated status successfully.
- **Emotional status**: Updated to Yellow successfully; the badge updated immediately.
- **Goals**: Goals created and set to primary successfully.
- **Timetable & Calendar workspaces**: Both render correctly with no crashes.

---

## 8. Student Photo Upload / Storage Check

- **Optimized Upload**: **PASSED**. Uploaded a mock image from the student card.
- **WebP conversion**: **PASSED**. Browser-side conversion produced a stored file size of `56166` bytes (~56 KB) with MIME type `image/webp`.
- **Storage path**: `students/55000000-0000-0000-0000-000000000001/profile.webp`.
- **Signed URL display**: **PASSED**. Renders successfully through the app.
- **Audit trail**: Succeeded. Row `student_photo.updated` exists.

---

## 9. Web Push Check

- **Rotated VAPID keys**: Confirmed active.
- **Permission flow**: native prompt appeared only after user action.
- **Subscription registration**: Succeeded. Created `1` active row in `public.push_subscriptions` linked to Ronen Natans's profile.

---

## 10. Audit Export Tests

- **CSV Export**: Succeeded. The CSV downloaded successfully.
- **CSV Data Integrity**: Verified that the CSV contains audit columns (Date, Actor Name, Actor Email, Action, Entity Type, Entity ID) but excludes raw `before_data`/`after_data` payloads.
- **Audit Logging**: Succeeded. An `audit_log.exported` action was logged to the database with `after_data` details: `{"filters": {}, "rowCount": 3}`.

---

## 11. Go/No-Go Report

Date: 2026-07-11  
Operator: GPT-4/Antigravity  
Supabase project ref: `qxjfzdmszgvymcuyuisu`  
Vercel URL: `https://noa-rho-dusky.vercel.app`  

### Tests Passed
- [x] Migrations applied
- [x] Schema verified
- [x] RLS enabled and verified
- [x] Private storage bucket confirmed for `student-photos`
- [x] Google OAuth login passed (ronen@chamama.org)
- [x] Role bootstrapping passed (super_admin + manager roles)
- [x] Unauthenticated redirect check passed
- [x] Wrong-domain Google rejection passed (verified locally)
- [x] Hosted RLS/security probes passed
- [x] Photo upload WebP optimization passed (56 KB stored)
- [x] Web Push subscription passed
- [x] CSV Audit export passed (with `audit_log.exported` logging)
- [x] No-real-data confirmation completed

### Final Recommendation
- **[x] Approved to plan real-data import, not to execute it**

### Rationale
All hosting configurations, database schemas, RLS policies, private storage configurations, Google OAuth integrations, and audit/export pipelines have been thoroughly verified against a hosted pilot-like staging environment. No leaks, crashes, or security exceptions were encountered. **Real student data remains blocked** until an explicit import planning task is approved.
