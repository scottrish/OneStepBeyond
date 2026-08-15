# Feature: Design System Adoption

**Status:** Implemented (2026-08-14). Tailwind CSS + shadcn/ui adopted;
`LoginPage`, `HomePage`, and `CoursesPage` retrofitted. Every screen built
since (Assignment Capture, Assignment Detail, Activities, Settings, the
nav shell) was built directly on this toolchain rather than needing its
own retrofit.

## Summary

Adopt Tailwind CSS + shadcn/ui — the toolchain `../OneStepBeyondPrototype`
is built on — as this application's styling foundation, and retrofit the
three screens that exist today (`LoginPage`, `HomePage`, `CoursesPage`) to
use it instead of hand-rolled inline styles and `index.css` custom
properties. This is an infrastructure/technical spec, not a new
user-facing feature: no user-visible behavior is intended to change, only
how it's styled and what it's styled to look like.

## Source

`../OneStepBeyondPrototype` — reference for design tokens (color, spacing,
radii, typography), component chrome, and interaction states. There is no
single prototype route to port screen-for-screen here, since this spec
retrofits OneStepBeyond's own existing screens rather than building new
ones — see `docs/decisions/20260814-adopt-prototype-visual-design-toolchain.md`
for why this is being done now rather than deferred.

## User Story

As a developer building any future OneStepBeyond screen, I want a
prototype-matched component toolkit already in place, so new features
don't each invent their own styling approach and the application reads as
one consistent product rather than a skeleton with mismatched screens
bolted on as they're built.

## Scope of Change

Not a user-facing UX flow — this section replaces the usual "UX Flow" with
what actually changes, screen by screen and layer by layer.

**Toolchain:**

- Install and configure Tailwind CSS v4 (matching the prototype's major
  version) and shadcn/ui (`components.json`) in OneStepBeyond.
- Port the prototype's design tokens — light/dark color palette, spacing
  scale, radii, font stack — into OneStepBeyond's Tailwind config /
  CSS variable layer, replacing `index.css`'s current hand-picked
  values with the prototype's actual values.
- Add only the shadcn primitives the three existing screens actually use:
  `Button`, `Input`, `Label`. Nothing else.

**Screens (behavior-preserving restyle only):**

- `LoginPage.tsx` — email/password form, sign in / sign up buttons.
- `HomePage.tsx` — heading, gear/Settings icon, signed-in-as text, sign
  out button.
- `CoursesPage.tsx` — back button, course list (color swatch + tap-to-
  rename name), empty state, error states (`role="alert"` load-error and
  add-error banners from `course-setup.i02.md`), add-course form.

Every interaction each screen currently supports must keep working
exactly as it does today — this spec changes appearance, not behavior.

## Functional Requirements

- Tailwind CSS builds correctly via the Vite plugin, with content globs
  covering `src/**`.
- `shadcn/ui` is initialized with configuration reasonably adapted from
  the prototype's own `components.json` (style, base color, CSS
  variables mode) rather than shadcn's un-adapted defaults.
- Design tokens (colors for both light and dark, spacing, radii,
  typography) are ported from the prototype's actual values, not
  reinvented.
- `LoginPage`, `HomePage`, and `CoursesPage` are rebuilt with Tailwind
  utility classes and the three shadcn primitives above, replacing their
  current inline `style={{}}` props and `index.css` rules.
- Every existing behavior is preserved exactly: sign in / sign up / sign
  out, the gear icon → Courses navigation and its back button, course
  create / rename-in-place / list, the empty state, the load-error state
  with retry, the add-error state that preserves typed input, and the
  add-button's disabled-until-non-empty state.
- All existing Vitest tests continue to pass. Because they query by role
  and accessible label (`getByRole`, `getByLabelText`) rather than
  markup structure, no test should need behavioral changes — only
  updates if an accessible name or label text is deliberately changed as
  part of the restyle, which should be avoided unless necessary.
- WCAG 2.2 AA compliance (contrast, focus visibility, labels, touch
  targets) holds under the new tokens — this needs explicit verification
  since the color values are new, not carried over from values already
  checked.
- Mobile-first responsive behavior (320–428px first, then `sm:`/`md:`/
  `lg:`) is preserved or improved, per CLAUDE.md's UI Quality Standards.

## Acceptance Criteria

- Tailwind CSS and shadcn/ui are installed and configured; `Button`,
  `Input`, and `Label` are in use by at least one screen each.
- `LoginPage`, `HomePage`, and `CoursesPage` visually match the
  prototype's look and feel (color, spacing, button/input chrome) —
  verified by comparing screenshots of each retrofitted screen against
  the closest equivalent prototype screen, not by code review alone.
- No existing test's assertions change in a way that reflects a
  behavior change; any test file touched should show only
  selector/markup-level diffs, if any.
- `npm run lint`, `npm run test:run`, and `npm run build` all pass.
- A manual mobile/tablet/desktop breakpoint check (per CLAUDE.md) shows
  no regression in touch target size, contrast, or focus visibility.
- No shadcn component beyond `Button`, `Input`, and `Label` is added.

## Domain Model Touchpoints

None. This is a presentation-layer change only — no entities, tables, or
business logic are affected.

## Explicitly Out of Scope (this increment)

- Any shadcn component beyond `Button`, `Input`, `Label` (e.g. `Dialog`,
  `Select`, `Tabs`) — added later, only when a feature actually needs it,
  per CLAUDE.md's YAGNI guidance applied at the component level.
- React Router, TanStack Query, and Oxlint — unaffected by this decision;
  still added only when a feature needs them
  (`docs/decisions/20260814-adopt-prototype-visual-design-toolchain.md`).
- Any new user-facing functionality, copy change, or behavior change.
- Porting the prototype's full component library, or any prototype
  screen that doesn't correspond to something already built in
  OneStepBeyond.
- A manual light/dark theme toggle control — token *values* for both
  modes are ported via `prefers-color-scheme` (matching the convention
  `index.css` already uses), but a visible toggle switch is out of scope
  unless the prototype's own equivalent screens already expose one;
  confirm against the prototype during implementation.

## Implementation Notes

- This is normal feature work: build it via the standard `analyze-feature`
  → `Implement` flow and this repo's ordinary Definition of Done, tagging,
  and commit conventions — **not** the experimental
  `run-iterative-playwright-development` process.
- Per CLAUDE.md's Repository Tagging section, this touches every existing
  screen at once — propose a `v-pre-design-system-adoption` tag and wait
  for confirmation before starting.
- Since no behavior is meant to change, this is a good candidate for
  running the existing Vitest suite continuously through the retrofit
  rather than only at the end, to catch an accidental behavior change as
  soon as it happens rather than after the fact.
