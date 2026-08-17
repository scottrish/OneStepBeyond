# Feature: Week Look-Ahead

**Status:** Implemented (2026-08-17), merged to `main`. The "Look ahead"
tab, the 7-day list (capacity phrase, due items linked to Assignment
Detail, Activities, planned sessions with remove), the signal-to-noise
rule, and the checkmark-not-strikethrough-alone completion indicator are
all built and tested against this spec's Acceptance Criteria. Which of
Plan's two tabs is showing is lifted to `App.tsx` (`planTab`, alongside
the existing `planDate`/`planStep`) rather than kept as `PlanPage`'s own
local state — discovered necessary via live testing, not written into
the plan up front: opening Assignment Detail from Look Ahead and tapping
Back was landing on the wizard's Day step instead, since the Assignment
Detail round trip unmounts/remounts `PlanPage`. See
`docs/decisions/20260816-plan-tab-state-lifted-not-reset-on-retap.md`'s
own 2026-08-17 update.

**Note on capacity language (2026-08-17):** the "Capacity language rule"
below assumes Planning already speaks in these qualitative phrases. It
doesn't yet — `daily-planning.md`'s Day step currently states capacity as
raw effort text ("about 1h 30m of study time"). This feature introduces
`capacityPhrase` as new (its own qualitative-phrase function, ported from
the prototype), used here only. Retrofitting Daily Planning's own,
already-shipped capacity copy to match is out of scope for this
increment — see `docs/Roadmap.md`'s Backlog if that divergence is worth
resolving later.

## Summary

A read-only, seven-day orientation view so a student can notice where the
week is crowded — distinct from, and secondary to, the day-by-day Planning
workflow. Formerly a standalone "Calendar" concept in early drafts of
Product-Vision.md; folded into Planning after prototype iteration (see
Product-Vision.md's "Week Look-Ahead" section).

## Source

Prototype: `src/components/efc/LookAhead.tsx`, reached via a "Look ahead"
tab within `src/routes/plan.tsx` (the standalone `/calendar` route redirects
here).

## User Story

As a student, I want to glance at the coming week and notice "Friday looks
packed" without having to plan every day just to see that.

## UX Flow

- A "Look ahead" tab alongside the day picker on the Planning screen (not
  a separate bottom-nav destination).
- Lists the next seven days, each showing: the date (tap to jump straight
  into that day's own Day step of the Planning wizard — not wherever the
  wizard was last left, and not a separate "week view of the wizard"),
  a qualitative capacity phrase, anything due that day (linked to its
  Assignment, opening Assignment Detail — see
  `docs/decisions/20260817-assignment-detail-global-overlay.md`), that
  day's Activities, and any already-planned sessions (with completion
  state and a remove action for not-yet-done sessions).
- **Signal-to-noise rule:** only call out a missing plan when it's actually
  consequential — something is due within the next two days and nothing is
  scheduled for it ("Preparation still needs a plan"). A day with nothing
  due and nothing planned just shows "Nothing scheduled," not a repeated
  warning.
- **Capacity language rule:** never state raw unscheduled hours (e.g. "8 hr
  30 min free"). Use the same qualitative phrases as Planning ("About 2 hr
  study time available," "Mostly open," "Plenty of room," "Tight day," "No
  study time today") — personal time is not automatically homework
  capacity (Design-Principles.md Eighth Principle).

## Functional Requirements

- Fully read-only: no way to plan or schedule from this view directly
  beyond removing an already-planned session or jumping into that day's
  Planning flow.
- Capacity per day uses the same `availableMinutes` calculation as
  Planning (Activities + travel time + a protected rest block subtracted
  from the realistic study window) — the two views must never disagree
  about how much time a day has.
- Removing an already-planned, not-yet-done session happens immediately
  on tap, with no confirmation step — matching Daily Planning's own
  remove action, which has none.
- A day's session list reflects only sessions actually happening that
  day: a session `deferred` away from a date does not appear on the date
  it was deferred from (it was moved, not cancelled — same rule
  `today-execution.md` states for its own list).

## Acceptance Criteria

- The view remains reachable from primary navigation (via Planning).
- No day shows a "nothing planned" message unless something is actually
  due soon and unaddressed.
- No screen in this feature ever states unscheduled time as a raw
  "X hr free" figure.
- Completed work is visually distinguishable by more than strikethrough
  alone (a checkmark, per the v1.1 prototype spec's accessibility note).

## Domain Model Touchpoints

- Planning → Availability; Commitments → Assignment (due dates), Activity.
- Directly implements Product-Vision.md's "Week Look-Ahead" functional
  requirement.

## Explicitly Out of Scope (this increment)

- A true calendar grid/month view.
- Editing Activities from this screen (see [activities.md](activities.md)).

No deviations from the prototype are proposed for this feature.
