# Synthetic Persona Assessment Report

**Assessment:** daily-planning-assessment (code: DP)
**Persona:** Alex Carter (student-alex-carter)
**Mission:** evaluate-daily-planning — decide what to actually work on today, around a real schedule
**Date:** 2026-08-16
**Viewport:** mobile (390x844)
**Server under test:** http://localhost:5174/
**Iteration:** 2 (re-run against a newer build; iteration 1's findings/report/transcript/screenshots have been fully replaced by this run's outputs)

> **Continuity note:** the test account already carried seed data from
> iteration 1 — Football practice (Mon–Fri, 3:30–5:30pm), three courses,
> four assignments, two assignments already broken into steps ("Cell
> structure reading," "Essay draft"), and a previously-confirmed Monday
> plan. None of it was re-added; this run verified it via the UI and
> treated it as Alex's own prior work, exactly as he'd recognize it.

---

## Executive summary

Alex reached a confirmed, persisted plan for Tuesday (30m for "Worksheet
15," scheduled after football) faster and with less confusion than
iteration 1's Monday session — the wizard now survives a tab switch away
and back, which was the single biggest defect found last time. But the
underlying "you must break an assignment into steps before Plan will
consider it" requirement is still in force, and this run's build hides
that requirement even more quietly than before: rather than iteration 1's
explicit "Nothing to plan yet" dead end, Step 2 now simply omits an
un-broken-down assignment from the list with no explanation at all. A
second, new issue also surfaced: a step already confirmed for one day can
be selected again for a different day with no warning that it's already
committed.

## Overall impression

The core mechanics that worked well in iteration 1 still work well:
football-awareness, calm non-blocking messaging, editable suggested times,
and a plan that's genuinely still there when you come back to check. The
navigation-state-loss problem is fixed. But the breakdown-discoverability
problem — arguably the more important of the two iteration-1 issues for a
persona with no patience — has not improved, and in one respect got
harder to self-diagnose: at least iteration 1's dead-end message told Alex
*something* was blocking him. This run's silent omission gave him no signal
at all until he left Plan and inspected the assignment directly.

## Initial mental model

Landed directly on Home, already authenticated (no login screen this
time). Home read exactly as before: a heading, "New assignment" and
"Settings" buttons, a one-line "logged in as..." message, no indication of
football, courses, or assignments. The bottom nav (Home / Plan /
Assignments) was immediately legible. Before trusting the app, Alex
checked Assignments and Settings → Activities to confirm his prior data
was intact — it was, exactly as expected, which read as a good sign before
even reaching Plan.

## Workflow narrative

1. Verified port 5174 shows the real app (working 5-step Plan wizard, day
   picker, "Step N of 5" labels) — not a placeholder.
2. Confirmed all seeded data was present via the UI (four assignments on
   Assignments; football practice Mon–Fri 3:30–5:30pm in Settings →
   Activities) without re-adding anything.
3. Plan's own "Today" was again Sunday, August 16 (no football, nothing
   due) — used the day-selector to reach real weekdays instead, per the
   mission's framing.
4. Checked Monday first: it turned out to already be fully planned from
   iteration 1 (three steps, "about 0m of study time" left) — confirming
   the earlier confirmed plan really did persist across the intervening
   period. Not useful for this run's actual task, so moved on.
5. Selected Tuesday, August 18: "Due: Worksheet 15, Algebra I," football
   practice, "about 2h of study time." Deliberately chosen because
   Worksheet 15 had no step breakdown yet, to re-test iteration 1's
   biggest problem.
6. Step 2 ("What should you work on?") showed three items belonging to
   Monday's two already-broken-down assignments, labeled "Due tomorrow."
   Worksheet 15 — the thing actually due that day — was absent, with no
   message explaining why.
7. Left Plan, opened Worksheet 15 from Assignments, found an empty "Steps"
   section and a "Break this down" button — confirming (by inference, not
   by anything Plan itself said) that missing steps was the reason.
8. Ran "Break this down" — three short screens (list pieces → estimate →
   confirm), added one step ("Do the worksheet," 30m).
9. Returned to Plan via the bottom nav: the wizard was still on Tuesday,
   still Step 2 — state fully preserved, unlike iteration 1. A new "Show
   more assignments" toggle revealed the newly-created step.
10. Selected "Do the worksheet," proceeded through Step 3 (time estimate,
    left at 30m against "about 1.5h still available"), Step 4 (suggested
    time "After football practice · 5:45 PM," accepted), Step 5 (review:
    "Do the worksheet — 5:45 PM · 30m," "30m planned of 2h available") —
    confirmed.
11. "Plan confirmed. 30m planned for Tuesday."
12. Home showed no trace of the plan, same as iteration 1.
13. Re-opened Plan: day selection (Tuesday) carried over; the confirmed
    step appeared under "Already planned" with a working remove control.
14. Checked Thursday out of curiosity: "Reading response — Chapter 10" is
    due that day and also has no steps — same silent-omission pattern.
    "Show more assignments" on Thursday surfaced the already-Tuesday-
    committed "Do the worksheet" step as freely selectable again, with no
    indication it was already scheduled elsewhere. Selected it briefly to
    confirm this, then deselected without confirming (not something Alex
    would actually do).
15. Confirmed via Assignments that no stray duplicate booking was left
    behind from that probe.

## Working memory evolution

- **Start:** "I'm already logged in, my stuff should still be here — let
  me check before I trust Plan." (unconfirmed, neutral)
- **After confirming seed data intact:** "Good, nothing's missing."
  (confidence rising)
- **After Monday turned out already fully planned:** "Oh, it remembered
  that too." (confidence rising)
- **After Step 2 on Tuesday showed nothing for Worksheet 15:** "Wait,
  where's my worksheet? Is this broken?" (confidence dropping sharply)
- **After finding the empty Steps section on Worksheet 15's detail page:**
  "Oh — needs steps first, same as before. It just didn't tell me that
  from Plan." (confidence partially recovering)
- **After returning to Plan and finding Step 2 exactly where left it:**
  "It actually remembered this time." (confidence rising)
- **After confirming Tuesday's plan:** "That part was fast once I had
  something to pick." (confidence high)
- **After Home showed nothing:** "Still nothing here. Didn't expect that
  to change, but still annoying." (confidence tempered)
- **After the Thursday double-booking probe:** "It let me pick something I
  already scheduled somewhere else without saying a word." (confidence
  settled at moderate)

## Confidence timeline

Moderate-high (data verified intact) → high (Monday already planned,
football-aware) → sharp drop (Worksheet 15 silently missing from Step 2)
→ partial recovery (root cause found via Assignments) → high (tab-switch
state preserved, breakdown flow itself fast) → high (fast confirm, calm
review screen) → tempered (Home still silent) → settled at **moderate**
after the Thursday double-booking observation.

## Positive observations

- Plan remains trivially discoverable in the persistent bottom nav, and
  is confirmed as the real 5-step wizard (not a placeholder) before use.
- **The Plan wizard now preserves in-progress day/step selection across a
  tab switch away and back** — iteration 1's highest-severity
  implementation defect (FINDING-DP-007) did not reproduce; leaving Plan
  to break an assignment down and returning landed exactly back on the
  same day and step.
- Football practice is still correctly excluded from available study time
  on every day checked, with suggested times correctly anchored after it.
- A confirmed plan is still durably saved and reappears under "Already
  planned" with a working remove control — including the Monday plan
  confirmed a full iteration ago, still intact.
- Once an assignment has steps, the actual plan-and-confirm flow (pick →
  estimate → time slot → review → confirm) is fast, low-stakes, and
  requires no typing.
- The wizard and breakdown flow both rendered cleanly at 390x844 across
  24 screenshots, no horizontal scrolling or cut-off controls observed.

## Sources of confusion

- Why an assignment clearly due that day (Worksheet 15 on Tuesday, Reading
  response on Thursday) simply wasn't present in Step 2's list, with
  nothing on-screen explaining the omission — this had to be diagnosed by
  leaving Plan and inspecting the assignment directly.
- Why "Show more assignments" surfaced steps belonging to assignments due
  a different day before surfacing (or, for un-broken-down assignments,
  ever surfacing) the step actually relevant to the day being planned.
- Whether selecting an already-Tuesday-scheduled step again on Thursday
  would silently double-book it, since nothing on that screen indicated
  it was already committed elsewhere.

## Incorrect assumptions

- Assumed that if an assignment didn't appear in Step 2, it had already
  been dealt with somehow — the actual reason (no steps yet) required
  independent investigation, since Plan gave no in-flow signal.
- Assumed the disabled step-completion checkbox seen on Cell structure
  reading in iteration 1 might have been fixed by this build; it reproduced
  identically on Worksheet 15's newly-created step.

## Points of friction

- **Silent omission of un-broken-down assignments from Step 2**
  (FINDING-DP-001): the dominant issue this run, and arguably a
  regression in discoverability from iteration 1's explicit (if
  unwelcome) dead-end message — this build gives no signal at all.
- **No warning when re-selecting an already-scheduled step for a
  different day** (FINDING-DP-003): could lead to genuinely double-booking
  the same 30 minutes of work without realizing it.
- **Home still shows nothing** (FINDING-DP-006): unchanged from iteration
  1 — no indication of open work or a confirmed plan on the screen the app
  opens to by default.
- Lower-priority: "Show more assignments" surfaces items due other days
  before the one actually due on the day being planned (FINDING-DP-012);
  the disabled step-completion checkbox persists (FINDING-DP-008).

## Findings summary

12 findings total: 2 implementation defects, 2 specification gaps, 1
UX improvement, 1 validation item, 6 preserved-behaviour (positive)
observations. Highest severity: **high** (FINDING-DP-001, the silent
omission of an un-broken-down assignment from what's plannable). Full
detail in `findings.yaml`.

## Persona feedback

"The part where it remembered I was still on Tuesday after I went to go
fix my worksheet — that's genuinely good, that's what I'd expect. And once
I actually had something to pick, planning was quick, like actually quick.
But it still did the thing where it just doesn't show you the one
assignment you actually need to deal with, and this time it didn't even
tell me why — last time it at least said 'nothing to plan yet.' I had to
go poke around Assignments myself to figure out I needed to break it down
first. And then when I was just looking around on Thursday, it let me pick
the same worksheet I already scheduled for Tuesday like it was brand new —
didn't say a word about it already being spoken for. That's the kind of
thing that'd make me double-check everything it tells me instead of just
trusting it."

## Evaluator observations

- The dependency on prior work-breakdown (an assignment needs steps before
  Plan will schedule it) is unchanged from iteration 1 and is very likely
  intentional at the domain level. What changed is how that dependency is
  surfaced: iteration 1's explicit "Nothing to plan yet" message has been
  replaced by silent list-filtering with no in-flow explanation anywhere
  — a regression in discoverability even though the underlying business
  rule may be correct.
- FINDING-DP-007 from iteration 1 (wizard state lost on tab navigation)
  was directly re-tested with the same interaction pattern that originally
  surfaced it (leave Plan mid-flow to do required breakdown work, then
  return) and did not reproduce. This is a genuine, verified fix.
- The new double-booking gap (FINDING-DP-003) appears to be a consequence
  of the same underlying "what's available to plan" query not excluding
  steps that already have a confirmed schedule entry on another day — a
  related but distinct concern from the missing-assignment issue, both
  pointing at the same area of logic.
- Home's total silence about the app's own data continues across both
  iterations and remains a candidate for a dedicated "what's going on
  today" surface, independent of Daily Planning's own scope.

## Recommendations

(Observations, not proposed UI solutions, per protocol.)

- I expected Plan's Step 2 to say *something* when an assignment due that
  day wasn't shown — even iteration 1's blunt dead-end message did more to
  orient me than this build's complete silence.
- I expected that if a step is already scheduled on a confirmed day, Plan
  wouldn't let me pick it again for another day without at least a "this
  is already scheduled for Tuesday" note.
- I wasn't confident, on first seeing Step 2 for Tuesday, that the app
  hadn't simply lost track of Worksheet 15 — nothing distinguished "this
  isn't ready to schedule yet" from "this doesn't exist to the app."
- I couldn't tell why Home never reflects any of this — not the open
  assignments, not the football schedule, not the plan I just confirmed.

## Human validation

The following should be confirmed by a human reviewer, since they touch
product intent rather than pure observation:

- Whether the silent omission of un-broken-down assignments from Step 2 is
  an intentional simplification (vs. iteration 1's explicit message) or an
  unintended regression in that message's removal.
- Whether allowing the same step to be selected for more than one
  confirmed day is intended flexibility (e.g. deliberately re-planning) or
  a gap that should be prevented or flagged.
- Whether Home is explicitly out of scope for this increment (per YAGNI)
  or was expected to reflect a confirmed plan by this point.

## Evidence summary

24 screenshots captured across the session, referenced individually from
`findings.yaml`; full step-by-step detail in `transcript.md`. All images
are under `synthetic/reports/daily-planning-assessment/screenshots/`.

---

## Machine-readable summary

```yaml
summary:
  assessment:
    id: daily-planning-assessment
    feature: daily-planning
    persona: student-alex-carter

  outcome:
    status: completed-with-friction
    completion: true
    final_confidence: moderate

  findings:
    total: 12
    issues: 4
    positives: 6
    hypotheses: 2

  recommendations:
    implementation_defects: 2
    specification_gaps: 2
    ux_improvements: 1
    validation_items: 1
    preserved_behaviour: 6

  highest_severity: high

  supporting_findings:
    implementation_defects:
      - FINDING-DP-001
      - FINDING-DP-003
    specification_gaps:
      - FINDING-DP-006
      - FINDING-DP-008
    ux_improvements:
      - FINDING-DP-012
    validation_items:
      - FINDING-DP-009
    preserved_behaviour:
      - FINDING-DP-002
      - FINDING-DP-004
      - FINDING-DP-005
      - FINDING-DP-007
      - FINDING-DP-010
      - FINDING-DP-011
```
