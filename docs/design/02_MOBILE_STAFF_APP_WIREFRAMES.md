# Design 02 — Mobile Staff App Wireframes (Text, Low-Fidelity)

## How to read this document

- All wireframes are described in **logical direction** ("start" = right in the Hebrew RTL UI, "end" = left). Never assume left/right.
- "Bottom nav" refers to the persistent mobile tab bar shared by all main staff screens: **Dashboard · Today · Students · Announcements · More**. Screens opened from within a tab (student card, announcement detail, settings) push over it with a back affordance in the header.
- Every screen defines: Header, Primary content, Sticky actions, Empty states, Error states, Loading states.
- Target device: a mid-range phone, one-handed use, unreliable school Wi-Fi. Perceived speed matters more than richness.

---

## 1. Login (`/login`)

### Header
- None. Full-screen focused layout.

### Primary content
- Centered vertical stack:
  - School / app logo mark.
  - App name.
  - One-line purpose sentence ("The staff app of Chamama").
  - Primary button: **Sign in with Google** (Google-branded button, full width with side margins).
  - Small note under the button: institutional accounts only.

### Sticky actions
- None; the sign-in button is the only action.

### Empty states
- Not applicable.

### Error states
- **Wrong domain / not approved:** the user is redirected to the access-denied screen with a clear explanation ("This account is not a Chamama staff account"), a sign-out/try-another-account action, and a contact hint for admins.
- **Valid domain, not activated yet:** access-pending screen — "Your account is recognized but not yet activated", with a sign-out action. Tone is reassuring, not alarming.
- **OAuth failure / network:** inline error banner above the button ("Sign-in failed, please try again") with the button re-enabled.

### Loading states
- After tapping the button: button switches to a spinner-in-button state; the rest of the screen dims slightly. No skeletons needed.

---

## 2. Dashboard (`/dashboard`)

### Header
- Start: app name or logo (small).
- End: search icon (opens student search), user avatar (opens More/settings).
- The header is compact; it should not compete with the acknowledgement banner below it.

### Primary content
Vertical stack of sections, each a titled card group. Order is fixed by priority:

1. **Requires your confirmation** — acknowledgement-pending announcements. Distinct emphasized banner cards (title + "read and confirm" affix). This section is visually loudest on the screen and cannot be dismissed without acknowledging.
2. **Announcements** — pinned first, then up to ~3 recent; each row: title, author, time, unread dot. "All announcements" link at section end.
3. **Today** — compressed timeline: up to ~4 next events/learning groups with time + title. "Full day" link.
4. **This week** — 2–3 upcoming highlight events. "Full week" link.
5. **Students you follow** — horizontal chip/card row of followed students **with recent updates only** (photo, name, small update hint like "new message"). Hidden when there are no updates.
6. **My students** — for mentors/masters: grid or row of their students with the two status dots.
7. Section for authorized users only: **quick create announcement** — exposed as a floating action button (FAB) at the bottom-end corner rather than a section.

### Sticky actions
- Bottom nav (Dashboard active).
- FAB "new announcement" for management+ only.

### Empty states
- Sections with nothing to show collapse entirely (no empty boxes) — except:
  - If literally everything is empty (new deployment): a single friendly hero state — "Nothing here yet. Your day at Chamama will appear here."
- "My students" absent for users who are not mentors/masters — never shown empty.

### Error states
- Per-section soft failure: a section that fails to load shows a one-line inline retry row ("Could not load — retry") without breaking the rest of the dashboard.
- Full failure (no session/network): full-screen error with retry.

### Loading states
- Skeleton cards per section in the fixed section order, so layout does not jump. Sections resolve independently.

---

## 3. Today (`/today`)

### Header
- Title: day name + date ("Sunday · 7.7").
- Start/end paging chevrons for previous/next day (chevrons flip for RTL).
- "Back to today" pill appears when viewing another day.

### Primary content
- **All-day events** first as full-width banner rows (no time column).
- Then a chronological list of timed items, each row:
  - Time range (fixed-width column at start).
  - Title.
  - Sub-line: room/location, leader (for learning groups), audience tag (school-wide / group name / layer / staff-only).
  - Category accent (thin edge marker on the row's start side).
- Learning groups (11:30–13:30) appear inline in time order, visually tagged as learning groups.
- Tapping a row opens a **bottom sheet** with full details: description, audience, category, times, location; no edit actions here (editing is admin-only, on desktop).

### Sticky actions
- Bottom nav (Today active).

### Empty states
- No events today: centered illustration-light state — "No events today." with a link to the week view.
- Non-school day: same state, optionally with the event that marks the day (holiday name) if present.

### Error states
- Full-list failure: centered error + retry.
- Pull-to-refresh available as the standard recovery gesture.

### Loading states
- Skeleton rows (time block + two text lines) ×5.

---

## 4. Week (`/week`)

### Header
- Title: week range ("7–11 July") with prev/next week paging.
- End: filter icon (opens a filter sheet: category, my-groups-only).
- "Back to current week" pill when off the current week.

### Primary content
- Vertical list of **day sections** for the school week.
- Each day section: sticky-ish day header (day name + date, "today" highlighted), then compact event rows (same row anatomy as Today, slightly denser).
- Days with no events show a single muted line "No events" inside the section — days are never hidden, so the rhythm of the week stays scannable.

### Sticky actions
- Bottom nav (Today tab hosts Today/Week as a segmented switch at the top of both screens — Today | Week — so both remain one tap away without consuming two nav slots).

### Empty states
- Entire week empty: hero state "A quiet week — no events scheduled."

### Error states
- Same pattern as Today (centered error + retry, pull-to-refresh).

### Loading states
- Skeleton day headers with 2 skeleton rows each.

---

## 5. Student search (`/students`)

### Header
- Search input, full width, auto-focus when arriving via the search icon. Placeholder: "Search a student…".
- Below the input: horizontally scrollable **filter chips**: Followed · Group · Mentor · Master · Project status · Emotional status. Chips with a selection show the selected value and a clear affix.

### Primary content
- Result list; each row:
  - Photo thumbnail (or initials avatar) at start.
  - Name (primary line), group name (secondary line).
  - End of row: two small status dots — project and emotional — each dot paired with a tiny distinguishing glyph so color is not the only signal.
- Default (no query, no filters): grouped list — "My students" (if any), "Followed", then "All students" grouped by group.
- Results update as the user types (debounced), maintaining scroll position sanity.

### Sticky actions
- Bottom nav (Students active).

### Empty states
- No results for a query: "No students found for '…'" + a hint to check spelling or clear filters, with a one-tap "clear filters" action when filters are active.
- No followed students (when Followed chip active): "You are not following anyone yet — open a student card and tap follow."

### Error states
- Search request failure: inline banner over the last good results ("Could not search — retry"), never wiping already-visible results.

### Loading states
- First load: skeleton rows ×8.
- Subsequent queries: subtle progress indicator on the search field; existing results stay visible until replaced.

---

## 6. Student card (`/students/[studentId]`)

Summarized here; the complete UX specification is `03_STUDENT_CARD_UX.md`.

### Header
- Back affordance at start.
- Student name (appears in the header once the identity block scrolls out of view).
- End: follow/unfollow toggle (always reachable), overflow menu for permitted actions.

### Primary content (scroll order)
1. Identity block: photo, full name, group, mentors, masters, last-updated timestamp.
2. Contact block: phone numbers and emergency contacts (tap-to-call), collapsed by default behind a "Contacts" expander.
3. Project block: project title, project status badge; status editor for authorized users.
4. Emotional status block: status badge; editor for authorized users; sensitive-notes affordance only for authorized roles.
5. Goals block: list of goals with status chips; central goal pinned first; management controls for authorized users.
6. Message stream: chat-like list, newest at bottom.

### Sticky actions
- Message composer pinned to the bottom (input + tag + importance + send) — replaces bottom nav while on the card.

### Empty states
- No project: "No active project" muted block (with "add" only for authorized users, if in scope).
- No goals: "No goals yet" + add action for authorized users.
- No messages: "No messages yet — write the first update." above the composer.

### Error states
- Card load failure: full-screen error + retry.
- Message send failure: the message stays in the composer/stream in a "failed, tap to retry" state; never silently lost.

### Loading states
- Skeleton: photo circle + name lines, then block skeletons in scroll order; the composer appears only after the stream loads.

---

## 7. Announcement detail (`/announcements/[id]`)

### Header
- Back affordance at start; overflow at end for authorized authors/managers (edit expiry, pin/unpin, view read report).

### Primary content
- Title (large).
- Meta row: author name + role, publish time, audience tag, pinned badge if pinned, expiration note if set.
- Body (rich-enough text: paragraphs, simple lists, links).
- **For managers on acknowledgement-required announcements:** a read-report summary strip ("12 of 20 confirmed") linking to the full report (acknowledged / pending lists with timestamps).

### Sticky actions
- If acknowledgement is required and not yet given: a full-width sticky bottom button — **"I read this"** — with a subtle confirmation state after tapping (button becomes a checkmark + "Confirmed at {time}").
- Otherwise: no sticky bar; bottom nav remains.

### Empty states
- Not applicable (a detail screen always has content); a deleted/expired deep link shows "This announcement is no longer available" + back to announcements.

### Error states
- Load failure: centered error + retry.
- Acknowledgement failure: button returns to active state with an inline error toast ("Could not confirm — try again"); the action is idempotent and safe to retry.

### Loading states
- Title + meta + body-paragraph skeletons.

---

## 8. Notification settings (`/settings`)

### Header
- Title: "Settings". Back affordance at start.

### Primary content
- **Profile block** (read-only): avatar, name, roles, sign-out action.
- **Notifications section** — grouped toggles:
  - Enable push on this device (master toggle; shows browser-permission state and a "fix permission" hint when the browser has push blocked).
  - Daily reminder: on/off + time picker (default from global settings).
  - New announcements: on/off.
  - Followed student updates: on/off.
  - Schedule changes: on/off.
- Each toggle has a one-line description of what it sends; descriptions repeat the promise that pushes never contain private student details.
- **Language/direction** is fixed (Hebrew RTL) in v1 — no control shown.

### Sticky actions
- None; changes save immediately with a transient "saved" confirmation per control (no global save button).

### Empty states
- Push not supported by browser/device: the notifications section shows an informational card ("This browser does not support notifications") instead of dead toggles.

### Error states
- A toggle that fails to save flips back visually with an error toast — the UI never shows a state the server did not accept.

### Loading states
- Toggles render disabled-skeleton until current preferences load.

---

## Shared mobile patterns

1. **Bottom sheet** is the default detail/action surface on mobile (event details, filters, message actions) — reachable, dismissible by swipe.
2. **Pull-to-refresh** on all list screens (Dashboard, Today, Week, Students, Announcements).
3. **Toasts** for transient confirmations and non-blocking errors; blocking errors get inline placement at the point of failure.
4. **Skeletons over spinners** for screen loads; spinners only inside buttons.
5. **Offline hint:** a slim persistent banner when the network is unreachable; read-only cached content remains visible where possible.
6. **Deep-link resilience:** every screen handles arriving cold from a push (auth redirect first, then land on target).
