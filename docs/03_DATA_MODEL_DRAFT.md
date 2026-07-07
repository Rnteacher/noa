# 03 — Data Model Draft

This is a first normalized schema draft. It is not yet final SQL.

Naming convention:

- Table names: plural snake_case.
- Column names: snake_case.
- Primary key: `id uuid primary key default gen_random_uuid()`.
- Timestamps: `created_at`, `updated_at`, optional `deleted_at`.
- Foreign keys should be explicit.
- Soft deletion for sensitive records where audit matters.

## school_years

Purpose: support current year and future archive.

Fields:

- id
- name
- starts_on
- ends_on
- is_current
- created_at
- updated_at

## profiles

App-level user profile linked to Supabase auth user.

Fields:

- id
- auth_user_id
- email
- full_name
- avatar_url
- primary_role
- is_active
- phone
- created_at
- updated_at

## roles

Fields:

- id
- key
- label_key
- created_at

Role keys:

- staff
- mentor
- master
- counselor
- management
- school_manager
- super_admin

## profile_roles

Many-to-many role assignments.

Fields:

- id
- profile_id
- role_id
- created_at

## groups

Student groups.

Fields:

- id
- school_year_id
- name
- layer
- is_active
- created_at
- updated_at

## group_mentors

Each group normally has two mentors.

Fields:

- id
- group_id
- profile_id
- mentor_slot
- active_from
- active_until
- created_at
- updated_at

Notes:

- `mentor_slot` may be `primary` or `secondary`.
- Use constraints to avoid more than two active mentors per group unless explicitly allowed later.

## students

Fields:

- id
- first_name
- last_name
- display_name
- photo_url
- is_active
- created_at
- updated_at
- deleted_at

## student_contacts

Fields:

- id
- student_id
- contact_type
- label
- name
- phone
- email
- notes
- sort_order
- created_at
- updated_at

## student_groups

Historical and current group assignments.

Fields:

- id
- student_id
- group_id
- school_year_id
- active_from
- active_until
- created_at
- updated_at

## projects

A student currently has one active project, but projects should be a table to support history and future expansion.

Fields:

- id
- student_id
- school_year_id
- title
- description
- is_current
- status
- status_note
- status_updated_by
- status_updated_at
- created_at
- updated_at
- archived_at

Status values:

- green
- yellow
- red

## student_masters

A student/project can have one or more masters. Multiple masters are exceptional but supported.

Fields:

- id
- student_id
- project_id
- profile_id
- is_primary
- active_from
- active_until
- created_at
- updated_at

## emotional_status_updates

Store emotional status as history, not only the latest value.

Fields:

- id
- student_id
- school_year_id
- status
- note
- created_by
- created_at
- deleted_at

Status values:

- green
- yellow
- red

Privacy note:

- Status is visible to all staff.
- Free-text note may need stricter access, even if initial UI is simple.

## goals

Fields:

- id
- student_id
- school_year_id
- title
- description
- status
- is_primary
- visible_to_student
- sort_order
- created_by
- updated_by
- created_at
- updated_at
- archived_at

Status values:

- active
- completed
- paused
- archived

## student_messages

Fields:

- id
- student_id
- author_id
- body
- tag
- is_important
- parent_message_id
- created_at
- updated_at
- deleted_at
- deleted_by

Rules:

- Any staff member can create a message.
- A user can soft-delete their own message.
- Super admins can soft-delete any message.
- Deleted message bodies remain in the database but are not shown in normal UI.

## followed_students

Fields:

- id
- profile_id
- student_id
- notification_level
- created_at

Notification levels:

- all_updates
- important_only
- muted

## announcements

Fields:

- id
- title
- body
- author_id
- is_pinned
- requires_acknowledgement
- push_enabled
- published_at
- expires_at
- created_at
- updated_at
- deleted_at

## announcement_targets

Fields:

- id
- announcement_id
- target_type
- target_id
- created_at

Target types:

- all_staff
- role
- profile
- group
- layer

## announcement_reads

Fields:

- id
- announcement_id
- profile_id
- read_at

## events

Annual gantt/calendar events.

Fields:

- id
- school_year_id
- title
- description
- starts_at
- ends_at
- is_all_day
- recurrence_rule
- location
- category
- color_key
- push_enabled
- google_calendar_event_id
- created_by
- updated_by
- created_at
- updated_at
- deleted_at

## event_targets

Fields:

- id
- event_id
- target_type
- target_id
- created_at

Target types:

- all_school
- all_staff
- group
- layer
- profile
- role

## learning_groups

Weekly learning group schedule.

Fields:

- id
- school_year_id
- title
- weekday
- starts_at_time
- ends_at_time
- leader_id
- room_id
- description
- active_from
- active_until
- is_active
- created_by
- updated_by
- created_at
- updated_at
- deleted_at

## learning_group_targets

Fields:

- id
- learning_group_id
- target_type
- target_id
- created_at

## rooms

Fields:

- id
- name
- location_note
- is_active
- created_at
- updated_at

## notifications

Internal notification records.

Fields:

- id
- profile_id
- type
- title_key
- body_key
- body_params
- deep_link
- related_entity_type
- related_entity_id
- read_at
- sent_at
- push_status
- created_at

## push_subscriptions

Fields:

- id
- profile_id
- endpoint
- p256dh_key
- auth_key
- device_label
- browser
- platform
- is_active
- created_at
- last_used_at

## notification_preferences

Fields:

- id
- profile_id
- daily_reminder_enabled
- announcement_push_enabled
- followed_student_push_enabled
- event_push_enabled
- learning_group_push_enabled
- quiet_hours_start
- quiet_hours_end
- created_at
- updated_at

## csv_exports

Fields:

- id
- requested_by
- export_type
- included_sensitive_data
- record_count
- file_url
- created_at

## webhooks

Fields:

- id
- name
- url
- secret
- is_active
- event_types
- created_by
- created_at
- updated_at

## webhook_deliveries

Fields:

- id
- webhook_id
- event_type
- payload
- status
- response_code
- response_body
- attempt_count
- next_retry_at
- created_at
- delivered_at

## audit_log

Fields:

- id
- actor_id
- action
- entity_type
- entity_id
- before_data
- after_data
- ip_address
- user_agent
- created_at

Actions should include:

- student.created
- student.updated
- student.deleted
- student_message.created
- student_message.deleted
- project_status.changed
- emotional_status.changed
- goal.created
- goal.updated
- goal.archived
- announcement.created
- announcement.published
- announcement.deleted
- event.created
- event.updated
- event.deleted
- csv.imported
- csv.exported
- role.changed
