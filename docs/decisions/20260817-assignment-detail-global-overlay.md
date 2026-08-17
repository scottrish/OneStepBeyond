# Assignment Detail becomes a global overlay owned by App.tsx

Date: 2026-08-17

## Context

Assignment Detail was reachable from two places, each with its own,
independent implementation: `AssignmentsPage.tsx` owned a local
`{name:"detail"}` view, rendered `AssignmentDetailPage` itself, refetched
its list on the way back, and wired a "brief Undo" soft-delete
(`requestDeleteWithUndo`/`pendingDeleteTimer`) specific to that screen.
`HomePage.tsx` independently owned a *second* local
`{name:"assignment-detail"}` view (used by Needs Attention's "Break it
down," the just-captured-assignment landing spot, and Coming Up), with no
Undo wiring and — confirmed while auditing this — **no refetch on the way
back**, meaning an edit made from Home's own entry point left Home
showing stale data until the student switched tabs away and back. Two
independent, already-inconsistent implementations of the same screen.

This was raised while planning Week Look-Ahead (`docs/features/
week-lookahead.md`, not yet built), whose UX Flow calls for due items to
link to their Assignment — a third call site. Building it as a third
local copy would cement the drift rather than fix it; per product-owner
direction, this was the point to address the underlying duplication
properly rather than descope the link.

## Decision

Assignment Detail is now a single overlay owned by `App.tsx`, following
the same shape already established for Today Execution (see
`docs/decisions/20260816-today-execution-interim-entry-point.md`):

- `App.tsx` holds `openAssignmentId: string | null`. Any page that
  displays an assignment gets one prop, `onOpenAssignment: (id: string)
  => void`, wired to `setOpenAssignmentId`.
- `App.tsx` renders `<AssignmentDetailPage assignmentId={openAssignmentId}
  onBack={() => setOpenAssignmentId(null)} .../>` in place of the active
  tab's content when set — the same ternary-replace shape already used
  for `executingToday`. `AssignmentDetailPage` itself needed no changes;
  it already only depended on `assignmentId`/`onBack`/`onDeleteImmediate`
  and fetches its own data.
- `AssignmentsPage.tsx`'s and `HomePage.tsx`'s own local `{name:"detail"}`
  view variants are removed entirely — both now call the shared prop.
- Because `activeTab` never changes when Detail opens, "back" trivially
  returns to whichever tab was showing. Because opening it unmounts that
  tab's content, returning remounts it fresh, which refetches
  automatically — this is what fixes Home's stale-data gap as a side
  effect, with no explicit refetch-on-back plumbing needed anywhere.
- `handleTabChange` clears `openAssignmentId` alongside `executingToday`,
  so tapping a tab always exits Detail the same way it already exits
  Today Execution.
- The Undo-window soft-delete (`UNDO_WINDOW_MS`, the timer, the toast) is
  likewise moved to `App.tsx` in full — not just the trigger. Any page
  that can delete an assignment (currently only `AssignmentsPage`'s own
  inline card action, plus Detail's own delete button reachable from
  anywhere) calls the same lifted `onDeleteImmediate`/`requestDeleteWithUndo`,
  and the toast itself renders once, at `App.tsx`/`AppShell` level,
  regardless of which tab is active. Pages that render an assignment list
  (`AssignmentsPage`) receive `pendingDeleteAssignmentId` and filter it
  out locally, since the server delete hasn't actually happened yet
  during the Undo window.

Product-owner direction (2026-08-17): a plain client-side Undo-window
soft-delete may later be replaced with a traditional confirm-before-delete
dialog. Centralizing it now, rather than leaving it duplicated per screen,
means that future change happens in one place.

Scope explicitly **not** included here: Plan's Select-step candidate
cards were not wired to `onOpenAssignment` — they're nested inside a
multi-select checkbox row, a different interaction-design question
(does tapping the row toggle selection, open Detail, or both?) that
deserves its own look rather than a bolt-on. The Day step's plain "Due:"
list, Home's Next/Needs Attention/Coming Up, and both of Assignments'
own lists are wired.

## Alternatives considered

- **Duplicate a third local `{name:"detail"}` view inside Plan/Week
  Look-Ahead.** Rejected — this is the exact duplication being fixed,
  and would have left three-then-four independently-maintained copies of
  the same screen with no guarantee they stay behaviorally consistent
  (as Home's missing refetch already demonstrated).
- **Descope the Assignment link to plain, non-interactive text** (the
  original plan while analyzing Week Look-Ahead, before this decision).
  Rejected on product-owner direction: the underlying problem had already
  surfaced twice and was worth fixing once, properly, rather than working
  around it a third time.
- **Keep two independent Undo mechanisms** (AssignmentsPage's own
  inline-card delete, and a new App-level one for Detail-triggered
  deletes reached from elsewhere). Rejected — small enough to unify, and
  two toasts that could theoretically both be showing at once is exactly
  the kind of inconsistency this change exists to remove.
- **Keep tabs mounted underneath Detail instead of unmounting/remounting
  them** (a true layered/modal overlay, rendered as an additional
  sibling rather than a ternary swap). Would preserve every last bit of
  a tab's own local UI state across the round trip, but requires new CSS
  stacking/positioning work this codebase doesn't otherwise have, and
  loses the "remount refetches automatically" correctness property this
  decision relies on to fix Home's staleness bug for free. Rejected as
  more machinery than the requirement calls for; the same trade-off was
  already accepted for Today Execution.

## Consequences

- `App.tsx` now owns two overlays (`executingToday`, `openAssignmentId`)
  plus the Undo-delete timer/toast — `openAssignmentId` takes precedence
  if both were ever true simultaneously, though no current entry point
  can reach Assignment Detail from within Today Execution, so this isn't
  exercised today.
- Any future screen that displays an assignment (Week Look-Ahead
  included) gets a working, consistent "view details / edit" link for
  the cost of one prop — no new rendering or Undo logic required.
- `AssignmentsPage.test.tsx`'s and `HomePage.test.tsx`'s own
  Detail-round-trip and Undo-timer tests moved to `App.test.tsx`, where
  the behavior now actually lives; both pages' own tests became simpler,
  prop-driven unit tests (tapping a card calls `onOpenAssignment`;
  deleting calls `onDeleteImmediate`) instead of exercising a full nested
  render of `AssignmentDetailPage`.

**Update (2026-08-17, Undo-window delete removed):** the "Product-owner
direction" note above proved out — the Undo-window soft-delete this
record centralized was replaced the same day with a plain
confirm-before-delete dialog, exactly the swap this record anticipated.
See `docs/decisions/20260817-remove-undo-delete.md`. Everything else in
this record still holds: Assignment Detail is still a single overlay
owned by `App.tsx`, reached the same way from every tab. What changed is
narrower than it sounds — `UNDO_WINDOW_MS`, the timer, the toast, and
`hiddenAssignmentIds` are gone from `App.tsx`; `onDeleteImmediate` is gone
from `AssignmentDetailPageProps`/`AssignmentsPageProps`/
`AssignmentCardProps`. The "two overlays... plus the Undo-delete
timer/toast" line in Consequences above is accordingly stale — `App.tsx`
now owns just the two overlays (`executingToday`, `openAssignmentId`),
nothing more.
