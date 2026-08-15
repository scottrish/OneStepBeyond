# Synthetic Persona Assessment Report

**Assessment:** assignment-management-assessment (assignment-management, iteration 1)
**Persona:** Alex Carter — 9th grade student, ADHD, high technical
confidence, no prior experience with this application
**Mission:** evaluate-assignment-management — view, edit, complete, and
delete assignments
**Date:** 2026-08-15
**Viewport:** Mobile (390×844), Chromium

## Executive Summary

Alex completed every part of the mission: found the assignments list,
opened an assignment and edited its due date, marked a different one
fully complete, and deleted a third. Three of the four core actions
(viewing, editing, completing) worked cleanly with clear, immediate
confirmation. One real navigation dead end was discovered along the way —
the bottom-nav "Home" tab does nothing while nested in Assignment Detail
— and two more subtle points of friction turned up around deleting
(instant, no undo) and the "Remaining" time figure changing in a way
that isn't explained on screen.

## Overall Impression

Mostly confident and fast, with two dips: a genuine "am I stuck?" moment
navigating back to Home, and a "wait, where did my time estimate go?"
moment after adding a single step. Neither stopped the mission, but both
are the kind of friction that erodes trust in a tool this persona is
already inclined to abandon under stress.

## Initial Mental Model

Alex checked the "Assignments" tab first, before adding anything —
correctly guessing that's where a list of homework would live, even
before there was anything in it.

## Workflow Narrative

See `transcript.md` for the full in-character walkthrough. Summary:
Assignments tab (empty) → Home → add 3 courses → capture "Worksheet 12" →
tap bottom-nav "Home" (no-op) → use "← Back" instead → capture "Cell
structure reading" and "Essay outline" the same way → Assignments tab
(now works, shows all three) → open "Worksheet 12," edit its due date →
open "Cell structure reading," mark it complete → back to list, see it
under "Finished" → delete "Essay outline" (instant) → add a step to
"Worksheet 12" and notice "Remaining" drops unexpectedly.

## Working Memory Evolution

| Stage | Alex believes |
|---|---|
| Checking Assignments first | "This is probably where my homework list lives." |
| After capturing assignment 1, landing on Detail | "Good, that's exactly what I entered." |
| Tapping bottom-nav "Home" from Detail | "Wait, did that not work? Am I stuck here?" |
| Using "← Back" instead | "OK that worked — I'll just use this arrow from now on." |
| Opening the real Assignments list | "This is exactly what I wanted to see." |
| After editing the due date | "That saved right away, no doubt." |
| After marking one complete | "Clearly done — moved out of the way, crossed out." |
| After deleting one | "That was fast... maybe too fast. No way to undo that." |
| After adding one step | "Wait, where did the rest of my time estimate go?" |

## Confidence Timeline

High → **dips to moderate** (Home tab no-op) → recovers to high (Back
button works, list/edit/complete all clear) → **dips to moderate again**
(instant delete with no undo, then the step-shrinks-remaining surprise) →
ends moderate.

## Positive Observations

- The Assignments list shows exactly what's needed per item — course,
  due date, title, remaining time — with no progress bar for
  unstructured assignments, matching the spec's "no false precision"
  rule (FINDING-AM-002).
- Inline editing gave immediate, visible confirmation with no doubt about
  whether it saved (FINDING-AM-003).
- "Mark assignment complete" was completely unambiguous — button
  replaced by "Completed," item visibly moved to a "Finished" section
  (FINDING-AM-004).

## Sources of Confusion

- The bottom-nav "Home" tab appearing active while the screen stayed on
  Assignment Detail — a real dead end avoided only because Alex tried the
  in-page Back button instead (FINDING-AM-001).
- "Remaining" dropping from 45m to 15m after adding a single 15m step,
  with nothing on screen explaining that the number now only reflects
  itemized steps rather than the assignment's original estimate
  (FINDING-AM-006).

## Incorrect Assumptions

- Alex assumed the bottom "Home" tab would always take him to Home from
  anywhere in the app, since that's how tab bars normally behave. It
  didn't, from this one specific state.
- Alex assumed the "Remaining" figure represented "what's left of the
  whole assignment" at all times; it silently narrowed to "what's left of
  the steps I've itemized so far" the moment a first step was added.

## Findings Summary

Seven findings in `findings.yaml`: one implementation defect
(FINDING-AM-001, the Home-tab dead end), two UX-improvement findings
(FINDING-AM-005 instant delete with no undo, FINDING-AM-006 the
remaining-time surprise), one specification gap already expected and
deferred (FINDING-AM-007, the confirm-before-delete path is unreachable
until per-step completion ships in a later feature), and three positive/
preserved-behaviour findings (list clarity, edit confirmation, complete
confirmation).

## Persona Feedback (in Alex's words)

"Most of it made sense — I could see my homework, tap in and change
something, and mark stuff done without wondering if it actually worked.
But tapping Home and having nothing happen freaked me out for a second,
and deleting something with zero warning is a little scary for someone
like me who taps fast. And I still don't really get why adding one step
made the time estimate shrink like that — did it forget about the rest
of the worksheet?"

## Evaluator Observations

FINDING-AM-001 is a genuine bug, not a spec gap — the root cause is that
`HomePage`'s internal navigation state isn't reset when the parent tab
changes away and back to "home," so the tab bar and the visible screen
can disagree about where the user is. This is a real dead end for anyone
who relies on the tab bar rather than discovering the in-page Back
button, and it's easy to hit — it happens on the very first assignment
anyone ever captures. FINDING-AM-005 and FINDING-AM-006 are both
spec-compliant behavior that still reads as risky/confusing to this
specific persona; neither requires a spec change, but both are cheap to
soften (an undo toast; a small note distinguishing "assignment estimate"
from "itemized so far"). FINDING-AM-007 is expected and already
scoped — same shape as FINDING-AC-005 from the prior feature's
assessment.

## Recommendations

- Fix FINDING-AM-001 before this feature is considered stable — it's a
  real dead end reachable on the most common path through the app (Home →
  "+" → capture → try to navigate away). This alone meets the iterative
  process's deterministic continue rule (implementation_defect at high
  severity).
- Consider a lightweight "Assignment deleted — Undo" affordance for
  FINDING-AM-005, given this persona's documented impulsiveness.
- Consider a short on-screen cue for FINDING-AM-006 when "Remaining"
  reflects itemized steps rather than the assignment's own estimate (e.g.
  distinguishing the two numbers rather than replacing one with the
  other).
- FINDING-AM-007 needs no action now; revisit once the Today-execution/
  Planning feature ships per-step completion.

## Human Validation

Recommend a human confirm FINDING-AM-001 firsthand (it's a one-tap
repro: capture any assignment from Home, then tap the bottom-nav Home
tab) before the next iteration's fix is considered verified.

## Evidence Summary

- `screenshots/i01-01-home-initial.png` — Home before any action.
- `screenshots/i01-02-assignments-empty.png` — Assignments tab checked
  first, before any data exists.
- `screenshots/i01-03-home-tab-noop.png` — bottom-nav Home tap while
  nested in Assignment Detail; no navigation occurred.
- `screenshots/i01-04-assignments-list.png` — full list of three sample
  assignments.
- `screenshots/i01-05-assignment-completed.png` — Detail screen right
  after "Mark assignment complete."
- `screenshots/i01-06-after-delete.png` — list immediately after an
  instant, unconfirmed delete.
- `screenshots/i01-07-step-shrinks-remaining.png` — "Remaining" dropped
  to 15m after adding one step; step checkbox visibly disabled.
- `transcript.md` — full in-character walkthrough.
- No console errors or alert dialogs observed this run.

```yaml
summary:
  assessment:
    id: assignment-management-assessment
    feature: assignment-management
    persona: student-alex-carter
  outcome:
    status: completed-with-friction
    completion: true
    final_confidence: moderate
  findings:
    total: 7
    issues: 4
    positives: 3
    hypotheses: 0
  recommendations:
    implementation_defects: 1
    specification_gaps: 1
    ux_improvements: 2
    validation_items: 0
    preserved_behaviour: 3
  highest_severity: high
  supporting_findings:
    implementation_defects:
      - FINDING-AM-001
    specification_gaps:
      - FINDING-AM-007
    ux_improvements:
      - FINDING-AM-005
      - FINDING-AM-006
    preserved_behaviour:
      - FINDING-AM-002
      - FINDING-AM-003
      - FINDING-AM-004
```
