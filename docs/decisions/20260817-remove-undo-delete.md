# Remove the Undo-window soft-delete; confirm before every delete instead

Date: 2026-08-17

## Context

Assignment deletion had two paths, both predating this record: an
assignment with completed steps required an in-place confirmation
("Delete this assignment? This assignment already has completed steps.
Deleting it will erase that progress."); one with none deleted
immediately, with a 5-second Undo toast (`App.tsx`'s `requestDeleteWithUndo`
/ `pendingDelete` / `pendingDeleteTimer`, added in
`docs/decisions/20260817-assignment-detail-global-overlay.md` when
Assignment Detail became a global overlay reachable from every tab).

That Undo pattern turned out to carry more complexity than its actual use
justified:

- **Only one undo window is meaningful at a time.** Deleting a second
  assignment while the first is still pending immediately commits the
  first for real, with no warning — a student who deletes two
  assignments in quick succession can only undo the second. Raised
  directly: "If I delete two assignments within the undo window, I can
  only undo the 2nd delete."
- **Getting it right required tracking hidden state across three pages,
  twice.** The first pass only hid a pending delete from
  `AssignmentsPage`; a live bug (reproduced and confirmed via direct
  database query, not just the test suite) showed `HomePage` and
  `PlanPage` needed it too. The second pass then found that clearing
  `pendingDelete` when its timer fired also stopped hiding the
  assignment, even though the real delete had just committed — nothing
  ever refetched the already-mounted page to notice, so a genuinely
  deleted assignment could keep showing indefinitely. Fixing that
  required a second, session-lifetime `hiddenAssignmentIds` set, on top
  of the timer and toast.
- **Deleting an assignment is infrequent.** Unlike the kind of
  low-stakes, common action (removing a single planned session, say)
  where an Undo toast earns back the friction it removes, an assignment
  delete is rare enough that a confirmation dialog's extra tap costs
  little in practice.

## Decision

Every assignment delete — regardless of completed-steps state or which
screen it's triggered from — now requires the same in-place confirmation
("Delete this assignment?"), extended with the existing "erase that
progress" warning only when the assignment has completed steps. This
collapses the two previously-separate delete paths (`AssignmentDetailPage`
and `AssignmentsPage`'s own `AssignmentCard`) into one code path each,
using the confirmation UI that already existed for the has-completed-steps
case.

Removed entirely: `App.tsx`'s `UNDO_WINDOW_MS`, `pendingDelete`,
`pendingDeleteTimer`, `hiddenAssignmentIds`, `requestDeleteWithUndo`,
`undoDelete`, and the toast JSX; the `onDeleteImmediate` prop on
`AssignmentDetailPageProps`, `AssignmentsPageProps`, and
`AssignmentCardProps`; the `hiddenAssignmentIds` prop on `HomePageProps`
and `PlanPageProps`. Deletion is now a plain, synchronous
`deleteAssignment()` call from whichever hook already owns the
assignment's data (`useAssignment` in Detail, `useAssignmentsList` in the
list), immediately followed by `onBack()`/local state update — no
cross-tab hidden-state tracking needed, since there's nothing left to
hide: the delete has already happened by the time any page would show it.

## Alternatives considered

- **Fix the "only one pending delete" gap by tracking multiple pending
  deletes.** Rejected — solves the immediate complaint but keeps (and
  grows) the exact machinery raised as the underlying concern: timers,
  toasts, and now a multi-item pending queue instead of a single slot.
- **Keep Undo only for the no-completed-steps case, confirm-dialog for
  completed-steps.** This was the status quo. Rejected for the reasons in
  Context — inconsistent behavior depending on assignment state adds its
  own confusion, and the no-completed-steps path is exactly the one that
  had the multi-delete and stale-visibility bugs.
- **Keep Undo but centralize it more robustly (e.g., a real undo stack,
  refetch-on-commit).** Would fix the correctness gaps but adds more
  code, not less, for a rarely-exercised action. Rejected per this
  session's YAGNI guidance: the confirm dialog already existed, was
  already tested, and needed no new infrastructure.

## Consequences

- Deleting an assignment now always costs one extra tap (the
  confirmation), even when there's nothing to lose — a deliberate
  trade-off given how infrequent the action is.
- `AssignmentDetailPage`, `AssignmentsPage`, `HomePage`, and `PlanPage`
  all lost props and branching that existed only to support Undo;
  `App.tsx` lost roughly 60 lines of timer/toast/hidden-set logic.
- If a future increment wants delete-undo back (e.g., a global toast
  system used by other actions too, not just this one), it should be
  designed as shared infrastructure from the start rather than
  reintroduced as a single-purpose mechanism the way this one was.
