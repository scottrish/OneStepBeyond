# Today Execution: interim entry point before Home Dashboard exists

Date: 2026-08-16

## Context

`docs/features/today-execution.md`'s UX Flow says the screen is "reached
from Home's 'Next' card or Plan's confirmation step." Home Dashboard's
full content (the Next card) is Phase 5, explicitly not built yet — see
`docs/Roadmap.md`, which sequences Phase 5 after Phase 4 precisely
because Home composes data from every prior phase, including this one.
Building Today Execution now (the remaining piece of Phase 4 that
unblocks Phase 5) therefore means only one of its two specified entry
points currently exists.

Taken literally, that leaves Today Execution reachable only in the
instant right after confirming a plan (`PlanPage`'s `justConfirmed`
state). A student who confirms a plan, does one task, then closes the
app and reopens it later the same day would have no way back into Today
Execution at all until Home Dashboard ships — `today-execution.md` is
explicit that this screen is not a bottom-nav tab, since Home already
represents "what's happening today" (`home-dashboard.md`'s Navigation
section), so there's no independent nav path to fall back on either.

## Decision

Add a second, interim entry point on Plan's **Day** step: when the
selected day is today and a confirmed (non-empty, not-fully-done) plan
exists for it, show a "Continue today's plan" action alongside the
existing "Already planned" list, linking into Today Execution. This is
in addition to — not instead of — the confirm-step link
`today-execution.md` already specifies.

This is a small, explicit deviation from `today-execution.md`'s literal
entry-point list, scoped narrowly to "today, when a plan already exists
for it" so it never appears for a future day being planned. When Home
Dashboard's Next card ships (Phase 5), it becomes the primary way in;
this Plan-side link should stay as a secondary path rather than being
removed — it costs nothing to keep and doesn't depend on Home's more
elaborate composed state (Next-card empty-state logic, "Coming up"
filtering, etc.).

## Alternatives considered

- **Wait to build Today Execution until Home Dashboard exists.** Rejected
  — this stalls the rest of Phase 4 and all of Phase 5 on a screen whose
  own spec says it's deliberately built last *because* it depends on
  Today Execution, not the other way around (see `docs/Roadmap.md`'s
  Phase 5 "Why last"). Circular if taken this way.
- **Add Today Execution as its own bottom-nav tab for now.** Rejected —
  directly contradicts `home-dashboard.md`'s Navigation section, which
  states this screen is reached from Home/Plan specifically so it
  doesn't compete with the three-tab structure validated in the
  prototype.
- **Only wire the confirm-step link, accept no other way back in this
  increment.** Rejected — makes the feature effectively untestable and
  unusable for the exact "return later the same day" case the feature
  exists to support; also blocks the acceptance criterion ("a student
  can identify the current task without navigating multiple screens")
  from ever being exercised outside the single moment right after
  confirming.

## Consequences

- `PlanPage.tsx`'s Day step gains new conditional UI (a link, not a
  redesign) — scoped to `date === today` only, so no other day's Day
  step is affected.
- When Home Dashboard's Next card is built, its own spec's Acceptance
  Criteria should be re-checked against this link still being present —
  no removal is planned, but it's worth confirming they don't disagree
  about state (e.g. both should independently reflect an already-done
  plan the same way).

**Update (2026-08-17, Home Dashboard implemented):** as anticipated
above, `TodayExecutionPage` was lifted out of being owned by `PlanPage`
alone — it's now a single instance owned by `App.tsx` (an `executingToday`
boolean sibling to `activeTab`), reached from both Home's Next card and
Plan's two existing entry points (Day step, Confirm success screen)
without duplicating the page. `PlanPage` no longer renders
`TodayExecutionPage` directly; it calls a new `onStartExecution` prop
instead. Plan's own entry points were kept exactly as this record
decided — Home's Next card became a *second* way in, not a replacement.

**Update (2026-08-17, "Continue today's plan" removed):** contrary to the
Consequences section's expectation above, this Day-step link was removed
rather than kept. Once Home's Next card was fully built out (docs/features/
home-dashboard-followthrough.md items 1a/1b/2/5 — visible "After that"
list, full Needs Attention list, unified routing to Plan, and a Start
button that actually starts the session), it became a fully-capable
primary entry point, and having it alongside "Continue today's plan" meant
two similarly-labeled buttons doing different things on the same Day-step
screen ("Continue" advances the wizard; "Continue today's plan" leaves it
for Today Execution). The user-facing motivation was a broader wish to
keep Plan's job to *constructing* a plan and Home's job to *viewing/acting
on* it, reducing capability overlap between the two tabs. The Confirm
step's "Start today's plan" link (`docs/decisions/
20260816-daily-planning-confirm-write-order.md`) was kept — it's a
one-time shortcut immediately after finishing construction, not a
persistent parallel path to Today Execution, so it doesn't have the same
two-similar-buttons problem.
