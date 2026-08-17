# Daily Planning: allow scheduling an assignment without a Work Breakdown

Date: 2026-08-16

## Context

Iteration 2 of the Daily Planning experiment (`docs/features/iterations/
daily-planning/daily-planning.i02.md` FR-1) fixed Select silently
dead-ending for any assignment with zero Work Items by signaling the
requirement and routing the student into the "Break this down" flow. That
spec explicitly deferred a broader question rather than assume an answer:

> Whether an assignment without a Work Breakdown should ever be directly
> schedulable using its own top-level estimate (bypassing breakdown
> entirely) is a separate product-intent question ... do not implement
> that broader change under this requirement without explicit
> confirmation.

Human validation on that question: not every assignment is meaningfully
decomposable. "Read chapter 1 of a book by Tuesday" gains nothing from a
forced multi-step breakdown — the assignment already states exactly what
to do. Requiring a detour through "Break this down" for a task like that
is pure friction, not a step toward independence. `Domain-Model.md`'s own
invariant 8 ("A Work Breakdown should not be made more complex than
necessary") and its Work Item guidelines ("guidelines rather than rigid
invariants") already point this direction; nothing in the domain model
requires a Work Breakdown to have more than one item.

## Decision

Add a second action alongside "Break down ..." wherever FR-1's signal
appears (Day step, Select step, Select's empty-state dead end): **"Plan
'{title}' as one task instead."** Choosing it creates a single Work Item
that mirrors the assignment's own title and effort estimate, via the same
`workBreakdownService.confirmWorkBreakdown` the full "Break this down"
wizard's confirm step already calls — just with a one-item draft and no
intervening screens. The result is an ordinary confirmed Work Breakdown
(one `DecompositionAttempt` recorded with `outcome: "confirmed"`, same as
any other) — not a new "unbroken-down but schedulable assignment"
concept. The assignment immediately becomes a normal Select candidate.

This reuses the existing abstraction (`workBreakdownService`,
`workItemService.createWorkItems`) rather than teaching `Work Session` to
reference an `Assignment` directly, which would need a schema change and
a second code path through Estimate/Schedule/Confirm for
assignment-level vs. item-level scheduling.

## Alternatives considered

- **Auto-create a matching Work Item at Assignment Capture time**, so
  every assignment always has at least one schedulable item and the
  breakdown-prerequisite signal disappears entirely. Rejected for this
  increment: touches already-shipped Phase 2 code
  (`assignment-capture.md`) outside Daily Planning's own scope, and
  blurs `manual-work-breakdown-reflection-v0.1.md`'s model of the
  student explicitly starting a breakdown. Worth reconsidering later if
  the two-action signal itself proves to be friction.
- **Let Work Sessions reference an Assignment directly**, bypassing Work
  Item entirely for simple cases. Rejected: a real domain-model and
  schema change (Work Session currently keys on `work_item_id` only)
  for a case the existing Work Item abstraction already covers with a
  one-item Work Breakdown.
- **A single combined button that skips the "Break down" choice
  entirely** ("Plan this" with breakdown offered as a secondary path
  from within Assignment Detail only). Rejected: FR-1's whole premise is
  that the choice needs to be visible at the point Select would
  otherwise dead-end, not moved further away; offering both actions
  side by side keeps that visibility for both outcomes.

## Consequences

- `assignmentsNeedingBreakdown` (i.e. "no Work Items yet") remains the
  correct filter — planning directly resolves it the same way breaking
  down does, by giving the assignment a Work Item.
- The assignment's own `effortMinutes` is left unchanged, since the
  single created item's estimate already equals it —
  `confirmWorkBreakdown`'s existing "derive Assignment effort from the
  sum of its items" step is a no-op here, not a special case.
- If a student later decides a "planned as one task" assignment does
  need real decomposition after all, "Break this down" from Assignment
  Detail still works normally — it edits the existing (one-item) Work
  Breakdown like any other, per the existing edit flow.
