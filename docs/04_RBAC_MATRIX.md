# 04 — RBAC Matrix

## Role keys

- `staff`
- `mentor`
- `master`
- `counselor`
- `management`
- `school_manager`
- `super_admin`

A user can have multiple roles.

## Relationship-based permissions

Some permissions depend on user relationship to a student:

- `is_group_mentor_for_student`
- `is_master_for_student`
- `is_counselor`
- `is_school_manager`
- `is_super_admin`

## Permission table

| Action | Staff | Master | Mentor | Counselor | Management | School manager | Super admin |
|---|---:|---:|---:|---:|---:|---:|---:|
| View staff dashboard | yes | yes | yes | yes | yes | yes | yes |
| View all students | yes | yes | yes | yes | yes | yes | yes |
| View student messages | yes | yes | yes | yes | yes | yes | yes |
| Add student message | yes | yes | yes | yes | yes | yes | yes |
| Delete own student message | yes | yes | yes | yes | yes | yes | yes |
| Delete any student message | no | no | no | no | no | no | yes |
| Follow student | yes | yes | yes | yes | yes | yes | yes |
| Update project status | no | related only | no | no | no | yes | yes |
| Update emotional status | no | no | related only | yes | no | yes | yes |
| Manage goals | no | no | related only | no | no | yes | yes |
| Manage student photo | no | no | related only | no | no | yes | yes |
| Create management announcement | no | no | no | no | yes | yes | yes |
| Send announcement push | no | no | no | no | yes | yes | yes |
| View announcement read report | no | no | no | no | yes | yes | yes |
| Manage annual calendar | no | no | no | no | no | yes | yes |
| Manage learning groups | no | no | no | no | no | yes | yes |
| Manage groups | no | no | no | no | no | no | yes |
| Assign group mentors | no | no | no | no | no | no | yes |
| Assign student masters | no | no | no | no | no | no | yes |
| Manage staff access grants | no | no | no | no | no | no | yes |
| Import CSV | no | no | no | no | no | yes | yes |
| Export data | no | no | no | no | no | yes | yes |
| Export sensitive data | no | no | no | no | no | restricted | yes |
| Manage users and roles | no | no | no | no | no | no | yes |
| View audit log | no | no | no | no | no | limited | yes |

## Implementation notes

Do not rely only on UI hiding.

Every protected action must be checked in three places:

1. UI: hide unavailable actions.
2. Server: validate action permission before mutation.
3. Database: enforce access with RLS and secure RPC functions where relevant.

## Suggested permission helpers

Implement permission helpers with clear names:

- `canViewStudentCard(profile, student)`
- `canCreateStudentMessage(profile, student)`
- `canDeleteStudentMessage(profile, message)`
- `canUpdateProjectStatus(profile, student)`
- `canUpdateEmotionalStatus(profile, student)`
- `canManageStudentGoals(profile, student)`
- `canManageStudentPhoto(profile, student)`
- `canCreateAnnouncement(profile)`
- `canManageCalendar(profile)`
- `canManageLearningGroups(profile)`
- `canImportCsv(profile)`
- `canExportData(profile, exportScope)`

## Sensitive data rules

- Emotional status is visible to all staff.
- Emotional notes should be treated as sensitive and may need narrower access.
- Push payloads must not expose sensitive student details.
- Exports containing student messages, emotional notes, or project/emotional history must be clearly marked as sensitive and audited.
