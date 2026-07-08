# GPT Admin Desktop Shell V1 Handoff

## Files changed

- `src/components/layout/AdminShell.tsx` (new)
- `src/app/(app)/layout.tsx`
- `src/app/(app)/admin/access-grants/page.tsx`
- `src/i18n/en.json`
- `src/i18n/he.json`
- `docs/12_CURRENT_STATE.md`
- `docs/handoff.md`
- `docs/parallel/GPT_ADMIN_DESKTOP_SHELL_V1_HANDOFF.md` (new)

## Chosen shell architecture

We chose **Option B (Path-aware shell component)**. 

### Rationale
- Conditionally renders the desktop-first `AdminShell` component inside the root layout wrapper `src/app/(app)/layout.tsx` by evaluating if the active route pathname starts with `/admin`.
- If it matches, the mobile bottom navigation bar is hidden and the admin sidebar is displayed.
- If it does not match, the mobile staff bottom navigation layout is rendered as normal.
- This approach completely avoids route-group directory refactoring, which would have required moving multiple folders (`announcements`, `dashboard`, `dev`, `more`, `students`, `today`) and would have caused major merge conflicts for parallel tasks working on those routes.

## Admin shell UI behavior

- **Desktop Layout**: Displays a sticky sidebar navigation on the start side (direction-aware: right side in RTL, left side in LTR) containing section links, and a scrollable content area.
- **Sidebar Elements**:
  - Administrative Navigation Title
  - Access grants link (fully clickable and highlighted on route match)
  - Muted, non-clickable placeholders for future admin modules (Calendar, Learning groups, Announcements, Students, Groups, Users, Import/Export, Settings)
  - Home link ("Back to Staff App") in the footer, returning the user to `/dashboard`
- **Mobile Responsive Fallback**: On narrow screens, the sidebar collapses. A sticky top bar is rendered displaying a hamburger menu trigger, which opens the sidebar menu as a overlay drawer. The staff `BottomNav` is hidden on all admin routes.

## Staff shell regression notes

All staff routes compile cleanly and continue to render their pages wrapped inside the mobile bottom navigation layout with full `BottomNav` access:
- `/dashboard`
- `/today`
- `/students`
- `/students/[studentId]`
- `/announcements`
- `/announcements/[announcementId]`
- `/more`

## i18n keys added

- `admin.nav.title` ("Administration" / "ניהול מערכת")
- `admin.nav.backToStaff` ("Back to Staff App" / "חזרה לאפליקציית צוות")
- `admin.nav.home` ("Admin Dashboard" / "לוח בקרה ניהולי")
- `admin.nav.calendar` ("Calendar" / "לוח אירועים")
- `admin.nav.learningGroups` ("Learning groups" / "קבוצות למידה")
- `admin.nav.announcements` ("Announcements" / "הודעות מנהלה")
- `admin.nav.students` ("Students" / "תלמידים")
- `admin.nav.groups` ("Groups" / "קבוצות")
- `admin.nav.users` ("Users" / "משתמשים")
- `admin.nav.accessGrants` ("Access grants" / "הרשאות גישה")
- `admin.nav.importExport` ("Import/Export" / "ייבוא וייצוא")
- `admin.nav.settings` ("Settings" / "הגדרות")
- `admin.nav.placeholder` ("Coming soon" / "בקרוב")

## Deferred admin/navigation items

- Concrete implementations of the placeholder sections (Calendar, Learning groups, Announcements, Students, Groups, Users, Import/Export, Settings).
- Global search input inside the top header.
- User menu profile triggers.

## Validation results

All quality check scripts ran and passed successfully:
- `npm run check:no-hebrew-in-code`: Passed with no Hebrew characters found in codebase.
- `npm run lint`: Passed with 0 errors/warnings.
- `npm run build`: Production compilation and typecheck succeeded.
- `git diff --check`: Passed with no whitespace errors.
