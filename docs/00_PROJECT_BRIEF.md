# 00 — Project Brief

## Product name

Working name: `Chamama Staff App`.

## Purpose

Build a staff-only web app for Chamama High School. The app is intended to become the daily operational layer for staff: announcements, daily and weekly schedule, annual gantt/calendar, student cards, staff notes, project status, emotional status, goals, notifications, reminders, exports, and future integrations.

## Primary audiences

1. Staff members using the mobile-first app during the school day.
2. Mentors and masters tracking students and projects.
3. Management and administration publishing updates.
4. School managers editing annual events, learning groups, and announcements.
5. Super admins maintaining system data, imports, exports, permissions, and integrity.

## Product shape

The system should be one web application with two main experiences:

1. Mobile-first staff app.
2. Desktop-first admin interface.

Both use the same backend, database, auth, permissions, and translation resources.

## Authentication

Users sign in with their institutional Google account. The system must restrict access to approved staff accounts and ideally to the school Google Workspace domain.

## Core mobile screens

- Personal dashboard
- Today at Chamama
- This week at Chamama
- Full gantt/calendar by month/year/date
- Student search
- Student card
- Staff notes/chat on student card
- Followed students
- Notifications
- Announcements
- User preferences

## Core admin screens

- Student management
- Staff/user management
- Group management
- Mentor assignment per group
- Master assignment per student/project
- Annual gantt/calendar management
- Weekly learning group schedule management
- Announcement management
- CSV import/export
- API/webhook settings
- Audit log

## Source of truth decisions

- The app is the source of truth for calendar/gantt events.
- Google Calendar is a sync target only.
- Events created or edited directly in Google Calendar are not imported back into the app.
- Current project: one active project per student for now.
- Future support for multiple projects should remain possible.
- Goals are visible only to staff in this app, but should be modelled so that selected goals can later sync to an existing student app.

## Language rule

The app will be Hebrew-facing, but source code must remain English-only. Hebrew strings belong only in dedicated language files.
