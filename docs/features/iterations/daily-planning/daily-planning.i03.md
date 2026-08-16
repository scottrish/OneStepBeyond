---
feature: daily-planning
iteration: 3
derived_from: docs/features/iterations/daily-planning/daily-planning.i02.md
playwright_evidence: docs/playwright/daily-planning/iteration-02/
---

# Daily Planning — Iteration 3

## Assessment Summary

Iteration 2's persona assessment (Alex Carter / `evaluate-daily-planning`,
re-run against the FR-1/FR-2 build) confirmed FR-2 (wizard state
persistence across tab navigation) works exactly as intended. FR-1 (the
breakdown-prerequisite signal), however, turned out to be implemented
more narrowly than the requirement called for: the signal only fires when
*every* candidate for the selected day still needs breaking down. When a
day has a mix — some assignments already broken into Work Items, others
not — the ones that aren't simply vanish from Select's list with no
explanation at all, which is arguably less legible than iteration 1's
explicit dead end. This reproduced identically on two different days in
the same session. A second, previously-unseen issue also surfaced: a work
item already scheduled on a confirmed day can be selected again for a
different day with no warning that it's already committed elsewhere. Full
detail: `docs/playwright/daily-planning/iteration-02/findings.yaml` and
`report.md`.

## Finding Dispositions

| Finding | Disposition | Reasoning |
|---|---|---|
| FINDING-DP-001 (mixed-candidates case silently omits un-broken-down assignments) | Implementation defect | FR-1 (`daily-planning.i02.md`) already required naming *which* assignment(s) need breaking down; the build only did so when the day's candidate list was entirely empty. Bug fix against the existing requirement, not a new one. |
| FINDING-DP-002 (state persists across tab navigation) | Preserve | Confirms FR-2 fixed exactly as specified. Design constraint. |
| FINDING-DP-003 (already-scheduled item re-selectable for another day, no warning) | Specification gap | Neither daily-planning.md nor iteration 2's spec says anything about a work item that already has a session on one day being offered again for another. New requirement below (FR-1). |
| FINDING-DP-004 (football correctly excluded from capacity) | Preserve | Unchanged from iteration 1. Design constraint. |
| FINDING-DP-005 (confirmed plans persist, including iteration 1's surviving Monday plan) | Preserve | Unchanged from iteration 1. Design constraint. |
| FINDING-DP-006 (Home doesn't reflect a confirmed plan) | Out of scope | Unchanged from iteration 1's disposition — belongs to a different screen/feature. |
| FINDING-DP-007 (fast, low-stakes flow once a plannable item exists) | Preserve | Confirms iteration 1's core mechanics still hold. Design constraint. |
| FINDING-DP-008 (disabled step-completion checkbox) | Out of scope | Unchanged from iteration 1's disposition — plausibly Today Execution's concern. |
| FINDING-DP-009 ("Today" landed on a football-free Sunday) | Human validation required | Environment/clock artifact, not a product observation. No requirement. |
| FINDING-DP-010 (Plan discoverable via bottom nav) | Preserve | Unchanged. Design constraint. |
| FINDING-DP-011 (clean rendering at 390x844) | Preserve | Unchanged. Design constraint. |
| FINDING-DP-012 ("Show more" buries the item actually due that day) | UX improvement (deferred) | Real and plausible, but low severity/confidence and touches candidate-ranking logic not otherwise in scope this iteration. Deferred — see Out of Scope. |

## Product Problems

**Problem A — FR-1's breakdown signal doesn't cover the mixed-candidates case.**
Affected users: any student planning a day where some but not all
relevant assignments have been broken down — plausibly the common case
once a student has been using the app for more than a day or two (as
this session's own data showed). Impact: the assignment due that day
silently disappears from Select with zero explanation, which is worse
than iteration 1's explicit dead end because there's no visible signal
that anything is wrong at all — a student who doesn't independently think
to check Assignments has no way to discover why their plan looks
incomplete. Supporting: FINDING-DP-001. Implementation defect — bug fix,
no new requirement text (FR-1 from iteration 2 already covers this case
in its own wording; the fix is closing the gap between that wording and
the gating condition actually implemented).

**Problem B — Scheduling an already-committed item a second time has no guardrail.**
Affected users: any student planning multiple days in the same session
(exactly this assessment's flow: Monday from iteration 1, Tuesday and
Thursday this iteration) who might reasonably re-open a work item they
forgot they'd already scheduled. Impact: a student could end up believing
the same piece of work is planned for two different days, discovering the
conflict only when one of them arrives. Supporting: FINDING-DP-003.
Specification gap — new requirement (FR-1, this iteration's own
numbering).

## Functional Requirements

### FR-1 — Warn on or exclude a work item that already has a planned session elsewhere

A work item that already has a `planned` (not yet started/done) session
on a different date must not appear in Select as an ordinary,
unqualified option. At minimum, the student must be able to tell, before
selecting it, that the item is already scheduled elsewhere (e.g. which
day). Whether the correct behavior is to exclude such items from the
candidate list entirely, or to show them with a visible "already planned
for {day}" indicator and allow the student to knowingly reschedule, is an
implementation choice — either satisfies this requirement, provided the
existing commitment is never silently invisible.

Supporting findings: FINDING-DP-003.

## Design Constraints

- Preserve capacity math, football/Activity exclusion, and the
  over-capacity messaging exactly as validated in iterations 1 and 2.
  (FINDING-DP-004, FINDING-DP-007)
- Preserve confirmed-plan persistence exactly as validated: a plan
  reappears under "Already planned" with working remove controls, and
  prior days' plans remain intact when a different day is later
  confirmed. (FINDING-DP-005)
- Preserve FR-2's tab-navigation state persistence exactly as validated
  — do not regress it while fixing Problem A. (FINDING-DP-002)
- Preserve Plan's discoverability and clean mobile rendering.
  (FINDING-DP-010, FINDING-DP-011)

## Non-functional Requirements

- The Problem A fix must not regress FR-2 (state persistence) or FR-1's
  already-working all-empty case from iteration 2 — both must continue
  to pass their existing acceptance criteria.
- FR-1 (this iteration) must not require a new table or schema change;
  "already has a planned session elsewhere" is answerable from the
  existing `work_sessions` data already loaded for candidate ranking.

## Acceptance Criteria

- Given a selected day where at least one relevant assignment has Work
  Items and at least one other relevant assignment does not, the
  student is told which assignment(s) still need breaking down (with a
  direct link to do so), the same way as when *all* candidates need
  breaking down — not silently omitted with no signal.
- Given a work item that already has a planned session on a different
  date, selecting the current day's Select step never presents that item
  as an ordinary, unqualified selectable option — the existing
  commitment is visible before or at the point of selection.
- All iteration 1 and iteration 2 acceptance criteria continue to hold
  (5-step flow, three-candidate cap with show-more, parent
  assignment+course shown per item, wizard state survives tab
  navigation, breakdown routing returns to the same step).

## Out of Scope

- Home reflecting a confirmed plan (FINDING-DP-006) — unchanged from
  iteration 1's disposition.
- Step-level completion controls (FINDING-DP-008) — unchanged from
  iteration 1's disposition.
- Reordering candidate ranking so the item due on the *selected planning
  day* is prioritized over items due on other days (FINDING-DP-012) —
  real but low-severity/low-confidence; deferred to a future increment
  rather than folded into this one's already-scoped fixes.
- Any change to Estimate/Schedule/Confirm mechanics, unaffected by either
  problem this iteration addresses.

## Assumptions

- FR-1's "already scheduled elsewhere" check only needs to consider
  `planned`-status sessions (not `in_progress`/`done`, which don't yet
  exist in practice since Today Execution isn't built) — consistent with
  how "not-yet-started" is already defined elsewhere in this feature.

## Open Questions

- Whether FR-1 should exclude already-scheduled items outright or show
  them with an override — left to implementation judgment; either
  satisfies the acceptance criteria above.
- FINDING-DP-012's ranking-order issue (deferred) — worth a human product
  decision on whether "due on the day being planned" should outrank
  "due soonest overall" in candidate ordering, independent of this
  iteration.

## Human Validation Recommendations

- Confirm FINDING-DP-009's environment mismatch (system clock's "Today"
  landing on a non-representative day) isn't masking anything about how
  a real student's actual "Today" behaves — no action expected, but
  flagged for completeness across two consecutive assessment runs.

## Evidence Traceability

| Requirement | Supporting Findings |
|---|---|
| FR-1 | FINDING-DP-003 |
| (defect fix, no FR — Problem A) | FINDING-DP-001 |
| (design constraint, no FR) | FINDING-DP-002 |
| (design constraint, no FR) | FINDING-DP-004 |
| (design constraint, no FR) | FINDING-DP-005 |
| (design constraint, no FR) | FINDING-DP-007 |
| (design constraint, no FR) | FINDING-DP-010 |
| (design constraint, no FR) | FINDING-DP-011 |
| (out of scope, no FR) | FINDING-DP-006 |
| (out of scope, no FR) | FINDING-DP-008 |
| (deferred ux improvement, no FR) | FINDING-DP-012 |
| (no requirement — environment artifact) | FINDING-DP-009 |
