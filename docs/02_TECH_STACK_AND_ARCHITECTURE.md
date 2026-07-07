# 02 — Tech Stack and Architecture

## Selected stack

Use this stack unless a future architecture review finds a specific blocker:

- Next.js App Router.
- TypeScript.
- Tailwind CSS.
- Supabase local development first.
- Supabase Cloud later.
- PostgreSQL.
- Supabase Auth with Google OAuth.
- Supabase Storage for student photos.
- Supabase Realtime only where it provides clear value.
- Supabase Edge Functions or Next.js server routes for privileged backend actions.
- Web Push / Firebase Cloud Messaging-compatible architecture for mobile push.

## Architecture shape

The project is a single monorepo-style Next.js app with clear internal boundaries:

```txt
src/
  app/
    (auth)/
    (staff)/
    (admin)/
    api/
  components/
    common/
    staff/
    admin/
    student-card/
    calendar/
  features/
    announcements/
    audit/
    auth/
    calendar/
    csv/
    groups/
    i18n/
    learning-groups/
    notifications/
    students/
    users/
    webhooks/
  lib/
    supabase/
    permissions/
    dates/
    validation/
  i18n/
    he.json
    en.json
```

## App areas

### Staff area

Route group: `src/app/(staff)`.

Mobile-first. It should be usable on a phone during a school day.

Primary routes:

- `/dashboard`
- `/today`
- `/week`
- `/calendar`
- `/students`
- `/students/[studentId]`
- `/announcements`
- `/notifications`
- `/settings`

### Admin area

Route group: `src/app/(admin)`.

Desktop-first. It should support heavier table, calendar, import/export, and configuration workflows.

Primary routes:

- `/admin`
- `/admin/students`
- `/admin/users`
- `/admin/groups`
- `/admin/calendar`
- `/admin/learning-groups`
- `/admin/announcements`
- `/admin/import-export`
- `/admin/webhooks`
- `/admin/audit-log`

## Backend placement

Use three layers:

1. Database functions and RLS for enforceable data rules.
2. Server Actions / Route Handlers for app-specific mutations.
3. Supabase Edge Functions for jobs, webhooks, and notification sending when needed.

## Local-first Supabase

Start with local Supabase:

- Version-controlled migrations.
- Version-controlled seed data.
- Local Storage bucket setup.
- Local auth setup documented.
- No manual schema changes without migration capture.

## Cloud migration later

When moving to Supabase Cloud:

- Create a cloud project.
- Link the local project.
- Push migrations.
- Configure Google OAuth credentials.
- Configure Storage buckets and policies.
- Configure environment variables.
- Configure scheduled reminders.
- Configure production web push keys.
- Seed only required production baseline data.

## Push notifications

Push architecture should support:

- User device registration.
- Notification preferences.
- Web push subscription storage.
- Push sending service.
- Safe notification body.
- Deep link target.
- Delivery logging.

Do not put sensitive student details in push payloads.

## Realtime

Realtime can be used for:

- Live student message thread updates.
- Notification badge refresh.
- Announcement read status updates.

Do not use Realtime as the only source of critical logic. Important notifications and audit logs must be written to the database.

## Permissions

Use defense-in-depth:

- UI hides unauthorized actions.
- Server actions validate permissions.
- RLS protects database access.
- Audit logs record critical actions.

## Recommended packages, to evaluate before installing

- `@supabase/supabase-js`
- `@supabase/ssr`
- `zod`
- `react-hook-form`
- `date-fns` or `dayjs`
- `rrule`
- `papaparse`
- `jszip`
- `lucide-react`
- `fullcalendar` or another calendar library after UI review
- `next-pwa` or custom service worker strategy after PWA review

Do not install packages casually. Each package should solve a real need.
