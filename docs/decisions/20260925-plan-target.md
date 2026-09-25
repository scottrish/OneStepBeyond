# Plan opens for one assignment, with its work already chosen

Date: 2026-09-25

## Context

`home-dashboard-followthrough.md` §4 (approved, never built) asked for
Home's "Find time" to carry its assignment into Plan, so the student
doesn't have to find it again. `daily-planning-and-completion-v2-proposal.md`
item 1 (roadmap Phase 7 step 5) builds it, with three refinements from
the prototype: pre-select only steps that still need time, sort the
target first, and let "Make a plan" carry the target too. Building it
raised two questions, which the product owner settled on 2026-09-25.

## Decision

1. **Plan can be opened for one assignment or one step** (`PlanTarget`
   in `src/domain/planningCandidates.ts`). App.tsx holds the target and
   passes it to PlanPage.
2. **What's pre-chosen** (`preselectFor`): the assignment's open steps
   that aren't already planned on another day on or before the due date.
   If none are left, every step that can be chosen. Steps already planned
   on this day are never chosen, because Select disables them (6c). A
   step target chooses exactly that step. It's only a starting point: the
   student can untick anything.
3. **The target's rows come first**, with a ring and screen-reader text
   ("The assignment you came to plan."), and every row is shown, not
   capped at three.
4. **Applied once.** PlanPage applies the target during render, once its
   data (including every day's sessions) has loaded, then tells App to
   clear it. So a later remount of Plan, for example after an Assignment
   Detail round trip, can't re-apply a stale target over the student's
   own choices.
5. **P1 — Assignment Detail's "Plan work for today" carries its
   assignment too**, the case `assignment-detail-cta-hierarchy.md`
   explicitly put off until this was built.
6. **P2 — a targeted entry always opens today.** This amends
   `20260925-existing-day-view.md` point 3 for targeted entries only: an
   untargeted one (Needs Attention's "Break it down") still opens Select
   on whatever day Plan was showing. Home is about today, and landing on
   another day because Plan was last left there would be confusing.
7. "Find time" and "Make a plan" carry their assignment. "Break it down"
   carries nothing (for now; step 7 sends it to Assignment Detail).

## Alternatives considered

- **Apply the target in an effect** after the data loads. The list would
  paint once without the selection, and this repo's lint rules forbid
  setting state inside an effect.
- **Keep the target in the URL** (the prototype's `?assignment=` /
  `?pick=`). The app has no router, and the overlay props already carry
  what's needed.

## Consequences

- Step 7's "Plan it as one piece" can reuse the step target (`pick`).
- Step 8 (removing the three-candidate cap for everyone) depends on the
  target-first sort, which now exists.
