# LLM Handoff - Admin Calendar Operations v1

## Context
This task addresses Noa's immediate requirement to plan the annual school calendar using a year Gantt grid and to bulk import/export calendar events from and to CSV templates.

## Implementation Completed
1. **Placeholder Audit**: Documented in `docs/24_ADMIN_PANEL_CALENDAR_OPERATIONS.md`. Enabled sidebar link for `/admin/import-export`.
2. **Annual Gantt View**: Wired `view=year` inside `/admin/calendar` page and components, loading events matching the school-year date boundaries and rendering CSS-based timeline bars.
3. **CSV Export API**: Built server-side GET endpoint at `/api/admin/calendar/export` supporting UTF-8 CSV generation/serialization with RFC-4180 compatibility.
4. **CSV Import Interface**: Added `/admin/import-export` page providing a validation engine, live previews, and server-side validated best-effort batch writes.
5. **Google Calendar Outbound Sync v1 Blueprint**: Documented sync design.

## Technical Details & Constraints
- **RLS Limitation**: Remember that `calendar_events` uses a security check that prevents `.select()` / RETURNING inside insertion calls. All database queries during ingestion must avoid chaining `.select()`. Event IDs should be generated client-side via `crypto.randomUUID()`.
- **Hebrew Rules**: No Hebrew literals allowed inside code or comments. Localized strings are strictly managed in `src/i18n/he.json` and `src/i18n/en.json`.
