# Daily Planning: confirm-plan write order and navigation fallback

Date: 2026-08-16

## Context

`docs/features/daily-planning.md`'s functional requirements say
"Confirming a plan replaces that day's *not-yet-started* planned sessions
(in-progress/done sessions are left alone) and records a Planning
Session." This is a multi-table write across `work_sessions` (delete the
date's old `status = 'planned'` rows, insert the newly confirmed set) and
`planning_sessions` (insert one Domain Event row) — the same shape of
problem `docs/decisions/20260815-manual-work-breakdown-draft-state.md`
already solved for confirming a Work Breakdown, which chose
insert-before-delete, sequential client calls, no Postgres function.

Also undecided: what "Looks good" navigates to. The spec says "Confirming
navigates to Today execution if planning today, or back to Week
look-ahead if planning a future day" — but neither Today Execution nor
Week Look-ahead exists yet in this codebase (both are separate,
not-yet-built features).

## Decision

1. **Delete-before-insert, not insert-before-delete.** Unlike Work
   Breakdown confirmation — where the old and new rows are
   distinguishable by nothing in particular, so insert-then-delete just
   avoids a moment with zero items — here both the *old* sessions being
   replaced and the *new* sessions being written share the same
   `status = 'planned'`, and the only replace operation available
   (`deletePlannedSessionsForDate`, filtered on `student_id + date +
   status = 'planned'`) can't distinguish "old, to be replaced" from
   "new, just inserted" by status alone. Inserting first would mean the
   delete step immediately erases the rows just created. Deleting the
   old planned rows first, then inserting the new set, avoids that
   collision entirely and matches the ordering the feature's own task
   description used. Same three sequential-client-calls precedent
   otherwise: delete `work_sessions` (status='planned') → insert
   `work_sessions` → insert `planning_sessions`, no Postgres function.

2. **If the destination doesn't exist yet, "Looks good" shows a success
   state on the Confirm step itself instead of navigating.** Today
   Execution and Week Look-ahead are both explicitly out of this
   increment's scope (per the task brief) and don't exist as pages in
   this codebase. Confirming a plan still fully completes (the writes in
   #1 happen regardless) and the student sees positive confirmation that
   it worked; there is simply nowhere further to send them yet. This
   preserves the "student owns the Plan" invariant and the acceptance
   criterion that a plan be confirmable end-to-end — it just stops one
   screen short of a navigation target neither this feature nor its
   sibling features have built.

## Alternatives considered

- **Track which sessions are "new" by ID and delete-by-ID instead of by
  status.** Would let insert-before-delete work as in Work Breakdown, but
  adds a second code path (delete-by-id vs. delete-by-date+status) for no
  behavioral gain — the failure-mode asymmetry insert-before-delete
  protects against (a moment with zero items) is far less costly here,
  since a failed confirm mid-sequence just leaves the previous day's plan
  in place or partially replaced, recoverable by re-confirming, not a
  silent data-loss scenario for anything with completed-work history
  (only `status = 'planned'` rows are ever touched by this delete).
- **Wrap the confirm sequence in a Postgres function.** Deferred for the
  same reason as Work Breakdown confirmation: no precedent in this
  codebase yet, single-user non-concurrent context, and the realistic
  failure mode (retry needed) is acceptable for this increment.
- **Navigate to the Plan tab's own "day" step instead of a success
  state.** Rejected: re-showing step 1 of the flow the student just
  finished reads as if nothing happened, undermining the "Plan
  Confirmed" acknowledgment the spec's Domain Event framing implies the
  student should get.

## Consequences

- If the confirm sequence fails after the delete but before the insert
  succeeds, the student could see an empty "already planned" list until
  they retry — the hook detects the failure and refetches from the
  server so local state doesn't silently disagree with it.
- Once Today Execution and/or Week Look-ahead ship, `PlanPage`'s confirm
  handler needs a small follow-up change to navigate to them instead of
  showing the inline success state — tracked as this increment's
  suggested next step, not additional scope here.

**Update (2026-08-17):** Today Execution shipped (`docs/Roadmap.md` Phase
4) but this follow-up was never done — the Confirm step still shows the
inline success state with a "Start today's plan" button, one explicit tap
short of the auto-navigation the original spec text describes. Still
outstanding; not addressed by the Assignment Detail global-overlay work
that touched this same file's Day step around the same time (see
`docs/decisions/20260817-assignment-detail-global-overlay.md`), which was
a different, narrower change.
