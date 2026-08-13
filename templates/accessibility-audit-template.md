# Accessibility and Mobile Responsiveness Audit Template

Copy this into `docs/` (e.g. `docs/accessibility-mobile-requirements.md`)
and fill it in when auditing this application against `CLAUDE.md`'s UI
Quality Standards (WCAG 2.2 AA + 320px-minimum responsive design). Replace
the placeholders below with real findings from a real audit pass — this
file is a structure, not a checklist to leave blank.

## Overview

State what was audited (which pages/components, or "the whole application")
and against which standard (`CLAUDE.md`'s UI Quality Standards). Note that
line numbers are approximate locators, not fixed targets, since code
shifts.

## Priority 1 — Critical

Issues that prevent users with disabilities from completing core tasks, or
make core screens unusable on mobile. Address these first.

### P1-N [Short title]

**Component:** `path/to/Component.tsx`

**Problem:** [What's wrong, specifically — not "not accessible," but the
actual missing semantic, contrast ratio, or touch-target size.]

**Required changes:**
- [Concrete change]

**WCAG criteria:** [e.g. 2.1.1 Keyboard, 2.4.3 Focus Order, 1.4.3 Contrast]

**Acceptance criteria:**
- [Observable, testable outcome]

---

## Priority 2 — Important

Issues that degrade the experience for users with disabilities or on mobile
but have a workaround, or affect secondary flows.

### P2-N [Short title]

[Same shape as above.]

---

## Priority 3 — Minor

Polish items: contrast on non-critical text, minor touch-target gaps,
inconsistent focus-ring styling.

### P3-N [Short title]

[Same shape as above.]

---

## Common Categories Worth Checking

Not every application will have all of these, but each is worth a
deliberate pass rather than an assumption:

- Custom modal/dialog overlays without proper `role="dialog"`, `aria-modal`,
  focus trap, or Escape handling (prefer the shadcn `Dialog` primitive,
  which provides all of this).
- Navigation/header components that don't collapse below a specific
  viewport width, or touch targets under 44px (WCAG 2.5.5) — this matters
  more than usual for this application, since mobile is the primary target.
- Any small badge/chip/pill using a translucent background color — check
  actual rendered contrast, not just that the color "looks light."
- Icon-only buttons without `aria-label`.
- Form inputs without an associated `<label>`.
- Color used as the only signal for state (error/success/warning) with no
  text or icon backup.
- Focus order that doesn't follow visual/reading order, especially in
  grid or card-based layouts.
