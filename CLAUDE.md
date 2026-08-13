# OneStepBeyond

## Purpose

Replace this section with a one- or two-sentence description of the
application once its purpose is settled. This file otherwise stays as-is
as the project grows.

---

# Project Documentation

Read these documents if they exist:

- `docs/requirements.md`
- `docs/decisions/README.md`

Feature specifications are stored under:

`docs/features/`

Read **only** the feature specification referenced by the current task.

Project decisions are stored under:

`docs/decisions/`

Before making a significant product, domain, or architectural decision:

1. Review any existing decision records.
2. Create a new decision record when appropriate.
3. If none exist, continue without making assumptions.

---

# Development Workflow

Before implementing any feature:

1. Read the feature specification.
2. Verify it is consistent with `docs/requirements.md`.
3. If requirements are ambiguous, stop and ask.
4. Do not implement functionality outside the feature scope.
5. Preserve existing behaviour unless requirements explicitly change it.
6. Prefer incremental refactoring over rewrites.
7. Explain significant architectural changes before implementing them.
8. Never commit secrets or `.env` files.

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

Before introducing a new table, entity, or abstraction, confirm that the
current feature genuinely requires it. A concept can be acknowledged in a
decision record or code comment without becoming a database table this
increment. If a future feature needs a richer model, introduce it then.

This applies directly to the app's eventual platform direction: this is a
mobile-first web app that **may** later become a PWA and/or get wrapped in
something like Capacitor for native distribution. Don't install PWA
tooling, service workers, or Capacitor speculatively — build the web app
well (mobile-first, responsive, accessible) and add that tooling as its own
increment if and when it's actually needed. If a decision is made to move
in that direction, record it in `docs/decisions/`.

Ask before building:
- Does any acceptance criterion in the current feature require this?
- Would omitting it force a correctness-breaking workaround, or just defer
  work?
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
this template. Add React Router, TanStack Query, Tailwind CSS, shadcn/ui,
and Oxlint when a feature actually needs them, rather than installing the
whole list up front.

---

# Architecture Principles

- Keep React components thin.
- Business logic belongs in services and domain modules.
- Keep Supabase access centralized.
- Algorithms should be pure TypeScript where practical.
- Prefer composition over inheritance.
- Design for testability.
- Minimize coupling between UI and business logic.

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

- **`analyze-feature`** (`.claude/commands/analyze-feature/`) — produces a
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

## Agents

- **`schema-migration-reviewer`** (`.claude/agents/`) — reviews Supabase
  migrations for schema/RLS coverage drift: columns silently missing from a
  clone/copy-style SQL function, junction tables a clone function forgot
  about, and RLS policies that hardcode a value that should instead respect
  a later-added configuration flag. Invoke it before considering any
  migration touching a copy/clone function or an RLS policy "done."

## Feature Build Prompt

Use this two-step prompt pattern when building a new feature from a spec.
(`analyze-feature` above implements Step 1 directly as a skill — invoke it
by name instead of re-typing this prompt.)

### Step 1 — Plan (read-only, no file changes)

```
Read `CLAUDE.md`.

Then read the feature specification:

`docs/features/<feature-name>.md`

Do not modify any files.

Treat this as a planning exercise only.

Review the feature and produce a build plan containing the following sections:

1. **Feature Summary**
   * Summarize the feature in your own words.
   * Identify the user value.

2. **Requirements Review**
   * Identify ambiguities, inconsistencies, or missing acceptance criteria.
   * Suggest improvements to the feature specification.

3. **Domain Review**
   * Identify which parts of this application's domain model are involved.
   * Identify any project-specific domain considerations.

4. **Architecture Review**
   * Describe the components, services, routes, and data model changes required.
   * Explain how the implementation fits the existing architecture.

5. **Implementation Plan**
   * Break the work into logical implementation steps.
   * Identify dependencies between the steps.
   * Recommend any small refactorings that should occur first.

6. **Testing Plan**
   * Identify unit, component, and integration tests required.
   * Map each acceptance criterion to one or more tests.

7. **Risks**
   * Identify technical risks.
   * Identify future extensibility considerations.
   * Recommend anything that should be deferred to a later increment.

Do not implement any code.

Wait for approval before making changes.
```

### Step 2 — Implement

After the plan has been reviewed and the spec updated as needed, the
trigger to proceed is:

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
