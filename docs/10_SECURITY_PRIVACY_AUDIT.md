# 10 — Security, Privacy, and Audit

## Security posture

This app handles sensitive student information. Build for privacy and accountability from the first migration.

## Authentication

- Google OAuth only.
- Restrict to institutional accounts.
- Require active app profile.
- Do not allow arbitrary public signup.

## Authorization

Use defense in depth:

1. UI permission gating.
2. Server permission checks.
3. RLS policies.
4. Audit logs.

## Sensitive areas

Treat the following as sensitive:

- Student contacts.
- Student messages.
- Emotional status notes.
- Project risk status history.
- Goal history.
- Export files.
- Push subscriptions.
- Webhook secrets.

## Push notification safety

Push payloads must not include sensitive student details.

Bad payload body:

```txt
Student X emotional status changed to red.
```

Better payload body:

```txt
A student card you follow was updated.
```

Use deep links to authenticated app pages for details.

## Audit log required actions

Audit these actions:

- User role changes.
- Student create/update/delete.
- Student photo changes.
- Student message deletion.
- Project status changes.
- Emotional status changes.
- Goal create/update/archive.
- Announcement publication.
- Announcement deletion.
- Calendar event changes.
- CSV import.
- CSV export.
- Webhook configuration changes.
- Google Calendar sync failures if persistent.

## Soft deletion

Use soft deletion for:

- Student messages.
- Students.
- Announcements.
- Events.
- Learning groups.

Physical deletion should be rare and require a super admin maintenance action.

## Exports

Only managers and super admins can export.

Each export must record:

- Requesting user.
- Export type.
- Time.
- Whether sensitive data was included.
- Record count.
- File location.

Export files should expire or require regeneration.

## Webhook secrets

- Store secrets securely.
- Never expose secrets in UI after creation.
- Show only masked values.
- Allow rotation.

## Service role key

- Never expose the service role key to the browser.
- Use it only in trusted server/edge contexts.
- Keep all privileged actions behind explicit permission checks.

## Local development data

Do not use real student data in local seeds.

Real data import should happen only after auth, RLS, and exports are implemented and reviewed.
