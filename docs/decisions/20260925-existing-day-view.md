# Plan opens on the existing day's plan when one exists

Date: 2026-09-25

## Context

`20260818-plan-day-step-removed.md` removed Plan's "Day" step: a
mandatory screen in front of Select, on every entry, with nothing
actionable on it (a Continue tap was the only way forward). Its content
became Select's header, and `AlreadyPlannedList` (with Move and Remove)
sat at the top of Select.

`docs/features/daily-planning-and-completion-v2-proposal.md` item 10,
from the prototype, reintroduces a day-level screen, but a different
one. When the chosen day **already has planned work**, Plan opens on an
**existing-day view** that shows and manages that plan (due-that-day,
activities, sessions with time and length, per-session edit, **Add more
work**, **Done**). An empty day still opens straight on Select. The
prototype's own reason: tapping a day that already has a plan "drops you
into the planning flow … as if the day had nothing on it."

The product owner approved it on 2026-09-25 (roadmap Phase 7 step 9).

## Decision

1. **`Step` gains `"day"`**, an un-numbered view that shows no "Step N of
   4" label. The four wizard steps are unchanged.
2. **Landing rule.** Plan shows the day view instead of Select when the
   chosen day has at least one not-done session, and:
   - a day is picked (day chips, a Look Ahead day tap), or
   - it's a fresh entry: the step is at its default and the wizard has
     no in-progress selections.

   A student who leaves mid-wizard and comes back returns mid-wizard,
   keeping `20260816-plan-tab-state-lifted-not-reset-on-retap.md`.
3. *(Amended 2026-09-25 by `20260925-plan-target.md`: entries that carry
   an assignment — "Find time", "Make a plan", Detail's "Plan work for
   today" — also snap to today.)* **"Add work" entries always go to Select:** Assignment Detail's "Plan
   work for today" (`handleGoToPlanToday`), Home's Needs Attention
   actions, and the day view's own **Add more work**.
4. **Confirming ("Looks good") lands on the day view,** showing the
   updated plan with a short "Plan confirmed." note and, when the day is
   today, a **Start** action. This replaces the Confirm step's inline
   success screen.
5. **`AlreadyPlannedList` is retired from Select.** Its Move to another
   day (with the capacity warning) and Remove move into a per-session
   edit sheet opened from the day view. Select instead shows a "Planned
   today" note on tasks already on the chosen day (item 6b).

This supersedes points 2 and 4 of `20260818-plan-day-step-removed.md`
(Select's header content, and `pickDay()` always landing on Select) for
days that already have a plan. Points 1, 3, 5, and 6 stand: there's
still no gate in front of Select, and an empty day behaves exactly as
before.

## Alternatives considered

- **Keep `AlreadyPlannedList` at the top of Select.** Rejected: the plan
  is visible, but the screen still opens as "pick new work", which is
  the complaint this addresses. It's also where step 10's reordering and
  re-timing would otherwise have to live.
- **Always open on the day view, even for an empty day.** Rejected: that
  brings back exactly the empty, Continue-only screen 20260818 removed.

## Consequences

- The day view becomes the place where a plan is *edited* (Move and
  Remove now; reorder and retime in roadmap step 10). The wizard only
  *adds*; see `20260925-confirm-plan-appends.md`.
- Tests that assumed Plan always lands on Select for a planned day, or
  that confirming shows the inline success screen, change accordingly.
