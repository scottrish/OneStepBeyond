# The prototype is no longer a reference

Date: 2026-09-26

## Context

Since the start, `../OneStepBeyondPrototype` (a Lovable-built prototype)
has been this app's source of truth for visual design and interaction.
CLAUDE.md told every feature to follow it; specs recorded prototype
routes and evidence; `analyze-feature` checked it. Roadmap Phase 7
(prototype parity) is now complete, and the app has its own
design system: colour tokens in `src/index.css` (light and dark),
shadcn/ui components, and shared components and screens. Recent specs
(for example `assignment-detail-no-steps-v0.1.md`) have started to
depart from the prototype on purpose, where its behaviour had the same
problems as the app's.

## Decision

The product owner decided on 2026-09-26: **the prototype isn't consulted
unless the product owner asks for it.** The app's own design system,
its existing screens and `docs/Design-Principles.md` are the reference
for new work.

Prototype routes and evidence in older specs stay where they are, as
the history of how those features were first built. They're not a
requirement to keep matching the prototype.

## Alternatives considered

- **Keep the prototype as the reference:** it no longer leads the app.
  Checking it adds work, and pulls toward behaviour the app has already
  improved on.
- **Remove prototype references from older specs:** it would lose useful
  history, for no benefit.

## Consequences

- CLAUDE.md ("Visual & Aesthetic Reference", "Development Workflow"),
  the `analyze-feature` skill and `docs/Design-Principles.md` now point
  at the app's own design system.
- The Roadmap's note about re-checking the prototype's `mobile-redesign`
  branch no longer applies.
- `20260814-adopt-prototype-visual-design-toolchain.md` still stands for
  the toolchain (Tailwind CSS, shadcn/ui).
- Visual consistency now rests on reusing the app's tokens and
  components. A new pattern that several screens will share belongs in
  `src/components/`, not copied screen to screen.
