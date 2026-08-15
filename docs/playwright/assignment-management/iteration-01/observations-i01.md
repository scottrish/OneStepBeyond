# Observations — Iteration 1

Derived from `findings.yaml` and `report.md` in this directory.

## What the persona attempted

Alex checked the Assignments tab first (empty), then set up three
courses and captured three sample assignments from Home. Along the way,
tapping the bottom-nav "Home" tab from an assignment's Detail screen did
nothing, so Alex fell back to the in-page "← Back" button. Once all three
assignments existed, Alex used the Assignments tab (now populated),
opened one and edited its due date, marked a second one fully complete,
deleted a third, and finally added a step to the remaining open
assignment to see how a breakdown would work.

## What was observed

- The bottom-nav "Home" tab is a no-op while nested in Assignment Detail
  reached via Home's "+" — the tab shows as active but the screen never
  changes. The in-page "← Back" button works correctly from the same
  state. (`i01-03-home-tab-noop.png`)
- The Assignments list shows course, due date, title, and remaining-time
  text per item, with no progress bar for any of the three (unstructured)
  sample assignments — matching spec. (`i01-04-assignments-list.png`)
- Inline edit (due date) and "Mark assignment complete" both gave
  immediate, unambiguous on-screen confirmation.
  (`i01-05-assignment-completed.png`)
- Deleting an assignment with no completed steps happens instantly, with
  no confirmation step and no undo. (`i01-06-after-delete.png`)
- Adding a single step to an assignment changed "Remaining" from the
  assignment's full estimate (45m) down to just that step's estimate
  (15m), with nothing on screen explaining why. The step's own checkbox
  is disabled — no way to complete an individual step from this screen.
  (`i01-07-step-shrinks-remaining.png`)

## Why it matters

One genuine implementation defect this iteration: FINDING-AM-001, the
Home-tab dead end, is reachable on the most common path through the
app (capture an assignment from Home, then try to navigate away via the
tab bar) and meets the iterative process's deterministic continue rule
(`implementation_defect` at `high` severity) on its own. Two further
findings (FINDING-AM-005, FINDING-AM-006) are spec-compliant behavior
that still reads as risky or confusing to this persona specifically —
worth addressing but not spec deviations. FINDING-AM-007 (the
confirm-before-delete path is currently unreachable) is expected and
already scoped, per the same precedent as `assignment-capture`'s
FINDING-AC-005 — per-step completion is explicitly deferred to the
Today-execution/Planning feature.

## Evidence

- `screenshots/i01-01-home-initial.png` through
  `screenshots/i01-07-step-shrinks-remaining.png`
- `transcript.md`
- `findings.yaml` — FINDING-AM-001 through FINDING-AM-007

## Suggested improvement

- Fix FINDING-AM-001: reset (or scope) `HomePage`'s internal navigation
  state so the bottom tab bar and the visible screen can never disagree
  about where the user is.
- Consider a lightweight undo affordance for instant deletes
  (FINDING-AM-005).
- Consider a short on-screen cue distinguishing "assignment estimate"
  from "itemized so far" when steps exist but don't cover the whole
  assignment (FINDING-AM-006).
- No action needed yet for FINDING-AM-007 — revisit once per-step
  completion ships.
