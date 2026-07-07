# 09 — API and Webhooks

## API principles

The app should start with internal APIs and server actions, but design them cleanly so they can later support external clients, including the existing student app.

Rules:

- Use explicit permission checks.
- Validate inputs with schemas.
- Return consistent error shapes.
- Never expose service-role operations to the client.
- Log sensitive actions.

## Internal API areas

### Students

- List students.
- Search students.
- Get student card.
- Update student photo.
- Update student contacts.
- Assign student to group.

### Student messages

- Create student message.
- Soft-delete own message.
- Super admin soft-delete any message.
- List message thread.

### Projects

- Get current project.
- Update project status.
- Assign masters.

### Emotional status

- Get latest status.
- Create status update.
- Get status history for authorized users.

### Goals

- List goals.
- Create goal.
- Update goal.
- Archive goal.
- Set goal visibility for future student-app sync.

### Announcements

- List relevant announcements.
- Create announcement.
- Update announcement.
- Delete announcement.
- Mark as read.
- Get read report.

### Calendar events

- List relevant events.
- Create event.
- Update event.
- Delete event.
- Sync event to Google Calendar.

### Learning groups

- List weekly schedule.
- Create learning group.
- Update learning group.
- Delete learning group.
- Manage exceptions.

### Notifications

- Register push subscription.
- Update notification preferences.
- Mark notification as read.
- Send test push.

### CSV

- Validate import.
- Commit import.
- Create export.
- Download export.

## External API, future

Future student app integration may need:

- Get student-visible goals.
- Update student goal progress.
- Get student-relevant events.
- Get student-visible announcements.

Never expose internal staff messages through the student-facing API.

## Webhook events

Initial planned event types:

- `student.updated`
- `student.message.created`
- `student.project_status.changed`
- `student.emotional_status.changed`
- `student.goal.created`
- `student.goal.updated`
- `event.created`
- `event.updated`
- `event.deleted`
- `announcement.published`
- `learning_group.updated`

## Webhook payload shape

```json
{
  "id": "event-id",
  "type": "student.goal.updated",
  "created_at": "2026-07-07T07:00:00.000Z",
  "entity": {
    "type": "goal",
    "id": "goal-id"
  },
  "data": {}
}
```

## Webhook security

Each webhook delivery must include a signature header.

Example headers:

```txt
X-Chamama-Event: student.goal.updated
X-Chamama-Delivery: delivery-id
X-Chamama-Signature: sha256=...
```

Use HMAC with the webhook secret.

## Retry behavior

- Retry failed deliveries.
- Use exponential backoff.
- Store status and response code.
- Allow super admins to replay failed webhook deliveries.

## Data minimization

Webhook payloads should include only what the receiving system needs.

Do not include sensitive emotional notes unless a future explicit integration requires it and has been approved.
