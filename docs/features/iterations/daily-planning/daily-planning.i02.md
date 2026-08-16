---
feature: daily-planning
iteration: 2
derived_from: docs/features/daily-planning.md
playwright_evidence: docs/playwright/daily-planning/iteration-01/
---

# Daily Planning — Iteration 2

## Assessment Summary

Iteration 1's persona assessment (Alex Carter / `evaluate-daily-planning`,
2026-08-16, corrected re-run after a dev-server port collision invalidated
the first attempt) found the core 5-step wizard mechanically sound and
trustworthy once reached: it correctly excludes football practice from
available capacity, communicates over-capacity selections calmly without
blocking, offers sensible editable suggested times, and durably persists a
confirmed plan. The single dominant problem is that Plan's Select step
dead-ends — "Nothing to plan yet. Break an assignment into steps first,
then come back." — for any assignment that hasn't already been manually
broken into Work Items, with no signal of that requirement anywhere
upstream (not on Day/Step 1, not before entering Plan at all). Discovering
it costs a detour through a separate 4-screen breakdown flow per
assignment (~15 taps for two assignments), directly undermining the
feature's own under-five-minutes acceptance criterion for the common case
of a student with undecomposed assignments. A second, compounding problem:
leaving Plan to complete that detour and returning silently resets the
wizard to "Today"/Step 1, losing the day the student had already selected.
Full detail: `docs/playwright/daily-planning/iteration-01/findings.yaml`
and `report.md`.

## Finding Dispositions

| Finding | Disposition | Reasoning |
|---|---|---|
| FINDING-DP-001 (session opened on Login, not pre-authenticated) | Human validation required | Assessment-infrastructure artifact (storage-state timing), not an observation about the feature itself. No requirement. |
| FINDING-DP-002 (breakdown-required-before-planning, no in-flow signal) | Specification gap | daily-planning.md never states that Select's candidates require an existing Work Breakdown, nor how a student without one should be signaled or routed. Whether steps-before-scheduling should remain a hard prerequisite at all is a product-intent question (see Human Validation below); regardless of that answer, the complete absence of any upfront or in-flow signal is unambiguously a gap. New requirement below (FR-1). |
| FINDING-DP-003 (football correctly excluded from capacity) | Preserve | Matches spec's Functional Requirements exactly. Design constraint. |
| FINDING-DP-004 (calm, non-blocking over-capacity messaging) | Preserve | Matches spec's Estimate step description exactly ("calm, non-alarming statement... does not block"). Design constraint. |
| FINDING-DP-005 (confirmed plan persists, visible under "Already planned" with remove) | Preserve | Matches spec's Confirm/Day-step requirements exactly. Design constraint. |
| FINDING-DP-006 (Home doesn't reflect a confirmed plan) | Out of scope | Home's content is a different feature's concern; daily-planning.md has no requirement touching Home. Flagged for a future increment, not this one, per CLAUDE.md's YAGNI guidance against scope creep into an adjacent screen. |
| FINDING-DP-007 (wizard resets day/step selection on tab navigation) | Specification gap | daily-planning.md is silent on what happens to in-progress wizard state when the student navigates away and back — this matches the app's general existing pattern of unmounting a tab's page on switch, which was never a problem before a multi-step, effortful-to-rebuild flow like this existed. New requirement below (FR-2). |
| FINDING-DP-008 (disabled step-completion checkbox, low confidence) | Out of scope | Evaluator flagged this as plausibly belonging to a not-yet-built Today Execution feature, with low confidence and no mission-relevant impact. Not actionable here. |
| FINDING-DP-009 ("Today" landed on a football-free Sunday) | Human validation required | Test-environment/clock artifact of when the assessment happened to run, not a product observation. No requirement. |
| FINDING-DP-010 (Plan trivially discoverable via bottom nav) | Preserve | Matches spec implicitly (Plan is a primary tab). Design constraint. |
| FINDING-DP-011 (clean rendering at 390x844 mobile viewport) | Preserve | Matches CLAUDE.md's mobile-first requirement. Design constraint. |

## Product Problems

**Problem A — The breakdown-before-planning dependency is invisible until it dead-ends the flow.**
Affected users: any student whose selected day's candidate assignments
don't yet have Work Items — plausibly the common case for a student who
just captured assignments and hasn't separately visited each one to break
it down. Impact: Select shows "Nothing to plan yet" with no explanation
or path forward, directly costing the feature's under-five-minutes
acceptance criterion and risking outright abandonment for a low-patience
persona. Supporting: FINDING-DP-002. Specification gap — new requirement
(FR-1).

**Problem B — The detour Problem A forces then erases the student's progress.**
Affected users: the same students affected by Problem A, since resolving
it requires leaving Plan. Impact: after completing a breakdown and
returning to Plan, the previously selected day is lost and must be
reselected, adding friction on top of an already-unexpected detour.
Supporting: FINDING-DP-007. Specification gap — new requirement (FR-2).

## Functional Requirements

### FR-1 — Signal and resolve the breakdown prerequisite before it dead-ends Select

When a candidate assignment for the selected day has no Work Items (i.e.
has not yet been broken down), the wizard must not let the student reach
a bare "nothing to plan" state with no path forward. At minimum:

- The Day step (Step 1) or the Select step (Step 2) must state plainly,
  before or at the point Select would otherwise show nothing, that one or
  more of the day's assignments still need to be broken into steps before
  they can be scheduled — naming which assignment(s).
- From that signal, the student must have a direct path to start the
  breakdown for the named assignment(s) without independently discovering
  the Assignments tab and the "Break this down" entry point themselves.
- After completing (or abandoning) that breakdown, the student must be
  able to return to Plan and continue from where they left off (see
  FR-2) rather than starting the wizard over.

This requirement addresses the *signaling and routing* gap only. Whether
an assignment without a Work Breakdown should ever be directly
schedulable using its own top-level estimate (bypassing breakdown
entirely) is a separate product-intent question — see Human Validation
Recommendations below; do not implement that broader change under this
requirement without explicit confirmation.

Supporting findings: FINDING-DP-002.

### FR-2 — Preserve in-progress wizard selection across tab navigation

The Plan wizard's selected day and current step must survive the student
navigating to another bottom-nav tab and back, at least until the plan is
confirmed or the student explicitly changes the selected day. Returning
to Plan after visiting another tab must resume at the same day/step the
student left, not reset to "Today"/Step 1.

Supporting findings: FINDING-DP-007.

## Design Constraints

- Preserve capacity math exactly as observed: the day's realistic study
  window minus Activities (+ travel) minus the protected downtime block,
  with Activities (e.g. football practice) explicitly named and excluded
  — never silently absorbed into "free time." (FINDING-DP-003)
- Preserve the Estimate step's over-capacity handling exactly: a calm,
  specific, plain-language statement of the overage that never blocks
  progress or uses alarming styling. (FINDING-DP-004)
- Preserve Confirm's current behavior: a durable write that reappears
  under the Day step's "Already planned" section (with working remove
  controls) when the day is revisited later. (FINDING-DP-005)
- Preserve Plan's current placement and discoverability as a persistent
  bottom-nav tab. (FINDING-DP-010)
- Preserve clean rendering at mobile viewport widths (~390px) with no
  horizontal scrolling, overlap, or truncation, across the full wizard and
  the breakdown flow it now links to (per FR-1). (FINDING-DP-011)

## Non-functional Requirements

- FR-1's added signal/routing must not introduce a new UI abstraction
  where reusing the existing "Break this down" entry point (or navigating
  directly to it) suffices — per CLAUDE.md's YAGNI guidance.
- FR-2's state preservation must not change how any *other* tab's page
  currently mounts/resets (e.g. Home's and Assignments' existing
  reset-on-re-tap behavior) — scope the fix to Plan's own wizard state.
- Both requirements remain subject to CLAUDE.md's mobile-first and WCAG
  2.2 AA standards already applied in iteration 1.

## Acceptance Criteria

- Given a selected day whose candidate assignments have no Work Items,
  the student is told which assignment(s) need to be broken down before
  reaching any "nothing to plan" state, and is given a direct way to
  start that breakdown from within the signal itself.
- After completing a breakdown reached via that path, the student can
  return to Plan and land back on the same day/step they left, with the
  newly-broken-down assignment(s) now available to select.
- Selecting a day, navigating to Home or Assignments, and returning to
  Plan resumes on the same day and step — not "Today"/Step 1 — provided
  the plan for that day has not yet been confirmed.
- All iteration 1 acceptance criteria (5-step flow, "Step N of 5" label,
  three-candidate cap with show-more, parent assignment + course shown
  for every work item, full session completable once no breakdown detour
  is required) continue to hold.

## Out of Scope

- Home reflecting a confirmed plan or open work (FINDING-DP-006) —
  belongs to a future increment/feature touching Home, not Daily
  Planning.
- Step-level completion controls on Assignment Detail (FINDING-DP-008) —
  plausibly Today Execution's concern; not touched here.
- Allowing an assignment to be scheduled directly from its top-level
  estimate without any Work Breakdown at all — a broader design change
  than FR-1's signaling/routing fix; flagged for human validation, not
  assumed.
- Any change to the Estimate/Schedule/Confirm steps' own mechanics, all
  of which iteration 1 validated as working well.

## Assumptions

- FR-1's "direct path" can reuse the existing per-assignment "Break this
  down" flow as-is; iteration 1 found that flow itself functional, just
  poorly connected to Plan.
- FR-2's persistence only needs to survive ordinary tab navigation within
  a single session — not a full page reload or a new login session.

## Open Questions

- Exact wording/placement of FR-1's signal (Day step vs. Select step;
  naming all blocked assignments at once vs. one at a time) — left to
  implementation judgment.
- Whether FR-2's persisted state should reset once the day's plan is
  confirmed (clearing back to a fresh wizard) or continue holding the
  last-viewed day — left to implementation judgment, consistent with
  Design-Principles.md's general preference for state that helps rather
  than surprises the student.

## Human Validation Recommendations

- Confirm whether requiring a full Work Breakdown before an assignment
  can be scheduled is the intended design for Daily Planning, or whether
  lightweight/inline estimation directly from Plan (bypassing breakdown)
  was meant to be available — iteration 1's evidence only established
  that the *current* hard dependency is poorly signaled, not whether the
  dependency itself is correct. (FINDING-DP-002)
- Confirm whether Home is deliberately out of scope for reflecting a
  confirmed plan at this stage of the roadmap, or was expected to change.
  (FINDING-DP-006)

## Evidence Traceability

| Requirement | Supporting Findings |
|---|---|
| FR-1 | FINDING-DP-002 |
| FR-2 | FINDING-DP-007 |
| (design constraint, no FR) | FINDING-DP-003 |
| (design constraint, no FR) | FINDING-DP-004 |
| (design constraint, no FR) | FINDING-DP-005 |
| (design constraint, no FR) | FINDING-DP-010 |
| (design constraint, no FR) | FINDING-DP-011 |
| (out of scope, no FR) | FINDING-DP-006 |
| (out of scope, no FR) | FINDING-DP-008 |
| (no requirement — infra/environment artifact) | FINDING-DP-001 |
| (no requirement — infra/environment artifact) | FINDING-DP-009 |
