# Feature: Risk Detection ("Needs Attention")

**Status:** Implemented (2026-08-17), merged to `main`, as part of Home
Dashboard's Phase 5 build. Both rules (not-enough-time,
due-soon-unscheduled), the priority order for choosing between them, and
all three next-actions ("Break it down" / "Find time" / "Make a plan")
are built in `src/domain/riskDetection.ts` and tested against this spec's
Acceptance Criteria — consumed today only by Home's Needs Attention
section. It is **not yet** consumed by Assignment Detail, despite this
spec's own Summary naming `assignment-management.md` as a consumer — see
`docs/Roadmap.md`'s Backlog item on Assignment Detail's CTA hierarchy,
which now covers this gap alongside the assignment-management.md items it
was already tracking. Week Look-Ahead, this spec's third named consumer,
doesn't exist yet either (see Roadmap Phase 4).

**Fix (2026-08-17):** `assignmentsNeedingAttention` didn't actually
enforce this spec's own "only assignments with remaining work... are
considered" rule — it was only implied by rule 1's arithmetic (`remaining
> capacity` is false when `remaining` is 0), never checked before rule 2.
Completing every Work Item under an assignment (e.g. finishing all of
today's sessions in Today Execution) completes each item but doesn't
mark the assignment itself complete, so `assignment.completedAt` stayed
null; rule 2's `hasFutureSession` check only looks at *open* items, so an
assignment with zero open items vacuously had "no future session" and was
flagged "Due soon and nothing planned for it yet." — for an assignment
with nothing left to plan. Fixed by skipping any assignment with zero
remaining minutes before either rule runs.

## Summary

A derived signal — never stored as a score, never authored as a judgment
of the student — that surfaces on Home and Assignment Detail when an
assignment is genuinely at risk of not being completed successfully, paired
with a specific next action rather than a vague warning. This is a cross-
cutting domain service consumed by [home-dashboard.md](home-dashboard.md),
[assignment-management.md](assignment-management.md), and
[week-lookahead.md](week-lookahead.md), not a screen of its own.

## Source

Prototype: `assignmentsNeedingAttention` and `attentionAction` in
`src/lib/domain/derive.ts`.

## User Story

As a student, I want the app to tell me — plainly, without alarm — when
something actually needs my attention, and what to actually do about it,
instead of leaving me to notice it myself or nagging me about everything.

## Logic

Two rules, evaluated per open (incomplete) assignment, derived at read time
(never persisted as a standing "risk score"):

1. **Not enough time.** Sum available study capacity (per
   [activities.md](activities.md)'s `availableMinutes`) across every day
   from today through the due date, inclusive. If remaining estimated
   effort exceeds that total, the assignment needs attention: *"There is
   more work left here than time before it is due. Worth replanning
   together."*
2. **Due soon and unscheduled.** If the due date is within two days and no
   future Work Session exists for any of its Work Items, the assignment
   needs attention: *"Due soon and nothing planned for it yet."*

Only assignments with remaining work and a non-past due date are
considered. Results are sorted by soonest due date, so "the one item
needing attention" shown on Home is always the most urgent, not just the
first one found.

### Next action (never a vague CTA)

Chosen from what's actually missing, per Product-Vision.md's updated Risk
Detection guidance:
- No Work Items exist yet → **"Break it down"**.
- Flagged for rule 2 (due soon, unscheduled) → **"Find time"** (→
  Planning).
- Otherwise (rule 1, not enough time, but a breakdown exists) →
  **"Make a plan"** (→ Planning).

## Functional Requirements

- This is a pure derived computation with no side effects and no
  persistence of its own — it must be safe to call on every render.
- The underlying reasons (which rule fired, the numbers behind it) are
  available internally but the **student only ever sees the short message
  and the action label** — never remaining-minutes math, never "you are at
  X% risk" (Domain Invariant 11).
- When nothing needs attention, no message is shown at all — silence is
  the "on track" state (Product-Vision.md).

## Acceptance Criteria

- An assignment with a confirmed breakdown, enough remaining capacity, and
  a session already scheduled never appears in Needs Attention.
- Home never shows more than one Needs Attention item at a time (see
  home-dashboard.md), and it is always the soonest-due one currently
  flagged.
- The action shown always matches what's actually missing (never "Find
  time" when the real issue is that no breakdown exists yet).

## Domain Model Touchpoints

- Observation → Risk Assessment ("derived... not manually authored as a
  judgment of the student"); Domain Service: Risk Assessment Service.
- Domain Event: `Risk Assessment Changed` (conceptually — this increment
  computes at read time rather than storing a changelog of risk state).

## Explicitly Out of Scope (this increment)

- Any parent- or coach-facing detail view of *why* something is flagged
  (Product-Vision.md's original three-tier "reason" visibility by role is
  deferred along with those dashboards).
- A persisted risk history/trend.

## Deviation from Domain-Model.md — already applied to Product-Vision.md

Domain-Model.md's original student-facing vocabulary was three states (On
Track / Needs Attention / Let's Adjust). The prototype validated a simpler,
more actionable two-state pattern (silence, or Needs Attention + a specific
action) and dropped the distinct "Let's Adjust" state as redundant with a
well-chosen action label. This has already been reflected in
Product-Vision.md's Risk Detection section as part of this analysis: no
further approval needed here, noted for traceability.
