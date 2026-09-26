# Assignment Detail with no steps: one card, and planning that makes steps

Date: 2026-09-26

## Context

On an assignment with no steps, Assignment Detail had three problems:

- Big assignments (over 45 minutes) got two boxes: a "This one is fairly
  big… Yes, help me start" card above "No steps yet".
- "Break this down" and "Plan work for today" were both solid buttons.
- "Plan work for today" went in a circle. Plan had nothing to choose
  for an assignment with no steps, and its "No steps yet" row reopened
  Assignment Detail.

`assignment-detail-no-steps-v0.1.md` proposed a fix. The product owner
confirmed N1–N4 on 2026-09-26, and had already decided to hide "Mark
assignment complete" until there's a step.

## Decision

1. **One "No steps yet" card**, with the hint worded by size, and two
   quiet buttons: **Break this down** (secondary) and **Just add a step**
   (ghost) (N1). "Yes, help me start" is gone. It opened the same flow as
   "Break this down".
2. **"Plan work for today" is the only solid button, and always ends in
   planned steps.** With no steps, it opens a sheet, "How do you want to
   plan this?" (N2):
   - **Break it into steps first:** after confirming, Plan's Select opens
     with the new steps chosen (N3);
   - **Plan it as one piece:** as before.
   
   For a big assignment, breaking it down is the sheet's main choice.
3. **"Plan it as one piece" is only in the sheet.** It's a way to plan,
   not a way to break down.
4. **Coming from Plan, every breakdown returns to Plan's day with the
   new steps chosen** (N4). This includes the card's own "Break this
   down". Before, a breakdown confirmed from Plan returned to Select with
   nothing chosen. Not coming from Plan, the card's "Break this down"
   stays on Assignment Detail.

App gains one handler, `handlePlanBrokenDown`: an assignment target, on
Plan's day if opened from Plan, otherwise today. It replaces
`onBreakdownConfirmedFromPlan`.

## Alternatives considered

- **Go straight into the breakdown from "Plan work for today"**, with
  "one piece" offered inside it: fewer taps, but it hides the quick path.
- **Keep the two boxes for big assignments** (R2's arrangement): the
  duplication and the competing buttons stay.
- **Keep "Plan it as one piece" on the card too:** it would repeat the
  sheet's choice, and blur breaking down with planning.

## Consequences

- This partly supersedes:
  - R2 in `20260925-plan-rows-and-one-piece.md`: there's no nudge card
    left to avoid repeating;
  - item 3a of `assignment-detail-cta-hierarchy.md`: the nudge card and
    "Yes, help me start".
- Plan's "No steps yet" row still opens Assignment Detail. The loop
  ends there, because "Plan work for today" now leads somewhere.
- "Plan work for today" with steps is unchanged. It still always means
  today, even when opened from Plan on another day (P2 in
  `20260925-plan-target.md`).

## Revision (2026-09-26, N5): built the same day

After the first build, the product owner said "Plan it as one piece"
shouldn't have left the card; decision 3 above had moved it. The
revision:
- **"Plan it as one piece" is back on the "No steps yet" card**, for
  every size, as a quiet (ghost) button. It stays in the "Plan work for
  today" sheet too, with the same label and behaviour. This supersedes
  decision 3.
- **"Just add a step" is renamed "Add the first step".** The old label
  was easy to confuse with "Plan it as one piece", since both end in one
  step. "First" says more steps can follow.
- **The card's buttons are Break this down (secondary), Add the first
  step (ghost) and Plan it as one piece (ghost).** The hint still
  encourages breaking it down ("This one is fairly big — smaller steps…"
  or "Small steps are easier to start…"), and "Plan work for today"
  stays the only solid button.

Considered and not taken: "Skip steps and plan it" as the one-piece
label (clearer about what's given up, but the product owner kept the
familiar "Plan it as one piece"), and showing it on the card only for
small assignments.

## Revision (2026-09-26, N6, N7 and R1): approved and built the same day

Details are in the spec, "Revision N6 and N7 (proposed)".

- **N6: "Plan work for today" is hidden until there's a step,** and the
  "How do you want to plan this?" sheet is removed. That supersedes
  decisions 2 and 3 above. With no steps, the "No steps yet" card is the
  only place to start. After a breakdown confirmed from Assignment
  Detail, the student returns there and "Plan work for today" appears.
  Coming from Plan, it's unchanged (decision 4). *Why:* the card and the
  sheet asked the same question twice, in different words. *Trade-off:*
  one more tap to plan a big assignment after breaking it down.
- **N7: the app's ← Back on Assignment Detail closes an open form
  first** (the add-step form, the edit-assignment form, the delete
  confirmation, a step being edited or a completed step's delete being
  confirmed (R1)), and only leaves Assignment Detail when nothing is
  open. *Why:* the add-step form looks
  like its own screen, but Back left the assignment entirely.

