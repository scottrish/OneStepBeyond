# Feature: Assignment Detail — CTA Hierarchy, Risk Detection, and Breakdown Nudge

**Status:** Partially implemented. Items 1 and 2, and item 3a's nudge
card, were implemented and merged to `main` on 2026-08-18 as originally
specced: "Plan work for today" restored as the dominant CTA (solid,
`size="lg"`) with "Mark assignment complete" demoted to
`variant="ghost"`/muted beneath it, both moved to the bottom of the
screen after Steps; the Risk Detection message (`bg-attention` card,
fails closed on an Activities/Preferences load error rather than
computing from incomplete data); and the breakdown-nudge card (shown only
when `workItems.length === 0 && effortMinutes > 45`). Verified live:
opening an assignment flagged on Home's Needs Attention shows the
identical message on Detail, the nudge appears for a large
unbroken-down assignment, and "Plan work for today" correctly switches to
the Plan tab.

**Not yet implemented:** item 3b, substantially expanded 2026-08-18 (see
Correction 2 below) to add "Just add a step" and remove
`WorkBreakdownPage`/"Edit breakdown" once any Work Item exists in favor
of inline add/edit/delete — this is new scope, not yet built. The
already-shipped code still has "Edit breakdown" opening `WorkBreakdownPage`
for a non-empty breakdown; that needs to change per the revised item 3b
below.

Resolves the Roadmap Backlog item "Assignment Detail's CTA hierarchy
needs reconsidering, not just completing," raised 2026-08-16 — items 1
and 2 fully; item 3 partially, pending 3b.

**Amends:** `docs/features/assignment-management.md` (UX Flow's Assignment
Detail section, specifically the "Primary actions" line and its "Open
item" note) and closes the corresponding gap named in
`docs/features/risk-detection.md`'s own Summary (Assignment Detail as a
named consumer, never wired in).

**Correction (2026-08-18, spec only — no code changed):** Item 3's
original Source/Decision under-read the prototype. `assignments.$id.index.tsx`'s
"Yes, help me start" and its empty-Steps-state "Break this down" both
link to `/assignments/$id/breakdown` — a *different, richer* route with
its own distinct prompts (Understand → Confirm → Sitting-check →
Attempt-with-scaffold-ladder → Final review), not the same destination as
this app's plain `WorkBreakdownPage`. The prototype also has a third,
separate affordance — "Just add a step" — that this spec never
considered at all. See the revised Item 3 below for what each of these
actually implies for this increment, and why one is deliberately not
followed. The already-shipped code (`setBreakingDown(true)` for both
"Break this down" and "Yes, help me start") is unchanged by this
correction — see Item 3's own reasoning for why that's the right call,
not an oversight to fix.

**Correction 2 (2026-08-18, spec only — no code changed yet):** item 3b's
open question is now resolved by direct product-owner instruction:
`WorkBreakdownPage` — a 3-step create/estimate/review wizard for what
amounts to "type a title, pick an effort preset" — is more page than the
underlying functionality warrants, especially now that *two* buttons
("Break this down" and "Yes, help me start") both lead there for the
empty-Steps case. "Just add a step" is added, matching the prototype;
once at least one Work Item exists, `WorkBreakdownPage`/"Edit breakdown"
is no longer offered at all — inline add and inline edit, directly on
Assignment Detail, become the only way to manage an existing breakdown.
See the rewritten item 3b below. This reverses the "single entry point"
premise of `docs/decisions/20260815-manual-work-breakdown-draft-state.md`
for the add/edit case — implementation should replace that decision
record with a new one rather than editing it in place, per this project's
convention of leaving a paper trail rather than rewriting history.

## Summary

Three related, previously-deferred pieces of Assignment Detail, all
blocked on the same root cause (Daily Planning and Risk Detection didn't
exist yet when this screen was first built) and all unblocked now:

1. Restore "Plan work for today" as this screen's dominant CTA, and
   correct "Mark assignment complete"'s prominence relative to it — not
   by inventing a new hierarchy, but by matching the one the prototype
   already built and this app never finished porting.
2. Show *why* an assignment needs attention, when it does (Risk
   Detection), instead of leaving that signal exclusive to Home.
3. Nudge toward breaking down a large, not-yet-broken-down assignment,
   without forcing it.

## Source

Prototype: `src/routes/assignments.$id.index.tsx` (already read in full —
this spec ports its resolved design rather than inventing one). Three
things there this app's build never carried over:

```tsx
// lines 168-172 — the attention message, plain text in a bg-attention card
{attention ? (
  <div className="mt-4 rounded-3xl bg-attention px-5 py-4">
    <p className="text-sm text-attention-foreground">{attention.message}</p>
  </div>
) : null}

// lines 174-189 — the breakdown nudge, only when items.length === 0 and
// estimateMinutes > 45
{suggestBreakdown ? (
  <div className="mt-4">
    <CoachNote action={<Button ...>Yes, help me start</Button>}>
      This one is fairly big. Would it help to break it into smaller
      steps? What do you think should happen first?
    </CoachNote>
  </div>
) : null}

// lines 281-297 — the CTA block, at the very bottom of the screen, after Steps
<div className="mt-8 space-y-3">
  <Button asChild size="lg" className="w-full rounded-2xl">
    <Link to="/plan">Plan work for today</Link>
  </Button>
  {!assignment.completedAt ? (
    <Button variant="ghost" className="w-full rounded-2xl text-muted-foreground" onClick={...}>
      Mark assignment complete
    </Button>
  ) : null}
</div>
```

Two things worth noting about this source: the prototype's `CoachNote`
component itself was never ported into this app (`grep -rln "CoachNote"
src/` returns nothing) — see Architecture Review for how this spec handles
that. And `assignment-management.md`'s own spec text ("Primary actions:
'Plan work for today'... and 'Mark assignment complete'") reads as two
co-equal buttons; the prototype it's meant to be built from never actually
treated them that way. This spec follows the prototype, not the spec
text's literal phrasing — see Decision 1 below.

**A fourth thing, missed in the original read of this source (see the
2026-08-18 Correction above):** the `<Link to="/assignments/$id/breakdown">`
inside `assignments.$id.index.tsx`'s "Yes, help me start" button doesn't
go to this app's equivalent of `WorkBreakdownPage`. It goes to
`assignments.$id.breakdown.tsx` — the prototype's full **Assignment
Understanding & Guided Breakdown** screen (`Route:
/assignments/$id/breakdown`), the same route the empty-Steps-state
"Break this down" button also links to. That screen is a six-step flow
with genuinely different prompts at each stage, none of which exist
anywhere in this app:

```tsx
// assignments.$id.breakdown.tsx:39 — a completely different step machine
type Step = "understand" | "confirm" | "sitting" | "single" | "attempt" | "final";

// step "understand" (152-170): "What do you have to do?" — three entry
// choices ("Paste what the teacher said" / "Say it in my own words" /
// "Help me figure out what this is asking"), each free-text.
// step "confirm" (207): "Did I get that right?" — a parsed Assignment
// Brief checklist, inferred items marked "(my guess)".
// step "sitting" (274): "Can you finish this in one sitting?" — Yes /
// Probably not / Not sure, the last showing a CoachNote before branching.
// step "attempt" (363): "What are the main pieces?" — the student's own
// list, then reviewBreakdown() surfaces at most one coaching prompt, or
// (only "I need help") a five-level scaffold ladder (escalate()/rung).
// step "final" (502): "Does this look like how you want to tackle it?" —
// per-item effort estimate with a keyword-suggested default.
```

This is `docs/features/assignment-understanding-and-breakdown.md`'s
screen verbatim — the spec that document itself now marks **Superseded**,
whose replacement, `manual-work-breakdown-reflection-v0.1.md`, explicitly
excludes every one of these steps for the current increment ("do not
implement: decomposition review, heuristic coaching, Assignment
Understanding parsing, scaffold escalation..."). "Yes, help me start"
promising "different prompts that the app will use to help the student"
is therefore promising the *superseded* spec's experience, not this
increment's. See Item 3 below for how this spec now treats that.

The prototype's empty-Steps state also has a **third** affordance this
spec's first draft never mentioned:

```tsx
// assignments.$id.index.tsx:193-209
{items.length === 0 && !adding ? (
  <EmptyState
    title="No steps yet."
    action={
      <div className="flex flex-col items-center gap-2">
        <Button asChild className="rounded-2xl">
          <Link to="/assignments/$id/breakdown" params={{ id: assignment.id }}>
            Break this down
          </Link>
        </Button>
        <Button variant="ghost" className="rounded-2xl" onClick={() => setAdding(true)}>
          Just add a step
        </Button>
      </div>
    }
  />
) : ( ... )}

// submitStep (69-74), on the resulting inline form:
const submitStep = () => {
  if (!stepTitle.trim()) return;
  addWorkItem(assignment.id, stepTitle.trim(), stepEffort);  // persists immediately
  setStepTitle("");
  setAdding(false);
};
```

"Just add a step" persists one Work Item **immediately**, no draft, no
confirm step — see Item 3 for why this is a real conflict with an
existing decision in this codebase, not just a missing feature.

## Current built state (for contrast)

`src/pages/AssignmentDetailPage.tsx`:
- Lines 273-278: "Mark assignment complete" is the *only* CTA, rendered
  with the Button component's **default (solid, primary-colored) variant**
  — not because anyone chose to make it dominant, but because it's the
  only button on the screen. It renders directly after the Due/Remaining/
  Notes block, **before** Steps.
- No "Plan work for today" button exists anywhere on this screen.
- No Risk Detection message is rendered — `grep -n "riskDetection\|
  assignmentsNeedingAttention" src/pages/AssignmentDetailPage.tsx` returns
  nothing.
- No breakdown-suggestion nudge exists — `workItems.length === 0` today
  only ever shows Steps' own empty-state text, no coaching note.
- Data currently loaded: `useAssignment` (single assignment),
  `useCourses`, `useWorkItems` (this assignment's items only). Nothing
  else.

## 1. Restore "Plan work for today," correct "Mark assignment complete"'s prominence

**Problem:** "Mark assignment complete" is the screen's sole, accidentally-
dominant CTA — including for an assignment that was just captured and
never worked on. `assignment-management.md`'s own words: *"it's a 'record
already-done or unplanned work' action in an app that's a planning tool,
not a tool for recording unplanned work."*

**Decision:** Match the prototype exactly rather than treating this as an
open design question to resolve from scratch:
- "Plan work for today": `size="lg"`, default (solid) Button variant,
  full width — the true primary action.
- "Mark assignment complete": `variant="ghost"`, `text-muted-foreground`,
  full width, rendered *beneath* "Plan work for today" — present, always
  reachable, but visually quiet rather than competing for attention.
- Both move to the **bottom of the screen, after Steps** — matching the
  prototype's ordering, not the built app's current ordering (which
  currently puts the sole CTA before Steps). This is a real layout change,
  not just a restyle: everything above it (progress, attention message,
  breakdown nudge, Steps) becomes "here's the full picture," and the CTA
  block becomes "now, what do you want to do about it" — consistent with
  this app's own established pattern of primary actions living at natural
  decision points, not interrupting information the student hasn't seen
  yet (e.g. Home's Next card, Plan's Day step).
- "Plan work for today" is a bare tab switch — `onGoToPlan={() =>
  handleTabChange("plan")}`, the exact same pattern `HomePage.tsx` already
  uses. It does **not** pass this assignment through to Plan or
  pre-select its Work Items — that's `home-dashboard-followthrough.md`
  item 4's already-deferred scope (target-assignment passthrough), not
  reopened here. See Explicitly Out of Scope.
- "Mark assignment complete" once the assignment is already complete:
  keep the built app's existing "Completed" text treatment (line 274) —
  the prototype simply omits the button entirely once done; this app's
  existing choice to show a small status line instead is a reasonable,
  already-shipped deviation not worth reverting.

**Functional Requirements:**
- `handleMarkComplete` (existing) is unchanged — only the button's
  variant, position, and neighboring "Plan work for today" button change.
- A new `onGoToPlan: () => void` prop on `AssignmentDetailPageProps`,
  wired in `App.tsx` identically to `HomePage`'s own
  `onGoToPlan={() => handleTabChange("plan")}`.

**Acceptance Criteria:**
- Opening a freshly-captured, never-worked-on assignment shows "Plan
  work for today" as the visually dominant action; "Mark assignment
  complete" is present but visually secondary.
- Tapping "Plan work for today" switches to the Plan tab, exactly as
  Home's own routes there today (same destination, same mechanism).
- Tapping "Mark assignment complete" behaves exactly as it does today
  (marks the assignment and all open steps complete, same confirmation
  rules) — only its visual weight and position change.
- An already-completed assignment's screen is unchanged from today's
  behavior (the "Completed" text line, no button).

## 2. Show why an assignment needs attention

**Problem:** `risk-detection.md` names Assignment Detail as a consumer of
`assignmentsNeedingAttention`; nothing on this screen calls it. A student
who opens an assignment flagged on Home has no indication of *why* once
they're actually looking at it.

**Decision:** Port the prototype's treatment directly — a single,
message-only card, no separate action button. Home already offers the
"Break it down"/"Find time"/"Make a plan" action for a flagged assignment;
this screen already offers its own "Plan work for today" and (once item 1
above ships) "Break this down"/"Edit breakdown" — adding a third,
risk-specific action button here would compete with those rather than
add anything an equivalent existing button doesn't already cover.

- Rendered directly beneath the progress/estimate block, above Steps —
  matching the prototype's position exactly.
- Styling: `bg-attention`/`text-attention-foreground` — tokens already
  defined (`src/index.css:50-51,77-78`) and already used for the same
  underlying signal elsewhere (`WeekLookAhead.tsx`'s "Preparation still
  needs a plan," `PlanPage.tsx`'s equivalent), not a new introduction.
- Message text only — no minutes/percentages, no action label (Domain
  Invariant 11, already enforced by `assignmentsNeedingAttention` itself).

**Functional Requirements:**
- Call `assignmentsNeedingAttention([assignment], workItems, allSessions,
  activities, today, preferences)[0]` — the domain function already
  supports a single-assignment array; no change to
  `src/domain/riskDetection.ts` is needed.
- New data this page must load that it doesn't today: all Work Sessions
  (not just this assignment's), Activities, and Preferences — via the
  same `useAllWorkSessions`, `useActivities`, `usePreferences` hooks
  `HomePage.tsx` already uses for the identical computation. This is a
  real widening of this page's data-loading surface (see Architecture
  Review) — today it loads three things, this adds three more.
- The message is silent (renders nothing) when the assignment doesn't
  qualify — matching every other Needs-Attention surface in this app.
- **Fail closed, not open, on a load error.** `assignmentsNeedingAttention`
  is only called once `useActivities` and `usePreferences` have both
  finished loading with no `loadError`, and `useAllWorkSessions` has
  finished loading (it has no `loadError` of its own — see Architecture
  Review). If either `useActivities` or `usePreferences` reports a
  `loadError`, the risk section renders nothing — the same as "doesn't
  qualify" — rather than computing a result from incomplete data.
  `usePreferences` in particular still holds `DEFAULT_PREFERENCES` after
  a failed fetch (it never clears the value, only sets `loadError`
  alongside it), so computing anyway would silently use placeholder
  capacity assumptions instead of the student's real ones and could
  produce a message that's confidently wrong rather than absent — the
  screen must not present a *guess* as if it were the same signal Home
  shows. This applies only to this new risk-message slot; it does not
  change how `useAssignment`'s own existing `loadError` (title/due
  date/notes) is handled, which keeps its current page-level error
  banner untouched.

**Acceptance Criteria:**
- An assignment currently flagged on Home's Needs Attention shows the
  identical message text on its own Detail screen.
- An assignment not flagged shows nothing in this slot — no empty card,
  no placeholder.
- The message never includes a minutes/percentage figure.
- If `useActivities` or `usePreferences` fails to load, the risk section
  shows nothing — never a message computed from default/incomplete data,
  and never a visible error state that contradicts the rest of the page
  (which continues to render normally from its own already-loaded data).

## 3. Nudge toward breaking down a large assignment

**Problem:** `assignment-management.md` UX Flow: *"If it has no Work
Items yet and its estimate exceeds 45 minutes, offer a coaching prompt
suggesting a breakdown (does not force one)."* Never built.

### 3a. What "Yes, help me start" actually does

**Decision, corrected 2026-08-18 (no code change — the already-shipped
behavior is confirmed correct, for a different reason than originally
written):** the prototype's "Yes, help me start" navigates to
`assignments.$id.breakdown.tsx` — the full Assignment Understanding &
Guided Breakdown screen, per the Source section's new excerpt above.
Matching that destination literally would mean building the Understand /
Confirm / Sitting-check / scaffold-ladder / Final-review flow that
`manual-work-breakdown-reflection-v0.1.md` explicitly lists as excluded
from this increment, and that CLAUDE.md's own Project Documentation
section is direct about: *"do not pull later-phase functionality into
the current increment merely because it's described in one of these
[strategy docs]."* This app has exactly one breakdown experience
(`WorkBreakdownPage`, the current increment's unassisted create → estimate
→ review flow) and no coached alternative to route to — there is no
in-scope way to give "Yes, help me start" the *different* prompts the
prototype's version has, because this increment deliberately doesn't
build any prompts beyond `WorkBreakdownPage`'s own single "What are the
main pieces you'll need to get done?"

Kept as originally shipped: "Yes, help me start" calls the same
`setBreakingDown(true)` transition "Break this down" already uses,
landing on `WorkBreakdownPage`. This is a **deliberate, scope-driven
deviation from the prototype's routing**, not the oversight the original
Decision text implied ("a second, more visible entry point to one
action, not a second action") — that framing was written without having
actually read `assignments.$id.breakdown.tsx` yet, and happened to land
on the right call for the wrong stated reason. Revisit this the moment
Work Breakdown Coaching's Phase 2+ (`docs/reference/
work-breakdown-coaching-feature-spec-v0.2.md`) is ever scheduled — at
that point "Yes, help me start" is the natural, already-named place to
point at the real guided flow instead of `WorkBreakdownPage`, and "Break
this down" the natural place to keep pointing at the plain one, matching
the prototype's own implicit distinction between a nudge response and a
cold click even though today both happen to lead to the same place.

No reusable `CoachNote` component is introduced. The prototype's
`CoachNote` was never ported and this spec has exactly one call site for
it — a small inline-styled block (reusing this app's existing card/border
tokens) is enough; extract a shared component only if a second call site
appears (YAGNI, per CLAUDE.md).

**Functional Requirements (3a):**
- Condition and copy match the prototype verbatim: *"This one is fairly
  big. Would it help to break it into smaller steps? What do you think
  should happen first?"* with a single action, "Yes, help me start,"
  calling `setBreakingDown(true)`.
- Never shown once at least one Work Item exists, regardless of how it
  was created.

**Acceptance Criteria (3a):**
- A newly-captured assignment with a 60-minute estimate and no Work Items
  shows the nudge; the same assignment after adding one Work Item does
  not, on the next render.
- A newly-captured assignment with a 30-minute estimate never shows the
  nudge regardless of Work Item count.
- Tapping "Yes, help me start" opens the same `WorkBreakdownPage` flow
  "Break this down" opens — verifiably the same code path, not a parallel
  one. (Not the prototype's `/assignments/$id/breakdown` — see this
  item's own Decision for why.) This only holds while `workItems.length
  === 0`; see 3b for what replaces "Break this down"/"Edit breakdown"
  once a Work Item exists.

### 3b. "Just add a step," then inline-only management once a step exists

**Decision (2026-08-18, direct product-owner instruction — supersedes the
"open question" this section originally raised):**
`WorkBreakdownPage`'s 3-step wizard is more page than "type a title, pick
an effort preset" warrants — clearest now that two buttons ("Break this
down," "Yes, help me start") both lead there for the same empty state.
Add "Just add a step," matching the prototype's mechanism (title + effort
preset, persisted immediately, no draft/confirm cycle) but going further
than the prototype in one respect: once at least one Work Item exists,
`WorkBreakdownPage`/"Edit breakdown" is **no longer offered at all** —
inline add and inline edit, directly in the Steps list, become the only
way to manage an already-started breakdown. (The prototype itself never
supports inline *editing* of an existing step — its Steps list is
read-only display plus a repeatable quick-*add* only. The edit half of
this decision is new UI this app is building, not a straight port.)

**State machine for the Steps section, replacing today's single
`workItems.length > 0 ? "Edit breakdown" : "Break this down"` toggle:**

- **Zero Work Items:** unchanged from today plus one addition — "Break
  this down" (→ `WorkBreakdownPage`, for someone who wants to plan several
  steps at once, e.g. arriving via "Break down/Plan as one task instead"
  from Plan's Day step) **and** a new "Just add a step" beside it (inline
  form: title + effort preset, `WorkBreakdownPage` never opens). The
  breakdown-nudge card (item 3a) still shows independently when its own
  condition is met, still pointing at `WorkBreakdownPage`.
- **One or more Work Items:** "Break this down"/"Edit breakdown" is
  **removed**. The nudge is already gone (its own condition requires zero
  items). The Steps list itself becomes the only surface: each row gains
  inline editing (tap to edit title/effort, in place — no navigation), and
  a persistent "Add another step" control below the list reuses the exact
  same inline form "Just add a step" used, just relabeled to match the
  prototype's own copy split (`assignments.$id.index.tsx:204` "Just add a
  step" for empty / `:275-277` "+ Add another step" once items exist —
  same `setAdding`/form, different label only).

**Flagged, not silently decided — delete:** removing "Edit breakdown"
also removes the *only* place a Work Item can currently be deleted
(`WorkBreakdownPage`'s per-row trash icon). The instruction above covers
"adding/editing" only. Recommendation: add a small inline delete control
to each Steps row too — without it, this change is a real regression (a
mis-typed or no-longer-needed step becomes permanently stuck), not just a
UI simplification. Flagging this as the one place this section extends
past the literal instruction, rather than silently bundling it in.

**Flagged, not silently decided — reorder:** `WorkBreakdownPage` also
supports reordering; the instruction doesn't mention it, and this section
doesn't add an inline equivalent. Recommendation: accept the loss for now
(YAGNI — most single-session breakdowns don't need reordering badly
enough to justify inline drag/up-down controls) rather than either
building it or blocking this change on it. Revisit if it turns out to
matter in practice, same as this project's usual bar for such calls.

**`docs/decisions/20260815-manual-work-breakdown-draft-state.md` is
superseded, not amended in place:** that record's whole rationale was
"one entry point so `DecompositionAttempt` recording can't be
bypassed by a second path." This section reopens exactly that. To honor
the same underlying concern rather than just discarding it: both the new
inline add and the new inline edit should still record a
`DecompositionAttempt` (`outcome: "confirmed"`, one row per action,
`revisionCount` meaningless for a single-item change — reuse the field
with a fixed `1` or make it optional), so the evidentiary trail that
decision cared about survives even though the single-entry-point
mechanism enforcing it doesn't. A new decision record at implementation
time should document this reversal and why (see Correction 2 above) —
don't edit `20260815-...` in place; per this project's own established
pattern elsewhere in this document, a new record cross-references the old
one rather than rewriting it.

**Functional Requirements:**
- Condition and copy for the breakdown-nudge card (item 3a) unchanged.
- New: "Just add a step" (zero items) / "Add another step" (≥1 item) — a
  single inline form (title input + effort preset buttons, matching
  `WorkBreakdownPage`'s own preset UI for visual consistency), submitting
  persists one Work Item immediately via a new single-item path — reusing
  `workItemService.createWorkItems` with a one-element array is sufficient
  (it already supports a bulk array; no new service function needed for
  add) — followed by recomputing `assignment.effortMinutes` as the sum of
  all confirmed Work Items (mirroring `confirmWorkBreakdown`'s own effort
  derivation, per `manual-work-breakdown-reflection-v0.1.md` §5) and
  recording one `DecompositionAttempt`.
- New: inline editing of an existing Work Item's title/effort. Requires a
  new `workItemService` function (no generic single-item update exists
  today — `workItemService.ts` currently has only `createWorkItems`,
  `deleteWorkItems`, `completeAllForAssignment`, `completeWorkItem`).
  Saving an edit also recomputes `assignment.effortMinutes` and records a
  `DecompositionAttempt`.
- New: inline delete per Steps row (see "Flagged — delete" above) using
  the existing `workItemService.deleteWorkItems`, also recomputing
  `assignment.effortMinutes`.
- "Break this down" continues to open `WorkBreakdownPage` **only** while
  `workItems.length === 0`; "Edit breakdown" is removed from the
  component entirely once that's no longer true.

**Acceptance Criteria:**
- An assignment with zero Work Items shows both "Break this down" and
  "Just add a step."
- Submitting "Just add a step" adds the item without ever navigating to
  `WorkBreakdownPage`, and the assignment's total estimated effort updates
  to include it.
- Once at least one Work Item exists, "Break this down"/"Edit breakdown"
  is not present anywhere on the screen — confirmed by its absence, not
  just by the new controls' presence.
- Editing a Work Item's title or effort inline updates it immediately, and
  the assignment's total estimated effort reflects the change, without
  navigating away from Assignment Detail.
- Deleting a Work Item inline removes it and updates the total effort.
- The breakdown-nudge card (item 3a) never appears once a Work Item
  exists, regardless of whether it was added via "Break this down" or
  "Just add a step" — unchanged from item 3a's own criteria.

## Architecture Review

- `AssignmentDetailPage.tsx` gains three new hook calls
  (`useActivities`, `useAllWorkSessions`, `usePreferences`) purely to
  support item 2's risk computation. **Resolved:** these three do *not*
  fold into this screen's existing top-level `loading`/`loadError` gate
  (which stays scoped to `useAssignment` alone, as it is today) — the
  rest of the page (title, due date, notes, progress, Steps, CTAs) has
  its own already-loaded data and should render as soon as it's ready,
  independent of whether the risk computation's supporting data has
  arrived or failed. Instead, the risk-message slot alone gates on its
  own three inputs: it renders nothing while any of them is still
  loading (a small, local, single-section flash — not the whole-page flash
  `home-dashboard.md`'s stricter requirement guards against, and not
  something this spec is holding itself to), and nothing if `useActivities`
  or `usePreferences` comes back with a `loadError` — a fail-closed
  behavior, not a best-effort one, per the load-error requirement above.
  A single local `readyForRisk = !activitiesLoading && !preferencesLoading
  && !allSessionsLoading && !activitiesLoadError && !preferencesLoadError`
  check gates the computation.
- No domain module changes — `assignmentsNeedingAttention` and
  `remainingMinutes` are reused exactly as they already exist.
- No new Supabase queries beyond what these three hooks already run
  elsewhere in the app (no new tables, no new RLS surface).
- `App.tsx` gains one new prop wire (`onGoToPlan`) on the existing
  `AssignmentDetailPage` render — no change to the global-overlay
  ownership model (`docs/decisions/20260817-assignment-detail-global-overlay.md`)
  itself.
- **Item 3b's inline add/edit/delete** (new, per Correction 2): a new
  `useWorkItems` action or a small new hook is needed for "add one item
  and recompute the assignment's effort total" and "edit one item's
  title/effort and recompute" — today's `useWorkItems.ts` only exposes
  `markAllComplete`; it needs `addItem`/`editItem`/`deleteItem`
  equivalents that each (a) call the relevant `workItemService` function,
  (b) recompute `assignment.effortMinutes` as the sum of all confirmed
  items (the same derivation `confirmWorkBreakdown` already does), which
  means either exposing `useAssignment`'s `updateAssignment` to
  `useWorkItems` or lifting this orchestration into
  `AssignmentDetailPage.tsx` itself rather than either hook alone — worth
  deciding which before implementation, since neither hook today knows
  about the other's data. (c) records a `DecompositionAttempt` (see 3b's
  Decision).
- `workItemService.ts` gains one new function — a generic single-item
  update (`updateWorkItem(id, { title, effortMinutes })` or similar) — the
  only genuinely new service-layer capability this whole spec requires;
  `createWorkItems` and `deleteWorkItems` are reused as-is for add/delete.
- No new tables — inline add/edit/delete write to the existing
  `work_items` table exactly as `WorkBreakdownPage`'s confirm flow already
  does, just one row at a time instead of a bulk replace.

## Domain Model Touchpoints

- Commitments → Assignment; Planning → Work Item; Observation/Risk
  Assessment → the same derived signal Home and (once Week Look-Ahead
  shipped) the 7-day view already surface — this spec adds a third
  consumer, not a new concept.
- No new Domain Events, no new persisted state.

## Explicitly Out of Scope

- Passing the target assignment through to Plan so it lands pre-selected
  on the Select step — `home-dashboard-followthrough.md` item 4's already-
  identified, already-deferred architecture gap (`chosen`/`showAll` local
  state, `useAssignmentsList` load timing). "Plan work for today" here
  behaves exactly like Home's own untargeted routing today.
- Any action button alongside the Risk Detection message (item 2) —
  message-only, matching the prototype; existing buttons elsewhere on this
  screen already cover "Break it down"/"Plan work for today."
- A reusable `CoachNote` component — one call site doesn't justify the
  abstraction yet.
- AssignmentType-aware or content-generated coaching copy of any kind —
  still governed by `manual-work-breakdown-reflection-v0.1.md`'s own
  broader Explicitly Out of Scope list; item 3 here is one fixed sentence,
  not a coaching system.
- Any change to Risk Detection's own rules, message text, or action
  labels (`src/domain/riskDetection.ts`) — reused exactly as built.
- The full Assignment Understanding & Guided Breakdown screen
  (`assignments.$id.breakdown.tsx`'s six-step flow) that the prototype's
  "Yes, help me start" and "Break this down" actually link to — see item
  3a. Out of scope for the same reason `manual-work-breakdown-reflection-v0.1.md`
  already excludes it: it's later-phase Work Breakdown Coaching
  functionality, not this increment's.
- Inline reordering of Work Items — see item 3b's "Flagged, not silently
  decided — reorder." Accepted as a capability lost from
  `WorkBreakdownPage`'s current reorder-via-arrows, not replaced inline.
- `WorkBreakdownPage`'s multi-step estimate/review flow for the *first*
  breakdown — "Break this down" still opens it for a zero-item assignment
  (item 3b keeps this path); only the *editing an existing breakdown* use
  of that page is removed.
