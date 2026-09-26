# OneStepBeyond

## Purpose

One Step Beyond is a mobile-first web application that helps secondary school students (Grades 8–12) develop independent executive functioning skills through planning, organization, task management, reflection, and coaching.
---

# Project Documentation

These documents define canonical project direction:

- `docs/reference/Product-Vision.md`
- `docs/reference/Domain-Model.md`
- `docs/Design-Principles.md`
- `docs/decisions/README.md`

Do not automatically read every canonical document in full for every task.
For feature analysis and implementation, use progressive context discovery:

1. Read the requested feature specification, or the requested increment
   within it, first.
2. Use its requirements, domain touchpoints, references, acceptance criteria,
   and out-of-scope boundaries to identify the canonical context that matters.
3. Consult only the relevant sections of Product Vision, Domain Model, and
   Design Principles needed to validate the feature.
4. Read `docs/decisions/README.md` when the feature may be affected by a prior
   decision, then read only the relevant decision records.
5. Expand into additional documentation only when current evidence identifies
   a specific dependency, ambiguity, or potential conflict.

The goal is sufficient evidence for correctness, not exhaustive document
loading. Do not recursively read every document referenced by a feature merely
because it is referenced.

`docs/reference/` also holds longer-term capability strategy documents,
layered above individual feature specs the same way the Domain Model is:
canonical direction, not any one increment's scope. When a task touches
**work breakdown** (decomposition, breakdown coaching, scaffolding) or
**metacognition/reflection**, consult the relevant sections of the matching
strategy document when needed:

- `docs/reference/work-breakdown-coaching-feature-spec-v0.2.md`
- `docs/reference/metacognition-reflection-feature-spec-v0.2.md`

These describe target-state capability and a phased delivery strategy —
most of what they describe is future-phase, not current scope. The current
increment's own spec under `docs/features/` (e.g.
`manual-work-breakdown-reflection-v0.1.md`) states what's actually in scope
now and takes precedence over a strategy doc: do not pull later-phase
functionality into the current increment merely because it's described in
one of these.

Feature specifications are stored under:

`docs/features/`

Read the feature specification referenced by the current task. If the user
identifies a specific independently deliverable increment within a larger
proposal, treat that increment as the implementation scope and read only the
shared portions of the proposal needed to understand its intent, dependencies,
domain touchpoints, and boundaries.

Project decisions are stored under:

`docs/decisions/`

Before making a significant product, domain, or architectural decision:

1. Review the decision index and any relevant existing decision records.
2. Create a new decision record when appropriate.
3. If none exist, continue without making assumptions.

---

# Visual & Aesthetic Reference

The sibling repository `../OneStepBeyondPrototype` (a Lovable-built
prototype) is this application's source of truth for visual design —
colors, spacing, typography, component chrome, and interaction patterns —
not just behavior.

Feature specifications under `docs/features/` name a specific prototype
route as "Source" when a directly matching screen exists (e.g.
`src/routes/activities.tsx`). When a feature has **no** matching prototype
screen — as with `course-setup.md` — its UI must still adopt the
prototype's overall look and feel (component style, spacing scale, color
tokens) rather than inventing a new aesthetic or falling back to bare,
unstyled markup.

The prototype is built with Tailwind CSS and shadcn/ui. See
`docs/decisions/20260814-adopt-prototype-visual-design-toolchain.md` for
how that interacts with this file's YAGNI guidance on introducing that
tooling.

## Prototype Evidence

When a feature specification already records prototype evidence — such as
specific routes, components, commits, screenshots, behaviors, or design
observations — treat that evidence as the starting point. Do not automatically
repeat the investigation.

Inspect the prototype directly when:

- the feature spec does not contain enough visual or behavioral detail;
- implementation requires exact styling or interaction details not captured in
  the spec;
- the recorded evidence appears inconsistent with the current prototype; or
- an ambiguity cannot otherwise be resolved.

When direct prototype inspection is needed, inspect the smallest relevant set
of files rather than broadly exploring the prototype.

---

# Development Workflow

Before implementing any feature:

1. Read the requested feature specification or requested increment.
2. Verify it against the relevant canonical project context using the
   progressive context-discovery rules above; do not preload canonical
   documents in full unless the task actually requires them.
3. Use prototype evidence already recorded in the feature specification.
   Inspect `../OneStepBeyondPrototype` only when additional visual or
   behavioral evidence is required, per "Prototype Evidence" above.
4. If requirements are ambiguous, stop and ask.
5. Do not implement functionality outside the feature scope.
6. Preserve existing behaviour unless requirements explicitly change it.
7. Prefer incremental refactoring over rewrites.
8. Explain significant architectural changes before implementing them.
9. Never commit secrets or `.env` files.

---

# Implementation Philosophy

Build the application as a sequence of small, independently testable
increments.

Prefer:

- extending existing abstractions;
- reusable domain services;
- pure TypeScript business logic;
- small focused pull requests;
- readable code over clever code.

Avoid:

- speculative generalization;
- premature optimization;
- unnecessary frameworks;
- unrelated refactoring;
- rewriting working code.

When uncertain, implement the smallest solution that satisfies the current
feature.

## You Aren't Going to Need It

The shared domain model describes concepts and relationships that matter — it is a guide to correctness, not a prescription for what to implement today.

Before introducing a new table, entity, or abstraction, confirm that the
current feature genuinely requires it. A concept can be acknowledged in a
decision record or code comment without becoming a database table this
increment. If a future feature needs a richer model, introduce it then.

This applies directly to the app's platform direction. This is a
mobile-first web app that **will** become a PWA, built in two phases
(`docs/decisions/20260924-pwa-in-two-phases.md`):

- **Phase 1 (installable), built:** a web app manifest, app icons, and
  standalone meta tags, delivered with the mobile shell
  (`docs/features/mobile-app-shell-and-touch-ergonomics-v0.1.md` §7).
- **Phase 2 (offline), in progress:**
  `docs/features/pwa-phase-2-offline-v0.1.md`, decided in
  `docs/decisions/20260925-pwa-phase-2-approach.md`. Increment 2a (the
  app opens offline; safe updates via `vite-plugin-pwa`) is built. 2b
  (last-known plan offline, stored by `src/services/`) and 2c (offline
  session actions) follow, each through `analyze-feature`. Push
  notifications are deferred to their own spec. The service worker is
  off in development; test offline behaviour against a production build
  (`vite preview`). Keep every data access behind `src/services/`, since
  offline data and queued writes build on that layer, never on
  components.

The app **may** also later be wrapped in something like Capacitor for
native distribution. That is still undecided. Don't install Capacitor
or native tooling speculatively. If a decision is made to go that way,
record it in `docs/decisions/`.

Ask before building:
- Does any acceptance criterion in the current feature require this?
- Would omitting it force a correctness-breaking workaround, or just defer work?
- Can the simpler approach be migrated cleanly if the need arises later?

If the answers are no, no, and yes — keep it simple.

---

# Engineering Standards

Technology stack:

- React
- TypeScript (strict)
- Vite
- Supabase
- React Router
- TanStack Query
- Tailwind CSS
- shadcn/ui
- ESLint
- Oxlint
- Vitest
- Playwright (synthetic persona assessments and lightweight e2e smoke checks
  — see `synthetic/README.md`)

Only React, TypeScript, Vite, and Supabase are installed at the base of
this template. Tailwind CSS and shadcn/ui are the exception to "add it
when a feature needs it": adopt them as soon as UI work begins, since
they're what `../OneStepBeyondPrototype`'s design system is built on (see
"Visual & Aesthetic Reference" above and
`docs/decisions/20260814-adopt-prototype-visual-design-toolchain.md`). Add
React Router, TanStack Query, and Oxlint separately, only when a feature
actually needs them.

---

# Architecture Principles

## General Principles

Portable software-design guidance, not specific to this application's
stack or structure — safe to carry into another project's CLAUDE.md
largely unchanged.

- Keep UI components thin — presentation only, no business logic.
- Prefer composition over inheritance.
- Design for testability.
- Minimize coupling between UI and business logic.
- Algorithms should be pure functions where practical.

## Project-Specific Architecture

Specific to this application's stack and structure. These name real
conventions already in use in `src/` — treat a change to one of them as
an architectural decision (see "Architectural Decisions" below), not a
casual edit.

- Business logic belongs in `src/services/` (I/O, including all Supabase
  calls) and `src/domain/` (pure business rules) — keep Supabase access
  centralized in the services layer; no direct Supabase client calls from
  components or hooks.
- Shared data-fetching and error-display patterns
  (`src/hooks/useAsyncData.ts`, `src/components/ErrorBanner.tsx`) are the
  default for a component that fetches data or reports a load/action
  error — see
  `docs/decisions/20260911-architecture-refactor-proposal.md` for why.
- Large pages are composed from focused sibling components/hooks under a
  page-specific subfolder (e.g. `src/pages/plan/`, `src/pages/home/`)
  rather than grown as a single file — see
  `docs/decisions/20260912-page-complexity-reduction-proposal.md`.

---

# UI Quality Standards

## Mobile-first responsive design

This application's primary target is a mobile browser, not desktop. Design
and build for a 320–428 px viewport first, then progressively enhance for
tablet and desktop with Tailwind's responsive prefixes (`sm:`, `md:`,
`lg:`) — don't design at desktop width and shrink it down afterward.

- Prefer stacking layouts over horizontal scrolling or dense multi-column
  layouts.
- Touch targets are at least 44×44 px (WCAG 2.5.5), not just clickable —
  tappable with a thumb, with adequate spacing from neighboring targets.
- Avoid interactions that assume a mouse (hover-only affordances,
  right-click menus, small precise drag handles) unless a touch-friendly
  equivalent is also provided.
- Test new UI at mobile, tablet, and desktop breakpoints before marking
  work complete — mobile is not the breakpoint you check last.

## Accessibility — WCAG 2.2 AA

All new UI must meet WCAG 2.2 Level AA. In practice this means:

- **Keyboard navigable.** Every interactive element is reachable and
  operable by keyboard alone. Focus order follows reading order.
- **Focus visible.** The focused element always has a clearly visible focus
  ring. Do not suppress the default outline without replacing it with an
  equivalent.
- **Labels.** Every form input has an associated `<label>` or `aria-label`.
  Icon-only buttons have an `aria-label`. Images have meaningful `alt` text
  or `alt=""` when decorative.
- **Colour contrast.** Text meets 4.5:1 contrast against its background
  (3:1 for large text) — this applies to *every* text/background pairing you
  introduce, including small badges, chips, and muted/secondary text, not
  just body copy. A light translucent background (e.g. a `/10` or `/15`
  opacity wash) composited over another tinted surface is a common way to
  accidentally fail this — check the actual rendered contrast, don't assume
  a "light" color pairing is automatically legible. Do not convey
  information by colour alone.
- **Semantic HTML.** Use the correct element for the job: `<button>` for
  actions, `<a>` for navigation, heading levels in order, lists for list
  content.
- **ARIA only when needed.** Prefer native HTML semantics over ARIA roles.
  Add ARIA only when no native element exists for the purpose.

shadcn/ui components are built on Radix UI primitives which handle most
keyboard interaction and ARIA patterns automatically. Use them as the
default; only reach for custom implementations when the primitive
genuinely does not fit.

---

# Available Claude Code Tooling

This project ships with project-level skills and agents under `.claude/`.
They are generic — none assume any specific application's data model.

## Skills

- **`analyze-feature`** (`.claude/skills/analyze-feature/`) — produces a
  read-only build plan for a `docs/features/*.md` spec (feature summary,
  requirements review, domain review, architecture review, implementation
  plan, testing plan, risks) without modifying any files. Use this before
  implementing any non-trivial feature.
- **`run-synthetic-persona-assessment`** and
  **`generate-requirements-from-persona-assessment`**
  (`.claude/skills/`) — the synthetic persona testing workflow. See
  `synthetic/README.md` for how to define a persona/mission/assessment for
  this application and run one.
- **`generate-ddd-documentation`** (`.claude/skills/`) — produces
  Domain-Driven Design documentation (bounded context map, aggregates,
  Mermaid diagrams) for this application. Useful periodically as the
  application grows, and especially before a significant refactor or
  before onboarding to an unfamiliar part of the codebase.
- **`run-iterative-playwright-development`** (`.claude/skills/`) —
  **experimental, not the normal development process.** Runs
  `docs/iterative-development-playwright-process.md`'s unattended
  analyze/tag/build/evaluate/commit loop (up to 3 iterations) inside an
  isolated git worktree, driven by an independent synthetic persona
  assessment rather than the feature spec itself. Only invoke this when
  explicitly asked to run that experiment — normal feature work uses
  `analyze-feature` and the ordinary tagging/commit rules in this file.

## Agents

- **`schema-migration-reviewer`** (`.claude/agents/`) — reviews Supabase
  migrations for schema/RLS coverage drift: columns silently missing from a
  clone/copy-style SQL function, junction tables a clone function forgot
  about, and RLS policies that hardcode a value that should instead respect
  a later-added configuration flag. Invoke it before considering any
  migration touching a copy/clone function or an RLS policy "done."

## Feature Build Prompt

Use the `analyze-feature` skill before implementing any non-trivial feature.
It is the single source of truth for the read-only analysis/build-plan process,
including progressive context selection and increment-scoped analysis.

After the plan has been reviewed and the spec updated as needed, the trigger to
proceed is:

```
Implement.
```

## Architectural Decisions

During implementation, if a significant architectural decision is made — a
non-obvious choice between two or more reasonable approaches, a deviation
from an existing pattern, or a trade-off with future consequences — create
a decision record under `docs/decisions/`.

Check `docs/decisions/README.md` for the format in use. If no README
exists, use a short markdown file named `YYYYMMDD-short-slug.md` with
sections: **Context**, **Decision**, **Alternatives considered**,
**Consequences**.

---

# Repository Tagging

Before implementing any change that carries meaningful risk of data loss or
hard-to-reverse breakage — schema migrations, destructive refactors,
changes that touch many files at once — propose a tag name and wait for
confirmation before applying it.

Tag naming convention: `v-pre-<short-slug>` (e.g.
`v-pre-tournament-timezone`).

Do not tag automatically. Propose the name, then apply it only after the
user confirms.

---

# Definition of Done

Before considering work complete:

1. Add or update tests covering the acceptance criteria.
2. Run:

```bash
npm run lint
npm run test:run
npm run build
```

3. Fix any failures.
4. Do not leave the project in a failing state.

---

# Deliverables

At the end of every implementation, summarize:

1. What changed.
2. Files modified.
3. Tests added or updated.
4. Commands run.
5. Remaining issues or technical debt.
6. Suggested next increment.
