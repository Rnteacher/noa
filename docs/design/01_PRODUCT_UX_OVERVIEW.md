# Design 01 — Product UX Overview

## Purpose of this document

This document describes the main user flows of the Chamama Staff App from a UX perspective. It is the top-level map that the other design documents zoom into. It intentionally avoids implementation detail; it describes what the user sees, does, and expects at each step.

## Design context

- The app is staff-only, Hebrew-facing, and right-to-left (RTL). All wireframes and layouts in the design docs are described in logical terms ("start"/"end" rather than "left"/"right") so they translate correctly to RTL rendering.
- Two experiences share one system: a **mobile-first staff app** used on phones during the school day, and a **desktop-first admin area** for heavier management workflows.
- Roles: staff, mentor, master, counselor, management, school manager, super admin. A user can hold several roles. The UI must adapt by hiding unavailable actions, while the server and database enforce the real rules.
- Traffic-light statuses (green/yellow/red) for project status and emotional status are a core visual language across the app.

## Primary personas and their day

1. **General staff member** — opens the app between lessons. Wants: what is happening today, any new announcements, and quick access to a student card when a situation comes up.
2. **Mentor** — everything staff wants, plus: the students of their group, emotional statuses, goals, and the message stream on their students' cards.
3. **Master** — everything staff wants, plus: the students/projects they master, and the ability to flip a project status when a project drifts.
4. **Management / school manager** — publishes announcements (often from a phone), checks read acknowledgements, manages the annual calendar and learning groups from a desktop.
5. **Super admin** — maintains students, groups, users, grants, imports/exports, and audit — almost entirely on desktop.

---

## Main user flows

### 1. Staff daily dashboard

**Entry:** default screen after sign-in; the app icon / PWA opens here.

**Flow:**
1. User opens the app and lands on `/dashboard`.
2. The dashboard is a vertical stack of prioritized sections, top to bottom:
   - Announcements requiring read acknowledgement (blocking-attention style, always first when present).
   - Pinned / recent management announcements.
   - Today's events (compressed timeline).
   - Learning groups relevant today (for the user or their groups).
   - Upcoming events this week (short list, "see week" link).
   - Followed students with recent updates (new messages, status changes).
   - "My students" — students connected to the user as mentor or master.
3. A persistent search affordance lets the user jump to any student at any time.
4. Users with announcement permission see a quick-create action (floating or header-level).

**Key UX principle:** the dashboard is a triage surface, not a full view of anything. Every section links to its full screen (Today, Week, Announcements, Student card). Sections with no content collapse rather than showing empty boxes, except acknowledgement-required announcements, which never silently disappear until acknowledged.

### 2. Today at school

**Entry:** dashboard "Today" section, bottom navigation, or a daily reminder push.

**Flow:**
1. `/today` shows a single school day: date header with quick prev/next day paging.
2. Content is a chronological list: all-day events first (banner style), then timed events and learning groups interleaved by start time.
3. Each item shows: time range, title, location/room when relevant, audience tag (school-wide / group / layer / staff-only), and a category hint.
4. Tapping an event opens an event detail (bottom sheet or detail screen) with full description and audience.
5. Learning group items show leader, room, and target groups.

**Key UX principle:** "Today" must answer "where should I be and what is happening" in under five seconds, one-handed, possibly while walking.

### 3. Weekly view

**Entry:** bottom navigation or "see week" from the dashboard.

**Flow:**
1. `/week` shows the current school week as a vertical list of day sections (not a grid — grids fail on phones).
2. Each day section: day name + date header, then the same compact event rows as Today.
3. A week pager (prev/next week) at the top; "jump to today" appears whenever the user is not on the current week.
4. A filter affordance allows narrowing by category or audience (school-wide vs. my groups).

**Key UX principle:** the weekly view is for planning ahead, so scanability beats density. The full month/year calendar remains available at `/calendar` for deeper browsing, reusing the same event rows.

### 4. Student search

**Entry:** persistent search affordance on dashboard, bottom navigation "Students", or deep link.

**Flow:**
1. `/students` opens with a search field focused-ready and a default list (suggested order: my students, then followed, then all by group).
2. Typing filters by student name with instant results; results show photo thumbnail, name, group, and the two status dots (project, emotional).
3. A filter row (chips) allows: group, mentor, master, project status color, emotional status color, followed-only.
4. Tapping a result opens the student card.

**Key UX principle:** search is the app's fastest path to a student; it must work with partial names and remain responsive on slow school Wi-Fi. Status filter chips double as a lightweight "who is red right now" triage tool.

### 5. Student card

**Entry:** search result, dashboard "my students"/"followed" sections, or a link inside a message/notification.

**Flow:**
1. `/students/[studentId]` opens with identity at the top (photo, name, group, mentors, masters) and follow/unfollow immediately available.
2. Below identity: contact numbers, project + project status, emotional status, goals, then the staff message stream.
3. Status editing and goal management are visible only to authorized users; everyone else sees read-only status.
4. The message composer is available to all staff at the bottom of the stream.

Full detail is in `03_STUDENT_CARD_UX.md`.

**Key UX principle:** the card is a single scrollable page with the message composer reachable quickly — the most frequent action on the card is reading and writing messages.

### 6. Student card messages

**Entry:** within the student card; also via push/notification deep links ("new message on a followed student").

**Flow:**
1. The message stream reads bottom-up like a chat: newest at the bottom, composer pinned below.
2. Each message: author name and role, timestamp, body, optional tag, optional importance flag.
3. Long-press / overflow menu on own messages exposes delete (soft delete, with confirmation). Super admins see delete on any message.
4. Deleted messages show a neutral "message deleted" placeholder to preserve conversational context.
5. Composer: text area, optional tag selector, optional importance toggle, send.

**Key UX principle:** posting a message must feel as light as sending a chat message. Importance-flagged messages get visual emphasis in the stream and drive "recent updates" on the dashboard for followers.

### 7. Followed students

**Entry:** follow button on student card; followed list on dashboard; followed-only filter in search.

**Flow:**
1. Following a student is a single tap on the card (star/heart-style toggle with immediate visual feedback).
2. Followed students surface on the dashboard when they have recent updates: new messages, project status change, emotional status change.
3. The followed-only filter in student search acts as the user's personal watchlist.
4. Unfollowing is the same toggle; confirmation is not needed (fully reversible).

**Key UX principle:** following is the personal attention mechanism of the app — cheap to do, cheap to undo, and it feeds both the dashboard and (by preference) notifications.

### 8. Announcements

**Entry:** dashboard sections, bottom navigation / announcements screen, push notification.

**Flow (reader):**
1. `/announcements` lists announcements newest-first, pinned items on top.
2. Each row: title, author, publish time, audience tag, unread indicator, acknowledgement-required badge when relevant.
3. Tapping opens the announcement detail: full body, author, timestamps, and — when required — the acknowledgement action.
4. Expired announcements drop out of the default list (accessible via an "older" or archive affordance).

**Flow (author — management and above):**
1. Quick-create from the dashboard or announcements screen.
2. Compose form: title, body, target audience selector (all staff / roles / specific users / groups / layers), push toggle, acknowledgement-required toggle, pinned toggle, optional expiration.
3. Publish is immediate (no draft mode in v1); a confirmation step summarizes audience size and whether a push will be sent.

**Key UX principle:** announcement creation must be comfortable on a phone — managers write routine announcements on the go. The audience selector is the riskiest control; it must show a human-readable summary ("All staff", "Mentors of group X") before publish.

### 9. Read acknowledgement

**Entry:** acknowledgement-required announcements on the dashboard and announcements list.

**Flow (staff):**
1. Announcements requiring acknowledgement are visually distinct and persistent — they remain in the dashboard's top section until acknowledged.
2. The acknowledgement action lives on the announcement detail, after the body — a deliberate full-width button ("I read this") so acknowledging implies having opened and seen the content.
3. After acknowledging, the item leaves the "requires acknowledgement" section; the state is reflected immediately.

**Flow (management):**
1. On their own acknowledgement-required announcements, managers see a read report: acknowledged count vs. audience, with two lists (acknowledged / pending) and timestamps.
2. The pending list supports a follow-up nudge (future: re-push to pending users only).

**Key UX principle:** acknowledgement is a lightweight compliance loop — annoying enough to not be ignorable, cheap enough to complete in two taps.

### 10. Push notification entry points

Push payloads never contain sensitive student details (no statuses, no message bodies, no emotional information). The payload names the type of update and deep-links into the authenticated app, which shows the sensitive content only after auth.

Notification types and their landing targets:

| Notification | Safe payload example | Deep link target |
|---|---|---|
| Daily reminder | "Your day at Chamama: 3 events, 1 new announcement" | `/today` |
| New announcement | "New announcement: {title}" (title is manager-authored, non-sensitive) | announcement detail |
| Acknowledgement pending | "An announcement is waiting for your confirmation" | announcement detail |
| Followed student update | "Update on a student you follow" | student card |
| Schedule change | "A change in today's schedule" | `/today` |

**Flow:**
1. Tap on push → app opens (or resumes) → auth check → deep-link target.
2. If the session expired, the user passes through Google sign-in and then continues to the original target.
3. `/settings` (notification settings) lets each user tune: daily reminder on/off and time, announcement pushes, followed-student pushes, schedule-change pushes.

**Key UX principle:** every push must land the user exactly one tap away from the thing it referred to. A push that lands on a generic home screen trains users to ignore pushes.

### 11. Admin desktop areas

**Entry:** an "Admin" entry visible only to users with any admin-level capability, from the staff app's navigation; direct URLs under `/admin`.

Areas (full detail in `04_ADMIN_DESKTOP_UX.md`):

1. **Annual calendar / gantt** (`/admin/calendar`) — school manager and super admin. Month/week/day/year views, drag interactions, event CRUD, Google Calendar outbound sync state.
2. **Learning groups weekly editor** (`/admin/learning-groups`) — school manager and super admin. A weekday × time grid for the fixed 11:30–13:30 window.
3. **Announcements management** (`/admin/announcements`) — management and above. Table of all announcements, read reports, expiry and pinning management.
4. **Staff access grants** (`/admin/access-grants`) — super admin only. *Already implemented by a parallel task; the design doc describes its UX context only and proposes no changes to it.*
5. **Student management** (`/admin/students`) — super admin (structure), school manager (partial). Students, group assignments, mentor and master assignments.
6. **CSV import/export** (`/admin/import-export`) — export for managers and super admins; import for super admins only. ZIP-of-CSVs export, audited, with sensitive-data gating.

**Key UX principle:** admin screens optimize for correctness and bulk work — tables, filters, previews before destructive actions, and visible audit trails — rather than for speed of glanceable reading.

---

## Cross-cutting UX rules

1. **Permission-aware UI everywhere.** Controls the user cannot use are hidden, not disabled, except where hiding would confuse (e.g., a read-only status is shown as a plain badge, not a missing section).
2. **Traffic-light language is consistent.** Green/yellow/red dots and badges look identical wherever they appear (search rows, cards, admin tables) and never rely on color alone — each has an icon/label distinction for color-blind accessibility.
3. **Everything sensitive stays behind auth.** Pushes, link previews, and exports follow the safe-payload rules; the design docs flag sensitive surfaces explicitly.
4. **Empty, loading, and error states are designed, not incidental.** Every screen defines all three (see wireframes doc).
5. **RTL-first.** All layouts are described in logical direction terms; icons with directional meaning (back, next) must flip in RTL.
6. **One-handed mobile reachability.** Primary actions on mobile live in the bottom half of the screen: bottom navigation, bottom-sheet details, composer pinned at bottom.
