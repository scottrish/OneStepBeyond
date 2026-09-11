# Architecture Refactor Proposal (audit findings, not yet approved)

Date: 2026-09-11

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
   function rendering all 5 wizard steps (day-picking chrome, candidate
   selection, estimation, scheduling, confirmation) via inline
   `safeStep === "X" ? (...)` branches. The largest file in the app by a
   wide margin; grew this way across several independent, individually
   reasonable increments (5-step wizard → 3 rounds of persona-driven
   fixes → decision #14's Day-step removal) with no structural refactor
   along the way.
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
   ~621-line component mixing four concerns: Work Item CRUD, effort
   roll-up (`recomputeAssignmentEffort`), Decomposition Attempt recording,
   and CTA/risk-detection display. Grew this way deliberately per decision
   #13 (inline Work Item management superseding the single-entry-point
   design) — the growth itself wasn't a mistake, but nothing since has
   separated the concerns it now owns.
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

## Decision

Record the following as a proposed, ordered refactoring backlog. **This
is a proposal only — implementation is not yet approved.** Per the
`architect-review` skill's own hard gate between Phase 1 (audit) and
Phase 2 (tag + refactor), and per `CLAUDE.md`'s Repository Tagging
convention, nothing below should be implemented without a separate,
explicit approval and a `v-pre-architecture-cleanup` tag applied first.

Proposed order, each an independently shippable increment:

1. **Extract `timeLabel`** into `planningDate.ts`; update the 4 call
   sites; delete the duplicates. Trivial risk.
2. **Shared async-fetch hook** (e.g. `useAsyncData`), migrated in small
   batches (3-4 call sites per batch) rather than all 13 at once —
   `useAllWorkSessions`'s deliberately non-critical error behavior (it
   doesn't surface `loadError`) needs to remain an explicit option, not
   be forced into the shared shape. Moderate risk, highest value of the
   five.
3. **Shared error-banner component**, migrated across the 15 call sites
   incrementally. Low-to-moderate risk, presentational only.
4. **Split `AssignmentDetailPage.tsx`'s four concerns apart** — inline
   Work Item CRUD UI into its own component; effort roll-up + Decomposition
   Attempt recording into a small orchestration hook. Moderate risk given
   the file's size and its 838-line test file.
5. **Split `PlanPage.tsx`'s wizard steps** into separate step components,
   leaving `PlanPage.tsx` itself as a thin orchestrator. Highest value,
   highest risk — the largest file and test file in the app. Should be
   done last, one step extracted at a time, re-running
   `PlanPage.test.tsx` after each extraction rather than as one large
   diff.

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

- No code has changed. This record exists purely to preserve the audit's
  findings and proposed sequencing.
- Before any of the five increments is implemented, it needs an explicit
  go-ahead and the `v-pre-architecture-cleanup` tag applied first,
  per `CLAUDE.md`'s Repository Tagging section.
- If priorities shift and none of this is ever implemented, that's a
  legitimate outcome — same framing `docs/Roadmap.md`'s own Backlog
  section already uses for "known, not scheduled" items.
- Future audits or onboarding can reference this record instead of
  re-deriving the same analysis from scratch.
