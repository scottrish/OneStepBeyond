# Feature: Work Breakdown Revision Preserves Completed Work Items

**Status:** Implemented (2026-08-17), merged to `main`. Completed Work
Items are excluded from the editable draft (`useWorkBreakdownDraft`),
shown read-only in `WorkBreakdownPage`'s create step, and never
deleted/recreated by `confirmWorkBreakdown` — only the still-open subset
of a breakdown is affected by a revision. The assignment's derived
estimated effort and the review step's step-list both account for this
split, per the Decision section below. Verified live: completing a step,
then editing that assignment's breakdown to add a new task, leaves the
completed step untouched (still checked on Assignment Detail, its effort
still counted in the "estimated ... in total" figure) and it never
reappears as a candidate in Plan's Select step.

**Amends:** `manual-work-breakdown-reflection-v0.1.md` §4 (Draft vs
Confirmed Semantics) and §5 (Assignment Estimated Effort). Governed by the
same increment's principles (§2) — this is a correctness fix within that
scope, not new capability.

## Summary

Completing a Work Item is meant to be a durable, historical fact — the
student did the work, and Today Execution records it (`completedAt` on
the Work Item, a `'done'` Work Session). Revising an assignment's Work
Breakdown to add, remove, or edit a step currently destroys that fact for
*every* existing Work Item in the breakdown, not just the ones being
changed: `confirmWorkBreakdown` deletes and recreates the entire set from
scratch on every confirm, silently resetting any already-completed item
back to incomplete and cascade-deleting its `'done'` Work Session. The
resurrected item then legitimately reappears as selectable/schedulable in
Plan's Select step — Plan's own filtering is correct; the data it reads
has already been corrupted upstream.

This spec defines the fix: a completed Work Item must survive a Work
Breakdown revision unchanged, and must therefore continue to be excluded
everywhere completion already excludes it today.

## Source

Reported directly by the product owner: after marking a task complete,
editing the assignment's breakdown to add a new task, then returning to
Plan, the completed task reappeared as plannable. Investigated and
confirmed against:

- `src/hooks/useWorkBreakdownDraft.ts` (seeds the draft from
  `confirmedItems`, dropping `id`/`completedAt`)
- `src/services/workBreakdownService.ts` (`confirmWorkBreakdown` —
  unconditional insert-all-then-delete-all)
- `src/pages/AssignmentDetailPage.tsx` ("Edit breakdown" entry point,
  passes all Work Items — completed or not — into the draft)
- `supabase/migrations/20260816173534_create_work_sessions_and_planning_sessions_tables.sql`
  (`work_item_id ... on delete cascade`, whose own comment anticipated
  this exact gap: *"revisit whether a Work Breakdown revision should
  still cascade-delete [sessions]... once a future increment starts
  recording actual time against 'done' sessions"* — that increment,
  Today Execution, has since shipped)
- `docs/decisions/20260815-manual-work-breakdown-draft-state.md` (the
  original insert-before-delete design; its stated rationale — "the worst
  case is duplicate/stale rows rather than data loss" — predates
  completed Work Items existing at all, and no longer holds)

`src/domain/planningCandidates.ts` (`rankCandidates`, which Plan's Select
step uses) already filters out `completedAt !== null` items correctly and
needs **no change** — confirmed by existing tests in
`planningCandidates.test.ts`. This spec's fix is entirely upstream of
that filter.

## Problem

1. **Data loss.** Editing a breakdown deletes every previous Work Item,
   including completed ones, and recreates them with `completedAt: null`.
   Any `'done'` Work Session cascade-deletes with it. The record of what
   the student actually did is gone.
2. **Silent "un-completion."** The recreated item is indistinguishable
   from one that was never done. Nothing in the UI tells the student this
   happened.
3. **Downstream symptom (what was actually reported):** the
   "un-completed" item reappears as a selectable, schedulable candidate
   in Plan's Select step — because it is, by then, genuinely
   indistinguishable from an open item. Fixing Plan's filter would do
   nothing; the filter is already correct.

## Decision

**Completed Work Items are immutable within the breakdown-edit flow.**
They are never included in the editable draft, never deleted, never
recreated, and never renumbered by a revision. They're shown for context
only — a plain, read-only reference so the student can see what's already
done without re-adding it by mistake — separate from the editable list of
remaining/new items.

Only the *incomplete* subset of a breakdown is affected by add / edit /
delete / reorder, exactly as today, just scoped to that subset instead of
the whole breakdown.

Concretely:

- `useWorkBreakdownDraft` seeds its editable draft only from
  `confirmedItems.filter(item => item.completedAt === null)`. Completed
  items are passed through separately, untouched, for display only.
- `confirmWorkBreakdown` inserts the new/edited incomplete items and
  deletes only the *previous incomplete* items (never a completed one),
  exactly mirroring today's insert-before-delete ordering and its
  rationale — just correctly scoped.
- The Assignment's derived estimated effort (§5 of the current-increment
  spec) remains the sum across **both** the untouched completed items and
  the revised incomplete items — not just the edited subset — so
  Assignment Detail's "X left of Y planned" and the Assignments list's
  equivalent line don't silently shrink by the completed items' effort
  every time a breakdown is revised.
- New/edited items are positioned after every completed item (`position`
  continues from `max(completed item positions) + 1`), so ordering across
  the full list (completed + new) stays monotonic. Interleaving completed
  and incomplete items by original position is not attempted — YAGNI
  unless a real case needs it.
- No new warning/confirmation dialog before "Edit breakdown" is needed.
  `AssignmentDetailPage`'s delete-*assignment* flow already warns when
  completed steps exist (`hasCompletedSteps`) because deleting the
  assignment is inherently destructive; editing the breakdown no longer
  is, once this fix lands, so no equivalent guard is required here.

## Functional Requirements

- Opening "Edit breakdown" on an assignment with one or more completed
  Work Items shows those items in a separate, clearly non-interactive
  section (title + effort, a completed indicator, no edit/delete/reorder
  controls) above or below the editable list — not intermixed with
  add/edit/delete/reorder controls.
- Confirming a revision must not change `completedAt`, `id`, or
  `position` on any previously-completed Work Item, and must not touch
  any Work Session referencing one.
- Confirming a revision must not change the status or identity of any
  Work Session belonging to a completed Work Item.
- The editable (incomplete-only) subset keeps its full existing
  capability unchanged: add, edit, delete, reorder, estimate — including
  cascading away any *planned* Work Session for an incomplete item that's
  edited/removed, which is existing, accepted behavior (re-planning a
  changed step is expected) and out of scope for this fix.
- `DecompositionAttempt` recording continues to reflect the full breakdown
  (completed + incomplete) in `initialWorkItems`/`resultingWorkItems`, not
  a scoped-down view — no behavior change needed here, since this is
  evidence-only and unaffected by which rows are physically
  deleted/recreated.
- Plan's Select step requires no changes — `rankCandidates` already
  excludes `completedAt !== null` items; this fix is what makes the data
  it reads trustworthy again.

## Acceptance Criteria

- Complete a Work Item (via Today Execution), then edit that assignment's
  breakdown to add a new task and confirm. The completed item's
  `completedAt` and its `'done'` Work Session are unchanged afterward —
  verifiable directly, not just inferred from the UI.
- After that same edit, returning to Plan's Select step shows only the
  new task (and any other still-open items) as candidates. The completed
  item does not reappear as selectable or schedulable anywhere.
- Assignment Detail's "X left of Y planned" (and the Assignments list's
  equivalent) still correctly includes the completed item's effort in the
  "planned" total after the revision — it does not drop just because a
  revision happened.
- Editing, deleting, and reordering *incomplete* items still works
  exactly as before the fix — no regression to existing "Break this
  down"/"Edit breakdown" behavior for the still-open subset.
- An assignment with **no** completed items behaves exactly as it does
  today — this fix changes nothing observable when there's nothing
  completed to preserve.

## Domain Model Touchpoints

- Planning → Work Breakdown, Work Item, Decomposition Attempt (all
  existing concepts; no new ones introduced).
- Execution/Reflection's `'done'` Work Session and completed Work Item
  are the durable evidence Today Execution and Decomposition Attempt
  recording both depend on being trustworthy — this fix is what actually
  keeps that evidence durable, closing a gap the
  `work_sessions` migration's own comment already flagged as a future
  revisit.
- Worth a follow-up, not part of this fix: `docs/reference/Domain-Model.md`'s
  Domain Invariants list (currently 14 items) has no explicit invariant
  stating that completed work is immutable/durable evidence. This fix
  establishes that behavior in code; recording it as an invariant would
  give future features a clear rule to check against instead of
  rediscovering it the way this bug did.

## Explicitly Out of Scope

- Reconciling *incomplete* items in place (matching by id instead of
  delete-all/recreate-all) — today's delete-and-recreate behavior for the
  still-open subset is unaffected by this fix and not something this
  report is about.
- Any UI affordance to un-complete a Work Item, or to delete a completed
  Work Item directly — no such capability exists today and none is being
  added.
- Warning/confirmation UI changes to "Edit breakdown" — per the Decision
  section, none are needed once completed items are no longer at risk.
- Adding the new Domain Invariant noted above — flagged for a future,
  separate change, not bundled into this fix.

## Testing Notes

- `src/services/workBreakdownService.test.ts` currently has no fixture
  with a non-null `completedAt` on a previous item — needs a new test
  asserting a completed item is excluded from the delete call and never
  appears in the insert call.
- `src/hooks/useWorkBreakdownDraft.test.ts` needs a test asserting
  completed items never enter draft/edit/delete/reorder state.
- `src/pages/WorkBreakdownPage.test.tsx` needs a test asserting completed
  items render read-only, separately from the editable list, with no
  interactive controls.
- `src/domain/planningCandidates.test.ts` already covers the downstream
  guarantee correctly — no change needed, but worth re-running after the
  fix as a confirming regression check rather than assuming it still
  passes.
