# GPT Admin Audit Log Viewer V2 Handoff

This task upgrades the Admin Audit Log Viewer page into an interactive, paginated investigation panel with multi-field filters (action, entity type, actor name/email, date ranges) and a secure dynamic CSV export endpoint.

---

## 1. Files Changed

- `src/features/admin/audit-queries.ts` [MODIFY] — Extended `AdminAuditLogRow` to include `actorEmail` and query pagination parameters. Replaced the static 100-row limit with range pagination (`.range()`) and total matching count fetching. Retrieves the active staff profile options list for dropdown filters.
- `src/app/(app)/admin/audit/page.tsx` [MODIFY] — Upgraded router page to parse all filter and pagination search parameters, query database, and mount filter and pagination subcomponents. Displays actor name and email side-by-side in rows.
- `src/app/(app)/admin/audit/AuditLogFilters.tsx` [NEW] — Client-side filter bar syncing action, entity, actor, and date ranges to URL GET search parameters. Features a "Clear filters" button and trigger to invoke CSV export.
- `src/app/(app)/admin/audit/AuditLogPagination.tsx` [NEW] — Client-side component displaying Previous/Next controls, active page number indicators, and page size selectors (25, 50, 100).
- `src/app/api/admin/audit/export/route.ts` [NEW] — Secure API Route Handler. Enforces session authentication and manager/super admin authorization. Queries up to 1000 matching rows using request-scoped user authorization (respecting RLS) and streams generated CSV bytes directly in-memory (no local disk files). Excludes raw JSON `before_data`/`after_data` fields to preserve user privacy. Automatically dispatches an `audit_log.exported` audit event capturing filters and row count.
- `src/i18n/en.json` & `he.json` [MODIFY] — Added translations for export button, actor selectors, date range fields, pagination button controls, page size titles, and header emails.

---

## 2. Implemented Features

### Investigation Filters
- **Action filter**: Dropdown selector of distinct audited actions.
- **Entity Type filter**: Dropdown selector of distinct audited entity types.
- **Actor filter**: Dropdown list containing the names and emails of active staff profiles.
- **Date Range filters**: Inclusive `fromDate` and `toDate` date pickers. `toDate` is converted to an exclusive next-day boundary to catch late-day logs correctly.
- **Parameters Sync**: All filter values are managed inside GET parameters, making urls easily shareable. Modifying filters automatically resets the active page to `1`.

### Pagination
- **Offset/Range Pagination**: Queries Supabase using `.range(from, to)`.
- **Page Size options**: 25, 50, and 100.
- **Page Controls**: Previous and Next buttons are enabled and disabled correctly at boundaries. Displays total pages matching the query.

### Controlled CSV Export
- Enforces OAuth session role check.
- Streams CSV output to browser on the fly (no files written to disk).
- Excludes sensitive JSON columns (`before_data`, `after_data`) from rows.
- Dispatches audit activity log event (`audit_log.exported`) recording query filters and row count.

---

## 3. RLS & Security Model

- **Authentication/Authorization**: Reads from `audit_logs` are executed via request-scoped Supabase client, relying on the DB RLS policy:
  `using (public.current_user_is_manager_or_super_admin())`
- **Mutations blocked**: Direct INSERT/UPDATE/DELETE on `audit_logs` remain blocked at the Postgres RLS layer for all client sessions.
- **API security**: `/api/admin/audit/export` checks user role via RPC `current_user_is_manager_or_super_admin` and returns `403` if unauthorized.

---

## 4. Browser Verification

Completed in a later pass against a real authenticated Google OAuth session (super_admin) and a real Chrome browser. Summary (see `docs/12_CURRENT_STATE.md`'s "Admin audit log viewer v2 status" for full detail):

- **Default page**: rows render with actor name/email; before/after JSON stays collapsed by default and expands correctly; default page size is 50.
- **Filters**: action, entity type, actor, from-date, to-date, and combined filters all correctly narrowed results via URL query params and reset to page 1; invalid/malformed params (`actorId=not-a-uuid`, `fromDate=garbage`, `page=abc`, `pageSize=999`) did not crash and fell back to safe defaults; "Clear filters" correctly reset the URL.
- **Pagination**: tested against a real 28-row dataset (generated via real create/delete actions through the existing calendar feature, never direct inserts). Page size 25 correctly produced 2 pages with correct Prev/Next boundary disabling and state preservation across navigation; page sizes 50 and 100 correctly showed all 28 rows on a single page.
- **CSV export**: verified both unfiltered (28 rows) and filtered by entity type (21 rows) via a direct authenticated `fetch` to the route. Confirmed the documented columns, no raw `before_data`/`after_data`, correct filter application, and `audit_log.exported` correctly logged with only `{filters, rowCount}` (never exported row contents) — confirmed directly against the database. The 1000-row cap was verified by code inspection only.
- **RLS/security**: verified with rollback-only SQL probes directly against the local Postgres container (not simulated) — a normal active-staff role sees 0 audit rows and INSERT/UPDATE/DELETE are all blocked by RLS; a manager role correctly sees all rows, matching the live super_admin browser session. An anonymous request to the export route was correctly intercepted by the app's auth middleware (307 to `/login`) before reaching the route handler. A live 403 test from a second, authenticated-but-non-manager real account was not performed (no second live account available this session), but the underlying RPC/RLS guard the route depends on was independently confirmed to deny non-privileged roles.

**Bug found and fixed**: the `toDate` filter (in both `getAdminAuditLogs` and the CSV export route) computed its exclusive next-day upper bound via `new Date(`${toDate}T00:00:00`)` — a string with no timezone marker, parsed by Node as local server time. On this server (`Asia/Jerusalem`, UTC+3), converting that local-time value back to UTC silently shifted the boundary earlier by the offset, so filtering `toDate` to "today" incorrectly excluded rows created earlier that same day (confirmed live: `toDate=2026-07-09` returned 0 of 28 real rows; `toDate=2026-07-10` returned all 28). `fromDate` was unaffected, since it constructs its UTC boundary directly as a string with no local-time `Date` parsing involved. Fixed in both files by computing the boundary entirely in UTC via `Date.UTC(year, month - 1, day + 1)`. Verified fixed live in both the page and a direct fetch against the export route.

Files changed for this fix: `src/features/admin/audit-queries.ts`, `src/app/api/admin/audit/export/route.ts`.

All temporary test data (calendar events used to generate a realistic audit dataset) was deleted afterward; the `calendar_events` table was verified back to its 2-row seeded state. The `audit_logs` rows generated by this real testing activity were intentionally left in place, since the audit log is an append-only record of genuine actions, not test debris.

---

## 5. Validation Results

- `npm run check:no-hebrew-in-code` — Pass (no Hebrew character literals exist in implementation code).
- `npm run lint` — Pass (0 warnings, 0 errors).
- `npm run build` — Pass (compiled production build successfully, including export API route).
- `git diff --check` — Pass (0 trailing whitespace violations).
