---
name: architect-review
description: Act as an expert software architect to audit codebase complexity, code smells, and SOLID violations, propose a refactoring strategy, and — only on explicit approval — tag the repo and perform the refactoring.
---

# Architecture & Refactoring Review

Use this skill when the user asks for a code quality / architecture audit,
a complexity or "code smell" review, a SOLID review, or wants a
refactoring strategy proposed for this codebase (or a subset of it, e.g.
"just the planning wizard" or a single top-level directory).

This skill has two hard-gated phases. Phase 1 is read-only. Phase 2 (tag +
refactor) may only begin after the user has explicitly approved the Phase
1 proposal. Never merge the phases or skip the gate, even if the requested
scope looks small.

## Phase 1 — Audit (read-only)

1. Read `CLAUDE.md` in full if not already in context, especially the
   **Architecture Principles** section's two subsections — **General
   Principles** (portable, apply regardless of project) and
   **Project-Specific Architecture** (this app's actual conventions:
   `src/services/`, `src/domain/`, the shared `useAsyncData`/
   `ErrorBanner` patterns, page-subfolder composition) — plus
   **Implementation Philosophy** and **You Aren't Going to Need It**.
   The bar for "bad smell" in this repo is set by those, not by generic
   textbook rules: judge General Principles findings against any
   project's normal standard, but judge Project-Specific Architecture
   findings against what's actually named there, not an assumption
   carried in from a different codebase. A pattern that looks like a
   violation in isolation (e.g. a component reaching past `src/services/`
   straight into Supabase) may be an explicitly named anti-pattern to
   avoid; a pattern that looks like missing abstraction may be deliberate
   YAGNI.
2. Read `docs/decisions/README.md` and any decision records touching the
   area under review — don't flag as a "violation" something that was
   already a deliberate, documented trade-off. Cite the decision record
   instead of re-litigating it.
3. Determine scope: the whole of `src/`, or the subset the user named. If
   unclear, ask.
4. Do not modify any files in this phase. Do not run `git tag`. Do not
   run codemods "just to check the diff."
5. Analyze the scope for, using this repo's own module boundaries — as
   named in CLAUDE.md's **Project-Specific Architecture** subsection and
   as actually found in the directory structure under review — not a
   layering assumed from a different codebase:
   - **Complexity**: oversized files/functions, deep nesting, high
     branching/cyclomatic complexity, parameter-list bloat, duplicated
     logic across this repo's own layers/modules.
   - **Code smells**: god objects/modules, feature envy, shotgun surgery,
     long parameter lists, primitive obsession, speculative generality,
     dead code, inappropriate intimacy between layers that are meant to
     stay independent (e.g. this app's data-fetching/domain/presentation
     split).
   - **SOLID violations**, read against this repo's actual module
     boundaries:
     - **SRP** — a module or function combining more than one distinct
       responsibility (e.g. data access, business-rule computation,
       presentation, orchestration) — use this repo's own boundaries
       (`src/services/`, `src/domain/`, `src/pages/`/`src/components/`,
       `src/hooks/`) as the reference, not a generic list.
     - **OCP** — logic that requires editing an existing module (rather
       than extending it) to support a new case.
     - **LSP** — implementations of a shared interface/type that violate
       its contract's expectations.
     - **ISP** — call sites forced to depend on parts of an interface
       they don't use.
     - **DIP** — business/domain logic (`src/domain/`) reaching into
       process-global state, live external clients, or UI/orchestration
       code instead of receiving dependencies — Supabase access is meant
       to stay centralized in `src/services/`, not called directly from
       components or hooks (per CLAUDE.md's Project-Specific
       Architecture).
   - Layer-boundary violations specifically: this app's distinct layers
     (data-fetching hooks, domain/business-rule modules, presentational
     components, page-level orchestration) must stay independently
     callable/testable — flag anything that collapses two of them
     together.
6. For each finding, capture: file:line, what it is, why it matters
   *concretely* (a failure scenario, not just a label), and severity.
   Skip findings that are stylistic-only with no maintainability or
   correctness cost.
7. **Capture a baseline metric for every finding that has one.** Not
   every finding reduces to a single number (an SRP judgment call
   usually doesn't) — but wherever the finding *is* inherently
   quantifiable, compute and record the exact current value using direct
   inspection (`wc -l`, `grep -c`, a manual line-span read) rather than
   adding a static-analysis dependency for this. Typical metrics:
   - file line count, for an oversized-file finding;
   - largest function/component line span, for a god-function finding;
   - **cyclomatic complexity, for a god-function or deep-branching
     finding** — the rigorous version of "this function branches a lot,"
     and preferred over a hand-counted branch tally whenever a finding is
     specifically about one function/component's own complexity (branch
     counting is still fine for a quick enumeration, e.g. how many
     `view.name === X` cases a file gates on). Compute it with ESLint's
     built-in `complexity` rule — it ships in ESLint core, so this needs
     no new dependency, and must never edit the project's real
     `eslint.config.js` to get it: write a throwaway config to a
     project-local temp file (not the session scratchpad — module
     resolution needs it inside the project so it can find
     `node_modules`), run `eslint --config <temp-file> <target>` with
     `complexity` set to `["warn", 1]` so every function reports its
     actual score as a warning, then delete the temp file immediately
     and confirm with `git status` that nothing was left behind. Example
     config body:
     ```js
     import js from '@eslint/js'
     import globals from 'globals'
     import tseslint from 'typescript-eslint'
     import { defineConfig } from 'eslint/config'
     export default defineConfig([{
       files: ['**/*.{ts,tsx}'],
       extends: [js.configs.recommended, tseslint.configs.recommended],
       languageOptions: { globals: globals.browser },
       rules: { complexity: ['warn', 1] },
     }])
     ```
     Record the specific function/component's reported score, not just
     the file's highest — a file can contain one very high scorer among
     several trivial ones.
   - count of top-level conditional branches, for a deep-branching
     finding that's about a file's overall shape rather than one
     function's internal complexity;
   - count of independent instances of a duplicated pattern (e.g. "N
     hand-rolled copies of this hook shape"), for a DRY finding;
   - count of call sites still using the old shape vs. a shared
     abstraction (0 shared / N old, at baseline), for anything the
     proposed strategy intends to consolidate.
   Record the metric's exact definition (so it's re-computable
   identically later, by anyone, not just by re-running the same prompt)
   alongside its value. Skip a metric only when the finding is genuinely
   not quantifiable — don't force a number onto a qualitative judgment
   call.

## Phase 1 output — Refactoring Strategy Proposal

Present, in this order:

1. **Summary** — overall health assessment in 2-4 sentences.
2. **Findings**, ranked most-severe first. Each: file:line, category
   (complexity / smell / SOLID letter), concrete failure scenario,
   whether it's isolated or systemic, and its baseline metric from step 7
   above when it has one.
3. **Proposed refactoring strategy** — an ordered list of independently
   shippable increments (per `CLAUDE.md`'s "prefer incremental,
   independently-testable steps over large rewrites"). For each
   increment: what changes, which files, expected risk/blast radius,
   which existing tests must pass after it (per CLAUDE.md's Definition
   of Done: `npm run lint`, `npm run test:run`, `npm run build`), and
   which finding(s)/metric(s) from step 2 it's meant to move.
4. **Explicitly out of scope** — anything that looked tempting but fails
   the YAGNI test in `CLAUDE.md` (no concrete acceptance criteria needs
   it) — name it and don't do it.
5. **Proposed tag name** — per `CLAUDE.md`'s Repository Tagging
   convention (`v-pre-<short-slug>`), a suggested tag to apply before
   starting, if the combined scope has meaningful risk of hard-to-revert
   breakage. If the scope is trivial/low-risk, say so and propose
   skipping the tag instead of tagging by default.
6. **Write this proposal to a decision record** under `docs/decisions/`
   (`YYYYMMDD-<slug>-proposal.md`, following `docs/decisions/README.md`'s
   Context/Decision/Alternatives/Consequences format and adding it to
   that file's index), regardless of whether the user goes on to approve
   it — the audit and its baseline metrics are worth preserving on their
   own. Include:
   - the findings and proposed strategy from points 1-4 above, in
     Context/Decision;
   - a **Baseline Metrics** table (finding → metric definition → current
     value), the step-7 data, placed in Context so it reads as "what was
     measured, and when";
   - an explicit **Status: Proposed, not yet approved** line, since
     nothing has been implemented yet.
   Present the written file's path to the user along with the summary
   above, not instead of it.
7. Ask explicitly: does the user approve this strategy, as a whole or
   increment-by-increment, and do they confirm the tag name?

Do not proceed past this point without explicit approval. "Looks good" or
approval of a subset of increments is sufficient to proceed only on the
approved subset.

## Phase 2 — Tag and Refactor (only after approval)

1. Confirm the exact tag name with the user if not already confirmed in
   Phase 1, then apply it (`git tag <name>`) before touching any files.
   Do not force-create or overwrite an existing tag.
2. Implement the approved increments one at a time, in the agreed order.
   For each increment:
   - Preserve existing behavior — this is a refactor, not a rewrite;
     public behavior and layer contracts must not change unless the user
     explicitly approved a behavior change.
   - Keep the change scoped to what was approved; do not fold in
     additional cleanup that wasn't part of the proposal.
   - Run CLAUDE.md's Definition of Done: `npm run lint`, `npm run
     test:run`, `npm run build`.
   - If this repo defines validation beyond that (a synthetic persona
     assessment, a benchmark/eval script, a recorded baseline), run
     whichever of those are relevant to the touched area and compare
     against its existing baseline — a refactor must not change
     externally-observable behavior; if it does, stop and report before
     continuing to the next increment.
3. If any increment's actual diff turns out larger or riskier than
   proposed, pause and re-confirm with the user before continuing —
   don't let scope grow silently mid-execution.
4. **Recompute, for every increment actually completed in this run, the
   same metric(s) from that finding's Phase 1 baseline** — identical
   definition, identical measurement method, so the numbers are
   genuinely comparable and not just two different eyeballed estimates.
   Update the proposal document written in Phase 1 (do not create a
   second file): add the post-refactor value and a verdict (improved /
   unchanged / regressed) to each completed row of its Baseline Metrics
   table, and change its Status line to reflect what's actually done —
   e.g. "Increments 1-3 implemented 2026-09-15; 4-5 still pending" if
   only a subset was approved and completed this run. Leave rows for any
   not-yet-completed increment as they were; a later Phase 2 run against
   the same document fills those in when that work happens. If a
   metric came out worse or unchanged despite the refactor targeting it,
   report that plainly rather than omitting or reframing the row — the
   comparison is only useful if it's honest.
5. If a change is significant enough to warrant a decision record per
   `CLAUDE.md`'s Architectural Decisions section (a non-obvious tradeoff,
   a deviation from an existing pattern), create one under
   `docs/decisions/` — separate from the proposal document's own
   before/after update in step 4, which stays about the audit's own
   metrics, not new tradeoffs made mid-refactor.
6. At the end, produce the `CLAUDE.md` Deliverables summary: what changed,
   files modified, validation/eval commands run and their results, the
   metrics comparison from step 4 (or a pointer to the updated proposal
   document), remaining issues/tech debt, suggested next increment.
