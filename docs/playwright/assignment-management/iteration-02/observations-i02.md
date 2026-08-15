# Observations — Iteration 2

Derived from `findings.yaml` and `report.md` in this directory.

## What the persona attempted

Alex re-ran the three specific scenarios that produced friction in
iteration 1: capturing an assignment via Home's "+" and then tapping the
bottom-nav "Home" tab, reviewing "Worksheet 12"'s time estimate after it
had a single step, and deleting a fresh assignment with no completed
steps. Also spot-checked that previously-working behavior (editing,
completing, the plain list view) still worked.

## What was observed

- The bottom-nav "Home" tab now always returns to Home's landing view,
  even when reached via a nested Assignment Detail screen from Home's
  "+". (`i02-01-home-tab-fixed.png`)
- Deleting an assignment with no completed steps now shows a
  "'{title}' deleted." message with an "Undo" button; the delete is only
  sent to the server once a short window elapses, confirmed both live
  (`i02-02-undo-banner.png`, `i02-03-delete-committed-after-window.png`)
  and via unit tests covering both the Undo path and the elapsed-window
  commit path.
- "Worksheet 12"'s Detail screen now reads "15m of work left · you
  estimated 45m in total," and its list card reads "About 15m left of
  45m planned" — both figures visible together instead of one silently
  replacing the other.
- No regressions: "Cell structure reading" remains correctly shown under
  "Finished," and list/edit behavior from iteration 1 is unchanged.

## Why it matters

All three findings that justified continuing past iteration 1
(FINDING-AM-001 at `implementation_defect`/`high`, FINDING-AM-005 and
FINDING-AM-006 at `ux_improvement`/`medium`) are now resolved, verified
with both live evidence and unit tests. No new finding this iteration
meets the deterministic continue bar
(`implementation_defect`/`specification_gap`/`ux_improvement` at
`high`/`medium`) — the only open item, FINDING-AM-007, is unchanged,
`low` severity, and already correctly deferred to a future feature. Per
the process's stop rule, this experiment stops here.

## Evidence

- `screenshots/i02-01-home-tab-fixed.png` through
  `screenshots/i02-03-delete-committed-after-window.png`
- `transcript.md`
- `findings.yaml` — FINDING-AM-001 through FINDING-AM-007 (resolved/
  reaffirmed/deferred statuses)

## Suggested improvement

None. Revisit FINDING-AM-007 once the Today-execution/Planning feature
ships per-step completion — not before.
