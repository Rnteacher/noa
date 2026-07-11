# 27 — Admin Import/Export Center v2

This document tracks the placeholder audit, structural design, validation schemas, and operator protocols for the upgraded Admin Import/Export Center.

---

## 1. Admin Sidebar Navigation Placeholder Audit

A search across `src/components/layout/AdminShell.tsx` and related routes identifies the following admin-facing navigation items:

| Translation Key | Path | Current Status | Action in this Task |
| :--- | :--- | :--- | :--- |
| `admin.nav.accessGrants` | `/admin/access-grants` | Active | Remains active |
| `admin.nav.calendar` | `/admin/calendar` | Active | Remains active |
| `admin.nav.learningGroups` | `/admin/learning-groups` | Active | Remains active |
| `admin.nav.announcements` | `/admin/announcements` | Active | Remains active |
| `admin.nav.students` | `#` | Disabled | Remains disabled (placeholder) |
| `admin.nav.groups` | `#` | Disabled | Remains disabled (placeholder) |
| `admin.nav.users` | `#` | Disabled | Remains disabled (placeholder) |
| `admin.nav.audit` | `/admin/audit` | Active | Remains active |
| `admin.nav.importExport` | `/admin/import-export` | Active | Refactored into a Tabbed Center |
| `admin.nav.settings` | `#` | Disabled | Remains disabled (placeholder) |

### Rationale
- We keep Students, Groups, Users, and Settings as disabled placeholders in the sidebar navigation.
- The `/admin/import-export` route serves as the unified dashboard for all bulk CSV operations, ensuring data integrity checks are centralized.

---

## 2. Center Architecture & Ingestion Flow

The Import/Export Center is divided into five tabs:

### A. Calendar Events
- **Purpose**: Seed and manage calendar events.
- **Actions**: Download CSV template/example, export active calendar events, preview/validate CSV, and Apply changes.
- **Safety**: Calendar event inserts use request-scoped Supabase client (respecting RLS). Google Calendar IDs are ignored/rejected.

### B. Learning Groups
- **Purpose**: Bulk-create weekly learning groups inside the school timetable.
- **Actions**: Download CSV template/example, export active learning groups, preview/validate CSV, and Apply changes.
- **Safety**: Inserts are done via request-scoped client with server-side pre-write validation and best-effort batch creation (no database transaction guarantee). Enforces RLS, timezone, and active-time boundaries.

### C. Staff Roster (Access Grants & Roles)
- **Purpose**: Validate and prepare whitelisted staff access grants and roles.
- **Actions**: Download CSV templates/examples, preview and validate uploaded CSV files.
- **Safety**: **Apply is disabled** in the browser to prevent unauthorized or accidental modifications. Operators must run whitelisted roster ingestion via the CLI tool.

### D. Student Roster (Groups, Students, Projects, Masters, Goals, Baselines)
- **Purpose**: Validate and prepare student profiles, project assignments, masters, and goals.
- **Actions**: Download CSV templates/examples (for all 9 files), upload and preview file folders, run relational consistency validation.
- **Safety**: **Apply is disabled** in the browser. Roster updates contain sensitive information; validation occurs client-side and server-side in a database-free read-only wrapper, directing final commits to the CLI tool.

### E. Operator Notes
- **Purpose**: Technical operator checklist.
- **Content**: Details on running validation, dry-run, apply-local, and rollback scripts locally, environment guards, and data recovery steps.

---

## 3. Database Safety & RLS Compliance
- **No Service-Role Usage**: The web application never utilizes the Supabase service-role client for normal app operations. All client/server actions use the standard user session token.
- **RLS Enforcement**: Only authenticated users with `manager` or `super_admin` roles are permitted to access the `/admin/import-export` routes and invoke import actions, as verified via server-side checks and database policies.
