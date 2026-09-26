# Feature: Assignment Detail with no steps — one card, and planning that makes steps

**Status:** Built 2026-09-26. N1–N4 were confirmed as recommended
(`docs/decisions/20260926-assignment-detail-no-steps.md`). See
"Implementation Notes (as built)". **Revision N5 (2026-09-26), built
the same day:** "Plan it as one piece" is back on the card, and "Just add
a step" is now "Add the first step". This changed requirements 1 and 5
and the acceptance criteria below. **Revisions N6, N7 and R1 (approved
and built 2026-09-26):** see "Revision N6 and N7" below. N6 replaces N2,
N3 and requirements 2 and 4.

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

**N2. What "Plan work for today" does with no steps.** *(Replaced by
N6.)*
- **Option A (recommended): a sheet**, "How do you want to plan this?",
  with two choices (below).
- **Option B:** go straight into the breakdown, with "Plan it as one
  piece" offered inside it. That's fewer taps, but it hides the quick
  path behind the longer one.

**N5 (product owner, 2026-09-26, after the first build). The card's
buttons.**
- "Plan it as one piece" goes back on the card, for every size. As
  built, it had moved into "Plan work for today"'s sheet only, and the
  product owner hadn't realised it would leave the card. The hint text
  still encourages breaking it down.
- The labels are **Break this down**, **Add the first step** (was "Just
  add a step") and **Plan it as one piece**. The old "Just add a step"
  was easy to confuse with "Plan it as one piece", because both end in
  one step. "First" makes clear that more steps can follow.

**N3. Where "Break it into steps first" leads after confirming.**
*(Replaced by N6.)*
*Recommended:* into Plan's Select, with the new steps chosen. The
student asked to plan, so planning continues. The card's own **Break
this down** keeps today's behaviour and returns to Assignment Detail,
because it wasn't a request to plan.

## Revision N6 and N7 (approved and built 2026-09-26, with R1)

### Why

- **N6.** After N5, a student with no steps sees two different sets of
  choices. The card offers Break this down / Add the first step / Plan
  it as one piece, and "Plan work for today" then opens a sheet offering
  Break it into steps first / Plan it as one piece. That's the same
  decision, asked twice, in different words.
- **N7.** "Add the first step" (and "Add another step") opens a form in
  place of the card on Assignment Detail. It looks like a screen of its
  own, but the app's **← Back** at the top belongs to Assignment Detail:
  it leaves the assignment entirely, and only the form's Cancel returns
  to the card. Reported by the product owner, 2026-09-26. The browser's
  own back isn't part of this.

### N6. "Plan work for today" appears only once there's a step

1. With no steps, **"Plan work for today" is hidden**, like "Mark
   assignment complete" (requirement 7). The "No steps yet" card is the
   one place to start:
   - **Break this down**
   - **Add the first step**
   - **Plan it as one piece**
   
   Its hint text stays as it is, and still encourages breaking it down.
2. **The "How do you want to plan this?" sheet is removed**
   (`AssignmentDetailPlanSheet.tsx`), along with its "Break it into steps
   first" path.
3. Once there's at least one step, **"Plan work for today" appears** and
   behaves as today: Plan's Select with the steps that still need time
   chosen.
4. **After the card's "Break this down" is confirmed:**
   - not opened from Plan: back to Assignment Detail with the new steps
     listed, where "Plan work for today" now shows;
   - opened from Plan: back to Plan's day with the new steps chosen, as
     now (N4 stays).
5. **The card's "Plan it as one piece"** is unchanged: one step, then
   Plan's Select with it chosen.
6. **Hidden, not disabled.** A disabled button doesn't say why, and
   screen readers skip it. The card already says what to do first.

**Trade-off:** for a big assignment, planning takes one more tap after
the breakdown: confirm → Assignment Detail → "Plan work for today".
That's accepted, in return for one consistent set of choices.

**With no steps, the screen has no solid button.** "Break this down"
(secondary) leads. This changes the Accessibility line "exactly one solid
button" to "at most one solid button".

### N7. The app's ← Back closes an open form before leaving

While one of these is open on Assignment Detail, **← Back closes it and
stays on Assignment Detail**, exactly like that form's own Cancel:

- the **add-step form** ("Add the first step", "Add another step", or
  "Not yet — add a step" on the all-done card), discarding what was
  typed;
- the **edit-assignment form** (the pencil);
- the **delete confirmation** (the bin).

With none of them open, ← Back leaves Assignment Detail as today.

Out of scope for N7:
- the breakdown flow (it has its own Back, which already returns to
  Assignment Detail);
- the reflection and turned-in reminder after completing (they have
  their own ways out);
- the browser or phone back (no router; it would need its own spec).

**R1 (approved): editing a single step inline** (a step's menu → Edit)
is closed by ← Back too, and so is a completed step's delete
confirmation. The rule is simply "Back closes whatever is open first".

### Acceptance criteria (N6, N7)

- **No steps:** there's no "Plan work for today" and no "Mark assignment
  complete". The card shows its three buttons, and no sheet can open.
- **After adding the first step,** or after a breakdown confirmed from
  Assignment Detail, "Plan work for today" appears and opens Plan's
  Select with the steps chosen.
- **Opened from Plan,** a confirmed breakdown returns to Plan's day with
  the new steps chosen (unchanged).
- **The card's "Plan it as one piece"** → Plan's Select with the step
  chosen (unchanged).
- **With the add-step form open, ← Back** closes the form, shows the
  card (or the step list) again, and stays on Assignment Detail. Nothing
  is saved. The same goes for the edit-assignment form and the delete
  confirmation (and, if R1 is accepted, a step being edited).
- **With nothing open, ← Back** leaves Assignment Detail, as today.

### As built (2026-09-26)

- **`AssignmentDetailPage.tsx`:**
  - "Plan work for today" renders only with at least one step;
  - the sheet and its state are removed;
  - a confirmed breakdown returns to Detail, or to Plan when opened from
    Plan;
  - `handleBack` closes, in order: the edit form, the delete
    confirmation, then the add-step form or an open step edit or step
    delete confirmation. For the last group, the Steps section remounts
    (`key`), which discards whatever was typed. Only with nothing open
    does it call `onBack`.
- **`AssignmentDetailSteps.tsx`:** a new `onStepOpenChange` reports a
  step being edited or a completed step's delete being confirmed.
- **`AssignmentDetailPlanSheet.tsx`** is deleted.
- **`App.tsx`:** `handlePlanBrokenDown` keeps Plan's day. It's only
  called when opened from Plan now.
- **Tests:**
  - `AssignmentDetailPage.test.tsx`:
    - no "Plan work for today" or solid button without steps;
    - adding the first step makes it appear;
    - the card's breakdown returns to Detail, where it appears;
    - N4 unchanged;
    - five ← Back tests: the add form (discarding what was typed), the
      edit form, the delete confirmation, a step edit, and a completed
      step's delete confirmation.
  - `App.test.tsx`: from Assignments, the card's breakdown → Detail →
    "Plan work for today" → Plan today with the new step chosen.
- **Browser check** (320 px, 8 checks): N6 with no steps; ← Back
  closing the add form, discarding what was typed; "Plan work for today"
  appearing after the first step; R1; the edit form; with nothing open,
  Back leaving; "Plan work for today" → Plan with the step chosen.

### Changes planned before building (kept for reference)

- **`AssignmentDetailPage.tsx`:**
  - hide "Plan work for today" when `workItems.length === 0`;
  - remove the sheet, `choosingHowToPlan`, and the `"plan"` breakdown
    source (a breakdown confirms to Detail, or to Plan when opened from
    Plan);
  - ← Back calls a new `handleBack` that closes whatever is open first
    (adding, editing, confirmingDelete, and the step being edited if R1
    is accepted).
- **Delete `AssignmentDetailPlanSheet.tsx`.**
- **`AssignmentDetailSteps.tsx`,** only if R1 is accepted: lift
  `editingStepId` so the page can close it (or accept a "close" signal).
- **`App.tsx`:** `handlePlanBrokenDown` stays for the from-Plan case. Its
  "not from Plan → today" branch is no longer reached from Assignment
  Detail, and could be simplified.
- **Tests:**
  - replace the sheet tests with "no Plan work for today without steps"
    and "appears after the first step";
  - the App test for the sheet's breakdown path becomes "card breakdown
    → Detail → Plan work for today";
  - new ← Back tests for each open form.
- **Docs:** the decision record's revision, and the Roadmap.

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
   - Buttons (N5): **Break this down** (secondary), then **Add the first
     step** and **Plan it as one piece** (ghost), for every size. None is
     solid.
     - **Add the first step:** the inline add form. The student names the
       step and its time, and stays on Assignment Detail.
     - **Plan it as one piece:** one step the size of the whole
       assignment, then Plan's Select with it chosen (on Plan's day if
       opened from Plan, otherwise today).
   - The separate "This one is fairly big…" card and the "Yes, help me
     start" label are removed.
2. ~~**"Plan work for today" stays the only solid main button**, at the
   bottom, in every state.~~ *Replaced by N6:* it appears only once
   there's a step; with none, there's no solid button.
3. **With steps:** unchanged. Plan's Select opens with the steps that
   still need time chosen.
4. *(Replaced by N6: removed.)* ~~**With no steps**, it opens a sheet (`ResponsiveSheet`) titled "How
   do you want to plan this?", with:
   - **Break it into steps first:** the breakdown flow (with the
     understanding prompt). On confirm, Plan's Select opens with the new
     steps chosen (N3). If cancelled, the student returns to Assignment
     Detail with nothing changed.
   - **Plan it as one piece:** exactly as today. One step, then Plan's
     Select with it chosen.
   - For a big assignment (`suggestBreakdown`), "Break it into steps
     first" is listed first and styled as the main choice. Otherwise the
     two are equal.~~
5. ~~**"Plan it as one piece" leaves the card.**~~ *Reversed by N5:* it's
   on the card (requirement 1) **and** in "Plan work for today"'s sheet
   (requirement 4). Both use the label "Plan it as one piece" and do the
   same thing.
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
- At most one solid (`bg-primary`) button on the screen: "Plan work for
  today" with steps, none without (N6).

## Acceptance Criteria

- A big assignment with no steps shows **one** box: "No steps yet.",
  the "fairly big" hint, **Break this down**, **Add the first step** and
  **Plan it as one piece** (N5), and no "Yes, help me start".
- The card's **Add the first step** opens the add form. The card's
  **Plan it as one piece** → Plan's Select with that one step chosen.
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
  - the card's three buttons and labels at both sizes (N5), and the
    card's "Plan it as one piece" path.
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

**Revision N5 (built 2026-09-26):**
- **The card's buttons:** Break this down (secondary), Add the first
  step (ghost), and Plan it as one piece (ghost; "Planning…" while it
  works), for every size. The sheet is unchanged.
- **Tests:**
  - `AssignmentDetailPage.test.tsx`: the three buttons at both sizes,
    with the one-piece button quiet, and the card's "Plan it as one
    piece" → `onPlanPick`, with no sheet;
  - renamed label assertions;
  - `App.test.tsx`: opened from Plan, the card's "Plan it as one piece"
    returns to Plan's Tuesday with the step chosen, while the
    from-Assignments test still goes through the sheet.
- **Browser check** (320 px): the card shows the three buttons in
  order; "Plan work for today" is still the only solid button; the
  card's "Plan it as one piece" → Plan today with the step chosen.

