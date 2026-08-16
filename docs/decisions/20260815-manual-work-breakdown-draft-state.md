# Manual Work Breakdown: client-side draft state, single entry point

Date: 2026-08-15

## Context

`docs/features/manual-work-breakdown-reflection-v0.1.md` requires that
Work Items created or edited inside the "Break this down" flow form a
**draft Work Breakdown** that must not become authoritative until the
student explicitly confirms it — including when the flow is re-opened to
revise an *existing* confirmed breakdown (Scenario C: cancelling an edit
must leave the previously-confirmed Work Items untouched). It also
requires that confirming a breakdown update the Assignment's estimated
effort to the sum of the confirmed Work Items, "rather than maintaining
two independently editable estimates that can drift apart."

Assignment Management (already shipped) has one existing way to add Work
Items: an inline "Add another step" form on Assignment Detail that
persists a single item immediately. This increment needs a second,
richer way to manage the full set (add/edit/delete/reorder, then
estimate, then confirm).

## Decision

1. **Draft state lives entirely in React state, not the database.**
   Opening "Break this down" seeds an in-memory draft from the
   assignment's current confirmed Work Items (or an empty list, for a
   first-time breakdown). All add/edit/delete/reorder/estimate actions
   mutate only that local state. Nothing is written to `work_items` until
   the student taps "Looks good." Cancelling or navigating away discards
   the draft with no server call. This trivially satisfies "the existing
   confirmed Work Breakdown remains authoritative while the student edits
   a revision" — nothing else in the app can observe a draft that was
   never persisted.

2. **Confirmation is a client-orchestrated sequence of writes, not a
   database transaction.** On "Looks good": insert the new confirmed Work
   Items, update the Assignment's `effort_minutes` to their sum, delete
   the Work Items that existed before this edit session, then record one
   `DecompositionAttempt` row. Insert-before-delete order is deliberate:
   if a later step fails, the worst case is duplicate/stale rows rather
   than data loss. No new Postgres function was introduced for this — the
   codebase has none yet, and this is a single-user, non-concurrent
   editing context.

3. **"Break this down" / "Edit breakdown" replaces "Add another step" as
   the only entry point for managing an Assignment's Work Items.** Having
   both the wizard's confirmed set and a separate one-at-a-time
   inline-add path would recreate exactly the "two independently
   editable" drift problem the spec calls out for effort estimates,
   applied to item management itself — an item added via the old inline
   form would never go through a `DecompositionAttempt`, and there would
   be two different ways for a "confirmed breakdown" to change.

## Alternatives considered

- **Persist draft state to a `status` column on `work_items` (draft vs.
  confirmed).** Rejected for this increment: nothing in v0.1's scope
  needs a draft to survive a reload or be visible anywhere else, and it
  would require every existing query (`listWorkItems`,
  `listWorkItemsForStudent`, `remainingMinutes`) to filter out drafts
  everywhere they're used today. The spec explicitly says persistence is
  *allowed*, not required.
- **Keep "Add another step" alongside the new wizard.** Rejected per
  point 3 above.
- **Wrap confirmation in a Postgres function for true atomicity.**
  Deferred: no precedent in this codebase yet, and the insert-then-delete
  ordering keeps the realistic failure mode non-destructive without it.

## Consequences

- If the confirm sequence fails partway after the insert step, a student
  could see both old and new Work Items until they retry — acceptable for
  this increment, should be revisited if this pattern gets reused for a
  more concurrency-sensitive feature.
- Re-running "Break this down" on an assignment with an existing
  confirmed breakdown is now the only way to edit its Work Items —
  consistent with the spec's Scenario C, but a real behavior change from
  the shipped `assignment-management.md` UX (which offered one-at-a-time
  ad hoc adding). `docs/features/assignment-management.md` should get a
  short note cross-referencing this once the new flow ships.
