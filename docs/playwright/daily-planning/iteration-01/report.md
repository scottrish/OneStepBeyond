# Synthetic Persona Assessment Report

**Assessment:** daily-planning-assessment (code: DP)
**Persona:** Alex Carter (student-alex-carter)
**Mission:** evaluate-daily-planning — decide what to actually work on today, around a real schedule
**Date:** 2026-08-16
**Viewport:** mobile (390x844)
**Server under test:** http://localhost:5174/

> **Methodology note:** a prior run of this assessment was invalidated by a
> dev-server port collision (it tested port 5173, an unrelated unbuilt app)
> and its outputs have been fully replaced by this corrected re-run against
> port 5174, this worktree's real implementation.

---

## Executive summary

Alex reached a confirmed, persisted plan for Monday (2h10m of scheduled
work across two assignments) that correctly accounted for football
practice and honestly surfaced that he was slightly over capacity — the
core mechanics work and are trustworthy. But getting there required a
detour he didn't expect: Daily Planning refuses to schedule any assignment
that hasn't already been manually broken into steps, and discovering that
requirement only happens by hitting a dead end inside the planning flow
itself. For a persona with low patience and a five-minute budget, that
detour is the single biggest problem found.

## Overall impression

Once the pieces were in place, the actual 5-step Plan wizard was genuinely
good: it knew about football, it did the arithmetic, it was calm about
being over budget, and it produced a plan that was still there when Alex
came back to check. That's the experience the mission was hoping to find.
The problem is everything had to be in place first, and the app doesn't
say so until you've already committed to the flow and hit a wall.

## Initial mental model

Landing (unexpectedly) on a login screen, Alex assumed this was just
normal phone-app behavior — mildly odd but not alarming — and signed in
without much thought. Home read as bare: a heading, "New assignment" and
"Settings" buttons, and a one-line "you are logged in as..." message, with
no indication of the football schedule, courses, or assignments known to
already exist. The bottom nav (Home / Plan / Assignments) was immediately
legible, and "Plan" read exactly as "this is where I find out what to do
today."

## Workflow narrative

1. Verified port 5174 shows the real app (a working 5-step Plan wizard,
   not the "coming soon" placeholder) before doing anything else.
2. Confirmed the seeded data (football practice Mon–Fri 3:30–5:30 PM;
   Biology/Algebra I/English Literature; four assignments) was already
   present on Assignments and in Settings → Activities — did not re-add
   any of it.
3. The app's own "Today" was Sunday (no football, no due work), which
   doesn't match the mission's weekday framing. Used Plan's day-selector
   to plan for "Mon" instead — the next real school day, with football and
   two assignments due — playing this as Alex getting ahead on a Sunday
   night.
4. Plan Step 1 for Monday correctly listed the two items due, showed
   football practice as a fixed block, and computed "about 2h of study
   time" remaining.
5. Step 2 hit a dead end: "Nothing to plan yet. Break an assignment into
   steps first, then come back." Neither assignment had been broken into
   steps yet, and Plan offers no way to do that inline.
6. Left Plan, opened each assignment from Assignments, and ran "Break this
   down" for both — a separate 4-screen mini-wizard each time (list
   pieces → estimate each piece → confirm). Roughly 15 extra taps/screens
   across the two assignments.
7. Returned to Plan. The wizard had silently reset to "Today"/Step 1,
   losing the earlier "Mon" selection — had to reselect it.
8. Step 2 now listed all three step-items and let Alex select all of them
   (2h15m against ~2h available, deliberately testing over-capacity).
9. Step 3 showed the total, a plain-language over-capacity note ("This is
   15m more than you have that day. That is worth knowing now rather than
   at 10pm."), and working +/- adjusters per step. Nudged one step down by
   5m and moved on with the plan still 10m over — no blocking occurred at
   any point.
10. Step 4 offered sensible sequential suggested start times, all
    anchored after football practice, each editable via a custom time
    field.
11. Step 5 reviewed the full numbered plan and totals; confirming produced
    "Plan confirmed. 2h 10m planned for Monday."
12. Home did not reflect the new plan at all after confirming.
13. Re-opening Plan and reselecting "Mon" showed the confirmed steps under
    a new "Already planned" section with remove controls, confirming the
    plan had actually persisted.

## Working memory evolution

- **Start:** "This is probably where I add my stuff and then it tells me
  what to do." (unconfirmed)
- **After Step 1 (Monday):** "Okay, it already knows about practice — good
  sign." (confidence rising)
- **After the Step 2 dead end:** "Wait, it wants me to go do work on the
  homework before it'll even show me the homework? That's backwards."
  (confidence dropping)
- **After completing both breakdowns and returning:** "Fine, it works now,
  but that was a lot of extra stuff before I got anywhere."
  (confidence partially recovering)
- **After the over-capacity message:** "That's actually chill about it,
  not stressing me out." (confidence rising)
- **After confirming and verifying persistence:** "Okay, this really did
  save. I trust it." (confidence settled, moderate overall)
- **Back on Home:** "...but none of this shows up here? I'd have to
  remember to go check Plan again." (confidence tempered)

## Confidence timeline

Low → rising (Step 1 football-awareness) → dropping sharply (Step 2 dead
end) → recovering slowly through the breakdown detour → rising again
(over-capacity handling, suggested times) → high at confirmation → settled
at **moderate** once Home's silence on the plan was noticed.

## Positive observations

- Plan is trivially discoverable in the persistent bottom nav.
- Plan Step 1 correctly excludes football practice from available study
  time and displays it explicitly — the app "already knows."
- Over-capacity is communicated with a calm, specific, non-blocking
  message, with live +/- adjusters that make changing an estimate feel
  optional rather than a test.
- Suggested time slots in Step 4 are sensible (sequential, anchored after
  football) and editable.
- Confirming a plan is a real commit: it's retrievable later under
  "Already planned" with remove controls, not just a toast that vanishes.
- The wizard and breakdown flow both rendered cleanly at 390x844 with no
  horizontal scrolling or cut-off controls.

## Sources of confusion

- Whether "Today" being Sunday (no football, 8h30m free) was the actual
  intended test day, versus needing to pick a weekday manually.
- Why Plan's Step 2 offered nothing at all for two assignments that
  clearly existed and were clearly due the next day — no in-flow
  explanation of *why* until reading the fine print ("break an assignment
  into steps first").
- Whether the disabled step-completion checkbox on assignment detail meant
  completion happens elsewhere, or wasn't wired up yet.

## Incorrect assumptions

- Assumed tapping "Continue" from Step 1 would show something to schedule
  immediately, since the assignments already existed with time estimates
  ("About 45m left," "About 1.5h left"). It turned out those top-level
  estimates don't count for Plan — only step-level breakdowns do.
- Assumed the confirmed plan would be visible or referenced from Home,
  since that's the screen the app opens to by default. It wasn't.

## Points of friction

- **Breakdown-before-planning requirement** (FINDING-DP-002): the
  dominant issue. Discovering it requires hitting a dead end inside Plan
  itself, then completing a separate multi-screen flow per assignment
  before returning.
- **Wizard state loss on tab navigation** (FINDING-DP-007): leaving Plan
  to do the required breakdown work, then returning, silently reset the
  day/step selection — directly punishing the exact detour the app itself
  demanded.
- **Home shows nothing** (FINDING-DP-006): before or after planning, Home
  gives no indication of open work or a confirmed plan.
- Landing on a login screen instead of the expected pre-authenticated
  session (FINDING-DP-001) — minor, likely environment-related.

## Findings summary

11 findings total: 1 implementation defect, 3 specification gaps, 2
validation items, 5 preserved-behaviour (positive) observations. Highest
severity: **high** (FINDING-DP-002, the breakdown-before-planning
requirement). Full detail in `findings.yaml`.

## Persona feedback

"Once it actually got going, planning Monday was genuinely fast and it
didn't stress me out about being over on time — I liked that. But getting
it to that point meant it told me 'nothing to plan,' and I had to go
figure out on my own that I needed to break both assignments into pieces
first, in a whole separate flow, twice. If I hadn't already been sitting
there patiently testing this thing, I'd have bailed the second I saw
'nothing to plan yet' and just picked something myself. And now that I
have a plan, it's not even on the screen I open first — I'd have to
remember to go back into Plan to see it again."

## Evaluator observations

- The core Daily Planning mechanics (day-aware capacity math,
  football-awareness, non-blocking over-capacity messaging, editable
  suggested times, persisted confirmation) are all sound and match the
  mission's evaluation focus well.
- The dependency on prior work-breakdown is very likely intentional at the
  domain level (a plan needs steps with estimates to schedule), but the
  *discovery* of that dependency — via a mid-flow dead end rather than any
  upfront signal — is the actual UX problem, independent of whether the
  dependency itself is correct design.
- The wizard's state-loss on navigation (FINDING-DP-007) compounds the
  breakdown-detour problem specifically, since the detour requires leaving
  Plan by definition.
- Home's total silence about the app's own data (open assignments, a
  confirmed plan) is a recurring theme across this and prior assessments
  of this codebase and may be a candidate for a dedicated "what's going on
  today" surface, independent of Daily Planning's own scope.

## Recommendations

(Observations, not proposed UI solutions, per protocol.)

- I expected Plan to tell me *before* I chose a day, or at latest right at
  Step 2, that my assignments needed steps first — not to hit a bare
  "nothing to plan yet" with no path forward from that screen.
- I expected some of that estimate/breakdown work to be offered inline,
  since I'd already given each assignment a top-level time estimate when I
  created it.
- I wasn't confident, until I explicitly went back and checked, that
  confirming a plan actually saved anything — the confirmation screen
  alone didn't feel different from any other "success" message I've seen
  disappear before.
- I couldn't tell why Home never changes regardless of what's in the app —
  not while I had nothing, not after four assignments and a football
  schedule, not even after confirming a real plan for tomorrow.

## Human validation

The following should be confirmed by a human reviewer, since they touch
product intent rather than pure observation:

- Whether requiring steps-before-scheduling is the intended design for
  this increment of Daily Planning, or whether inline/lightweight
  estimation was meant to be available directly from the Plan flow.
- Whether Home is explicitly out of scope for this increment (per YAGNI)
  or was expected to reflect a confirmed plan.
- Whether the Plan wizard's reset-on-navigation (FINDING-DP-007) is a
  known limitation or an unintended defect.

## Evidence summary

19 screenshots captured across the session, referenced individually from
`findings.yaml`; full step-by-step detail in `transcript.md`. All images
are under `screenshots/` alongside this report.

---

## Machine-readable summary

```yaml
summary:
  assessment:
    id: daily-planning-assessment
    feature: daily-planning
    persona: student-alex-carter

  outcome:
    status: completed
    completion: true
    final_confidence: moderate

  findings:
    total: 11
    issues: 4
    positives: 5
    hypotheses: 2

  recommendations:
    implementation_defects: 1
    specification_gaps: 3
    ux_improvements: 0
    validation_items: 2
    preserved_behaviour: 5

  highest_severity: high

  supporting_findings:
    implementation_defects:
      - FINDING-DP-007
    specification_gaps:
      - FINDING-DP-002
      - FINDING-DP-006
      - FINDING-DP-008
    validation_items:
      - FINDING-DP-001
      - FINDING-DP-009
    preserved_behaviour:
      - FINDING-DP-003
      - FINDING-DP-004
      - FINDING-DP-005
      - FINDING-DP-010
      - FINDING-DP-011
```
