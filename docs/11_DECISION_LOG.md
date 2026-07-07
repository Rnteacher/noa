# 11 — Decision Log

## 2026-07-07 — Initial stack decision

Decision:

Use Next.js, TypeScript, Tailwind CSS, and Supabase.

Rationale:

- Familiar stack.
- Good fit for a web/PWA product.
- Supabase gives PostgreSQL, Auth, Storage, Realtime, local development, and later cloud deployment.
- The project needs structured relational data and clear permissions.

## 2026-07-07 — Local-first Supabase

Decision:

Start with local Supabase and move to cloud later.

Rationale:

- Allows fast development.
- Keeps schema and migrations version controlled.
- Avoids putting real data into the system before security basics exist.

## 2026-07-07 — App as calendar source of truth

Decision:

The app is the source of truth for annual calendar/gantt events. Google Calendar is an outbound sync target only.

Rationale:

- Avoids sync conflicts.
- Avoids duplicate imports.
- Keeps permissions and event targeting in the app.

## 2026-07-07 — Staff visibility model

Decision:

All staff can view all student cards, student messages, project status, emotional status, and goals.

Rationale:

- The app is a shared staff workspace.
- Editing permissions remain controlled by role and relationship.

## 2026-07-07 — Message deletion

Decision:

Users can delete their own student-card messages. Super admins can delete any message. Deletion is soft deletion.

Rationale:

- Allows user correction.
- Preserves audit trail.

## 2026-07-07 — Group-based mentor model

Decision:

Students belong to groups. Each group has two mentors. Mentor permissions are derived from the student’s active group.

Rationale:

- Matches school structure.
- Avoids repeated per-student mentor assignments.
- Still allows future exceptions.

## 2026-07-07 — Multiple masters supported

Decision:

Students/projects can have more than one master, even though this is exceptional.

Rationale:

- Supports edge cases without a later schema rewrite.

## 2026-07-07 — One active project for now

Decision:

Each student has one current active project for now.

Rationale:

- Matches current need.
- Use a projects table to support future expansion.

## 2026-07-07 — Goals staff-only for now

Decision:

Goals are visible only to staff in this app, but should include future student-app sync fields.

Rationale:

- Current product is staff-only.
- Future integration with existing student app is likely.

## 2026-07-07 — Read acknowledgements

Decision:

Announcements can require read acknowledgement.

Rationale:

- Management needs to know which staff members have seen important updates.

## 2026-07-07 — Daily reminders

Decision:

The system should send daily reminders.

Rationale:

- The app is intended as daily operational infrastructure.

## 2026-07-07 — Draft mode not required

Decision:

No draft mode for announcements/events in the first version.

Rationale:

- Simpler MVP.
- Add confirmation before push sending instead.

## 2026-07-07 — Export permissions

Decision:

Only managers and super admins can export data.

Rationale:

- Student data is sensitive.
- Exports are high-risk and must be audited.

## 2026-07-07 - Initial schema role names

Decision:

Use the migration task role enum values: `staff`, `mentor`, `master`, `counselor`, `leadership`, `manager`, and `super_admin`.

Rationale:

- The migration task is more specific than the earlier RBAC draft.
- `manager` and `super_admin` map cleanly to export and administration requirements.
- `leadership` supports announcement creation without granting full manager privileges.

## 2026-07-07 - Announcement target mode

Decision:

Add `announcements.target_type` using the `announcement_target_type` enum, while keeping normalized target tables for roles, groups, and users.

Rationale:

- The enum was explicitly required.
- `all_staff` needs a durable representation without adding a synthetic target row.
- Normalized target tables keep role, group, and user targeting explicit.

## 2026-07-07 - Learning group time window

Decision:

Enforce the standard learning group window at the database level with `starts_at >= 11:30` and `ends_at <= 13:30`.

Rationale:

- The product requirement describes this as the normal operating window.
- The rule is simple, deterministic, and does not require application context.

## 2026-07-07 - Column-sensitive updates need RPC or server actions

Decision:

Use RLS for row-level authorization in the initial migration, but handle column-sensitive mutations through future RPC functions or server actions.

Rationale:

- PostgreSQL RLS policies decide which rows may be changed, not which individual columns may change.
- Student photo updates and student message soft deletion should be constrained to exact columns and paired with audit logging.
- A trusted server action or security definer RPC can enforce those column-level mutation contracts in one transaction.

## 2026-07-07 - Audit log write policy

Decision:

Allow managers and super admins to read audit logs, but do not allow normal client-side inserts in the initial RLS policy set.

Rationale:

- Audit logs should be append-only and trustworthy.
- Application code should write audit entries from privileged server-side flows or dedicated RPC functions.
- This avoids clients forging audit entries directly.

## 2026-07-07 - Staff access grants for first-run activation

Decision:

Use `staff_access_grants` and `staff_access_grant_roles` as the normal first-run activation path for staff accounts.

Rationale:

- Institutional Google domains may include users who are not staff.
- A valid Google domain alone is not enough to enter the staff app.
- Grants let a super admin or import process pre-approve staff emails and roles before first OAuth login.

## 2026-07-07 - Bootstrap super admin emails

Decision:

Support `BOOTSTRAP_SUPER_ADMIN_EMAILS` as a comma-separated server-side environment variable for first-run super admin access.

Rationale:

- A new environment needs a safe way to create the first admin without manually editing production data.
- Bootstrap emails still require Google OAuth and the allowed institutional domain.
- Bootstrap grants only `super_admin` and `manager` roles, and should be treated as a sensitive deployment setting.

## 2026-07-07 - Pending profiles for valid-domain users

Decision:

Create or update an inactive profile for valid-domain users who sign in without a grant, bootstrap entry, or existing active profile with roles.

Rationale:

- This gives administrators a visible pending account to activate later.
- It does not grant protected route access because route protection still requires `profiles.is_active = true` and at least one role.

## 2026-07-07 - Next.js route protection convention

Decision:

Use `src/proxy.ts` for request-level route protection.

Rationale:

- The project uses Next.js 16.2.10.
- In Next.js 16, the current documented convention is Proxy; `middleware.ts` is deprecated in favor of `proxy.ts`.
- Request-level protection still runs before app routes, auth callback routes are explicitly exempted, and protected routes require an active staff profile with roles.
