# Feature: Mobile Gestures — Drag to Reorder & Swipe to Reveal Removal

**Status:** Proposed, not yet approved. **Needs two decisions before
implementation** (see "Decisions required"). Produced 2026-09-24 from a
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
point 4) confirms only completed steps. **Recommend keeping this app's
decision.** Swipe-to-reveal is already a deliberate two-step gesture,
and the app removed undo precisely to keep deletes rare and considered
(`20260817-remove-undo-delete.md`). If product wants the prototype's
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
  live on the same row.
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
  "{Action} {label}" (for example, "Delete Biology lab report"). It's in
  the tab order, and **focusing it reveals it**, so keyboard users reach
  it without a gesture. It has a visible focus ring.
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
| Plan existing-day view: planned sessions | Remove | Removes the session from the day, with no confirmation (unchanged) | Edit sheet → "Remove from this day" |
| Plan Schedule step: draft rows | Remove | Drops the item from the draft (in memory) | The edit sheet or overflow menu required by §1 |
| Week Look-Ahead: planned sessions | Remove | Removes the session, with no confirmation (unchanged) | The edit sheet or overflow menu required by §1 |
| Assignments list | Delete | Existing assignment-delete confirmation (unchanged) | Row's "Actions for {title}" overflow menu → Delete (`mobile-app-shell-and-touch-ergonomics-v0.1.md` §4) |
| Assignment Detail: steps | Delete | Per D2: confirmation for completed steps; immediate for open ones (unchanged) | The existing visible Delete button. The prototype hides it below `sm:`; this app keeps it at every width |
| Guided breakdown: draft steps | Remove | Removes the draft step (unchanged) | Overflow menu |
| Activities | Delete | Deletes the activity, with no confirmation (unchanged) | Overflow menu |
| Courses | Delete | Opens `course-management-v2-proposal.md` §2's inline confirmation | Overflow menu |
| Support: active relationships | Remove | Relationship-removal confirmation | Overflow menu. **Applies only once** `supporter-invitation-feature-spec-v0.1.md` §12 (Removing a Supporter) ships; it's currently "Not built" in this app |
| Support: pending invitations | Cancel | Cancels the invitation | Overflow menu. **Applies only once** that spec's deferred "cancel Pending invitation" ships |

Week Look-Ahead detail: on `mobile-redesign`, only `planned` sessions
can be removed from Look Ahead. `main` also let in-progress ones be
removed. Follow `mobile-redesign`, which is consistent with Plan:
in-progress work is ended from Today Execution, not deleted from a
calendar.

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
- Tabbing onto a hidden swipe action reveals it, and its focus ring is
  visible.
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
