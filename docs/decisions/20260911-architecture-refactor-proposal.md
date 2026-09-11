# Architecture Refactor: Audit Findings and Completed Refactor

Date: 2026-09-11

**Status: All five increments implemented (2026-09-11), approved and
completed in one Phase 2 run.** Tagged `v-pre-architecture-cleanup`
before starting; `npm run lint`, `npm run test:run` (538 tests), and
`npm run build` all passed after every increment, and `PlanPage.test.tsx`
(the largest test file in the app, covering the highest-risk increment)
passed unchanged throughout — zero test edits were needed for any of the
five increments, the strongest available signal that behavior was
preserved. See the Baseline Metrics table below for the measured
before/after on every quantifiable finding.

Earlier same-day history: re-verified in a second audit pass before
implementation — all six findings held, `git status` was clean going into
that re-run, and every re-checked line count, duplicate, and dead-code
reference was unchanged from the original pass. That second pass also
added the cyclomatic-complexity scores below (via ESLint's built-in
`complexity` rule, per the `architect-review` skill's own updated
metrics-capture step), which the original pass only had line counts for.

## Context

An architecture and code-quality audit was run against `src/` and
`supabase/migrations/` (the `architect-review` skill's Phase 1 — read-only
audit, complexity/SOLID/code-smell review). The codebase is generally
healthy: most complexity that looks unusual in isolation turned out, on
checking `docs/decisions/`, to be a deliberate and already-documented
tradeoff (App.tsx's seven pieces of lifted state, each justified by
decisions #7/#9/#10; the RLS policy counts on `work_items`/`assignments`,
which are the correct shape of the owner+supporter+superuser model built
by decision #15; the no-router view-gating pattern used throughout).

The audit did surface concrete, verified findings worth recording even
though none are urgent:

1. **`src/pages/PlanPage.tsx`** — 1201 lines, a single ~941-line component
   function (lines 260-1201) rendering all 5 wizard steps (day-picking
   chrome, candidate selection, estimation, scheduling, confirmation) via
   inline `safeStep === "X" ? (...)` branches. **Cyclomatic complexity 47**
   for that one function (ESLint's `complexity` rule) — for reference,
   most style guides flag anything above ~10-15 as worth splitting up; a
   nested arrow function at line 727 separately scores 18. The largest
   file in the app by a wide margin; grew this way across several
   independent, individually reasonable increments (5-step wizard → 3
   rounds of persona-driven fixes → decision #14's Day-step removal) with
   no structural refactor along the way.
2. **The "fetch on mount" hook pattern** (`useState(loading)` +
   `useEffect` + `.catch(setError)` + `.finally(setLoading(false))`) is
   hand-rolled independently in 13 places: `useActivities`, `useCourses`,
   `usePreferences`, `useAssignmentsList`, `useAssignment`, `useWorkItems`,
   `useDailyPlanning`, `useAllWorkSessions`, `useWeekSessions`,
   `useTodayExecution`, `useSupporterAccess`, `useDashboardData`, and
   `SupportPage.tsx`'s own inline fetch. Not hypothetical cost: the same
   `react-hooks/set-state-in-effect` bug (synchronous `setState` inside an
   effect body) was independently discovered and fixed twice in this same
   session — in `useSupporterAccess.ts` and `SupportPage.tsx` — precisely
   because there was no single implementation to fix once.
3. **`src/pages/AssignmentDetailPage.tsx`** — 661 lines, a single
   ~621-line component (lines 40-661) mixing four concerns: Work Item
   CRUD, effort roll-up (`recomputeAssignmentEffort`), Decomposition
   Attempt recording, and CTA/risk-detection display. **Cyclomatic
   complexity 35** for that function. Grew this way deliberately per
   decision #13 (inline Work Item management superseding the
   single-entry-point design) — the growth itself wasn't a mistake, but
   nothing since has separated the concerns it now owns.
4. **15 files hand-roll their own `role="alert"` error-banner markup** —
   no shared component exists under `src/components/ui/` for this pattern,
   unlike `button`/`input`/`label`/`textarea`.
5. **`timeLabel` (12-hour formatter) is byte-for-byte duplicated** in
   `HomePage.tsx`, `ActivitiesPage.tsx`, `WeekLookAhead.tsx`, and
   `PlanPage.tsx`, despite `src/domain/planningDate.ts` already being the
   established home for sibling label helpers (`dayLabel`,
   `shortDayLabel`).
6. **`src/domain/planningDate.ts`'s `dayOfWeek` is dead code** — verified
   directly (not just grepped): referenced only by its own test, called
   from nowhere in application code.

A broader "dead code" candidate list came out of the initial mechanical
sweep but mostly didn't hold up under direct verification (constants/
functions used internally within their own file, just also exported) —
only `dayOfWeek` above was confirmed. Not re-litigating the rest without
individually checking each.

### Baseline Metrics — before/after (baseline 2026-09-11, post-refactor 2026-09-11)

Each metric's definition is exact and re-computable — the same command
against the same target reproduces the same number. All five increments
were completed in one Phase 2 run, so every row below is filled in.

| # | Finding | Metric | Definition | Baseline | Post-refactor | Verdict |
|---|---|---|---|---|---|---|
| 1 | PlanPage.tsx | File line count | `wc -l src/pages/PlanPage.tsx` | 1201 | 635 | **Improved** (−47%) |
| 1 | PlanPage.tsx | `PlanPage` function cyclomatic complexity | ESLint `complexity` rule (throwaway config, `["warn",1]`), score for the top-level page function | 47 | 31 | **Improved** (−34%) |
| 1 | PlanPage.tsx | Largest nested function complexity | Same rule, highest-scoring function in the file | 18 (arrow fn, old line 727) | 8 (`SelectStep`'s own function, the largest extracted piece) | **Improved** |
| 2 | Fetch-on-mount duplication | Independent hand-rolled implementations | Count of hooks/pages matching `useState(loading)` + `useEffect` + `.catch(setError)` + `.finally(setLoading(false))`, no shared hook | 13 | 1 (`useAllWorkSessions.ts` — deliberately kept separate, see its own comment; the 13th, `useAsyncData.ts` itself, is the canonical implementation, not a duplicate) | **Improved** (12 of 13 consolidated) |
| 2 | Fetch-on-mount duplication | Shared-hook call sites | Count of call sites using `useAsyncData` | 0 | 12 | **Improved** |
| 3 | AssignmentDetailPage.tsx | File line count | `wc -l src/pages/AssignmentDetailPage.tsx` | 661 | 404 | **Improved** (−39%) |
| 3 | AssignmentDetailPage.tsx | `AssignmentDetailPage` function cyclomatic complexity | ESLint `complexity` rule, score for the page function | 35 | 32 | **Improved** (modest — most of this step's complexity was in risk/CTA computation that wasn't part of this increment's scope, not in the extracted Steps UI) |
| 4 | Error-banner duplication | Files hand-rolling their own `role="alert"` markup with no shared component | `grep` count across `src/`, excluding `ErrorBanner.tsx` itself | 15 | 4 (`DashboardApp.tsx`, `InviteAcceptPage.tsx`, `ReflectionPrompt.tsx`, `AlreadyPlannedList.tsx` — all deliberately excluded: a distinct, lighter visual style already used before this increment, not the `ErrorBanner`-shaped pattern; see Decision below) | **Improved** (11 of 15 consolidated; the other 4 were never the target — see note below the table) |
| 4 | Error-banner duplication | Shared component call sites | Count of files using `<ErrorBanner` | 0 | 14 | **Improved** |
| 5 | `timeLabel` duplication | Byte-for-byte duplicate copies | Files containing the identical 5-line function body | 4 (`HomePage.tsx`, `ActivitiesPage.tsx`, `WeekLookAhead.tsx`, `PlanPage.tsx`) | 0 | **Improved** (fully eliminated) |
| 6 | `dayOfWeek` dead code | Call sites outside its own definition/test | `grep -rn dayOfWeek src/`, excluding `planningDate.ts`'s own definition and `planningDate.test.ts` | 0 | 0 | **Unchanged** — not part of any approved increment; left alone deliberately |

Note on finding 4's baseline being revised from 15 to "11 of 15 were the
real target": the original count included `ReflectionPrompt.tsx`, whose
one `role="alert"` instance turned out, on inspection during
implementation, to already use the lighter `text-sm text-destructive`
style (no card/border/padding) rather than the boxed `ErrorBanner`
pattern the other 11 files shared — the same lighter style
`DashboardApp.tsx` and `InviteAcceptPage.tsx` each also have one instance
of, for the same reason (a full-page gate state, not an inline list
error). All three were left alone on purpose; `AlreadyPlannedList.tsx`
inherited `PlanPage.tsx`'s own pre-existing `moveError` instance, which
was already in that same lighter style before this refactor and was
carried over unchanged during increment 5's extraction, not newly
introduced.

Not part of the numbered findings, but measured for context while the
`complexity` rule was already wired up: `HomePage.tsx`'s own function
(line 79) scored **33** at baseline — lower than findings 1 and 3, which
is why it wasn't its own increment. Not re-measured post-refactor since
`HomePage.tsx` wasn't touched by any of the five increments.

## Decision

All five increments below were approved as a whole ("Approve all
refactorings") and implemented in one Phase 2 run, in the order proposed.
Each entry now records what was actually built, not just what was
planned.

1. **✅ Extracted `timeLabel`** into `planningDate.ts`
   (`src/domain/planningDate.ts`); updated all 4 call sites
   (`HomePage.tsx`, `ActivitiesPage.tsx`, `WeekLookAhead.tsx`,
   `PlanPage.tsx`) to import it; deleted the 4 duplicate local
   definitions. New test coverage added directly to
   `planningDate.test.ts`.
2. **✅ Shared async-fetch hook** — `src/hooks/useAsyncData.ts` (with its
   own test suite), migrated to 12 of the 13 original call sites:
   `useActivities`, `useCourses`, `usePreferences`, `useAssignmentsList`,
   `useAssignment`, `useWorkItems`, `useDailyPlanning`, `useWeekSessions`,
   `useTodayExecution`, `useSupporterAccess`, `useDashboardData`, and
   `SupportPage.tsx`'s own inline fetch. `useAllWorkSessions.ts` was
   *not* migrated, on purpose — its own comment already documents two
   deliberate differences from the shared shape (silently-swallowed
   errors, no `loadError` surface; a `cancelled`-flag guard against a
   slow stale response overwriting a newer one), and forcing both into a
   more complex, option-laden shared hook would have cost more than it
   saved for the one caller that needs them. `useAssignmentsList.ts` and
   the two dashboard hooks each combine multiple fetched collections into
   one object before calling `useAsyncData`, rather than being left
   unmigrated, since `useAsyncData` only ever manages a single piece of
   state.
3. **✅ Shared error-banner component** — `src/components/ErrorBanner.tsx`
   (with its own test suite), migrated across 14 files (see the
   Baseline Metrics table's note on why the original "15 files" count
   included one file, `ReflectionPrompt.tsx`, that was never actually a
   target — its own error markup already used a different, lighter style
   that also correctly stayed unmigrated in 3 other places).
4. **✅ Split `AssignmentDetailPage.tsx`'s four concerns apart** —
   `src/pages/AssignmentDetailSteps.tsx` (the Steps section's own inline
   add/edit/delete UI and local state) and
   `src/hooks/useWorkItemOrchestration.ts` (with its own test suite; the
   effort-rollup and Decomposition Attempt recording side effects that
   used to live inline). `AssignmentDetailPage.tsx` itself now only
   composes them.
5. **✅ Split `PlanPage.tsx`'s wizard steps** — four new files under
   `src/pages/plan/`: `EstimateStep.tsx`, `ScheduleStep.tsx`,
   `ConfirmStep.tsx` (covering both its review and post-confirm
   sub-states), and `SelectStep.tsx` — the densest step, itself further
   split into `AlreadyPlannedList.tsx` (the "already planned" + move-to-
   another-day sub-feature) and `BreakdownNotice.tsx` (the breakdown-
   needed notice and its shared `BreakdownList`, previously defined
   inline in `PlanPage.tsx`). Extracted one step at a time as planned,
   re-running `PlanPage.test.tsx` after each — all 33 of its tests passed
   unchanged after every single extraction, including the final one.
   `PlanPage.tsx` itself is now a thin orchestrator holding the wizard's
   lifted state and the handlers each step needs, per the Baseline
   Metrics table's measured line-count and complexity reduction.

Explicitly considered and rejected as findings (not part of this
backlog): a shared Supabase query-builder for the repeated
`.select().eq().order()` shape across 7 services (real but shallow
boilerplate duplication — a generic abstraction here would itself be the
"speculative generalization" `CLAUDE.md` warns against for a one-line
saving per service).

## Alternatives considered

- **Implement immediately rather than recording a decision first.**
  Rejected — direct instruction was to capture the proposal as a decision
  doc, and per this repo's own established practice, significant
  tradeoffs get recorded before (or independent of) implementation so the
  reasoning survives even if the work is picked up later or by someone
  else.
- **Fold this into `docs/Roadmap.md`'s Backlog section instead of a
  dedicated decision record.** Considered — Roadmap's Backlog is exactly
  for "known, not yet scheduled" work. Chose a decision record instead
  because it can hold the audit's actual reasoning (severity, concrete
  failure scenarios, what was checked and rejected) at a level of detail
  Roadmap's terse bullet style isn't meant to carry; a short Roadmap
  backlog entry pointing at this record would be a reasonable follow-up
  if/when this gets prioritized, but wasn't requested.

## Consequences

- All five increments are implemented, tagged (`v-pre-architecture-cleanup`,
  applied before any file was touched, per `CLAUDE.md`'s Repository
  Tagging section), and verified: `npm run lint`, `npm run test:run`
  (538 tests), and `npm run build` all passed at the end, and were
  re-run after each individual increment along the way.
- No behavior changed. Every existing test suite passed without
  modification, including `PlanPage.test.tsx` (1245 lines, the largest in
  the app) across all four of its own step extractions — the intended
  outcome for a refactor, not a rewrite.
- 9 new files were added: `src/hooks/useAsyncData.ts`,
  `src/hooks/useWorkItemOrchestration.ts`, `src/components/ErrorBanner.tsx`,
  `src/pages/AssignmentDetailSteps.tsx`, and 5 files under
  `src/pages/plan/` (`SelectStep.tsx`, `EstimateStep.tsx`,
  `ScheduleStep.tsx`, `ConfirmStep.tsx`, `AlreadyPlannedList.tsx`,
  `BreakdownNotice.tsx` — six, not five; `SelectStep.tsx` itself further
  split into two). Each ships with its own test coverage except the
  pages/steps, whose behavior is already covered by the existing
  page-level test files that continued passing unchanged.
- The Baseline Metrics table above is the permanent record of what this
  refactor actually achieved, not just what it targeted — every row is
  filled in with a measured, re-computable post-refactor value and an
  honest verdict, including finding 3 (`AssignmentDetailPage.tsx`'s
  complexity), whose improvement was real but modest, and finding 6
  (`dayOfWeek`), which was correctly left unchanged since it was never
  part of an approved increment.
- Future audits or onboarding can reference this record instead of
  re-deriving the same analysis from scratch — including the two explicit
  decisions (the Supabase query-builder, and treating
  `useAllWorkSessions.ts` as a deliberate non-migration) that a future
  pass might otherwise re-propose without knowing they were already
  considered and rejected on purpose.
