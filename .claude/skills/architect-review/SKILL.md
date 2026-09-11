---
name: architect-review
description: Act as an expert software architect to audit codebase complexity, code smells, and SOLID violations, propose a refactoring strategy, and — only on explicit approval — tag the repo and perform the refactoring.
---

# Architecture & Refactoring Review

Use this skill when the user asks for a code quality / architecture audit,
a complexity or "code smell" review, a SOLID review, or wants a
refactoring strategy proposed for this codebase (or a subset of it, e.g.
"just `src/rag`").

This skill has two hard-gated phases. Phase 1 is read-only. Phase 2 (tag +
refactor) may only begin after the user has explicitly approved the Phase
1 proposal. Never merge the phases or skip the gate, even if the requested
scope looks small.

## Phase 1 — Audit (read-only)

1. Read `CLAUDE.md` in full if not already in context, especially the
   **Architecture Principles**, **Implementation Philosophy**, and **You
   Aren't Going to Need It** sections — the bar for "bad smell" in this
   repo is set by those, not by generic textbook rules. A pattern that
   looks like a violation in isolation (e.g. business logic in
   `src/experiment`) may be an explicitly named anti-pattern to avoid; a
   pattern that looks like missing abstraction (e.g. only one scaffold
   ladder implemented) may be deliberate YAGNI.
2. Read `docs/decisions/README.md` and any decision records touching the
   area under review — don't flag as a "violation" something that was
   already a deliberate, documented trade-off. Cite the decision record
   instead of re-litigating it.
3. Determine scope: the whole of `src/`, or the subset the user named. If
   unclear, ask.
4. Do not modify any files in this phase. Do not run `git tag`. Do not
   run codemods "just to check the diff."
5. Analyze the scope for:
   - **Complexity**: oversized files/functions, deep nesting, high
     branching/cyclomatic complexity, parameter-list bloat, duplicated
     logic across `src/corpus` / `src/rag` / `src/app` / `src/eval` /
     `src/experiment`.
   - **Code smells**: god objects/modules, feature envy, shotgun surgery,
     long parameter lists, primitive obsession, speculative generality,
     dead code, inappropriate intimacy between pipeline stages.
   - **SOLID violations**, read against this repo's actual module
     boundaries:
     - **SRP** — a module or function doing more than one of:
       validation, retrieval, ranking, scaffolding, ambiguity resolution,
       generation, orchestration.
     - **OCP** — logic that requires editing an existing pipeline stage
       (rather than extending it) to support a new case.
     - **LSP** — implementations of a shared interface/type that violate
       its contract's expectations.
     - **ISP** — call sites forced to depend on parts of an interface
       they don't use.
     - **DIP** — business logic (`src/corpus`, `src/rag`) reaching into
       process-global state, live API clients, or orchestration
       (`src/app`, `src/experiment`) instead of receiving dependencies —
       note the model-config/API-key gap is already a known, accepted
       exception per `CLAUDE.md`; don't re-flag that specific gap unless
       the task is about it.
   - Stage-boundary violations specifically: retrieval, ranking,
     scaffolding, ambiguity resolution, and response generation must stay
     independently callable/testable — flag anything that collapses two
     stages together.
6. For each finding, capture: file:line, what it is, why it matters
   *concretely* (a failure scenario, not just a label), and severity.
   Skip findings that are stylistic-only with no maintainability or
   correctness cost.

## Phase 1 output — Refactoring Strategy Proposal

Present, in this order, and then stop:

1. **Summary** — overall health assessment in 2-4 sentences.
2. **Findings**, ranked most-severe first. Each: file:line, category
   (complexity / smell / SOLID letter), concrete failure scenario, and
   whether it's isolated or systemic.
3. **Proposed refactoring strategy** — an ordered list of independently
   shippable increments (per `CLAUDE.md`'s "prefer incremental,
   independently-testable steps over large rewrites"). For each
   increment: what changes, which files, expected risk/blast radius, and
   which existing tests / `eval:*` scripts / `validate:corpus` must pass
   after it.
4. **Explicitly out of scope** — anything that looked tempting but fails
   the YAGNI test in `CLAUDE.md` (no concrete acceptance criteria needs
   it) — name it and don't do it.
5. **Proposed tag name** — per `CLAUDE.md`'s Repository Tagging
   convention (`v-pre-<short-slug>`), a suggested tag to apply before
   starting, if the combined scope has meaningful risk of hard-to-revert
   breakage. If the scope is trivial/low-risk, say so and propose
   skipping the tag instead of tagging by default.
6. Ask explicitly: does the user approve this strategy, as a whole or
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
     public behavior and pipeline stage contracts must not change unless
     the user explicitly approved a behavior change.
   - Keep the change scoped to what was approved; do not fold in
     additional cleanup that wasn't part of the proposal.
   - Run `npm test` and `npm run validate:corpus`.
   - Run whichever `eval:*` scripts are relevant to the touched stage,
     and compare against existing baselines in `eval-results/` /
     `evaluation/baselines/` — a refactor must not change eval outcomes;
     if it does, stop and report before continuing to the next increment.
3. If any increment's actual diff turns out larger or riskier than
   proposed, pause and re-confirm with the user before continuing —
   don't let scope grow silently mid-execution.
4. If a change is significant enough to warrant a decision record per
   `CLAUDE.md`'s Architectural Decisions section (a non-obvious tradeoff,
   a deviation from an existing pattern), create one under
   `docs/decisions/`.
5. At the end, produce the `CLAUDE.md` Deliverables summary: what changed,
   files modified, validation/eval commands run and their results,
   remaining issues/tech debt, suggested next increment.
