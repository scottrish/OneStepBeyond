# Feature: Mobile Gestures — Drag to Reorder & Swipe to Reveal Removal

**Status:** §2 (swipe) implemented 2026-09-25 (tag `v-pre-swipe-removal`
marks the state before; see "Implementation Notes (as built)"), on the
lists that exist today (see "Scope of the first increment" below). §1
(drag) is deferred to roadmap Phase 7 step 10, where it has something to
reorder; D1 is still open for it. Produced 2026-09-24 from a
prototype-sync audit of `../OneStepBeyondPrototype`'s unmerged
`mobile-redesign` branch (`1ce3145`; gesture work in commits
`5e39235`–`ac89c94`).

**How to read this document:** the prototype is evidence of UX, behavior,
and copy only (localStorage-backed mock). See
`daily-planning-and-completion-v2-proposal.md`. This spec covers the
**interaction chrome** shared by every reorderable or removable list.
The **rules** about what reorders, what gets re-timed, and what is
removed (and with which confirmation) stay in each feature's own spec,
and this document links to them rather than restating them.

## Summary

`mobile-redesign` replaces two families of small, always-visible row
controls with phone gestures:

1. **Drag to reorder.** A grip handle on each planned-work row replaces
   the stacked up/down chevrons.
2. **Swipe left to reveal a destructive action.** Remove / Delete /
   Cancel replaces the small trash and X icons on every removable list.

Neither gesture is the only way to do the job. Swiping *reveals* a
button and never acts directly. Every drag has a button-based
alternative. Existing confirmations are unchanged. The prototype's
stated goal (`.lovable/plan/drag-reordering-and-swipe-removal-2026-09-24.md`):
"Replace visible move-up/down and delete controls with familiar mobile
gestures while keeping the same saved-data behavior and a fully
accessible desktop/keyboard path."

## Source

Prototype (`mobile-redesign`): `src/components/efc/GestureRows.tsx`
(`ReorderableList`, `SortableRow`, `SwipeActionRow`), and its use in
`src/routes/plan.tsx`, `src/components/efc/LookAhead.tsx`,
`src/routes/assignments.index.tsx`, `src/routes/assignments.$id.index.tsx`,
`src/routes/assignments.$id.breakdown.tsx`, `src/routes/activities.tsx`,
`src/routes/courses.tsx`, and `src/routes/support.tsx`. New dependencies:
`@dnd-kit/core`, `@dnd-kit/sortable`, `@dnd-kit/utilities`.

## Current production behavior (for contrast)

- **No session reordering exists yet.** It's proposed in
  `daily-planning-and-completion-v2-proposal.md` item 2. The only
  reordering in the app is `WorkBreakdownPage`'s draft steps, through
  `src/domain/reorder.ts`'s `moveItem`, with this comment: *"Up/down
  move rather than drag-and-drop, per CLAUDE.md's mobile-first guidance
  against small precise drag handles."*
- Removal is a visible icon button on each row: Activities (trash),
  Already planned and Week Look-Ahead sessions (X), Assignments list
  (trash, with inline confirmation), Assignment Detail steps (trash,
  confirmation only for completed steps, per
  `docs/decisions/20260818-inline-work-item-management.md` point 4).

## Decisions required

**D1. Adopt drag-to-reorder, with a new dependency?** CLAUDE.md says to
avoid "small precise drag handles unless a touch-friendly equivalent is
also provided", and to avoid "unnecessary frameworks". The prototype's
handle is a 44×44 px target, not a small one, and this spec *requires*
a button-based equivalent on every sortable list (§1). That meets the
CLAUDE.md condition, but it reverses the reasoning recorded in
`reorder.ts`, and it adds `@dnd-kit` (about 3 small packages, with
pointer, touch, and keyboard sensors and screen-reader announcements
built in).
- **Option A (parity, recommended):** adopt `@dnd-kit` drag plus the
  required Earlier/Later fallback. Record the decision, including why a
  hand-rolled sortable isn't worth it (keyboard sorting and live-region
  announcements are the hard parts, and dnd-kit already does both).
- **Option B (smaller):** Earlier/Later buttons only, reached from each
  row's edit sheet, with no drag. This is fully accessible and adds no
  dependency, but it isn't parity, and reordering on phones takes one
  tap more per move.

**D2. Step deletion confirmation.** The prototype now asks for
confirmation on *every* step delete. For an open step the copy is:
"Delete this step? Any time planned for it will be removed too." This
app's recorded decision (`20260818-inline-work-item-management.md`
point 4) confirms only completed steps. **Resolved 2026-09-25: keep this
app's decision.** Swipe-to-reveal is already a deliberate two-step
gesture, so an open step's delete doesn't need a dialog on top of it.
(An earlier draft also cited `20260817-remove-undo-delete.md` here, but
that decision covers only *assignment* deletes.) If product wants the prototype's
warning when an open step has planned time, that's a narrow extension:
confirm only when the step has planned sessions. It would amend point 4
explicitly.

## 1. Drag to reorder

**Where:** exactly the three lists defined in
`daily-planning-and-completion-v2-proposal.md` item 2: the Schedule
step's draft rows, the existing-day view's sessions (item 10), and each
day in Week Look-Ahead. Not Assignments, Courses, Activities, or steps.
None of those have a meaningful order in this app.

**Handle:**
- A `GripVertical` button, 44×44 px, at the row's leading edge,
  vertically centered, with accessible name "Drag to reorder {title}".
- `touch-action: none` on the **handle only**, so the rest of the row
  still scrolls the page normally.
- Shown only on `planned` rows. In-progress and done rows have no handle,
  and their content lines up with the other rows' content rather than
  leaving a gap where the handle would be.

**Behavior:**
- Pointer drag starts after 8 px of movement, so a tap on the handle
  isn't read as a drag.
- The dragged row lifts (shadow, 80% opacity, raised z-index), and the
  other rows move aside to show where it will land. Vertical list only.
- Keyboard: focus the handle, press Space/Enter to pick up, arrow keys to
  move, Space/Enter to drop, Escape to cancel.
- **Screen-reader announcements must use row titles, not internal ids.**
  dnd-kit's default announcements say things like "Picked up draggable
  item {id}". The prototype leaves those defaults, so it announces raw
  ids. Provide custom `announcements` (for example, "Picked up {title}.
  Position 2 of 4." / "{title} moved to position 3 of 4." / "{title}
  dropped at position 3 of 4.").
- Dropping calls the list owner's reorder handler with the new id order.
  What happens next (re-chaining, and saving immediately or at Confirm)
  is decided by `daily-planning-and-completion-v2-proposal.md` item 2,
  not by this component.

**Required non-drag alternative (WCAG 2.2 SC 2.5.7, Dragging
Movements):** every sortable list also offers **Earlier** / **Later**
buttons that do the same reorder, disabled at the ends.
- Existing-day view: in the per-session edit sheet, as in the prototype.
- **Schedule draft rows and Week Look-Ahead rows: the prototype gives
  these no Earlier/Later path at all.** That's a gap to close here, not
  copy. Give each of these rows the same "Edit {title}" button and edit
  sheet the existing-day view uses (with Earlier/Later, and Remove where
  it applies), or an overflow menu with Earlier / Later / Remove.
  Choose one pattern and use it on both lists.

## 2. Swipe to reveal a destructive action

**Component behavior** (the prototype's `SwipeActionRow`, restated as
requirements):
- The destructive action sits *under* the row's trailing edge: a 104 px
  wide destructive-colored button with a trash icon and a text label.
- Swiping left drags the row with the finger, up to 104 px. Letting go
  past halfway snaps it **open**; otherwise it snaps **closed**.
- Horizontal intent is detected after 7 px of movement. If the movement
  is mostly vertical, the swipe is abandoned and the page scrolls. The
  row uses `touch-action: pan-y`.
- Starting a swipe on a drag handle doesn't swipe, so both gestures can
  live on the same row. **A swipe also never starts inside a text field**
  (`input`, `textarea`, `select`, `contenteditable`). There, horizontal
  movement belongs to caret placement and text selection. This matters
  for the breakdown draft rows, whose title is an editable input.
- A swipe that *ends* over a button inside the row (e.g. an Activities
  day toggle) must not also click it.
- **When a revealed action shows an inline confirmation** (Assignments),
  the row snaps closed first, so the confirmation never renders shifted
  sideways.
- **Only one row is open at a time, across the whole app.** Opening one
  closes any other.
- While a row is open, tapping the row's content **closes it and does
  nothing else**. It doesn't navigate or select. Swiping right also
  closes it.
- Rows reset to closed when their screen unmounts.
- Mouse drags work the same as touch (pointer events). A right-click
  never swipes.
- Motion: a 200 ms ease-out slide, or none with reduced motion.

**The revealed button runs exactly the action the old icon button ran,
with that action's existing confirmation.** Swiping never skips or
weakens a confirmation.

**Accessibility (WCAG 2.2 SC 2.5.1, Pointer Gestures):**
- The action button is a real `<button>` whose accessible name is
  "{Action} {label}" (for example, "Delete Biology lab report").
  **Amended 2026-09-25: it's a pointer-only affordance.** While the row
  is closed it's `aria-hidden` and out of the tab order; once swiped
  open it's focusable, with a visible focus ring. Keyboard and
  screen-reader users use the row's visible non-gesture route below
  instead. An earlier draft put the hidden button in the tab order too,
  which gave every row *two* destructive tab stops, announced twice.
- **Every swipe action also has a non-gesture route at every
  breakpoint.** The prototype shows its "More actions for {label}"
  overflow menu only from `sm:` up, and turns it off entirely on several
  lists, which leaves phone users who can't swipe with no way in. That
  isn't acceptable under SC 2.5.1. The table below says which route each
  list uses. Where the answer is "overflow menu", show it at all widths.
- The UI never gives gesture-only instructions (no "Swipe to delete"
  hint text).

**Where it applies:**

| List | Label | Tapping the revealed action… | Non-gesture route (all widths) |
|---|---|---|---|
| Plan existing-day view: planned sessions | Remove | Removes the session from the day, with no confirmation (unchanged) | Edit sheet → "Remove from this day". *(Built 2026-09-25 with the day view.)* |
| Plan Schedule step: draft rows | Remove | Drops the item from the draft (in memory) | The edit sheet or overflow menu required by §1 |
| Week Look-Ahead: planned sessions | Remove | Removes the session, with no confirmation (unchanged) | "More actions for {title}" overflow menu → Remove, replacing today's visible ✕. §1's Earlier/Later will be added to this same menu later |
| Assignments list | Delete | Existing assignment-delete confirmation (unchanged) | Row's "Actions for {title}" overflow menu → Delete (`mobile-app-shell-and-touch-ergonomics-v0.1.md` §4) |
| Assignment Detail: steps | Delete | Per D2: confirmation for completed steps; immediate for open ones (unchanged) | "More actions for {step}" row menu: Edit (open steps only) and Delete, replacing the visible pencil and trash. *(Amended 2026-09-25 at product-owner request, for consistency with every other list. An earlier version kept the visible trash button.)* |
| Guided breakdown: draft steps | Delete | Removes the draft step (unchanged) | Overflow menu, replacing today's visible 🗑. The ↑/↓ reorder buttons stay |
| Activities | Remove | Removes the activity, with no confirmation (unchanged) | Overflow menu, replacing today's visible 🗑 |
| Courses | Delete | Opens `course-management-v2-proposal.md` §2's inline confirmation | Overflow menu |
| Support: active relationships | Remove | Relationship-removal confirmation | Overflow menu. **Applies only once** `supporter-invitation-feature-spec-v0.1.md` §12 (Removing a Supporter) ships; it's currently "Not built" in this app |
| Support: pending invitations | Cancel | Cancels the invitation | Overflow menu. **Applies only once** that spec's deferred "cancel Pending invitation" ships |

Labels follow this app's existing names ("Remove {activity}", "Delete
{draft step}"), not the prototype's, so accessible names don't change.

**Friction on Activities and Look Ahead (accepted 2026-09-25).** Both
removed in one tap with no confirmation before. They now take a swipe
or menu, then a tap. That's two deliberate steps, but still no dialog.

**Not in this table: Plan's "Already planned" list** (`AlreadyPlannedList`,
at the top of Select). It keeps its visible Move and ✕ buttons unchanged
until `daily-planning-and-completion-v2-proposal.md` item 10 replaces it
with the existing-day view.

Week Look-Ahead detail: on `mobile-redesign`, only `planned` sessions
can be removed from Look Ahead. `main` also let in-progress ones be
removed. Follow `mobile-redesign`, which is consistent with Plan:
in-progress work is ended from Today Execution, not deleted from a
calendar.

## Scope of the first increment (2026-09-25)

§2 only, on the lists that exist today: Assignments, Assignment Detail
steps, guided breakdown draft steps, Activities, and Week Look-Ahead.
Courses gets it with `course-management-v2-proposal.md` (roadmap step
3), Support with the supporter spec's deferred actions, and the Plan
rows with daily-planning items 2 and 10. §1's acceptance criteria below
apply to that later increment.

## Acceptance Criteria

- On a touch device, a student can reorder planned sessions by dragging
  the handle in all three sortable lists. The same reorder is possible
  with Earlier/Later buttons alone, with no drag, in all three lists.
- Keyboard-only: pick up, move, and drop with the keyboard in every
  sortable list. A screen reader announces the row's title and new
  position, never an internal id.
- Vertical scrolling that starts on a row, off the handle, scrolls the
  page. It never starts a drag or a swipe.
- Swiping a removable row left more than halfway reveals its labelled
  action. Less than halfway snaps back. Opening a second row closes the
  first.
- Tapping an open row's content closes it without navigating or
  selecting.
- Tapping a revealed action does exactly what the table says, including
  every existing confirmation. No swipe deletes anything by itself.
- Every row in the table can reach its action without a swipe, at 320
  px and at 1280 px.
- A closed row's swipe action is `aria-hidden` and not in the tab order.
  Once swiped open, it's focusable with a visible focus ring.
- A swipe that starts inside a text field never moves the row.
- A swipe that ends over a button inside the row doesn't click it.
- When a revealed Delete opens an inline confirmation, the row is closed.
- Week Look-Ahead offers no remove route (swipe or menu) for in-progress
  or done sessions.
- With reduced motion turned on, rows open and close without animation.
- No horizontal page overflow is introduced at 320 px.

## Testing Notes

- Unit: the swipe open/close threshold logic, and the "one open at a
  time" coordinator, as pure logic where practical.
- Component (Testing Library): Earlier/Later reorder paths; keyboard
  focus revealing the swipe action; accessible names; announcement
  strings using titles.
- Playwright (touch-emulated mobile project plus desktop project):
  drag-reorder in each of the three lists; swipe reveal, snap-back,
  and single-open; vertical scroll not intercepted; the non-gesture
  route for each table row.

## Domain Model Touchpoints

None beyond what the owning specs already define. Reorder persistence
belongs to `daily-planning-and-completion-v2-proposal.md` item 2.
Deletion cascades belong to each entity's own spec. This spec adds no
new Domain Events; a drag-reorder records the same "session moved"
event as any other reorder.

## Explicitly Out of Scope

- Swipe-right actions, long-press menus, and haptic feedback. None are
  in the prototype.
- Undo toasts after removal
  (`docs/decisions/20260817-remove-undo-delete.md` stands).
- Drag-reordering Assignments, Courses, Activities, or Assignment
  Detail steps (no meaningful order in this app).
- Converting `WorkBreakdownPage`'s own up/down draft-step reordering to
  drag. The prototype's guided breakdown has no reordering at all, only
  swipe removal. Leave `moveItem` as it is unless D1 Option A is chosen
  *and* a later spec asks for it.
- Changing any confirmation copy or cascade rule. Those stay in their
  owning specs.

## Implementation Notes (as built, 2026-09-25)

- **Components:** `src/lib/swipeGesture.ts` (pure thresholds and the
  can-start rule), `src/components/SwipeActionRow.tsx`,
  `SwipeRowProvider.tsx` + `swipeRowContext.ts` (one open row app-wide,
  mounted in `App.tsx`), and `RowActionsMenu.tsx` (the shared visible
  route, extracted from `AssignmentsPage`). No new dependencies.
- **Where a swipe may start:** the "no text fields" rule applies to
  *text-like* inputs only; a checkbox or radio (e.g. a step's status
  checkbox) can start a swipe. Popup triggers (`aria-haspopup`) are also
  excluded, because Radix opens menus on pointerdown.
- **Bug found by the tests:** the click a browser sends right after a
  swipe was first treated as a tap on an open row, which closed the row
  the swipe had just opened. It's now swallowed without closing, and a
  test pins it.
- **Dark-mode contrast fix:** the action's label (`--destructive-foreground`
  on `--destructive`) measured 2.76:1 in dark mode. That's a
  pre-existing token problem shared by every destructive button. The
  dark `--destructive-foreground` is now the dark background color
  (6.97:1). Light mode was already 5.10:1.
- **Verified in a real browser** (Chromium, touch emulation via CDP, 375
  px): swipe reveals Delete/Remove, tap closes without navigating, a
  vertical drag doesn't open a row, and a swipe that starts and ends on
  Activities day toggles doesn't flip a day.

## Implementation Notes

- Build this after `mobile-app-shell-and-touch-ergonomics-v0.1.md`
  (it needs that spec's overflow menu and sheet primitives), and
  together with or after
  `daily-planning-and-completion-v2-proposal.md` items 2 and 10 (drag
  has nothing to reorder until those exist). Swipe can ship on its own
  first, starting with the lists that exist today (Assignments,
  Activities, Courses, steps).
- Put the "one open row at a time" coordination in a small React
  context rather than the prototype's `window` CustomEvent. It's easier
  to test, and nothing leaks between screens.
- Write a decision record for D1 (and for D2, if it changes point 4 of
  `20260818-inline-work-item-management.md`).
