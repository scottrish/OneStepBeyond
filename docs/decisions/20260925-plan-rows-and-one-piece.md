# Breakdown choices live on Assignment Detail; Plan lists every assignment

Date: 2026-09-25

## Context

`daily-planning-and-completion-v2-proposal.md` items 3, 4, 5 and 6a
(roadmap Phase 7 steps 6, 7 and 8) follow the prototype in three linked
changes:

- Plan's Select step lists assignments it used to hide: ones with no
  steps, and ones whose steps are all done.
- "Plan it as one piece" moves from Plan to Assignment Detail.
- Completing an assignment ends with a reminder to mark it turned in at
  school.

The product owner confirmed the approach (P3–P6) and two build details
(R1, R2) on 2026-09-25.

## Decision

1. **Select's rows** (`rankSelectRows`): open steps to choose; a
   **"No steps yet"** row per unbroken assignment, which opens Assignment
   Detail; and an **"All steps done"** row per assignment whose steps are
   all done but which is still open. That row expands to "Every step here
   is done. Is the whole assignment finished?" with Mark it complete / Add
   another step. One pure rule, `isAssignmentFinishable`, decides the
   last case for Plan and Detail (and later Today Execution).
2. **Assignment Detail is the one place for breakdown choices.** This
   supersedes the *placement* in `20260816-plan-directly-without-breakdown.md`;
   the capability itself is unchanged. Plan's `BreakdownNotice` and its
   "Plan … as one task instead" button are removed. Detail offers Break
   this down, Just add a step, and **Plan it as one piece** in its
   "No steps yet" state, for any assignment with zero steps. Its nudge
   card (over 45 minutes) offers Yes, help me start plus the same two
   extra actions. Plan it as one piece makes one step named after the
   assignment and opens Plan's Select with that step chosen (the `pick`
   target from `20260925-plan-target.md`).
3. **R2 — no duplicate buttons.** When the nudge card shows, "No steps
   yet" shows only its text. The prototype repeats all three buttons
   there.
4. **P6 — Home's "Break it down" opens Assignment Detail.** This
   reverses `home-dashboard-followthrough.md` §2, which sent it to Plan
   because Plan used to offer both choices.
5. **Completing, by any path, ends with the turned-in reminder**
   (`TurnedInReminder`, full screen, one Got it button). **P3 / R1:** if
   the assignment had steps, the reflection prompt comes first
   (`manual-work-breakdown-reflection-v0.1.md` §9's trigger, wherever it
   happens). So: Detail's two complete buttons, and Plan's "All steps
   done" row, each go complete → reflection (if it had steps) → reminder →
   back.
6. **Where "back" goes.**
   - On Detail, Got it closes Detail, revealing whichever screen opened it
     (Home, Assignments, or Plan on the same day).
   - Detail knows whether it was opened from Plan (`assignmentOpenedFromPlan`
     in App.tsx, set by Plan's wizard and Look Ahead). If so, a confirmed
     breakdown returns to Plan's Select for that day, and Plan it as one
     piece lands on that day. Otherwise Plan it as one piece lands on
     today, and a confirmed breakdown stays on Detail as before.
   - No URL routing is needed.
7. **P4 / step 8 — Select shows every row**, with no three-candidate cap
   or "Show more". This replaces `daily-planning.md`'s criterion "Select
   never shows more than three candidates without an explicit 'show more'
   action." The new rows, and a targeted assignment's pre-selection,
   could otherwise be hidden.

## Alternatives considered

- **Keep Plan's breakdown prompt alongside the new rows.** An unbroken
  assignment would appear twice, with two sets of choices.
- **Ship the rows (step 6) before the move (step 7), or the other way
  round.** Either order leaves an unbroken assignment shown twice or not
  at all in between (P5).
- **Reminder before reflection.** Its heading, "One last thing", makes
  it the natural last screen.

## Consequences

- Planning an unbroken assignment "as one piece" from Plan takes one
  more tap: the row, then Detail's button. The pick target lands the
  student straight back on Select with it chosen.
- Completing an assignment with steps now shows two full screens in a
  row. Worth watching in the next persona assessment.
- Today Execution's own "is the whole assignment finished?" check
  (`execution-coaching-v0.1.md`, roadmap step 12) should reuse
  `isAssignmentFinishable` and `TurnedInReminder`.

---

*Update 2026-09-26:* R2 is superseded by
`20260926-assignment-detail-no-steps.md`. There's now one "No steps yet"
card (Break this down, Just add a step), and "Plan it as one piece" is
offered from "Plan work for today" when there are no steps.
