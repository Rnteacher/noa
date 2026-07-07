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
