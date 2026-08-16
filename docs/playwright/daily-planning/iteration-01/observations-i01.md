# Observations — Daily Planning, Iteration 1

Persona: Alex Carter (`synthetic/personas/student-alex-carter.yaml`)
Mission: `synthetic/missions/evaluate-daily-planning.yaml`
Full findings: `findings.yaml` · Full report: `report.md` · Full transcript: `transcript.md`

Note: an earlier run of this assessment was invalidated by a dev-server
port collision (it tested an unrelated, unbuilt "coming soon" placeholder
on port 5173 rather than this worktree's real implementation on port
5174). The observations below are from the corrected re-run only, which
verified it was looking at the real implementation before proceeding.

---

## FINDING-DP-002 — Daily Planning dead-ends on any assignment without pre-existing steps (high, specification_gap)

**What the persona was attempting:** Selecting Monday in the Plan wizard
and moving to Step 2 ("What should you work on?") to pick from his open
assignments (Cell structure reading, Essay draft — both due imminently).

**What was observed:** Step 2 showed "Nothing to plan yet. Break an
assignment into steps first, then come back." — a dead end with no path
forward inside Plan itself. Alex had to leave Plan, open each assignment
from the Assignments tab, and complete a separate 4-screen "Break this
down" wizard (list pieces → estimate each piece's time → confirm) for
both assignments — roughly 15 additional taps — before Plan's Step 2
would show anything selectable.

**Why it matters:** The mission's central premise is landing on a real
plan "fast" without "puzzling it out" — under five minutes per the
feature's own acceptance criterion. A first-time user with two open,
undecomposed assignments cannot reach a plan in anything close to five
minutes, and nothing in the Day step (Step 1) or the entry to Plan warns
that decomposition is a prerequisite. Alex's own reaction: "I just wanted
it to tell me what to do. Instead it sent me back to go do homework on
the homework before I could even start the homework."

**Evidence:** `screenshots/i01-04-plan-step2-nothing-to-plan-dead-end.png`,
`i01-05-assignment-detail-no-steps.png`, `i01-06-break-down-flow-start.png`,
`i01-11-essay-breakdown-two-pieces.png`

**Suggested improvement:** Either let Plan's Select step schedule
undecomposed assignments directly (using their own estimate, the way the
prototype's derive.ts treats an assignment with no work items — see
`remainingMinutes()`'s existing fallback), or surface the
decomposition requirement earlier and more actionably — e.g. Step 1 or
Step 2 showing "2 assignments need to be broken into steps before you can
plan them" with a direct link into that flow and a way back into Plan
afterward, rather than a flat dead end discovered only by hitting it.

---

## FINDING-DP-006 — Home shows no trace of a just-confirmed plan (medium, specification_gap)

**What the persona was attempting:** After confirming Monday's plan,
checking Home — the tab he'd naturally land on next — to see the plan
reflected there.

**What was observed:** Home was unchanged from before planning: page
heading, "New assignment"/"Settings" buttons, and a login-status line.
No reference to the confirmed plan, next step, or any sign planning had
happened.

**Why it matters:** This sits just outside Daily Planning's own scope
(Home's content belongs to a different feature), but it's a real gap in
the persona's actual experience: he did the work of planning and got no
payoff for it on the screen he'd check next. "I'd want it staring at me
the second I open the app, not buried a tab away."

**Evidence:** `screenshots/i01-18-plan-confirmed.png`

**Suggested improvement:** Out of this feature's direct scope to fix
(Home's content), but worth flagging for a future increment — Home
surfacing "today's plan" once one exists would close the loop the persona
is explicitly asking for.

---

## FINDING-DP-007 — Plan wizard silently discards day/step selection on tab navigation (medium, implementation_defect)

**What the persona was attempting:** With Monday selected in Plan,
navigating to Assignments to complete the required breakdown (see
FINDING-DP-002), then returning to Plan to continue.

**What was observed:** Plan had reverted to "Today" (Sunday — no
football, no due items) at Step 1. "Mon" had to be re-selected from
scratch. Happened twice in the session, once directly interrupting the
exact recovery path the app itself had just sent the persona on.

**Why it matters:** Combined with FINDING-DP-002, this compounds the
friction: the app sends the user away to fix a prerequisite, then forgets
where they were when they come back. "It sent me to go fix my
assignments, and when I came back it forgot what day I was even looking
at."

**Evidence:** `screenshots/i01-01-plan-tab-today-sunday.png`

**Suggested improvement:** Persist the wizard's selected day (and ideally
step) across tab navigation within a session, at least until the plan is
confirmed or explicitly abandoned.

---

## FINDING-DP-001 — Session started on Login instead of pre-authenticated (low, validation_item)

Assessment infrastructure note, not a product finding: the browser
session was expected to start authenticated (per the assessment's
`starting_point`) but landed on Login instead. Signing in manually with
the supplied test credentials worked on the first attempt. Likely an
artifact of this run's storage-state regeneration timing rather than a
product defect — flagged for the record, not actionable against the
feature itself.

**Evidence:** `screenshots/i01-01-plan-tab-today-sunday.png`

---

## FINDING-DP-008 — Step completion checkbox present but disabled (low, specification_gap)

Assignment detail's step list shows a completion checkbox that's
disabled, with no other visible way to mark a step done on the screens
this mission touched. Plausibly out of scope (Today Execution, a later
Phase 4 feature, likely owns step completion) — flagged as low-confidence
since the persona didn't need to explore further to complete the mission.

**Evidence:** `screenshots/i01-10-cell-structure-steps-added.png`

---

## Positive observations (informational, preserved_behaviour)

- **FINDING-DP-010** — Plan is immediately discoverable as the second of
  three bottom-nav tabs; no hunting required.
- **FINDING-DP-003** — Football practice is correctly treated as fixed
  time: Step 1's capacity phrase and Step 4's suggested slots both
  correctly exclude and build around it.
- **FINDING-DP-004** — Over-capacity selection is communicated calmly
  ("This is 15m more than you have that day. That is worth knowing now
  rather than at 10pm.") without blocking progress or alarming styling.
- **FINDING-DP-005** — A confirmed plan is durably persisted; revisiting
  the day shows it under "Already planned" with working remove controls.
- **FINDING-DP-011** — The full wizard and breakdown flow rendered
  cleanly at a 390×844 mobile viewport with no overflow or truncation
  observed (visual check only, not a measured contrast/hit-box audit).

---

## Summary

11 findings: 1 high (specification_gap), 1 medium implementation_defect,
1 medium specification_gap, 2 low (specification_gap, validation_item),
5 informational positives, 1 informational validation note. Mission
outcome: **completed** — Alex reached a real, persisted plan for Monday —
but only after an unplanned detour through a prerequisite flow the wizard
itself didn't explain, which is the single substantive issue driving the
next iteration.
