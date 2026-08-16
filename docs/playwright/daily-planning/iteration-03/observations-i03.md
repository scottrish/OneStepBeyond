# Observations — Daily Planning, Iteration 3

Persona: Alex Carter (`synthetic/personas/student-alex-carter.yaml`)
Mission: `synthetic/missions/evaluate-daily-planning.yaml`
Full findings: `findings.yaml` · Full report: `report.md` · Full transcript: `transcript.md`

This iteration re-tested both fixes from `daily-planning.i03.md` (the
mixed-candidates breakdown signal, and the new already-scheduled-elsewhere
warning) in one continuous session, planning Wednesday then Thursday back
to back on top of the account's carried-forward iteration 1/2 data.

---

## FINDING-DP-001 — Mixed-candidates breakdown signal: fixed (informational, preserved_behaviour)

Planning Wednesday — where "Reading response — Chapter 10" had no steps
but three other candidates already did — correctly named and linked the
missing assignment on both the Day step and Select step, alongside the
real candidate list. This is the exact scenario iteration 2's
FINDING-DP-001 got wrong (silent omission, no explanation). Confirmed
resolved.

**Evidence:** `screenshots/i03-06-select-mixed-case-and-new-candidate.png`

---

## FINDING-DP-002 — Already-scheduled-elsewhere warning: working for pre-existing commitments (informational, preserved_behaviour)

All four work items carried over from iterations 1 and 2 correctly
showed "Already planned for Monday" or "Already planned for Tuesday" on
Wednesday's Select step. Selecting one anyway was still permitted (not
blocked) — confirms the implementation chose warn-don't-exclude, one of
the two acceptable approaches per `daily-planning.i03.md` FR-1.

**Evidence:** `screenshots/i03-05-select-already-planned-warning.png`

---

## FINDING-DP-003 — Already-scheduled-elsewhere warning misses same-session commitments (medium, implementation_defect)

**What was attempted:** After confirming "Read Chapter 10" for
Wednesday, immediately switched to planning Thursday in the same
session, expecting the same warning treatment for that item as every
other already-committed candidate.

**What was observed:** "Read Chapter 10" appeared on Thursday's Select
step as a plain, unwarned candidate — no "Already planned for Wednesday"
tag, unlike the four items that existed before this session started
(which all warned correctly). A direct database check confirmed the
Wednesday session genuinely exists (`work_sessions`, date 2026-08-19,
status `planned`) — the data is correct, the UI just never picked it up.

**Why it matters:** This narrows the warning's usefulness to exactly the
scenario it doesn't need to cover (data that existed before the session
began) and misses the scenario a student planning several days in one
sitting — which this app's own multi-day picker strip explicitly invites
— would actually hit.

**Likely root cause:** the hook backing this warning
(`useAllWorkSessions`) fetches once on mount and has no mechanism to
refetch after `confirmPlan` succeeds elsewhere in the same page's
lifetime.

**Evidence:** `screenshots/i03-08-thursday-missing-warning-for-just-confirmed-wednesday-item.png`

**Suggested improvement:** Refetch (or optimistically update) the
all-sessions data used for this warning immediately after a plan is
confirmed, not only on initial page load.

**Disposition:** This is the last iteration under the 3-iteration cap.
Recorded here as an **unresolved finding** for future work rather than
driving a fourth iteration, per the process's "Stop: Maximum Iterations
Reached" rule.

---

## Regression checks (informational, preserved_behaviour)

- **FINDING-DP-004** — Full 5-step flow, breakdown routing (iteration
  2's FR-1), and tab-state persistence (iteration 2's FR-2) all continue
  to compose correctly with this iteration's changes.
- **FINDING-DP-005** — Monday's original plan from iteration 1 (three
  items) remains fully intact after two further iterations of activity.
- **FINDING-DP-006** — Football exclusion and capacity math remain
  correct on every day tested.

---

## Summary

6 findings: 1 medium (implementation_defect — the same-session
stale-warning gap), 5 informational (preserved_behaviour, confirming
both of this iteration's intended fixes work for the scenario they were
directly built to address, plus no regressions). Mission outcome:
**completed**, high final confidence. This is the final iteration under
the 3-iteration cap — FINDING-DP-003 is the one unresolved substantive
finding carried forward as a candidate for future work.
