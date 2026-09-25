# Home's secondary screens become App-level overlays

Date: 2026-09-24

## Context

`docs/features/mobile-app-shell-and-touch-ergonomics-v0.1.md` §1 adds a
trailing slot to the bottom tab bar: an **"Add assignment"** quick-add on
phones, and **"Settings"** from `sm:` up. Both must work from *any* tab.

Until now, Assignment capture, Settings, Courses, Activities, Study hours
(`PreferencesPage`), and Support were all **sub-views of `HomePage`**,
held in its own `view` state. They could only be reached while the Home
tab was active, and they were rendered in place of Home's content. A
button in the tab bar has no way to switch `HomePage`'s internal state
while Plan or Assignments is showing.

These screens are also linked to each other. Capture links to Courses
(for a student with no courses), and Settings links to Activities,
Courses, Study hours, and Support. So lifting only capture and Settings
wouldn't work: their links would lead back into a `HomePage` that
isn't mounted.

This app already has an established way to show a screen above
whichever tab is active: Assignment Detail
(`20260817-assignment-detail-global-overlay.md`) and Today Execution
(`20260816-today-execution-interim-entry-point.md`) are both App-level
state that renders in place of the active tab's content.

## Decision

1. **All six of Home's secondary screens become one App-level overlay
   state** in `App.tsx`: `capture`, `settings`, `courses`, `activities`,
   `preferences`, and `support`, with `null` meaning "show the active
   tab". It sits alongside `openAssignmentId` and `executingToday`.
   `HomePage` no longer owns a `view` state. It calls App-level callbacks
   (`onOpenCapture`, `onOpenSettings`, `onOpenSupport`).
2. **Closing an overlay shows whichever tab was active when it opened.**
   Opening an overlay never changes `activeTab`, so this happens
   naturally, exactly as it does for Assignment Detail. Plan's lifted
   day/step/tab state is untouched.
3. **Back routes:** Support, Activities, and Study hours Back →
   Settings. Courses Back → **whichever screen opened it**: Settings, or
   capture when it was opened from capture's "Add a course" (so a
   student with no courses returns to the assignment they were adding).
   Capture's Cancel and Settings' Back close the overlay. Saving an
   assignment closes the overlay and opens Assignment Detail, as before.
   *(Amended 2026-09-25 by product-owner direction. Originally this
   point preserved the old behavior, where Courses, Activities, and
   Study hours went Back to Home.)*
4. **Tapping any tab closes every overlay**, extending `handleTabChange`,
   which already clears Assignment Detail and Today Execution.
5. **Precedence when more than one is set:** Assignment Detail, then
   Today Execution, then the secondary overlay, then the tab. Capture's
   save path clears the secondary overlay before opening Detail, so in
   practice at most one is ever set.
6. **No router.** A seventh or later global screen is the point to
   reconsider, in its own decision record.

## Alternatives considered

- **Introduce React Router.** Rejected for now. CLAUDE.md says to add
  it only when a feature needs it, and this feature is fully served by
  the overlay pattern already used twice. A router would also force
  rethinking Plan's lifted state and the tab re-tap reset, each of which
  has its own recorded decision.
- **Lift only capture and Settings.** Rejected. Their links go to
  Courses, Activities, Study hours, and Support, which would then point
  into an unmounted `HomePage`.
- **Keep the views in `HomePage` and have tab-bar buttons switch to the
  Home tab first.** Rejected. Quick-add from Plan would silently move the
  student to Home, and Cancel would leave them there instead of back on
  Plan. That's exactly the behavior the spec rules out.

## Consequences

- `HomePage` gets simpler. It renders only its own content, and it
  remounts (and so refetches) every time an overlay closes. For
  example, a newly captured assignment shows on Home without any
  explicit refetch, the same benefit the Assignment Detail overlay
  already provides.
- Home-scoped navigation tests (Settings → Courses and so on) move to
  `App.test.tsx`, where the overlays now live. `HomePage.test.tsx`
  asserts callbacks instead.
- `AssignmentsPage` can open capture directly (its new "Add assignment"
  button and empty-state action), where before it could only say "Go to
  Home".
