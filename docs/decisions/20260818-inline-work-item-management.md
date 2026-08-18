# Assignment Detail regains inline Work Item add/edit/delete, superseding the single-entry-point design

Date: 2026-08-18

## Context

`docs/decisions/20260815-manual-work-breakdown-draft-state.md` established
`WorkBreakdownPage` as *"the only entry point for managing an Assignment's
Work Items,"* replacing an earlier inline "Add another step" form
specifically to avoid *"two independently editable [paths]"* — an item
added outside `WorkBreakdownPage`'s confirm flow wouldn't go through a
`DecompositionAttempt`, and there'd be two different ways for "the
confirmed breakdown" to change.

`docs/features/assignment-detail-cta-hierarchy.md` item 3b reopens this
by direct product-owner instruction: `WorkBreakdownPage`'s 3-step
create/estimate/review wizard is more page than "type a title, pick an
effort preset" warrants — clearest once two buttons ("Break this down"
and the new breakdown-nudge card's "Yes, help me start") both led there
for the same empty-Steps case. See that spec's own Correction 2 and item
3b for the full reasoning; this record exists to give the reversal itself
a decision record, as that spec called for, rather than silently editing
`20260815-...` in place.

## Decision

1. **`WorkBreakdownPage`/"Edit breakdown" is no longer reachable once an
   assignment has any Work Item.** "Break this down" still opens it, but
   only while `workItems.length === 0` — building several steps at once
   from a blank slate is still a real use case (e.g. arriving via Plan's
   "Break down/Plan as one task instead"). Revising an *existing*
   breakdown no longer goes through that page at all.
2. **Inline add, edit, and delete live directly on Assignment Detail**
   (`AssignmentDetailPage.tsx`), backed by three new actions on
   `useWorkItems` (`addItem`, `editItem`, `deleteItem`), each persisting
   immediately (no draft/confirm cycle) and returning the resulting full
   array so the caller can recompute the assignment's total effort
   without waiting on a second render.
3. **Editing is never offered for a completed Work Item** — preserves
   `docs/features/work-breakdown-revision-preserves-completed-items.md`'s
   "once a task has been completed, it cannot be rescheduled" principle,
   which this reversal could otherwise have quietly broken by reopening a
   second write path onto Work Items.
4. **Deleting a completed Work Item requires confirmation; deleting an
   incomplete one is immediate** — mirrors the exact reasoning
   `AssignmentDetailPage.tsx` already applies to whole-assignment
   deletion (`hasCompletedSteps` → "will erase that progress"). This was
   flagged as an extension beyond the literal add/edit instruction and
   confirmed directly, not assumed.
5. **Add and edit each record one `DecompositionAttempt`
   (`revisionCount: 1`); delete does not.** This is the direct answer to
   `20260815-...`'s core concern — a second entry point existing again is
   fine as long as the evidentiary trail that decision cared about still
   gets recorded for every attempt at decomposing an assignment. Delete
   is scope reduction, not a decomposition attempt, so it's excluded.
6. **`assignment.effortMinutes` is recomputed after every add/edit/delete**
   via `useAssignment.updateAssignment`, using the same "sum of all
   confirmed Work Items" derivation `confirmWorkBreakdown` already applies
   for its own bulk-replace case (`manual-work-breakdown-reflection-v0.1.md`
   §5) — one row at a time here instead of a bulk replace, same rule.
7. **Reordering is not replaced.** `WorkBreakdownPage` supports it; this
   change doesn't add an inline equivalent. Accepted as a capability lost
   for now (YAGNI) — most single-session breakdowns don't need it badly
   enough to justify inline drag/up-down controls, and it's a small,
   independently addable follow-up if that turns out wrong in practice.

## Alternatives considered

- **Keep `20260815-...`'s single-entry-point design and just add a
  quick-add path for the empty-Steps case only** (this spec's original,
  more conservative "open question" framing, before the product-owner
  instruction resolved it). Rejected by direct instruction — inline
  editing of an *existing* breakdown was explicitly requested too, not
  just a lighter first-step experience.
- **Drop `DecompositionAttempt` recording for the new inline paths
  entirely**, accepting `20260815-...`'s concern as no longer worth
  guarding against. Rejected — the evidence exists for a real future
  purpose (coaching-phase calibration, per
  `manual-work-breakdown-reflection-v0.1.md`'s own stated rationale for
  recording it at all); dropping it here would silently create gaps in
  that evidence for exactly the students using the lighter-weight path,
  which skews the very data future coaching phases would train on.
- **Require confirmation before every delete, not just completed items.**
  Rejected — an incomplete step has no "progress" to erase, and
  `WorkBreakdownPage`'s own existing draft-delete already has no
  confirmation for the equivalent case; matching that precedent is more
  consistent than inventing a stricter rule here.

## Consequences

- `workItemService.ts` gained one new function, `updateWorkItem` — the
  only new service-layer capability this change required; `createWorkItems`
  and `deleteWorkItems` are reused as-is.
- `useWorkItems(studentId, assignmentId)`'s signature changed (previously
  `useWorkItems(assignmentId)` alone) to support `createWorkItems`'s
  existing `studentId` requirement — its one call site
  (`AssignmentDetailPage.tsx`) was updated accordingly; no other caller
  existed.
- A student can now genuinely have two different Work Item edit
  experiences depending on entry point (the multi-step wizard for a
  from-scratch breakdown, inline editing for an existing one) — this is
  the intended, decided outcome of this record, not an inconsistency to
  resolve later.
- If reordering ever needs to come back, it belongs on the Steps list
  itself (up/down controls, matching `WorkBreakdownPage`'s own
  `moveItem` pattern) rather than by re-routing through
  `WorkBreakdownPage`, since that page is no longer part of the
  edit-an-existing-breakdown path at all.
