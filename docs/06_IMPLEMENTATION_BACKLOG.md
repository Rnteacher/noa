# 06 — Implementation Backlog

## Phase 0 — Repository and docs

Goal: create the project skeleton and enforce project rules.

Tasks:

- Initialize Next.js app with TypeScript, App Router, Tailwind, ESLint, and path aliases.
- Add docs package.
- Add basic folder structure.
- Add i18n files.
- Add lint rule or custom check for Hebrew text outside language files.
- Add Supabase local project.
- Add initial environment examples.

Acceptance criteria:

- App runs locally.
- Docs are committed.
- Supabase local can start.
- No Hebrew exists outside allowed i18n files.

## Phase 1 — Auth, profiles, roles

Goal: users can sign in with institutional Google accounts and receive app roles.

Tasks:

- Configure Supabase Auth with Google OAuth.
- Create profiles table.
- Create roles and profile_roles tables.
- Create profile creation flow.
- Restrict access to allowed domain and active profiles.
- Create protected route layout.
- Create basic admin-only route guard.

Acceptance criteria:

- Unauthorized users cannot access app pages.
- Inactive users cannot access app pages.
- Role checks work on server and client.

## Phase 2 — Core data: school years, groups, users, students

Goal: establish the operational data foundation.

Tasks:

- Create school years.
- Create groups.
- Create group mentors.
- Create students.
- Create student contacts.
- Create student group assignments.
- Create admin tables/views for super admins.
- Add seed data for local development.

Acceptance criteria:

- Super admin can view groups and students.
- Student group assignment works.
- Group mentor derivation works.

## Phase 3 — Student card MVP

Goal: any staff member can open any student card and add notes.

Tasks:

- Student search.
- Student card page.
- Student photo display.
- Contacts display.
- Group mentors display.
- Masters display.
- Project section.
- Emotional status section.
- Goals section.
- Message thread.
- Create message.
- Soft delete own message.
- Super admin delete any message.
- Audit log for message deletion.

Acceptance criteria:

- Staff can view all student cards.
- Staff can add messages.
- Delete rules are enforced.
- Audit entries are written.

## Phase 4 — Project, emotional status, goals

Goal: authorized staff can update student status and goals.

Tasks:

- Project table and current project view.
- Student masters.
- Project status update flow.
- Emotional status history.
- Emotional status update flow.
- Goal create/edit/archive flow.
- Mentor-derived permissions.

Acceptance criteria:

- Master can update project status only for related students.
- Mentor can manage goals only for students in their group.
- Counselor can update emotional status.
- Staff can view status and goals but cannot edit unless authorized.

## Phase 5 — Announcements and read acknowledgement

Goal: management can publish announcements and track read acknowledgements.

Tasks:

- Announcement create/edit page.
- Mobile-friendly announcement editor.
- Announcement targeting.
- Announcement list in dashboard.
- Read acknowledgement button.
- Read report for managers.
- Pinned announcements.

Acceptance criteria:

- Management can create targeted announcements.
- Staff see relevant announcements.
- Read acknowledgement works.
- Managers see acknowledgement status.

## Phase 6 — Notifications and push foundation

Goal: users can receive safe push notifications.

Tasks:

- PWA manifest.
- Service worker strategy.
- Push subscription table.
- Notification preferences.
- Push registration UI.
- Notification creation service.
- Push sending service.
- Deep links.
- Delivery logging.

Acceptance criteria:

- Users can enable push.
- Test push reaches registered device.
- Push payloads contain no sensitive student details.
- Clicking push opens the correct app location.

## Phase 7 — Daily reminders

Goal: send daily operational reminders.

Tasks:

- Daily reminder query.
- Reminder notification builder.
- Scheduled job.
- User preference support.
- Quiet hours support.

Acceptance criteria:

- Daily reminders are created for relevant users.
- Users can disable daily reminders.
- Reminder content is safe.

## Phase 8 — Annual calendar/gantt

Goal: managers can manage annual events interactively.

Tasks:

- Events table.
- Event targets.
- Calendar views.
- Event create/edit/delete.
- Multi-day events.
- Recurring events.
- Drag and resize interactions.
- Push targeting for events.
- Staff calendar views.

Acceptance criteria:

- Managers can manage events.
- Staff see relevant events.
- Events can target groups/layers/all school.

## Phase 9 — Learning groups

Goal: manage weekly learning groups from 11:30 to 13:30.

Tasks:

- Rooms.
- Learning groups.
- Weekly admin schedule UI.
- Drag/drop changes.
- Active date range.
- One-off exceptions.
- Staff view.

Acceptance criteria:

- Managers can create and edit weekly learning groups.
- Staff can see relevant learning groups.

## Phase 10 — Google Calendar sync

Goal: sync app events outward to Google Calendar.

Tasks:

- Google Calendar integration credentials.
- Create event in Google Calendar.
- Update synced event.
- Delete/cancel synced event.
- Store external event id.
- Error handling.
- Sync status display.

Acceptance criteria:

- Events created in app sync to Google Calendar.
- Updates in app update Google Calendar.
- Google Calendar edits are not imported back.

## Phase 11 — CSV import/export

Goal: enable safe data import/export.

Tasks:

- CSV import UI.
- CSV validation preview.
- Students import.
- Users import.
- Groups import.
- Assignments import.
- ZIP export.
- Audit logging.

Acceptance criteria:

- Managers/super admins can export allowed scopes.
- Super admins can import core data.
- Errors are shown before data is committed.

## Phase 12 — API and webhooks

Goal: prepare communication with external apps.

Tasks:

- Internal API standard.
- Webhook table.
- Webhook signing.
- Delivery logs.
- Retry logic.
- Initial webhook events.

Acceptance criteria:

- Webhooks can be registered by super admin.
- Events are delivered with signed payloads.
- Failed deliveries retry and are logged.
