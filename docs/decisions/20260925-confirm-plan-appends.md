# Confirming a plan adds to the day; it no longer replaces it

Date: 2026-09-25

## Context

`20260816-daily-planning-confirm-write-order.md` point 1 made confirming
the wizard a **replace**: delete every not-yet-started (`planned`)
session for the date, then insert the wizard's items
(`daily-planning.md`: "Confirming a plan replaces that day's
not-yet-started planned sessions"). Because the wizard only sends the
items chosen in *this* pass, confirming new work for a day that already
had a plan silently deleted the existing plan.

`20260925-existing-day-view.md` adds **Add more work** to a day that
already has a plan, expressly "keeping what is already planned." Under
replace, that button would destroy the plan it's adding to.

The product owner decided on 2026-09-25: **always append.**

## Decision

1. **Confirm only inserts.** It inserts `work_sessions` for the chosen
   items, then records the Planning Session. It never deletes.
   `workSessionService.deletePlannedSessionsForDate` loses its only
   caller and is removed.
2. **The plan is edited in the day view, not by re-planning.** Removing,
   moving to another day, and (roadmap step 10) reordering and re-timing
   happen per session there.
3. **Duplicates are prevented at selection time.** A task that already
   has a not-done session on the chosen day is disabled in Select, with
   a "Planned today · {N} min" note saying why
   (`daily-planning-and-completion-v2-proposal.md` items 6b/6c). Replace
   used to make a same-day duplicate impossible by accident; append
   needs it prevented deliberately.
4. **New work's default times start after the day's existing sessions
   and activities** (`src/domain/defaultStartTimes.ts`), so added work
   never defaults on top of what's already there.
5. **The Planning Session records what this confirm added:**
   `items_planned` and `minutes_planned` for the added items only. It's
   an event ("a planning session happened, and added this"), not a
   snapshot of the day's total.

This supersedes point 1 of `20260816-daily-planning-confirm-write-order.md`.
Its point 2 (where the student lands after confirming) was already
superseded by `20260925-existing-day-view.md` point 4.

## Alternatives considered

- **Keep replace, and pre-load the day's existing sessions into the
  wizard** so confirming writes them back. Rejected: every existing
  session's time and estimate would round-trip through the wizard, and
  "add one thing" would become re-confirming the whole day.
- **Keep replace, and warn.** Rejected: that contradicts "Add more work"
  keeping the existing plan.

## Consequences

- There's no longer a moment where the day's plan has been deleted but
  the new rows aren't written yet. The old delete-then-insert failure
  window is gone.
- "Re-plan the day from scratch" is no longer a thing the wizard does.
  To change a plan, you remove or move sessions in the day view.
- Anything that reads `planning_sessions.items_planned` as "the day's
  plan size" would undercount. Nothing does today: the coach dashboard's
  timeline treats planning sessions as events.
