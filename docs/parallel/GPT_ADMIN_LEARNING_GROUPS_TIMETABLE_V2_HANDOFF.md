# GPT Admin Learning Groups Timetable V2 Handoff

This task upgrades the Learning Groups management section to support a weekly timetable layout view while keeping existing list and mutation workflows fully stable.

---

## 1. Files Changed

- `src/app/(app)/admin/learning-groups/page.tsx` [MODIFY] — Handled parsed URL search parameter `view`, defaulted to `timetable` view, and mounted the `LearningGroupsWorkspace` component.
- `src/app/(app)/admin/learning-groups/LearningGroupsWorkspace.tsx` [NEW] — Client-side wrapper coordinating active view layout containers (Timetable and List), header filter navigations, and dynamic sidebar form modes (edit vs create).
- `src/app/(app)/admin/learning-groups/LearningGroupsViewSwitcher.tsx` [NEW] — Client-side tab component to toggle the `view` parameter.
- `src/app/(app)/admin/learning-groups/LearningGroupsTimetable.tsx` [NEW] — Responsive weekday grid columns rendering daily learning group cards sorted chronologically. Renders title, time, room, leader, target student groups, and status badges. Fits quick edit pencil icons and archive button hooks.
- `src/i18n/en.json` & `he.json` [MODIFY] — Added translation keys for view selector names and cancel button text.

---

## 2. Implemented Features

### Timetable Read View
- **Weekly Schedule Columns**: Displays columns for all 7 weekdays (Sunday-Saturday), always rendered unconditionally with a `-` placeholder for empty days, mapping active groups sorted chronologically by time slots (e.g. 11:30 - 13:30 activity window). **Correction (found during browser verification)**: this bullet previously claimed Friday/Saturday columns collapse when empty; live testing confirmed no such logic exists in `LearningGroupsTimetable.tsx`. This is not a functional defect, and per the browser-verification task's no-new-features scope, this doc was corrected rather than adding collapsing behavior.
- **Responsive Layout**: Desktop layout aligns weekdays side-by-side in grid columns; mobile stacked layout stacks daily cards vertically.
- **Unified Filters**: The existing filters (`weekday` and `state`) apply dynamically to both List and Timetable layouts. If a weekday filter is active, only that weekday column is displayed.

### Sidebar Form Integration
- Coordinates workspace edits: clicking the edit Pencil button on any group card in the timetable or list updates the right-hand sidebar into Edit mode, pre-populating values.
- Reverts back to Create mode cleanly when clicking the "Cancel" header button.

---

## 3. Deferred Scopes

- **Timetable Drag-and-drop slots editing**: Drag-to-reschedule mutations remain deferred.
- **Outbound Google Calendar Sync API integration**: Sync flows remain deferred.
- **Capacity / roster management**: Group student capacities/rosters remain deferred.
- **School-year selection**: Pickers for active school years remain deferred.

---

## 4. Validation Results

- `npm run check:no-hebrew-in-code` — Pass (no Hebrew character literals exist in implementation code).
- `npm run lint` — Pass (0 warnings, 0 errors).
- `npm run build` — Pass (compiled production build successfully).
- `git diff --check` — Pass (0 trailing whitespace violations).

---

## 5. Browser Verification

Completed in a later pass against a real authenticated Google OAuth session (super_admin) and a real Chrome browser. No code bugs were found. Summary (see `docs/12_CURRENT_STATE.md`'s "Admin learning groups timetable views v2 status" for full detail):

- All 8 required URL/param combinations (`view=timetable|list`, invalid `view=bad`, `weekday=all&state=active`, `weekday=monday`, `state=inactive`, `view=list&weekday=all&state=all`) rendered with no console errors; invalid `view` fell back safely to `timetable`.
- The Timetable/List switcher and the `weekday`/`state` filters applied identically to both views, confirmed live.
- Full create/edit/archive mutation flow verified live: a temporary group appeared correctly in Timetable (correct weekday/time) and List; editing from a Timetable card correctly pre-populated the sidebar; archiving correctly flipped `is_active` and was reflected correctly by all three state filters; `learning_group.created`/`.updated`/`.archived` all appeared correctly in the audit log.
- Edge cases verified live: boundary times (11:30 start, 13:30 end) saved successfully; a time outside the 11:30-13:30 window was rejected server-side with a clean error even after removing the client-side HTML `min`/`max` constraints (confirming defense-in-depth, not just client-side validation); an end-before-start submission was cleanly rejected; groups with no leader/no room rendered with correct fallback text; three same-weekday groups with different times sorted chronologically correctly.
- All temporary test groups were deleted afterward; the `learning_groups` table was verified back to its original single-row seeded state.
- **Documentation correction**: this doc's "Weekly Schedule Columns" bullet (section 2 above) previously claimed Friday/Saturday collapse when empty; this was found inaccurate during live testing and corrected in place, since adding real collapsing behavior would be a new feature outside this task's scope.

Validation after this pass: `npm run check:no-hebrew-in-code`, `npm run lint`, `npm run build`, `git diff --check` — all passed. No code changes and no new migrations were needed.
