# Feature: Assignment Detail with no steps — one card, and planning that makes steps

**Status:** Built 2026-09-26. N1–N4 were confirmed as recommended
(`docs/decisions/20260926-assignment-detail-no-steps.md`). See
"Implementation Notes (as built)".

## Summary

A brand-new assignment has no steps, and Assignment Detail doesn't make
the next move clear:

- **Big assignments get two boxes.** Over 45 minutes, a "This one is
  fairly big…" prompt appears above a "No steps yet" box. Smaller
  assignments get just the "No steps yet" box.
- **Two main buttons compete.** "Break this down" and "Plan work for
  today" are both solid, filled buttons.
- **"Plan work for today" goes in a circle.** It opens Plan, but an
  assignment with no steps has nothing to choose there. Its row says "No
  steps yet", and tapping it reopens Assignment Detail.

This spec combines the two boxes into one, and makes **"Plan work for
today" always end in planned steps**: either the steps from a breakdown,
or one step from "Plan it as one piece".

## Source

- **Prototype** (`../OneStepBeyondPrototype`,
  `src/routes/assignments.$id.index.tsx`, the same on `main` and
  `origin/mobile-redesign`, checked 2026-09-26):
  - It has the same two boxes for a big assignment ("This one is easier
    to start in smaller steps…" with **Yes, help me start / Just add a
    step / Plan it as one piece**, above "No steps yet." with **Break
    this down / Just add a step / Plan it as one piece**). It even
    repeats all three choices.
  - Its **Plan work for today** is a plain link to `/plan`.
  
  So this spec deliberately departs from the prototype's behaviour. It
  keeps its look: an empty state, ghost and secondary buttons, the solid
  `size="lg"` main button at the bottom, and the prototype's wording
  where it fits.
- **Product owner, 2026-09-26:**
  - "'Plan work for today' needs to result in steps being added, whether
    it's multiple steps or a step resulting from 'Plan it as one
    piece'";
  - combine the "fairly big" prompt with "No steps yet";
  - hide "Mark assignment complete" until there's at least one step
    (done).

## Current behaviour (as built, 2026-09-26)

In `src/pages/AssignmentDetailPage.tsx`:

- **Big assignments** (`suggestBreakdown`: no steps and over 45 minutes,
  from `useAssignmentRisk`) show a card with this text: "This one is
  fairly big. Would it help to break it into smaller steps? What do you
  think should happen first?" Its buttons are **Yes, help me start**
  (secondary), **Just add a step** and **Plan it as one piece** (ghost).
  Below it, "No steps yet." appears with no buttons (R2: they'd repeat
  the card's).
- **Other assignments with no steps** show "No steps yet. Small steps
  are easier to start than a whole assignment." Its buttons are **Break
  this down** (solid), **Just add a step** and **Plan it as one piece**
  (ghost).
- "Yes, help me start" and "Break this down" open **the same flow**:
  `WorkBreakdownPage` with the "Paste what the teacher said / Say it in
  my own words" prompt.
- After a breakdown is confirmed, the student returns to Assignment
  Detail, or to Plan's Select if they came from Plan.
- **Plan work for today** (solid, large, at the bottom) calls
  `onGoToPlan`: Plan's Select for today, with the assignment's steps
  that still need time chosen (`preselectFor`, `20260925-plan-target.md`).
  With no steps, nothing is chosen.
- **Plan it as one piece** creates one step the size of the assignment,
  then opens Plan's Select with it chosen (`onPlanPick`).
- **Mark assignment complete** (ghost, muted) is hidden while there are
  no steps.

## User Story

As a student looking at a new assignment, I want one clear way to get it
into my plan, so I know what to do next without working out which of
several buttons matters.

## Decisions required

**N1. Keep "Just add a step" on the card?** *Recommended: yes.* It's the
lightweight way to start without the full breakdown, and it doesn't
compete with planning.

**N2. What "Plan work for today" does with no steps.**
- **Option A (recommended): a sheet**, "How do you want to plan this?",
  with two choices (below).
- **Option B:** go straight into the breakdown, with "Plan it as one
  piece" offered inside it. That's fewer taps, but it hides the quick
  path behind the longer one.

**N3. Where "Break it into steps first" leads after confirming.**
*Recommended:* into Plan's Select, with the new steps chosen. The
student asked to plan, so planning continues. The card's own **Break
this down** keeps today's behaviour and returns to Assignment Detail,
because it wasn't a request to plan.

## Functional Requirements

1. **One "No steps yet" card**, shown whenever the assignment has no
   steps and the student isn't adding one:
   - Title: "No steps yet."
   - Hint, by size:
     - over 45 minutes (`suggestBreakdown`): "This one is fairly big —
       smaller steps will make it easier to start. What should happen
       first?"
     - otherwise: "Small steps are easier to start than a whole
       assignment."
   - Buttons: **Break this down** (secondary) and **Just add a step**
     (ghost, if N1 is kept). Neither is solid.
   - The separate "This one is fairly big…" card and the "Yes, help me
     start" label are removed.
2. **"Plan work for today" stays the only solid main button**, at the
   bottom, in every state.
3. **With steps:** unchanged. Plan's Select opens with the steps that
   still need time chosen.
4. **With no steps**, it opens a sheet (`ResponsiveSheet`) titled "How
   do you want to plan this?", with:
   - **Break it into steps first:** the breakdown flow (with the
     understanding prompt). On confirm, Plan's Select opens with the new
     steps chosen (N3). If cancelled, the student returns to Assignment
     Detail with nothing changed.
   - **Plan it as one piece:** exactly as today. One step, then Plan's
     Select with it chosen.
   - For a big assignment (`suggestBreakdown`), "Break it into steps
     first" is listed first and styled as the main choice. Otherwise the
     two are equal.
5. **"Plan it as one piece" leaves the card.** It's only offered in the
   sheet, because it's a way to plan, not a way to break down.
6. **Opened from Plan** (`openedFromPlan`): both sheet choices return to
   Plan's day, not today, as "Plan it as one piece" and a confirmed
   breakdown already do.
7. **"Mark assignment complete" hidden until there's a step.** Done
   2026-09-26.
8. **Plan's "No steps yet" row** still opens Assignment Detail. There,
   "Plan work for today" now leads somewhere, which ends the loop.

## Accessibility

- The sheet is a `ResponsiveSheet`. It traps focus and closes with
  Escape, and focus returns to "Plan work for today" when it closes.
  Both choices are at least 44 px tall, and "Never mind" closes it.
- The card's hint is plain text. The big variant isn't shown by colour
  alone.
- With no steps there is exactly one solid (`bg-primary`) button on the
  screen.

## Acceptance Criteria

- A big assignment with no steps shows **one** box: "No steps yet.",
  the "fairly big" hint, **Break this down** and **Just add a step**,
  and no "Yes, help me start".
- A smaller assignment with no steps shows the same box with the usual
  hint.
- In both, the only solid button is **Plan work for today**, and
  **Mark assignment complete** isn't shown.
- With no steps, **Plan work for today** → "How do you want to plan
  this?":
  - **Plan it as one piece** → Plan's Select for today, with that one
    step chosen;
  - **Break it into steps first** → breakdown → confirm → Plan's Select
    for today, with the new steps chosen;
  - cancelling the breakdown → back to Assignment Detail, with nothing
    changed.
- Opened from Plan, both paths return to Plan's day.
- The card's own **Break this down** → confirm → back to Assignment
  Detail, with the steps listed (unchanged).
- With steps, the screen and **Plan work for today** behave as today.

## Testing Notes

- **Component** (`AssignmentDetailPage.test.tsx`):
  - the one card in both sizes;
  - a single solid button;
  - the sheet and its two paths, including the confirm → `onGoToPlan` /
    Plan's day wiring and the cancel path;
  - "Plan it as one piece" absent from the card.
- **Existing tests to update:**
  - the nudge-card tests ("Yes, help me start");
  - the empty-state tests;
  - R2's "no repeated buttons" test.
- **Real browser** (320 px): a new big assignment and a new small one,
  each through both sheet paths into Plan.

## Domain Model Touchpoints

No new concepts. A Work Breakdown (several Work Items) or a single
"one piece" Work Item is created exactly as today. Only the order of
screens and which buttons are shown changes.

## Explicitly Out of Scope

- The breakdown flow itself (`WorkBreakdownPage`) and its understanding
  prompt.
- The 45-minute threshold for "fairly big".
- Plan's own rows (`CandidateRow`), including "No steps yet".
- Assignment Detail with steps, apart from requirement 7 (done).

## Implementation Notes (as built), 2026-09-26

- **Decisions:**
  - N1: keep "Just add a step";
  - N2: a sheet;
  - N3: a breakdown from the sheet continues into Plan;
  - N4: coming from Plan, every breakdown (the sheet's, or the card's own
    "Break this down") returns to Plan's day with the new steps chosen.
- **Code:**
  - `src/pages/AssignmentDetailPage.tsx`:
    - one `EmptyState`, with the hint by `suggestBreakdown`;
    - `breakingDown` is `"steps" | "plan" | null`, so a confirmed
      breakdown knows whether to continue into Plan;
    - the nudge card is removed.
  - The new `src/pages/AssignmentDetailPlanSheet.tsx` (a `ResponsiveSheet`).
  - `src/App.tsx`: `handlePlanBrokenDown` replaces
    `onBreakdownConfirmedFromPlan`.
  - No service, database or Plan changes.
- **Tests:**
  - `AssignmentDetailPage.test.tsx`:
    - the single card in both sizes;
    - one solid button;
    - the sheet's order and styling by size, and Never mind;
    - both sheet paths, and cancelling;
    - the card's breakdown staying on Detail, or returning to Plan when
      opened from Plan;
    - "with steps, no sheet".
    
    The old nudge tests were rewritten as "fairly big" hint tests.
  - `App.test.tsx`:
    - from Assignments, sheet → break down → Plan today with the new
      step chosen;
    - from Plan on Tuesday, the card's "Break this down" → Plan
      Tuesday with the new step chosen;
    - the one-piece paths now go through the sheet.
- **Verified in a real browser** (Chromium, 320 px and 1024 px, local
  Supabase), 8 checks:
  - a big assignment shows one card with the "fairly big" hint, no
    "Yes, help me start" and no "Plan it as one piece";
  - "Plan work for today" is the only solid button;
  - "Mark assignment complete" doesn't show;
  - the sheet's buttons are at least 44 px tall;
  - the sheet → "Break it into steps first" → understanding prompt →
    one step → Plan today with it chosen;
  - a small assignment → "Plan it as one piece" → Plan today with it
    chosen;
  - desktop shows the same card.

