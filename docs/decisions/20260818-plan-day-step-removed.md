# Plan's Day step is removed; its content folds into Select

Date: 2026-08-18

## Context

`docs/features/daily-planning.md`'s wizard originally had five steps —
Day, Select, Estimate, Schedule, Confirm — with Day first: a day-picker
context screen (due-that-day, today's Activities, "Already planned"
sessions with Move/Remove, a plain-language capacity sentence) gated
behind its own "Continue" tap before Select's candidate list became
reachable.

Two things surfaced this session that made Day's presence as a distinct,
mandatory step questionable:

1. `assignment-detail-cta-hierarchy.md` item 1's "Plan work for today" CTA
   was found to force an unnecessary extra tap — landing on Day, which the
   student then had to Continue past to reach anything actionable, even
   though the day being planned (today) was already fixed. The smaller fix
   shipped for that (`App.tsx`'s `handleGoToPlanToday`, forcing
   `planStep` straight to `"select"`) resolved it for that one entry
   point, but the same shape of complaint applies to every other entry
   into Plan — the bottom-nav tab, Home's "Plan today" empty-state button,
   Home's Needs Attention actions — none of which had (or needed) a reason
   to stop on Day first.
2. Direct product-owner review (raised immediately after that fix
   shipped): re-reading `PlanPage.tsx`, the day-picker strip itself
   (`role="radiogroup"`, "Choose a day to plan") is rendered *above* the
   step conditional — visible on Select, Estimate, Schedule, and Confirm
   too, not only on Day. Day was never "the place where you pick a day";
   that already lived elsewhere, unconditionally. Day's only genuinely
   unique content was the orientation block (due-that-day, Activities,
   Already planned, capacity) plus a Continue gate in front of Select.

## Decision

1. **Day is removed as a distinct `Step`.** `Step` narrows from `"day" |
   "select" | "estimate" | "schedule" | "confirm"` to `"select" |
   "estimate" | "schedule" | "confirm"`. The wizard is now 4 steps, not 5;
   `STEP_LABEL` is renumbered accordingly (Select = "Step 1 of 4", ...,
   Confirm = "Step 4 of 4").
2. **Day's content becomes Select's own unconditional header.** Select now
   renders, in order: the "Let's plan {day}." heading, due-that-day,
   Activities, Already planned (with Move/Remove), the capacity sentence
   — then, immediately below with no gate in between, "What should you
   work on?" and either the candidate list, the mixed-case
   `BreakdownNotice`, or the appropriate dead-end/empty state.
3. **The "these assignments need breaking down" signal is shown exactly
   once per screen, not twice.** Previously Day rendered `BreakdownNotice`
   unconditionally and Select rendered it again for the mixed case — two
   separate screens, so the duplication was invisible. Merged onto one
   screen it would have been a visible double-message. `BreakdownNotice`
   now renders only in the "real candidates exist, some assignments are
   still missing" branch; the "nothing schedulable exists at all" case
   keeps its own richer dead-end copy (`"Break the assignment into steps
   first, then come back."` + `BreakdownList`), exactly as Select already
   did before this change — just reachable immediately instead of after a
   Continue tap.
4. **`pickDay()` now resets to `"select"`, not `"day"`.** Choosing a
   different day from the (still-persistent, still-global) day-picker
   strip lands back on Select with that day's own context, the same
   landing behavior as every other entry point.
5. **`safeStep`'s remount-with-no-selections fallback now targets
   `"select"`.** Same guard, same purpose (`chosen`/`times` are
   intentionally not lifted — see `20260816-plan-tab-state-lifted-not-
   reset-on-retap.md` — so a stale mid-flow remount can't render a broken
   Estimate/Schedule/Confirm), just retargeted at the new landing step.
6. **`App.tsx`'s `planStep` now defaults to `"select"`.** Every entry
   point into Plan — not just Assignment Detail's "Plan work for
   today" — now lands on Select by default. `handleGoToPlanToday` keeps
   its explicit `setPlanStep("select")` call rather than relying on the
   new default, since it still needs to force the step back from
   wherever the wizard was left mid-flow for a *different* assignment/day
   — the default only covers a fresh `planStep` that was never touched.

## Alternatives considered

- **Keep Day, but make it optional** (skip straight to Select unless the
  student explicitly wants to browse a different day first). Rejected —
  this would require inventing a new signal for "this student wants Day"
  that doesn't otherwise exist, and doesn't remove the actual duplication
  problem (the day-picker being visible everywhere already, and Day's
  context content having nowhere else to live) that made Day redundant in
  the first place.
- **Keep Day's content shown twice** (BreakdownNotice on the merged
  header, dead-end block below it when candidates are empty) to avoid
  touching wording. Rejected — this is a real, visible UX regression a
  reader would notice immediately (two boxes about the same assignment,
  stacked), not a neutral preservation of prior behavior; the two
  screens never showed both messages simultaneously before this change.
- **Leave the 5-step numbering and insert Select as steps "1a"/"1b" of
  5.** Rejected as needless complexity — renumbering to a genuine 4-step
  wizard is simpler and matches what a student actually experiences.

## Consequences

- `docs/features/assignment-detail-cta-hierarchy.md` item 1's
  `handleGoToPlanToday` fix is now largely subsumed by the new default —
  it still matters for forcing the *date* back to today and the step back
  from a stale mid-flow position, but no longer needs to "skip Day" since
  Day no longer exists for any entry point.
- `docs/features/home-dashboard-followthrough.md` item 4 (passing the
  triggering assignment through to Plan and pre-selecting its Work Items)
  remains separate, larger, and still deferred — this change removes the
  extra-tap friction for *every* entry point, but does not add assignment
  passthrough or pre-selection anywhere.
- Any future feature that wants a genuine "browse and pick a day before
  doing anything else" experience should reconsider this decision
  explicitly rather than resurrecting a bare Day step — the day-picker's
  persistent, global placement (unconditional across all four steps) was
  the reason Day added nothing on its own, and that placement isn't
  changing here.
