# Page Complexity Reduction: Audit Findings and Completed Refactor

Date: 2026-09-12

**Status: Approved and implemented 2026-09-12. Both increments complete.**

## Context

A follow-up `architect-review` audit, scoped specifically to complexity in
`src/pages/` and `src/dashboard/` (per direct instruction), run after
decision #16's five-increment refactor. That refactor deliberately left
`HomePage.tsx` unactioned — its own text: *"`HomePage.tsx`'s own function
(line 79) scored **33** at baseline... lower than findings 1 and 3, which
is why it wasn't its own increment... worth keeping in mind rather than
treat it as complexity-free... a future pass touching that file should
[not]."* This is that future pass.

Cyclomatic complexity (ESLint's built-in `complexity` rule, same
throwaway-config method as decision #16) across every page, re-measured
fresh rather than assumed:

| Page | Lines (baseline) | Complexity (baseline) |
|---|---|---|
| `HomePage.tsx` | 505 | **33** |
| `AssignmentDetailPage.tsx` | 404 | **32** |
| `PlanPage.tsx` | 635 | 31 |
| `WorkBreakdownPage.tsx` | 355 | 19 |
| `SupportPage.tsx` | 274 | 16 |
| `TodayExecutionPage.tsx` | 299 | 15 |
| `plan/SelectStep.tsx` | 269 | 8 |
| `AssignmentsPage.tsx` | 299 | 9 |
| `dashboard/DashboardApp.tsx`'s `DashboardContent` | 280 | 11 |

The headline finding: **`HomePage.tsx` is now the single highest-complexity
page in the app, ahead of `PlanPage.tsx` even after that file's own
five-increment reduction (47→31).** File size and complexity no longer
correlate cleanly post-refactor — `PlanPage.tsx` is still the largest file
by line count, but `HomePage.tsx`, never touched, has overtaken it on the
metric that actually predicts maintainability risk.

### Findings, ranked

**1. `HomePage.tsx:257-505` — one ~250-line render body composing 5
distinct dashboard sections. Complexity 33, highest in the app.**
Next/all-done/empty hero card (3-way state) + its own "After that" list
and plan-summary line, a Needs Attention card with a secondary-items
list, Today's Activities list, and Coming Up list, all inline in one
function alongside 8 upfront `useMemo`/derived-value computations (`next`,
`activeTodaySessions`, `totalPlannedMinutes`, `todaysActivities`,
`planSummaryActivity`, `attentionItems`, `needsAttention`, `comingUp`).
Concrete failure scenario: a change scoped to the Needs Attention card's
copy requires reading through all 8 upfront derivations to be confident
none of the other 4 sections' data flows through the same computation
block by accident — exactly the risk this repo's own prior refactor was
written to close for `PlanPage.tsx`/`AssignmentDetailPage.tsx`.
Systemic, same shape as the two findings decision #16 already fixed. The
page's own 6-branch `view.name` gating (Settings/Support/Activities/
Courses/Preferences/Capture) is **not** part of this finding — same
judgment as decision #16: an established, deliberate convention, each
branch cleanly delegates to its own page.

**2. `AssignmentDetailPage.tsx:39-260` — complexity 32, only modestly
reduced by decision #16 (35→32).** That increment's own scope was the
Steps section only; what's actually driving the remaining complexity was
out of scope then and still present: a 5-way boolean gate
(`readyForRisk`, spanning `useActivities`/`useAllWorkSessions`/
`usePreferences`'s loading/error state) feeding `attentionItem`'s
derivation, plus three mutually-exclusive top-level render branches
(`editing`, `confirmingDelete`, default) each with compound conditions.
Isolated to this one file, moderate severity.

**3. `PlanPage.tsx` — complexity 31, still the largest file (635 lines)
despite decision #16's reduction from 1201/47.** Already addressed once.
Its own top-level function still coordinates 6 hooks and ~15 handler
functions feeding the 4 already-extracted step components. Further
reduction is possible but this is diminishing-returns territory
immediately after a five-increment pass on the same file — see
Explicitly out of scope below.

**4. Lower-priority, monitored not actioned:** `WorkBreakdownPage.tsx`
(19), `SupportPage.tsx` (16), `TodayExecutionPage.tsx` (15) — all closer
to the ~10-15 range most style guides treat as acceptable, none close to
findings 1-2. Not proposing increments for these now.

## Decision

Both increments below were approved and implemented on 2026-09-12,
tagged `v-pre-page-complexity-cleanup` before either began. Each was
extracted one piece at a time, re-running the affected page's own test
file after each extraction — the same methodology decision #16
validated. Zero test-file edits were needed for either increment.

1. ✅ **Split `HomePage.tsx`'s dashboard sections into their own
   components** — `NextCard` (the 3-way hero-card state, its "After
   that" list, and the plan-summary line), `NeedsAttentionCard` (with
   its secondary-items list), `TodaysActivitiesList`, `ComingUpList`,
   all under `src/pages/home/`. `HomePage.tsx` itself reduced to a thin
   composer: data hooks, derived values, and a `view.name` gate
   delegating to these four components plus the existing sub-pages.
   27/27 `HomePage.test.tsx` and 14/14 `App.test.tsx` passed unchanged.
2. ✅ **Extract `AssignmentDetailPage.tsx`'s remaining view-state and
   risk computation** — new `useAssignmentRisk` hook
   (`src/hooks/useAssignmentRisk.ts`) wraps `useActivities` +
   `useAllWorkSessions` + `usePreferences` + the `readyForRisk`/
   `attentionItem`/`suggestBreakdown` derivation that previously lived
   directly in the page; new `AssignmentDetailEditForm.tsx` and
   `AssignmentDetailDeleteConfirm.tsx` replace the inline `editing`/
   `confirmingDelete` render branches, each owning its own local form/
   confirmation state. `AssignmentDetailPage.tsx` itself reduced to
   composing these alongside the existing `AssignmentDetailSteps`.
   36/36 tests across `AssignmentDetailPage.test.tsx` (unchanged) and
   the new `useAssignmentRisk.test.ts` (5 new tests) passed.

## Metrics comparison

| Page | Lines (before → after) | Complexity (before → after) | Verdict |
|---|---|---|---|
| `HomePage.tsx` | 505 → 313 | 33 → 18 | Improved |
| `AssignmentDetailPage.tsx` | 404 → 286 | 32 → 22 | Improved |

Complexity measured identically to the baseline: ESLint's built-in
`complexity` rule via the same throwaway-config method (see decision
#16), reading each page's own top-level component function score, not
the file's highest-scoring function overall.

## Alternatives considered

- **Fold `PlanPage.tsx` further reduction in as a third increment.**
  Considered, rejected for now — real but genuinely lower-value
  immediately after a five-increment pass already touched this exact
  file; revisit only if a later audit shows its complexity climbing
  again as new features land, not preemptively.
- **Action the three lower-priority pages (`WorkBreakdownPage.tsx`,
  `SupportPage.tsx`, `TodayExecutionPage.tsx`) now, while already in this
  part of the codebase.** Rejected — none are close to findings 1-2's
  severity; CLAUDE.md's YAGNI test (does this need it now, or just defer
  work) says no for all three today.

## Consequences

- `HomePage.tsx` and `AssignmentDetailPage.tsx` are both meaningfully
  smaller and less complex; six new files exist under `src/pages/home/`
  and alongside `AssignmentDetailPage.tsx` (`AssignmentDetailEditForm.tsx`,
  `AssignmentDetailDeleteConfirm.tsx`) plus one new hook
  (`src/hooks/useAssignmentRisk.ts`), each independently testable.
- `PlanPage.tsx` (finding 3) remains unactioned, as decided in
  Alternatives considered below — still the largest file by line count
  (635 lines) but no longer the highest-complexity page.
- The three lower-priority pages (finding 4) remain unactioned; none
  were close to findings 1-2's severity.
- Builds directly on decision #16 — see it for the methodology this
  record's own increments reused end to end (one section/component at a
  time, re-run the affected page's own test file after each, zero test
  edits needed across all 7 extractions between the two records).
- Full Definition of Done passed after both increments: `npm run lint`,
  `npm run test:run` (543/543), `npm run build`.
