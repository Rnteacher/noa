# Design 04 — Admin Desktop UX

## Scope and shared frame

The admin area is desktop-first: dense tables, calendars, and bulk operations that don't fit a phone. It shares auth, permissions, and translations with the staff app. Admin screens should remain *usable* on a tablet, but the design target is a laptop/desktop window.

### Shared admin layout

- **Side navigation** (start side): Admin home, Calendar, Learning groups, Announcements, Students, Groups, Users, Access grants, Import/Export, Audit log. Items render only for roles that can use them (school manager sees a subset; super admin sees all).
- **Top bar:** current area title, global student search, user menu, and a "back to staff app" link — admins are also staff and switch contexts often.
- **Content region:** per-area layouts below.
- **Audit visibility principle:** wherever an admin performs a state-changing action, the UI acknowledges it explicitly (toast + updated row), and destructive actions require typed or two-step confirmation.

> **Note:** `/admin/access-grants` is already implemented by a parallel task. Section 4 describes its UX context only; this document proposes no changes to that surface.

---

## 1. Annual calendar / gantt (`/admin/calendar`)

**Who:** school managers and super admins.

### Layout
- **View switcher** (top): Day · Week · Month · Year/Gantt.
- **Filter rail** (collapsible panel): by group, layer/year level, category, owner, month, push/notification status, sync status.
- **Main canvas:** the selected calendar view.
- **Create:** "New event" primary button + click-on-empty-slot creation in day/week views.

### Views
- **Month:** classic grid; events as compact bars; multi-day events span cells; overflow per day collapses to "+N more".
- **Week / Day:** time-axis columns; all-day lane on top; drag to move, drag edges to resize.
- **Year / Gantt:** rows = categories or groups (user-selectable grouping), columns = months; multi-day and recurring events render as horizontal bars. This is the annual-planning view — optimized for spotting collisions and empty stretches across the school year.

### Event interactions
- **Click** an event → edit panel (side panel, not modal, so the calendar stays visible): title, description, date/time (all-day, timed, multi-day), recurrence, audience (school-wide / groups / layers / staff-only), category, visibility.
- **Context menu** (right-click / overflow): edit, duplicate, delete, send push, sync to Google Calendar.
- **Drag to move / resize** with immediate optimistic feedback and an undo toast.
- **Recurring events:** editing asks scope explicitly ("this occurrence / this and following / entire series").

### Google Calendar sync
- The app is the source of truth; sync is outbound only. Each event shows a small sync-state indicator (not synced / synced / sync failed). A failed sync exposes a retry action. Nothing in the UI suggests inbound sync exists.

### States
- Empty year: onboarding hint ("Start by creating the annual plan — add the first event or import").
- Load failure: full-canvas error + retry; drag operations that fail server-side roll back visibly with an error toast.

---

## 2. Learning groups weekly editor (`/admin/learning-groups`)

**Who:** school managers and super admins.

### Layout
- **Grid canvas:** columns = school weekdays (Sunday–Friday as configured), rows = the time axis of the fixed daily window (11:30–13:30). This is a small, dense grid — the whole week fits on one screen without scrolling.
- **Above the grid:** active date-range selector (the term/period this schedule applies to) and a room-conflict indicator toggle.
- **Side panel:** opens on select/create with the learning group form: title, weekday, start/end time, leader (staff picker), room, target group(s), active date range.

### Interactions
- Click an empty slot → create at that weekday/time.
- Drag a block to another day/time; resize within the window. Conflicts (same room, same leader, overlapping time) highlight immediately on the affected blocks — warn, don't hard-block, since real school scheduling has exceptions.
- **One-off exceptions:** from a block's context menu — "cancel on a specific date" / "modify on a specific date"; exceptions are listed inside the side panel with remove actions.
- Duplicate a block across days from the context menu (common when the same group meets multiple days).

### States
- Empty week: "No learning groups yet" + create hint.
- A block whose leader or target group was deleted/deactivated shows a warning badge and is listed in a "needs attention" strip above the grid.

---

## 3. Announcements management (`/admin/announcements`)

**Who:** management, school managers, super admins.

### Layout
- **Table** of all announcements, newest first. Columns: title, author, audience summary, publish time, expiration, pinned, push sent, acknowledgement (required + progress "12/20"), status (active/expired).
- **Filters:** author, audience type, requires-acknowledgement, active/expired, date range.
- **Primary action:** "New announcement" — the same composer as mobile, in a desktop side panel with more room (audience picker as a structured builder: type → concrete selection → live audience-size preview).

### Row interactions
- Click → detail panel: full body, meta, and the **read report** for acknowledgement-required items: two tabs (Confirmed / Pending), each a list of names with timestamps, exportable, with a "remind pending" action (future: targeted re-push).
- Overflow per row: pin/unpin, change expiration, expire now, duplicate as new.
- No editing of a published body in v1 (no drafts, immediate publish); corrections are made by expiring and re-publishing — the UI should make "duplicate as new" easy for this.

### States
- Empty: "No announcements yet" + create action.
- A push that failed to send shows a warning icon in the push column with retry.

---

## 4. Staff access grants (`/admin/access-grants`) — context only

**Who:** super admins only. **Already implemented by a parallel task — no changes proposed here.**

UX context for the rest of the admin area:
- It sits in the admin side navigation under a "Users & access" cluster together with user management.
- Its interaction model (server-rendered list + forms, audit-logged mutations, super-admin double checks) is the reference pattern other admin surfaces should feel consistent with.

## 5. Student management (`/admin/students`)

**Who:** super admins (full); school managers (view + limited edits per RBAC).

### Layout
- **Table** of students. Columns: photo, name, group, mentors (derived from group), masters, project status, emotional status, active/archived.
- **Filters:** group, layer, status colors, has-no-master, unassigned-to-group, archived.
- **Bulk selection** with bulk actions: assign to group, archive (school-year rollover support later).
- **Row click** → student admin panel (side panel) with tabs:
  1. **Details:** name, photo, contact numbers, layer/year, group assignment (with history).
  2. **Masters:** current master assignments with add/remove (super admin only); multiple masters supported but visually marked as exceptional.
  3. **Card preview:** a link out to the staff-facing student card ("view as staff").

### Related structures
- **Groups** (`/admin/groups`, super admin): list of groups, each with its two mentor assignments (staff pickers), member list, and change history. Assigning a third mentor is blocked with an explanatory message (two mentors per group is a product rule).
- Mentor/master assignment changes surface a consequence note ("This changes who can edit emotional status / project status for N students") before confirm — permission side effects should never be a surprise.

### States
- Empty: "No students yet — import a CSV or add manually", linking to import/export.
- A student with no group or no master carries a subtle warning badge in the table (these gaps break the permission model).

## 6. CSV import / export (`/admin/import-export`)

**Who:** export — school managers and super admins; import — super admins only. Sensitive exports — super admins (school managers restricted).

### Export layout
- **Checklist of data sets** (students, groups, mentors/masters, calendar events, learning groups, announcements, goals…), each with a row count.
- **Sensitive sets** (student messages, emotional history/notes, project history) are visually separated under a "Sensitive data" divider with a warning treatment; selecting any of them requires an explicit extra confirmation and shows "this export will be recorded in the audit log" (all exports are audited; sensitive ones are marked as sensitive in the log).
- Output: one ZIP containing one CSV per selected set. The UI states the file naming and encoding conventions.
- Export history list below: who exported what, when, scope, sensitivity flag.

### Import layout (super admin only)
- **Stepper:** 1) choose data set type → 2) upload CSV → 3) **preview & validation** → 4) apply.
- The preview step is the heart of the UX: a table showing parsed rows with per-row status (create / update / error), error messages inline (bad references, duplicates, encoding), and summary counts ("40 create, 5 update, 2 errors").
- Apply is blocked while errors exist unless the admin explicitly chooses "skip error rows".
- After apply: result summary + link to the audit entry. Imports are never silent.

### States
- Upload/parse failure: clear error naming the row/column where parsing broke.
- Long-running export/import: progress state with the ability to leave the page and return (job status visible on re-entry).

---

## Cross-cutting admin UX rules

1. **Side panels over modals** for editing — the underlying table/calendar context stays visible.
2. **Optimistic UI with visible rollback** for drag interactions; **pessimistic UI** (wait for server) for destructive or permission-changing actions.
3. **Every destructive action names its blast radius** ("Delete this event and its 12 occurrences?").
4. **Audit trail is a feature, not a log file:** admin surfaces link to relevant audit entries after significant actions.
5. **RTL applies to admin too** — tables, side navigation, and panels follow the same logical-direction rules as the staff app.
