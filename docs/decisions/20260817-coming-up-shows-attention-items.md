# Coming Up shows Needs Attention's assignment(s) instead of hiding them

Date: 2026-08-17

## Context

`home-dashboard.md`'s original design capped Needs Attention at exactly
one item and required Coming Up to actively exclude it, so no assignment
ever appeared in both sections. `docs/features/
home-dashboard-followthrough.md` item 1b later changed Needs Attention to
render *every* qualifying assignment — the soonest-due as a full primary
card, the rest as compact secondary rows — but didn't touch `HomePage.tsx`'s
`comingUp` computation, which still only filtered out the single primary
item (`needsAttention?.assignment.id`).

The result, reported directly by the product owner: capturing three
assignments that all qualify for Needs Attention (Bio 1, Bio 2, Bio 3) left
Bio 1 (the primary item) missing from Coming Up while Bio 2 and Bio 3 (the
secondary rows) appeared in both sections. The two sections had silently
drifted out of sync with each other — secondary attention items already
violated the original "never duplicate" rule as an unnoticed side effect of
item 1b, while the primary item alone kept the old behavior. From the
student's side this reads as a bug: an assignment they just added
"disappears" from the list it would otherwise sort into, for no visible
reason, and inconsistently with its siblings.

## Decision

Remove the exclusion entirely. Coming Up now lists the next three distinct
open assignments by due date regardless of Needs Attention membership,
matching the behavior secondary attention items already had. An assignment
needing attention now appears in both sections when it qualifies for
both — reachable and visible the same way every other assignment is,
rather than being a special case that vanishes from one list.

This supersedes `home-dashboard.md`'s original UX Flow item 6, Functional
Requirements bullet, and Acceptance Criterion "no assignment ever appears
in both sections simultaneously" — struck through there with a pointer to
this record rather than deleted, per this project's practice of leaving a
paper trail from an existing spec to its own amendment.

## Alternatives considered

- **Also exclude secondary Needs Attention items from Coming Up**,
  restoring "never duplicate" as a real invariant rather than resolving
  the drift by removing it. Rejected: not what was asked, and it re-caps
  a related piece of information as unreachable, which is exactly the
  concern item 1b already existed to fix (a flagged assignment shouldn't
  become invisible in the section a student would naturally scan). It
  would also shrink Coming Up's effective list size for a student with
  several flagged assignments, at the very moment they need better
  visibility, not less.
- **Keep excluding only the primary item**, i.e. today's actual (buggy)
  behavior. Rejected — the product owner's report is exactly that this is
  wrong; it treats the primary item as more "hidden-worthy" than the
  secondary ones for no principled reason once item 1b removed the
  one-item cap.

## Consequences

- `HomePage.tsx`'s `comingUp` `useMemo` no longer takes `needsAttention` as
  a dependency or filters by it.
- A student can now see the same assignment referenced from both Needs
  Attention (with its specific risk message and action) and Coming Up
  (plain due-date entry) at once. This is intentional, not a residual
  duplicate to clean up later.
- `docs/features/home-dashboard.md`'s "no assignment ever appears in both
  sections" Acceptance Criterion is void; any future change to Needs
  Attention or Coming Up should not silently reintroduce an exclusion
  without a new decision record, since two sections independently
  computing membership is exactly what drifted out of sync here.
