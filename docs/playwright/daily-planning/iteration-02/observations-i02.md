# Observations — Daily Planning, Iteration 2

Persona: Alex Carter (`synthetic/personas/student-alex-carter.yaml`)
Mission: `synthetic/missions/evaluate-daily-planning.yaml`
Full findings: `findings.yaml` · Full report: `report.md` · Full transcript: `transcript.md`

This run reused the test account's existing seed data and prior progress
from iteration 1 (football practice, courses, four assignments, two
already-broken-down assignments, a previously-confirmed Monday plan) and
specifically re-tested Tuesday (Worksheet 15 — due that day, not yet
broken down) to directly re-exercise iteration 1's two open problems.

---

## FINDING-DP-001 — Breakdown-needed assignments are now silently omitted, not signaled (high, implementation_defect)

**What the persona was attempting:** Planning Tuesday, whose only due
item (Worksheet 15) had no Work Items yet — deliberately chosen to
re-test iteration 1's dead-end problem (FR-1 from
`daily-planning.i02.md`).

**What was observed:** Unlike iteration 1's explicit "Nothing to plan
yet — break an assignment into steps first" message, Step 2 simply
listed three *other* items (belonging to assignments due the following
day) and never mentioned Worksheet 15 at all. No text anywhere on Step 1
or Step 2 explained the omission. Alex had to leave Plan, open Worksheet
15 from Assignments, and notice its Steps section was empty to work out
why. The identical pattern recurred on Thursday for "Reading response —
Chapter 10."

**Root cause (verified in code, not just observed by the persona):**
`PlanPage.tsx`'s FR-1 signal only fires when `candidates.length === 0`
(i.e. *every* candidate for the day needs breakdown) — both the Day
step's early notice and Select's dead-end replacement are gated on that
same all-or-nothing condition. When some assignments already have Work
Items and others don't (exactly Tuesday's case: two pre-broken-down
assignments from iteration 1's data existed, so `candidates` was
non-empty even though Worksheet 15 itself had none), neither notice
appears — Worksheet 15 is just missing with zero explanation. This is a
narrower implementation of FR-1 than the requirement called for ("name
which assignment(s) still need breaking down" — not just "when nothing
at all is plannable").

**Why it matters:** This is arguably a regression in perceived quality
even though iteration 1's exact all-empty case is now fixed: an explicit
"you need to do X first" dead end, while itself a problem, is more
legible than an assignment silently vanishing from a list the student
expects to be complete. Alex's reaction: "Wait, where's my worksheet?
...Did I already do it? Is the app broken?"

**Evidence:** `screenshots/i02-06-plan-tuesday-overview.png`,
`i02-07-plan-step2-worksheet15-missing.png`,
`i02-08-worksheet15-detail-no-steps.png`,
`i02-22-plan-thursday-worksheet-reappears-and-response-missing.png`

**Suggested improvement:** Extend FR-1's existing signal to the mixed
case — change the gating condition from "no candidates at all" to "any
of today's due/relevant assignments lack Work Items," and surface the
same named-assignment-plus-breakdown-link treatment regardless of
whether other, already-broken-down assignments are also present.

---

## FINDING-DP-002 — Tab-navigation state loss is fixed (informational, preserved_behaviour — direct re-test of iteration 1's FINDING-DP-007)

Leaving Plan mid-flow (Tuesday, Step 2) to complete the Worksheet 15
breakdown via FR-1's own routing, then returning to Plan, landed exactly
back on Tuesday/Step 2 with the newly-created step now visible — no
re-selection of the day required. This directly confirms FR-2 from
`daily-planning.i02.md` is working as intended.

**Evidence:** `screenshots/i02-13-plan-step2-state-preserved-show-more.png`

---

## FINDING-DP-003 — A step already confirmed for one day can be selected again for another, with no warning (medium, implementation_defect)

After confirming "Do the worksheet" for Tuesday, switching to Thursday
and expanding "Show more assignments" showed that same already-committed
step as an ordinary, freely selectable option — no badge, disabled
state, or warning that it was already scheduled elsewhere. The
evaluator reversed the selection manually before advancing, so no actual
double-booking was written during the assessment, but nothing in the UI
would have stopped it.

**Evidence:** `screenshots/i02-22-plan-thursday-worksheet-reappears-and-response-missing.png`

**Suggested improvement:** Exclude (or visibly flag) work items that
already have a planned/in-progress/done session on another date from the
candidate list, or surface an explicit warning if one is selected again.

---

## FINDING-DP-012 — "Show more" buries the item actually due on the selected day (low, ux_improvement)

On both Tuesday and Thursday, the default (collapsed) top-3 candidate
list showed items belonging to assignments due the day *after* the real
system "Today," rather than the item due on the day actually being
planned — the relevant item only appeared after tapping "Show more
assignments" (and, for Worksheet 15, only once it existed at all). This
suggests candidate ranking may not be accounting for the *selected plan
day* when ordering by due-date proximity.

**Evidence:** `screenshots/i02-13-plan-step2-state-preserved-show-more.png`,
`i02-14-plan-step2-worksheet15-appears.png`

---

## Recurring, unchanged from iteration 1 (not new)

- **FINDING-DP-006 / iter-1 FINDING-DP-006** — Home still shows no trace
  of a confirmed plan. Unchanged; still out of scope for this feature.
- **FINDING-DP-008 / iter-1 FINDING-DP-008** — disabled step-completion
  checkbox, still present, still low-confidence/plausibly out of scope
  (Today Execution).
- **FINDING-DP-009 / iter-1 FINDING-DP-009** — system "Today" still lands
  on a football-free Sunday; handled the same way (day-selector stand-in)
  as iteration 1, environment artifact not a product issue.

## Positive observations (informational, preserved_behaviour)

- **FINDING-DP-004** — Football practice still correctly excluded from
  capacity on both re-tested days.
- **FINDING-DP-005** — Confirmed plans (both this iteration's Tuesday
  plan and iteration 1's surviving Monday plan) are durably persisted and
  correctly re-displayed.
- **FINDING-DP-007** — The core wizard mechanics remain fast and
  low-stakes once a plannable item exists — well under five minutes for
  a light day.
- **FINDING-DP-010 / FINDING-DP-011** — Plan remains trivially
  discoverable and renders cleanly at 390×844 throughout, including the
  new breakdown-signal UI.

---

## Summary

12 findings: 1 high (implementation_defect — FR-1's mixed-case gap), 2
medium (1 implementation_defect — double-booking risk, 1
specification_gap — Home silence, unchanged from iter 1), 2 low (1
specification_gap, 1 ux_improvement), 7 informational (6 positives, 1
environment note). Mission outcome: **completed with friction** — FR-2
(state persistence) is confirmed fixed; FR-1 (breakdown signaling) is
only partially fixed, now failing silently rather than with an explicit
message, in the specific case where some but not all of a day's
candidates need breakdown. This partial fix, plus the newly-surfaced
double-booking gap, are the substantive findings driving the iteration-3
decision.
