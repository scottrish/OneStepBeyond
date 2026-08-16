# Plan tab's day/step: lifted state, and not reset on re-tap

## Context

`docs/features/iterations/daily-planning/daily-planning.i02.md` FR-2
requires the Plan wizard's selected day and current step to survive the
student switching to another bottom-nav tab and back. Root cause:
`App.tsx` conditionally renders each tab's page
(`{activeTab === "plan" && <PlanPage .../>}`), which unmounts `PlanPage`
and destroys all of its local `useState` whenever another tab is active.

`App.tsx` also has an existing, separate convention (FINDING-WB-001):
tapping a tab — even one that's already active — increments a
per-tab `tabResetKeys` counter, forcing a fresh `key` and therefore a
full remount, so a page's own nested navigation (e.g. Assignment Detail
within Assignments) has a way to snap back to that tab's landing view
when its tab is tapped again.

FR-2's acceptance criterion only requires the day/step to survive
*switching away and back*. It says nothing about what a genuine re-tap
of Plan, while already on Plan, should do — and Plan now also has its
own nested sub-view (FR-1's in-place "Break this down" flow), so the
existing reset-on-re-tap convention is still potentially relevant to it.

## Decision

1. Lift only `date` and `step` out of `PlanPage`'s local state into
   `App.tsx` (`planDate`/`planStep`), passed down as controlled props.
   Everything else PlanPage tracks locally (chosen items, times,
   show-more, the just-confirmed acknowledgment, and the new
   breakdown sub-view) stays local and is intentionally lost on any
   remount — FR-2's acceptance criteria don't ask for those to survive,
   and preserving a `step` like "estimate" without its matching
   selections would render a broken/empty screen (guarded against in
   `PlanPage` via a `safeStep` fallback to "day" when that happens).

2. Keep `tabResetKeys.plan` incrementing on every tap of the Plan tab
   (re-tap or switch-to), unchanged from the existing convention — this
   still serves its original purpose of escaping Plan's own nested
   breakdown sub-view back to the wizard.

3. Do NOT reset `planDate`/`planStep` when Plan is re-tapped. Because
   they live in `App.tsx`, remounting `PlanPage` (whether via the
   `tabResetKeys` key change or the conditional-render unmount) never
   touches them — so this is the default outcome of lifting the state,
   not extra code. A re-tap of Plan now behaves as "return to the
   wizard's current day/step, discarding any nested breakdown view and
   uncommitted selections," rather than Home/Assignments' "return to
   this tab's landing view, full stop."

## Alternatives considered

- **Reset day/step to Today/Step 1 on every Plan re-tap**, matching
  Home/Assignments exactly. Rejected: once Plan holds multi-step,
  effortful in-progress work, silently discarding it on an accidental
  double-tap of the tab the student is already on is exactly the kind
  of state-loss iteration 1's assessment flagged as a problem (FR-2 was
  written to fix this for the away-and-back case; punching the same
  hole back open for re-tap would be inconsistent).
- **Lift the full wizard state (chosen items, times, etc.) so any step
  can be safely restored**, not just day/step. Rejected as over-scope
  for this iteration: FR-2's acceptance criteria only mention day/step,
  and the realistic scenario motivating it (FINDING-DP-007) — a detour
  to break down an assignment, or a quick check of another tab — most
  plausibly happens at/before the Select step, where nothing has been
  chosen yet. The `safeStep` fallback handles the deeper-step edge case
  cheaply without the extra prop surface.

## Consequences

- A student who taps away from Plan (Home, Assignments) and back
  resumes on the same day/step, per FR-2.
- A student who double-taps the already-active Plan tab also keeps
  their day/step (a deliberate, minor divergence from Home/Assignments'
  full-reset convention), but loses any in-progress selections/times and
  exits any open breakdown sub-view — consistent with how re-tap already
  behaves for nested views on other tabs.
- If a future increment needs mid-flow selections to survive as well
  (e.g. Estimate/Schedule state), lifting `chosen`/`times` the same way
  is a small, structurally identical follow-up — nothing here blocks it.
