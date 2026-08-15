# Adopt the Prototype's Visual Design Toolchain Early

Date: 2026-08-14

## Context

CLAUDE.md's YAGNI guidance says to add Tailwind CSS and shadcn/ui only
"when a feature actually needs them," and the first two increments built
under that guidance (the skeleton's `LoginPage`/`HomePage`, and
`course-setup.md`'s `CoursesPage`) were built with plain inline styles and
`index.css` custom properties instead.

Separately, it's been clarified that `../OneStepBeyondPrototype` (the
Lovable-built prototype referenced in
`docs/decisions/20260813-student-only-first-increment.md`) is this
application's source of truth for visual design — colors, spacing,
typography, component chrome — not just behavior, and this applies even
to features (like `course-setup.md`) that have no directly matching
prototype screen to copy behavior from.

The prototype is itself built on Tailwind CSS v4, shadcn/ui, Radix UI
primitives, and class-variance-authority (confirmed via its
`package.json` and `components.json`). Both of these are already named in
CLAUDE.md's Engineering Standards tech stack list — the only question is
timing. Matching the prototype's look and feel by hand, in a different
styling approach, would mean manually re-deriving its design tokens,
spacing scale, and component chrome and keeping them in sync by eye —
exactly the kind of duplicated, drift-prone effort YAGNI is meant to
avoid elsewhere, not something YAGNI's "wait until a feature needs it"
framing was written to justify.

## Decision

Tailwind CSS and shadcn/ui are adopted now, as soon as UI work begins,
rather than waiting for an individual feature to "need" them. This is a
deliberate, named exception to CLAUDE.md's general "add tooling when a
feature needs it" rule: the need here is visual-fidelity to the
prototype, a product-level constraint that exists from the first screen,
not a speculative technical generalization.

React Router, TanStack Query, and Oxlint are unaffected by this decision
and remain deferred until a feature actually needs them — this decision
is scoped to the two tools that directly determine visual output.

The existing skeleton (`LoginPage.tsx`, `HomePage.tsx`) and
`course-setup.md`'s `CoursesPage.tsx` currently do not use this toolchain
and will look inconsistent with prototype-matched UI built afterward.
Retrofitting them is a separate, explicit increment — propose a tag and
scope it on its own per this repo's tagging convention, rather than
silently folding a reskin into unrelated feature work.

## Alternatives considered

- **Keep hand-rolled CSS custom properties and manually replicate the
  prototype's visual tokens.** Rejected: this means maintaining visual
  parity with a Tailwind/shadcn design system by hand, in a different
  technology, indefinitely — it drifts easily and re-does work the
  prototype (via Lovable's shadcn scaffolding) already did.
- **Defer visual-fidelity work indefinitely and do one large "reskin"
  pass at the end of the increment.** Rejected: makes every feature's UI
  throwaway work, and this repo's UI Quality Standards (mobile-first,
  WCAG 2.2 AA) would effectively get validated twice — once against
  ad-hoc markup, once against the real component set.
- **Adopt the toolchain but keep building net-new UI in the old style
  until a dedicated "introduce Tailwind" increment lands.** Rejected:
  produces the same drift as the first alternative in the interim, for no
  benefit over adopting it immediately.

## Consequences

- Tailwind CSS and shadcn/ui should be installed and configured as part
  of the next UI-touching increment, ahead of the "when a feature needs
  it" trigger CLAUDE.md otherwise describes for the rest of the stack.
- `LoginPage.tsx`, `HomePage.tsx`, and `course-setup.md`'s `CoursesPage.tsx`
  need a follow-up increment to adopt the prototype's design system —
  tracked as technical debt until proposed and tagged separately.
- Future feature specs and builds consult `../OneStepBeyondPrototype`'s
  corresponding screen (or, absent one, its general component/token
  usage) for visual patterns, not just behavior — see CLAUDE.md's "Visual
  & Aesthetic Reference" section.
