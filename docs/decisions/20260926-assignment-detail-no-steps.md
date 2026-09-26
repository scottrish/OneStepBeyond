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
