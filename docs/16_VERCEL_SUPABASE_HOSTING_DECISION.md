# 16 - Vercel + Supabase Hosting Decision Memo

## 1. Decision Summary

For the pilot launch of the Chamama Staff App, we select **Vercel** for application hosting and **hosted Supabase Cloud** for database, authentication, and private storage.

- **Preferred Pilot App Hosting**: Vercel.
- **Preferred Database, Auth, & Storage**: Hosted Supabase (Supabase Cloud).
- **Deployment Target for First Hosted Dry Run**: A dedicated, fake-data-only production-like environment.
- **Real Student Data Gate**: Remains strictly **blocked** until a hosted dry-run is executed successfully and all security/privacy gates pass.
- **Google Calendar Sync**: Remains **deferred** (no Google Calendar variables will be configured during the dry run).

### Rationale
1. **Next.js 16 Native Compatibility**: Vercel is the developer of Next.js and provides first-class support for Next.js 16 runtime features, Server Actions, and the `src/proxy.ts` middleware convention.
2. **Operational Simplicity**: Using hosted serverless platforms minimizes the operator burden for a small school deployment, enabling focus on security and data privacy.
3. **Audit and Compliance Separation**: Hosted Supabase provides built-in SSL/TLS, database backups, and RLS enforcement out of the box, cleanly separating the client application from the secure data layer.

### Non-Goals
- This memo does not deploy any application code.
- This memo does not create Vercel or Supabase Cloud projects.
- This memo does not configure real Google OAuth credentials or VAPID keys.
- This memo does not import real student data.

### Required Approvals Before Execution
Before executing Hosted Pilot Dry-Run Execution v1:
- [ ] Project Owner approval of this decision memo.
- [ ] Assignment of the Technical Operator, Backup Owner, and Incident Owner.
- [ ] Selection of a production-like dry-run domain name.
- [ ] Pricing tier selection for hosted Supabase to confirm backup retention.

### Conditions for Revisiting the Decision
This decision will be revisited if:
- Vercel runtime constraints break Next.js 16's custom proxy/middleware resolution.
- Institutional Google Workspace policies restrict Google OAuth integration with third-party cloud-hosted services.
- Data sovereignty policies require on-premise hosting of student records, forcing a self-hosted Docker/Supabase stack.

---

## 2. Vercel Fit Check for this App

We evaluated Vercel's features against the specific requirements of the Chamama Staff App:

1. **Next.js 16 App Router**: Native support for Server Components, Route Handlers, and cache revalidation.
2. **Server Actions**: Fully supported. Vercel automatically manages server action endpoints and headers without manual API route configurations.
3. **Middleware/Proxy Auth Behavior (`src/proxy.ts`)**: Next.js 16 replaces `middleware.ts` with `proxy.ts`. Vercel's edge runtime supports custom routing logic and cookie propagation required by `@supabase/ssr` to validate user sessions before loading routes.
4. **Environment Variables**: Vercel offers distinct scopes (Production, Preview, Development) and supports encrypted Secrets, preventing leakage of the service-role key or private VAPID credentials.
5. **Preview Deployments**: Automatic previews generated per Git branch. This is highly useful for visual polish, but requires a strict security policy (see Section 5).
6. **Custom Domains**: Simple DNS mapping with automatic Let's Encrypt SSL/TLS certificates, ensuring all production traffic uses HTTPS.
7. **Root Service Worker (`/sw.js`)**: Web Push requires `/sw.js` to be served from the domain root. Placing the file in Next.js's `public/` directory allows Vercel to serve it natively at `https://<domain>/sw.js` with correct MIME types.
8. **Rollback Simplicity**: Vercel allows instant rollback to any previous successful deployment with a single click in the dashboard.
9. **Logs & Debugging**: Provides runtime function logs in the console to capture server action execution, error stacks, and audit logs.
10. **Unknowns**: Next.js 16's proxy/middleware performance under high concurrent traffic and cold-start latency for Server Actions must be verified during the dry-run rehearsal.

---

## 3. Supabase Fit Check for this App

We evaluated hosted Supabase against the database and storage requirements:

1. **Postgres Migrations**: Fully supported via the Supabase CLI (`supabase db push`). Remote DB schema will match local migrations.
2. **Row-Level Security (RLS)**: Enforced directly at the Postgres engine level. RLS policies will operate identically to local PG tests, blocking unauthorized SELECT/INSERT/UPDATE/DELETE.
3. **Supabase Auth & Google OAuth**: Standard integration. Supabase handles the OAuth handshake, token exchange, and session cookie generation, redirecting back to `/auth/callback`.
4. **Private Storage Bucket (`student-photos`)**: Hosted Supabase Storage supports private buckets, strict MIME checks, size limits, and signed URL generation. Direct public access fails by default.
5. **Service-Role Client**: Server actions can securely execute privileged SQL writes (e.g. audit logging and OAuth profile sync) using `SUPABASE_SERVICE_ROLE_KEY` inside the Vercel server runtime.
6. **Web Push Subscriptions**: The `push_subscriptions` table relies on Postgres unique constraints to prevent duplicate endpoints, which hosted Supabase handles natively.
7. **Backups and Restore Plan**: Hosted Supabase provides daily automatic backups. Point-in-time recovery (PITR) is available on Pro/Enterprise plans. Backup verification drills are required before importing real data.
8. **Custom Domain**: Supported as an add-on or built-in depending on the plan. This can be deferred for the dry run.
9. **RLS Smoke Tests**: The CLI allows running RLS verification scripts locally, but remote hosted RLS checks must be performed before real data ingestion.

---

## 4. Environment Variable Mapping for Vercel

The following table maps variables from `.env.example` to Vercel configuration settings. No real values should be committed to Git.

| Variable Name | Vercel Scope | Type | Required for Dry Run? | Required for Real Pilot? | Notes |
|---|---|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | All (Prod/Preview/Dev) | Public | Yes | Yes | Hosted Supabase API URL (`https://<ref>.supabase.co`). |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | All (Prod/Preview/Dev) | Public | Yes | Yes | Browser-safe Supabase anonymous key. |
| `SUPABASE_SERVICE_ROLE_KEY` | Production, Preview | Secret | Yes | Yes | Server-only. Do not configure for Dev. |
| `NEXT_PUBLIC_APP_URL` | Production (fixed), Preview (dynamic) | Public | Yes | Yes | Base canonical app URL (e.g. `https://dry-run.example`). |
| `GOOGLE_ALLOWED_DOMAIN` | All (Prod/Preview/Dev) | Public | Yes | Yes | Institutional Google domain (e.g. `school.org`). |
| `BOOTSTRAP_SUPER_ADMIN_EMAILS` | Production, Preview | Secret | Yes | Yes | Comma-separated operator emails for initial login. |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Production, Preview | Public | Yes | Yes | Public Web Push key. |
| `VAPID_PRIVATE_KEY` | Production, Preview | Secret | Yes | Yes | Private Web Push key. Server-only. |
| `VAPID_SUBJECT` | Production, Preview | Public | Yes | Yes | VAPID contact email (e.g. `mailto:ops@school.org`). |
| `SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID` | N/A (Supabase Dash) | Public-ish | Yes | Yes | Configured in Supabase Auth Provider, not Vercel. |
| `SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_SECRET` | N/A (Supabase Dash) | Secret | Yes | Yes | Configured in Supabase Auth Provider, not Vercel. |
| `GOOGLE_CALENDAR_CLIENT_ID` | None | Public | No | No | Deferred. Do not configure. |
| `GOOGLE_CALENDAR_CLIENT_SECRET` | None | Secret | No | No | Deferred. Do not configure. |
| `GOOGLE_CALENDAR_REDIRECT_URI` | None | Public | No | No | Deferred. Do not configure. |

---

## 5. Preview Deployment Policy

Preview deployments present a security surface area for a school app due to Google OAuth redirection constraints.

### Policy Recommendation: Option A (Safer)
*Disable Google OAuth testing on arbitrary preview branch URLs. Use one fixed production-like dry-run URL for all authenticated verification passes.*

### Details
1. **Risks of Broad Preview URL Auth**: Google OAuth requires exact redirect URIs. Specifying wildcards or adding many short-lived preview branch URLs to the Google Console is insecure and operationally noisy.
2. **Fake Data Only**: Preview deployments must never connect to a database containing real student data. They must either use a separate "dry-run" DB project or have mutations disabled.
3. **Real Data Block**: Real student data is strictly restricted to the production environment. No preview URL should ever have access to the production database credentials.
4. **Env Vars for Previews**: Preview environments will receive `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` pointing to the dry-run Supabase project. They do not receive production service-role keys.
5. **Redirect URL Handling**: Authenticated flows will only be verified against the canonical dry-run URL, preventing redirect mismatch errors.

---

## 6. Domain and OAuth Policy

Before executing the dry run, the operator must obtain these details:

1. **Production-like Dry-Run Domain**: `<dry-run-app-domain>` (e.g. `https://pilot-staff.chamama.org`).
2. **Future Production Domain**: `<prod-app-domain>` (e.g. `https://staff.chamama.org`).
3. **Approved Google Workspace Domain**: `<allowed-google-domain>` (e.g. `chamama.org`).
4. **Google OAuth Owner**: The institutional G-Suite administrator.
5. **Supabase Auth Site URL**: Set to the active domain (`https://pilot-staff.chamama.org`).
6. **Supabase Redirect URLs**: `https://pilot-staff.chamama.org/auth/callback`.
7. **Google Authorized JavaScript Origins**: `https://pilot-staff.chamama.org` and `https://<ref>.supabase.co`.
8. **Google Authorized Redirect URI**: `https://<ref>.supabase.co/auth/v1/callback`.
9. **Wrong-Domain Rejection test**: Verification requirement to try logging in with a personal Gmail account and ensure a redirect to `/access-denied` occurs.

---

## 7. Rollback and Operational Owner Policy

### Rollback Expectations
- **App Rollback**: Triggered instantly in the Vercel dashboard by selecting the last known stable deployment and clicking "Redeploy".
- **Database Migration Rollback**: Hosted Supabase migrations should be forward-fixed (applying a new migration to correct a bug) rather than rolled back, to avoid schema desynchronization. Destructive rollbacks are blocked unless a full DB restore is approved.
- **Bad Data Cleanup**: If fake or bootstrap data is corrupted during testing, the database will be reset via the Supabase CLI (`supabase db push --force` or db restore).

### Operational Owners

| Role | Responsibility | Proposed Owner |
|---|---|---|
| **Incident Owner** | General application downtime, security alerts, and domain issues | `<incident-owner>` |
| **Backup/Restore Owner** | Daily backup checks and database restore operations | `<backup-owner>` |
| **Deployment Operator** | Running builds, setting env vars, and executing dry runs | `<operator>` |
| **Secret Rotation Owner** | Rotating leaked Google secrets, database passwords, or VAPID keys | `<ops-team>` |
| **Dry-Run Approval** | Sign-off to execute the hosted dry run | Project Owner |
| **Real-Data Import Approval** | Sign-off to plan and ingest real student records | School Leadership |

---

## 8. Decision Matrix

| Criteria | Vercel + Supabase (Selected) | Netlify + Supabase | Self-Hosted App + Supabase (Docker) |
|---|---|---|---|
| **Familiarity for Operator** | High | Medium | Low |
| **Next.js 16 Support** | Excellent (Native) | Good | Complex (requires custom node setup) |
| **OAuth/Domain Complexity** | Low | Low | Medium |
| **Secret/Env Management** | Excellent | Good | Complex |
| **Rollback Simplicity** | Instant (One-Click) | Good | Medium (depends on container tag) |
| **Operational Burden** | Very Low | Very Low | High |
| **Suitability for Dry Run** | Perfect | Good | Poor (too much infrastructure overhead) |
| **Suitability for Real Pilot**| High | Medium | Medium |

---

## 9. Final Recommendation

We recommend proceeding with **Vercel + Hosted Supabase** as the default hosted pilot path, subject to the following gates:
1. Select a production-like domain name for the dry run.
2. Confirm the Supabase Cloud subscription tier to guarantee backup retention requirements.
3. Assign the Backup Owner, Incident Owner, and Technical Operator.
4. Adopt **Option A** for the preview deployment policy (disable OAuth redirection on branch previews).
5. Obtain explicit Project Owner sign-off to execute the Hosted Pilot Dry-Run.

> [!IMPORTANT]
> **Real student data remains strictly blocked** from entering any Vercel or Supabase Cloud environment until the dry-run rehearsal is completed and all security check gates pass.
