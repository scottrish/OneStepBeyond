# Course colour choice, and deleting a course with everything in it

Date: 2026-09-25

## Context

`course-setup.md` (2026-08-14) made two rulings: course colour is
assigned automatically and can't be edited, and deleting a course is put
off until "a real design question exists to answer". The prototype has
since answered both. `course-management-v2-proposal.md` (roadmap Phase 7
step 3) proposed adopting its answers, and the product owner approved
them on 2026-09-25: manual colour choice with an automatic default, and
a cascading delete behind a strong warning that says every assignment
goes, whatever its state. This record covers those rulings and the four
build choices that followed.

## Decision

1. **Colour choice (§1).** Students pick a course's colour when adding
   it and can change it later. The picker is pre-set to the first colour
   no other course uses, so nobody has to choose.
2. **Deleting a course (§2)** deletes its assignments and everything
   under them: steps, planned sessions, reflections and decomposition
   attempts. Delete opens an inline confirmation and never acts
   directly. For a course with assignments, the confirmation is titled
   "Delete {name} and all its assignments?" and says the count, and that
   not-yet-planned, planned and completed assignments all go. There is no
   undo (`20260817-remove-undo-delete.md`).
3. **C1 — 8 colours.** The spec said the prototype's 8 colours were
   "the same tokens this app already uses"; this app had 5. The
   prototype's `--course-6..8` (Teal, Rose, Moss) are added with its
   exact values. The first five keep their order, so existing courses
   keep their colour.
4. **C2 — editing saves name and colour together** on Save, and Cancel
   discards both. (In the prototype, a colour change saves immediately
   but a name change waits for Save.) The visible pencil replaces the
   old "tap the name to rename it".
5. **C3 — the database does the cascade.** `assignments.course_id` now
   has `on delete cascade`, and courses gain a delete policy for their
   owner (`20260925130000_course_delete_cascade.sql`). Everything below
   assignments already cascaded. One statement deletes it all, or
   nothing.
6. **C4 — each course row shows its assignment count**, including
   completed assignments. If the count can't be loaded, the confirmation
   says so and Delete stays disabled, so the warning is never wrong.

## Alternatives considered

- **Delete from the service in several calls** (assignments first, then
  the course). It could fail halfway and leave a course without its
  assignments, or the reverse.
- **Block deleting a course that has assignments.** The student would
  have to delete each assignment first, and the warning already makes
  the consequence clear.
- **Keep 5 colours.** That isn't parity, and the prototype's names and
  values were ready to use.

## Consequences

- The Delete action in `RowActionsMenu` can say it moves focus itself
  (`movesFocus`), so the menu doesn't pull focus back to its button after
  the inline confirmation takes it. Focus lands on "Keep it", the safe
  choice.
- Home shows "First, add your courses." when a student has none
  (§3), and a failed course load now shows Home's error banner instead of
  hiding it.
- `planning_sessions` (one row per confirmed plan, with only a date and
  counts) has no link to assignments, so a course delete leaves it
  unchanged.
