# Design 05 — Visual System Direction

## Intent

This document sets the visual and interaction direction for the Chamama Staff App. It defines principles and semantic tokens, **not** CSS values. Implementation should express these decisions as design tokens (Tailwind theme configuration) so they live in one place.

The personality target: **calm, warm, institutional-but-human**. This is a tool teachers use between lessons and during stressful moments — clarity and quietness beat visual excitement. The traffic-light statuses are the loudest color in the app; everything else stays out of their way.

---

## 1. Layout principles

1. **Single-column mobile, sidebar-plus-content desktop.** The staff app is one scrolling column with a bottom nav; the admin area is side-nav + content region.
2. **Logical direction only.** All spacing, alignment, and iconography are defined in logical properties (start/end), never physical left/right. The app is RTL-first; LTR is the derived case.
3. **Fixed section order.** Screens like the dashboard and student card have a fixed, prioritized block order — content never reorders itself based on data, so users build spatial memory.
4. **Content width discipline on desktop.** Reading surfaces (announcement body, forms) cap at a comfortable reading measure; tables and calendars may use full width.
5. **Reachability on mobile.** Primary actions live in the bottom half: bottom nav, bottom sheets, pinned composers, sticky confirm buttons.
6. **Density modes:** staff app is comfortable density (touch targets first); admin tables are compact density (information first) — but never below accessible touch/click target minimums.

## 2. Spacing scale

- Use a **single geometric-ish scale** with a small base unit (the conventional 4-unit base): steps at 1×, 2×, 3×, 4×, 6×, 8×, 12×, 16× of the base.
- Semantic usage rules rather than raw numbers:
  - **Within a component** (icon-to-label, input padding): the two smallest steps.
  - **Between related elements** (rows in a list, label to field): small-mid steps.
  - **Between blocks/sections** (dashboard sections, card blocks): mid-large steps — section separation must be visibly larger than in-section spacing, since the app leans on grouping instead of borders.
  - **Screen edge gutters:** one consistent gutter value per breakpoint, applied globally.
- Vertical rhythm matters more than horizontal precision in a single-column app; when in doubt, add vertical space between sections, not lines.

## 3. Typography direction

- **One typeface family** with excellent Hebrew support and matching Latin glyphs (a widely available open Hebrew-Latin sans; final pick during implementation). No second display typeface — hierarchy comes from size and weight.
- **Scale:** a small, strict set of text styles (roughly: screen title, section title, body, body-strong, caption, overline/tag). Every text element maps to one of these; no ad-hoc sizes.
- **Weight over size** for in-line emphasis; size changes mark hierarchy levels, not emphasis.
- **Numbers and times** (schedules, timestamps) should use tabular figures where alignment matters (time columns in Today/Week).
- **Line length and leading** tuned for Hebrew body text, which tends to read denser than Latin — slightly more generous leading on body copy.

## 4. Mobile navigation approach

- **Bottom tab bar** with five slots: Dashboard · Today · Students · Announcements · More.
  - "Today" hosts a Today | Week segmented switch at the top of the screen, so both live in one tab.
  - "More" contains settings/notifications, calendar (full month/year), and the admin entry for authorized users.
- **Push-over screens** (student card, announcement detail, settings) cover the tab bar and provide a header back affordance; system back must always work.
- **Badges:** the Announcements tab carries an unread/acknowledgement-pending badge; badges show counts up to a small cap ("9+").
- **FAB** is reserved for the single most important create action per screen (new announcement for authorized users on Dashboard/Announcements) — never more than one FAB, most screens have none.

## 5. Card style

- **Soft cards on a quiet background:** content blocks are cards distinguished mainly by surface contrast and spacing, with gentle rounding and minimal-to-no borders and at most a whisper of elevation. No heavy shadows.
- **One card = one tappable idea** in lists (a student row, an event row, an announcement). Whole-card tap targets, with inner actions (follow toggle, overflow) as clearly separated hit areas.
- **Accent edges** (a thin marker on the start edge) carry categorical meaning: event category on schedule rows, importance on flagged messages, "requires acknowledgement" on announcement cards.
- **Status dots/badges** are a first-class component: identical geometry everywhere (search rows, card header, admin tables), color + glyph + (where space allows) label.

## 6. Status colors — conceptual

Define **semantic tokens**, mapped to concrete values once during implementation:

- `status-positive` (green) — on track / calm. Must read as reassuring, not neon.
- `status-caution` (yellow) — attention needed. Must remain distinguishable from positive for deuteranopia; lean amber, and always pair with its glyph.
- `status-critical` (red) — needs intervention. Reserved exclusively for the traffic-light system and destructive actions; nothing decorative may use it.
- Separately: `accent` (brand/interactive color for links, active tab, primary buttons — deliberately **not** green/red so interactive elements never masquerade as statuses), `surface`/`surface-raised`, `text-primary`/`text-secondary`/`text-muted`, `border-subtle`, and feedback tokens (`info`, `success`, `warning`, `danger`) which may share hues with statuses but differ in usage context (toasts/banners vs. student-state badges).
- **Non-negotiable rule: color never carries meaning alone.** Every status has a paired glyph and accessible text label; every state communicated by color is also communicated by shape or text.
- Both light appearance is the v1 target; token indirection keeps a future dark appearance possible without redesign.

## 7. Accessible interaction patterns

1. **Touch targets** at or above platform-recommended minimums, including compact admin rows (row height may be compact, hit area may not).
2. **Focus visibility:** every interactive element has a visible focus state; the admin area must be fully keyboard-operable (tables, side panels, calendar navigation). Bottom sheets and panels trap focus and restore it on close.
3. **Contrast:** all text meets WCAG AA against its surface; status colors are chosen with AA-contrast badge text in mind.
4. **Semantics for assistive tech:** status badges expose their meaning as text ("Project status: yellow"); toasts announce politely; the acknowledgement button announces its confirmed state.
5. **Motion restraint:** transitions are short and functional (sheet slide, toast fade); respect reduced-motion preferences; no attention-grabbing animation except the acknowledgement-required emphasis, which uses static visual weight, not motion.
6. **Forgiving inputs:** destructive actions are two-step; drags are undoable; failed sends are retryable without data loss; forms preserve input on error.
7. **RTL correctness as an accessibility concern:** directional icons flip; keyboard arrow behavior in composite widgets follows reading direction.

## 8. Empty, loading, and error states

A shared vocabulary used identically across screens (specific instances are defined per screen in the wireframes doc):

### Empty states
- **Structure:** small icon or light illustration → one-line headline → optional one-line hint → optional single action.
- **Tone:** informative and warm, never blaming ("No events today", not "Nothing found!").
- **Rule:** an empty state must say what would fill it and, when the viewer can act, offer the action ("Add the first goal"). Sections that would be empty and meaningless collapse instead of rendering a placeholder — placeholders are for screens whose absence would confuse.

### Loading states
- **Skeletons for screens and sections** — shaped like the content they precede so layout never jumps; **spinners only inside buttons** for in-place actions.
- Sections load independently (dashboard) so one slow query doesn't blank the screen.
- Content that is already visible is never replaced by a loading state (search results stay while a new query runs).

### Error states
- **Three tiers:**
  1. **Inline** — field/section level, next to the failure, with retry ("Could not load — retry").
  2. **Toast** — transient action failures that don't block the screen (toggle save failed, ack failed) with automatic state rollback.
  3. **Full-screen** — the screen's primary data cannot load: icon, plain-language message, retry button; never a raw error code as the headline (codes may appear as small diagnostic text).
- **Honesty rule:** the UI never pretends success; optimistic updates that fail must visibly roll back.
- **Offline:** a slim persistent banner; cached content stays readable; write actions queue or fail loudly — never silently.

## 9. What this system deliberately avoids

- Multiple accent colors competing with the traffic-light system.
- Decorative illustration-heavy screens (small, quiet empty-state art at most).
- Dense dashboards of widgets — the dashboard is a prioritized list, not a control room.
- Any hardcoded color/size values scattered in components — everything routes through the token layer.
