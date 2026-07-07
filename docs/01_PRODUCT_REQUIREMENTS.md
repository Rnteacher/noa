# 01 — Product Requirements

## 1. Staff dashboard

After sign-in, each staff member sees a personal dashboard containing:

- Management announcements.
- Announcements requiring read acknowledgement.
- Today’s events.
- Learning groups relevant today.
- Upcoming events this week.
- Followed students with recent updates.
- Students connected to the user as mentor or master.
- Quick search for any student.
- Quick create announcement, only for authorized users.

## 2. Student search

Any staff member can search and open any student card.

Search should support:

- Student name.
- Group.
- Mentor.
- Master.
- Project title.
- Status filters: project green/yellow/red, emotional green/yellow/red.
- Followed only.

## 3. Student card

Every staff member can view every student card.

The student card includes:

- Full name.
- Photo.
- Group.
- Relevant phone numbers.
- Relevant emergency/contact numbers.
- Group mentors.
- Project master or masters.
- Current project.
- Project status.
- Emotional status.
- Current goals.
- Staff message thread.
- Follow/unfollow button.
- Last updated timestamp.

## 4. Student message thread

Every staff member can add a message to any student card.

The thread should feel like a simple internal chat:

- Message body.
- Author name and role.
- Timestamp.
- Optional tag.
- Optional importance flag.
- Soft deletion.

Deletion rules:

- A user can delete their own message.
- A super admin can delete any message.
- Deletion must be soft deletion, not physical deletion.
- Audit logs must record deletion events.

## 5. Project status

Project status uses a simple traffic-light system:

- Green.
- Yellow.
- Red.

Only authorized users can update project status:

- Masters assigned to the student/project.
- Managers.
- Super admins.

A student can normally have one active project, but the data model should support historical projects and future expansion.

## 6. Emotional status

Emotional status also uses green/yellow/red.

All staff members can view it.

Authorized editors:

- Group mentors.
- Counselors.
- Managers.
- Super admins.

Recommendation: keep emotional status visible to staff, but treat free-text emotional notes as sensitive data. The first version may show the status globally while limiting deeper notes to authorized roles.

## 7. Goals

Goals are defined together with students, but in this staff app they are visible only to staff.

Mentors of the student’s group can:

- Add goals.
- Edit goals.
- Delete or archive goals.
- Mark goals as active/completed/paused.
- Set a goal as central.

Managers and super admins can also manage goals.

Future support:

- Optional synchronization with the existing student app.
- Each goal should have a `visible_to_student` field, even if initially false.

## 8. Student groups and mentors

A student belongs to a group.

Each group has two mentors.

Super admins manage:

- Groups.
- Student-group assignments.
- Group mentor assignments.
- Changes over time.

Mentor permissions are derived from the student’s active group.

## 9. Student masters

A student can have one or more masters. Multiple masters are exceptional but supported.

Super admins manage master assignments.

Masters assigned to a student/project can update that student’s project status.

## 10. Announcements

Management/admin users can create announcements.

Announcements include:

- Title.
- Body.
- Author.
- Target audience.
- Push notification flag.
- Read acknowledgement requirement.
- Publish timestamp.
- Expiration timestamp.
- Pinned flag.

Targeting options:

- All staff.
- Mentors.
- Masters.
- Management.
- Administration.
- Specific users.
- Specific groups.
- Specific layers/year levels.

Announcement editing must work well on mobile, because many routine announcements may be created from a phone.

## 11. Read acknowledgements

Some announcements require read acknowledgement.

The system stores:

- Announcement id.
- User id.
- Read timestamp.

Managers can see who acknowledged and who did not.

## 12. Daily reminders

The system sends a daily reminder to each user according to global settings and personal notification preferences.

A first version should include:

- Today’s relevant events.
- New announcements.
- Announcements waiting for acknowledgement.
- Important schedule changes.

The push message should not include sensitive student details.

## 13. Annual gantt/calendar

Managers can create and edit an annual event plan.

Events may be:

- All-day.
- Time-specific.
- Multi-day.
- Recurring.
- School-wide.
- Group-specific.
- Layer/year-level specific.
- Staff-only.

Admin interface requirements:

- Month view.
- Week view.
- Day view.
- Year/gantt overview.
- Drag to move events.
- Drag to resize events.
- Click to edit.
- Context menu for edit/duplicate/delete/send push/sync.
- Filtering by group, layer, category, month, owner, and notification status.

## 14. Google Calendar sync

The app is the source of truth.

Google Calendar receives synced events from the app.

No inbound sync from Google Calendar is required.

Each synced event stores the external Google Calendar event id.

## 15. Weekly learning groups

Learning groups happen every school day between 11:30 and 13:30.

Managers can create, edit, delete, and move learning groups interactively.

Each learning group includes:

- Title.
- Weekday.
- Start time.
- End time.
- Leader.
- Room.
- Target group or groups.
- Active date range.
- One-off exceptions.

## 16. CSV import/export

Super admins and managers can export data.

Super admins can import and manage all core data.

Export should be a ZIP containing multiple CSV files, not one giant CSV.

Export must be audited.

Sensitive data export should be limited and logged.

## 17. API and webhooks

Build an internal API first, but design it so it can later support communication with other apps, especially the existing student app.

Webhook support should be planned for key events:

- Student updated.
- Student message created.
- Project status changed.
- Emotional status changed.
- Goal created/updated.
- Event created/updated/deleted.
- Announcement published.
- Learning group updated.
