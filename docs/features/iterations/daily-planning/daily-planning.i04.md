---
feature: daily-planning
iteration: 4
derived_from: docs/features/iterations/daily-planning/daily-planning.i03.md
source: product-owner review of the iteration-3 build (not a persona-assessment iteration — no findings.yaml/playwright_evidence backs this spec)
---

# Daily Planning — Iteration 4

## Source of These Requirements

Unlike iterations 2 and 3, this iteration isn't derived from a synthetic
persona assessment. It comes directly from a product-owner review of the
live iteration-3 build, covering three related observations about the
Schedule step and how an already-planned item can (or can't) move between
days. No `findings.yaml` exists for this iteration; requirements below
are traced to that review conversation instead of finding IDs.

## Product Problems

**Problem A — The Schedule step shows the current time twice.**
For each chosen item, a suggested-slots radiogroup (one button rendered
"active" when it matches the current value) sits next to a separate
manual time input that also displays and edits the same value. The
current time is effectively shown via two different controls
simultaneously, when one directly-editable control would do.

**Problem B — Re-planning an item on a second day reads as a warning, not information.**
Iteration 3's FR-1 already made it possible to select a work item on a
second day after it's already planned elsewhere (badge shown, selection
not blocked) — this was a deliberate choice, not an oversight. But
continuing an item's work across more than one day (e.g. not finishing it
Monday, picking it back up Tuesday) is an expected, common outcome, not a
mistake — `Domain-Model.md`'s own Work Session Outcomes ("Partially
Completed", "Need More Time") describe exactly this case. The current
"Already planned for {day}" badge, styled with the attention/warning
treatment, reads as flagging an error rather than stating a fact.

**Problem C — There is no way to move an already-planned item to a different day.**
Today, relocating a planned item from one day to another requires
planning it again on the new day, then separately returning to the
original day to remove it — two manual, disconnected actions with no
single "move" affordance, even though the underlying operation (delete
one `work_sessions` row, create another) is simple.

## Related System Note — Coach/Parent Dashboard

Raised alongside Problem B/C: does the dashboard need to change to
correctly represent an item spanning multiple Work Sessions? Checked
directly — no. `useDashboardData.ts` currently reads only Courses,
Assignments, Work Items, Decomposition Attempts, and Reflections; it does
not touch `work_sessions` at all yet (consistent with the Roadmap's
Behavior Trends phase — the dashboard phase that would need session-level
data — being not yet scheduled). Multiple Work Sessions per Work Item are
already representable in the existing schema (`work_sessions` rows keyed
by `work_item_id` + `date`, many-to-one), so when that dashboard phase
does get built, grouping by Work Item is a query against existing data,
not a schema change. No action required this iteration.

## Functional Requirements

### FR-1 — Make the Schedule step's time control directly editable, not display+control

Replace the current radiogroup-of-slot-buttons + separate time-input
pairing with a single primary control: a time input always populated
with the item's current planned time, directly editable (typed or via
the browser's native time picker). Suggested slots remain available as
one-tap shortcuts that set the input's value, but are no longer modeled
as a parallel selectable/"active" state duplicating what the input
already shows.

- Must preserve `daily-planning.md`'s existing requirement: suggested
  time slots computed from the day's actual open stretches, pre-assigned
  in order, editable, with manual entry always available as an escape
  hatch. This changes the control's shape, not that requirement.
- Whatever replaces the current `role="radiogroup"` must remain fully
  keyboard-operable with a visible focus ring and a correct accessible
  name per CLAUDE.md's WCAG 2.2 AA standard — shortcut buttons no longer
  need `role="radio"`/`aria-checked` once they stop representing a
  selection state of their own.

### FR-2 — Present "also planned on another day" as informational, not cautionary

No behavior change from iteration 3's FR-1 (selection stays unblocked).
Change presentation only:

- Reword the badge (e.g. "Also planned for {day}" rather than "Already
  planned for {day}").
- Replace the attention/warning badge styling with a neutral,
  informational treatment consistent with this feature's existing
  muted/secondary text, while still meeting CLAUDE.md's 4.5:1 contrast
  requirement for any badge/chip.

### FR-3 — Move an already-planned item to a different day

On the Day step's "Already planned" list, add a "Move" action next to
the existing Remove (✕) control, available under the same condition
Remove already uses (a `planned`, not-yet-`done` session — moving a
completed session is out of scope). Selecting it opens a lightweight day
picker — reusing the existing 5-day picker strip's own presentation,
scoped to the same Today+4 window as the rest of this feature, not an
open-ended date field.

Confirming a target day performs, as one action:

1. Delete the session's current `work_sessions` row.
2. Create a new `work_sessions` row for the same Work Item on the target
   date, carrying over its planned minutes. Leave the new row's start
   time unset rather than guessing — the target day's open slots differ
   from the original, so there's no reliable default to carry over.

If the target day doesn't have room for the move, show it the same way
Estimate already shows an over-capacity selection: a calm, specific,
non-blocking statement of the overage. Never a hard block — consistent
with this feature's existing stance that the app states reality rather
than prevents action.

Moving does not record a new Planning Session Domain Event. This mirrors
Remove, which is also a single-item plan edit outside the wizard and
doesn't record one today — only a full wizard confirm ("Looks good")
does.

This is a distinct action from FR-2's "plan again on another day" (already
possible via Select, unaffected by this FR): Move ends the item's
presence on the original day; planning it again keeps both. The two
affordances must stay visually and textually distinct so a student
doesn't confuse "move it" with "also work on it there."

## Design Constraints

- Preserve every prior iteration's validated behavior unchanged except
  where an FR above explicitly modifies it: 5-step flow, capacity math
  and football/Activity exclusion, over-capacity messaging tone,
  confirmed-plan persistence and existing Remove control, breakdown
  signal/routing (including iteration 3's mixed-candidates fix and
  iteration 4-pending "plan as one task" alternative), wizard state
  persistence across tab navigation, Plan's discoverability, and clean
  mobile rendering at ~390px.
- FR-3's day picker must reuse the existing 5-day strip presentation
  rather than introducing a new date-picker component (CLAUDE.md YAGNI).
- FR-3's move operation must follow this codebase's existing
  delete-then-insert pattern for a single-date-scoped write (see
  `docs/decisions/20260816-daily-planning-confirm-write-order.md`), not
  a new transactional mechanism.

## Non-functional Requirements

- FR-1 and FR-2 are presentation-only changes; neither requires a schema
  or service-layer change.
- FR-3 requires no new table — both the delete and the insert operate on
  the existing `work_sessions` table via `workSessionService`'s existing
  functions (`deleteWorkSession`, `createWorkSessions`), the same ones
  Remove and Confirm already use.
- All three FRs remain subject to CLAUDE.md's mobile-first and WCAG 2.2
  AA standards already applied in prior iterations.

## Acceptance Criteria

- On the Schedule step, each chosen item's current planned time is shown
  and edited through one control; suggested slots remain available as
  quick picks but no longer render a second, separate "current value"
  indicator alongside the editable field.
- Selecting a work item that already has a planned session on a
  different day continues to succeed without being blocked, and the
  resulting indicator reads as informational rather than as a warning
  (wording and styling both).
- From the Day step's "Already planned" list, a not-yet-started session
  can be moved to a different day (within the existing 5-day window) in
  one action, without the student separately re-planning it and removing
  the original.
- If the move target day doesn't have capacity for the item, the student
  is told so calmly and can still complete the move — the same
  non-blocking pattern Estimate already uses.
- After a move, the item appears only under the target day's "Already
  planned" list, not the original day's.
- All iteration 1–3 acceptance criteria continue to hold except where
  explicitly superseded by FR-2's wording/styling change above.

## Out of Scope

- Moving a session beyond the existing 5-day (Today+4) window — belongs
  to Week Look-ahead once it exists, not this iteration.
- Moving a session that is `in_progress` or `done` — Today Execution's
  concern once session-level statuses beyond `planned`/`done` exist.
- Any Work Session Outcome tracking (Completed / Partially Completed /
  Need More Time / Blocked / Skipped / Rescheduled) — that vocabulary
  belongs to Today Execution, not built yet. FR-3's move is a plan-stage
  edit only; it doesn't imply or require outcome tracking on the session
  being moved.
- Bulk/multi-item move — FR-3 covers moving one session at a time.
- Any dashboard change — see Related System Note above; none required.

## Assumptions

- FR-3's move is only offered on the same "Already planned" list Remove
  already appears on, not from within the Select/Estimate/Schedule wizard
  steps for a not-yet-confirmed selection (that scenario doesn't need a
  "move" at all — deselecting and re-selecting on the intended day already
  covers it, per Problem C's own framing of "already-committed" items).
- A moved session's planned minutes carry over unchanged; only its date
  and start time change.

## Open Questions

- Exact icon/label for the Move action, and whether its day picker
  appears inline or in a small overlay — left to implementation
  judgment, consistent with the rest of this feature's established
  visual language.
- Whether the target-day over-capacity notice needs an explicit
  secondary confirmation step, or inline text is sufficient before the
  move completes — left to implementation judgment; either satisfies the
  "informational, never blocking" acceptance criterion above.

## Evidence Traceability

| Requirement | Source |
|---|---|
| FR-1 | Product-owner review, 2026-08-16 — Problem A |
| FR-2 | Product-owner review, 2026-08-16 — Problem B |
| FR-3 | Product-owner review, 2026-08-16 — Problem C |
| (no FR — informational note) | Product-owner review, 2026-08-16 — Coach/Parent Dashboard question |
