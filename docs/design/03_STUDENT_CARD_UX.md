# Design 03 — Student Card UX

## Role of the student card

The student card is the heart of the staff app: the single place where any staff member can understand a student's current situation and contribute an update. Every staff member can **view** every card; what each user can **change** depends on role and relationship (mentor of the student's group, master of the student's project, counselor, school manager, super admin).

The card is one vertically scrollable screen on mobile. Blocks appear in a fixed order chosen by frequency of use and sensitivity: identity → contact → project → emotional → goals → messages. The message stream is last because it is open-ended and anchors the pinned composer.

---

## 1. Identity area

**Position:** top of the card, always first.

**Content:**
- Student photo — large circular avatar; initials avatar as fallback. Photo is managed only by group mentors, school managers, and super admins (photo change lives in the overflow menu for those roles).
- Full name — the dominant text element on the card.
- Group name — tappable, filters student search by that group.
- Group mentors — names as small person-chips; tapping shows a mini contact popover (name, role).
- Project master(s) — same chip pattern. Multiple masters are exceptional but supported; the layout wraps.
- Last-updated timestamp — muted single line ("Updated {relative time}"), reflecting the most recent change on any block of the card.

**Behavior:**
- As the identity block scrolls away, the compact header takes over: name + follow toggle stay visible.
- The two status dots (project, emotional) appear as small badges alongside the name so the card's "traffic-light summary" is visible without scrolling.

## 2. Contact area

**Position:** directly under identity, collapsed by default behind an expander row labeled "Contacts".

**Content when expanded:**
- Student phone number(s) — tap-to-call, with a call icon.
- Emergency / family contacts — each with label (relation), name, and tap-to-call number.

**Rationale for collapsing:** contact data is needed rarely but urgently. Collapsing keeps the card compact while keeping contacts two taps away. The expander must be visually obvious (not buried) because urgent use happens under stress.

**Sensitivity note:** phone numbers are personal data. They render only inside the authenticated card; they are never included in push payloads, notification previews, or list rows.

## 3. Project status

**Position:** after contacts.

**Content:**
- Project title (current active project; one active project per student in v1).
- Project status as a traffic-light badge: green / yellow / red, each with a distinct glyph in addition to color.
- "Status since {date}" muted line, so a long-standing red is distinguishable from a fresh one.

**Editing (masters of this student, school managers, super admins):**
- Authorized users see a "change status" affordance on the badge; tapping opens a bottom sheet with three large status options and an optional short reason/comment field.
- Changing status posts an automatic system line into the message stream ("{user} changed project status to yellow") so status history is socially visible; the optional comment attaches to that line.
- Unauthorized users see the badge as plain read-only — no disabled buttons.

**Empty state:** no active project → muted "No active project" block; the status badge is absent (never a fake gray status).

## 4. Emotional status

**Position:** after project status; deliberately adjacent so the two traffic lights read together.

**Content:**
- Emotional status traffic-light badge (same visual system as project status, labeled clearly as emotional status).
- "Status since {date}" line.

**Editing (group mentors of this student, counselors, school managers, super admins):**
- Same bottom-sheet pattern as project status: three options + optional note.
- **The optional free-text note is sensitive.** The status color itself is visible to all staff; the note is visible only to the roles that can edit emotional status. In the UI this appears as a "notes" affordance on the block shown only to authorized roles.
- Status changes also post a system line to the message stream, but the line contains **only the color change, never the note text**.

**Sensitivity notes:**
- Emotional status color: staff-visible, allowed in-app everywhere the student appears (search dots, card badge).
- Emotional free-text notes: restricted to authorized roles; excluded from the general message stream, from standard exports (sensitive-export path only), and always from push payloads.

## 5. Goals

**Position:** after emotional status.

**Content:**
- List of goals; the **central goal** is pinned first with a distinct "central" marker.
- Each goal row: goal text, status chip (active / completed / paused), and — for authorized users — an overflow menu (edit, mark completed/paused, set as central, archive/delete).
- Completed and archived goals collapse under a "show previous goals" expander to keep focus on active goals.

**Editing (group mentors of this student, school managers, super admins):**
- "Add goal" action at the end of the list.
- Goal editor (bottom sheet): text, status, central toggle, and a `visible to student` toggle that is present but **off and locked in v1**, with a small caption "future student-app sync" — this keeps the future field visible in the mental model without enabling it.

**Read-only view:** other staff see the same list without action affordances.

## 6. Message stream

**Position:** last block; flows into the pinned composer.

**Content — each message:**
- Author name + role tag (e.g., "Mentor", "Master", "Counselor") — role context is what makes a note trustworthy.
- Timestamp (relative for recent, absolute for older).
- Body text.
- Optional tag chip (from the fixed tag set).
- Optional importance flag: importance-flagged messages get an emphasized treatment (accent edge + flag icon) and are what surfaces the student in followers' dashboards.
- System lines (status changes) appear inline, visually distinct from human messages (centered, muted, icon-led).

**Ordering:** chronological, newest at the bottom, auto-scrolled to the newest on open — the mental model is a group chat about the student.

**Deletion:**
- Own message: overflow → delete → confirm. Soft delete; the message is replaced by a muted "Message deleted" placeholder.
- Super admin: same affordance on any message.
- Deletions are audited server-side; the UI communicates permanence honestly ("The message will be hidden for everyone").

**Composer (all staff):**
- Pinned to the bottom: text input (grows to a few lines), tag selector (optional), importance toggle (off by default), send button.
- Send failure keeps the text and shows a retry state — a staff member's observation must never be lost.
- Realtime: new messages from others appear live while the card is open, with a subtle "new message" indicator if the user has scrolled up.

## 7. Follow / unfollow

- A single toggle in the card header (and on the identity block), always visible, instant feedback, no confirmation in either direction.
- Following means: the student appears in the user's followed list, surfaces on the dashboard on updates, and (per notification preferences) triggers followed-student pushes.
- The toggle state must be unambiguous at a glance (filled vs. outline icon + label change "Follow" / "Following").

## 8. Permission-aware action buttons

The card renders differently per viewer. The matrix below is the UI contract (server and RLS enforce the same rules independently):

| Card action | General staff | Master (of this student) | Mentor (of this student's group) | Counselor | School manager | Super admin |
|---|---|---|---|---|---|---|
| View entire card | yes | yes | yes | yes | yes | yes |
| Follow/unfollow | yes | yes | yes | yes | yes | yes |
| Add message | yes | yes | yes | yes | yes | yes |
| Delete own message | yes | yes | yes | yes | yes | yes |
| Delete any message | — | — | — | — | — | yes |
| Change project status | — | yes | — | — | yes | yes |
| Change emotional status | — | — | yes | yes | yes | yes |
| View emotional notes | — | — | yes | yes | yes | yes |
| Manage goals | — | — | yes | — | yes | yes |
| Change photo | — | — | yes | — | yes | yes |

UI rules:

1. **Hide, don't disable** — with one exception: statuses always render (as read-only badges) for everyone, because seeing the status is universal; only the *edit* affordance is conditional.
2. Overflow menus contain only the items the viewer can use; an empty overflow menu is not rendered.
3. Relationship-based permissions ("master of *this* student") are computed per card, not per role globally — a master viewing a student they don't master sees the general-staff card.

---

## Sensitive information — summary for this screen

| Data | Visibility | Push/notification exposure |
|---|---|---|
| Name, group, photo | all staff, in-app | Name may appear in-app only; pushes say "a student you follow", never the name |
| Phone / emergency contacts | all staff, in-app, behind expander | never |
| Project status color | all staff | never in payload; deep link only |
| Emotional status color | all staff | never in payload; deep link only |
| Emotional notes | authorized roles only | never |
| Messages | all staff, in-app | never (push says "new message", no body, no author) |
| Goals | all staff, in-app | never |

### Safe push payload pattern for student updates

- Title: generic category ("Update on a followed student").
- Body: type of update only ("New message" / "Status changed"), no student name, no content, no colors.
- Deep link: the student card route; content appears only after the authenticated app loads it.
- Rationale: push payloads traverse third-party infrastructure and appear on lock screens; treating them as public text is the only safe default for a school context.
