# Feature: Assignment Detail — CTA Hierarchy, Risk Detection, and Breakdown Nudge

**Status:** Partially implemented. Items 1 and 2, item 3a's nudge card
itself, and item 3b (inline add/edit/delete) were implemented and merged
to `main` on 2026-08-18: "Plan work for today" restored as the dominant
CTA (solid, `size="lg"`) with "Mark assignment complete" demoted to
`variant="ghost"`/muted beneath it, both moved to the bottom of the
screen after Steps; the Risk Detection message (`bg-attention` card,
fails closed on an Activities/Preferences load error rather than
computing from incomplete data); the breakdown-nudge card (shown only
when `workItems.length === 0 && effortMinutes > 45`); and inline Work
Item management replacing `WorkBreakdownPage`/"Edit breakdown" for any
non-empty breakdown. Verified live: opening an assignment flagged on
Home's Needs Attention shows the identical message on Detail, the nudge
appears for a large unbroken-down assignment, "Plan work for today"
correctly switches to the Plan tab, and adding/editing/deleting steps
inline works with no page navigation.

**Item 3a implemented (2026-08-18), merged to `main` — Correction 5's
final design.** "Break this down" is removed from Assignment Detail
entirely; "Yes, help me start" is the sole remaining path into
`WorkBreakdownPage`, and always arrives with the understanding-prompt
preamble on its create step. Two tappable labels ("Paste what the teacher
said" / "Say it in my own words") show when `assignment.notes` is empty;
tapping one reveals a single shared textarea (autofocus, correct
placeholder per label) with a "Back" option; the add-step UI does not
render at all until the textarea is blurred with content, at which point
the typed text saves to `assignment.notes` (via a new `WorkBreakdownPage`
prop, `onSaveNotes`, orchestrated by `AssignmentDetailPage`'s existing
`updateAssignment`) and displays read-only above the add-step UI. When
notes already exist, they show read-only immediately with no prompt.
`WorkBreakdownPage` gained `showUnderstandingPrompt`/`onSaveNotes` props,
both omitted by `PlanPage.tsx`'s own separate entry point, which is
unaffected. Verified live end-to-end: "Break this down" is absent from a
fresh, large assignment's Detail screen; "Yes, help me start" shows the
two prompts; choosing "Say it in my own words" shows the correct
placeholder; typing and blurring saves the text (confirmed via the
assignment's own Notes field after cancelling back to Detail) and reveals
the add-step UI; reopening "Yes, help me start" afterward skips straight
to the add-step UI with the saved note shown read-only, no prompt shown
again.

Fixed incidentally: `App.test.tsx`'s Look-Ahead round-trip test used a
hardcoded due date that had drifted into the past as real time passed,
making it fail independent of anything this item changed — pinned to the
file's existing fake-timer convention instead.

**Item 3b implemented (2026-08-18), merged to `main`, including inline
delete.** `WorkBreakdownPage`/"Edit breakdown" is no longer reachable
once an assignment has any Work Item — "Break this down" still opened it
at the time, for `workItems.length === 0` only; **Correction 5 below
removes "Break this down" entirely**, on top of what's described here.
"Just add a step"/"+ Add another step" (`useWorkItems.addItem`), inline per-row editing
(`useWorkItems.editItem`, never offered for a completed item), and inline
delete (`useWorkItems.deleteItem`, immediate for an incomplete item,
confirmation-gated for a completed one — mirroring the assignment-level
delete warning) are all built and tested. `workItemService.ts` gained one
new function, `updateWorkItem`. Add and edit each record one
`DecompositionAttempt` (`revisionCount: 1`); delete does not. The
assignment's `effortMinutes` is recomputed after every add/edit/delete via
the existing `useAssignment.updateAssignment`. Verified live: added,
edited, and deleted steps on a real assignment, confirming the "Remaining"
total tracked each change and "Edit breakdown" never reappeared once a
step existed.

The decision record documenting this reversal of
`docs/decisions/20260815-manual-work-breakdown-draft-state.md`'s
single-entry-point premise is `docs/decisions/20260818-inline-work-item-management.md`.

Resolves the Roadmap Backlog item "Assignment Detail's CTA hierarchy
needs reconsidering, not just completing," raised 2026-08-16 — in full.

**Amends:** `docs/features/assignment-management.md` (UX Flow's Assignment
Detail section, specifically the "Primary actions" line and its "Open
item" note) and closes the corresponding gap named in
`docs/features/risk-detection.md`'s own Summary (Assignment Detail as a
named consumer, never wired in).

**Correction history, in order (all 2026-08-18, spec only — Correction 5
is current):**

**Correction 1:** Item 3's original Source/Decision under-read the
prototype. `assignments.$id.index.tsx`'s "Yes, help me start" and its
empty-Steps-state "Break this down" both link to
`/assignments/$id/breakdown` — a *different, richer* route with its own
distinct prompts (Understand → Confirm → Sitting-check →
Attempt-with-scaffold-ladder → Final review), not the same destination as
this app's plain `WorkBreakdownPage`. The prototype also has a third,
separate affordance — "Just add a step" — that this spec never
considered at all. The already-shipped code (`setBreakingDown(true)` for
both "Break this down" and "Yes, help me start") was unchanged by this
correction at the time — see Correction 5 below for where both buttons
ultimately ended up.

**Correction 2:** item 3b's open question is resolved by direct
product-owner instruction: `WorkBreakdownPage` — a 3-step
create/estimate/review wizard for what amounts to "type a title, pick an
effort preset" — is more page than the underlying functionality
warrants, especially with two buttons ("Break this down" and "Yes, help
me start") both leading there for the empty-Steps case. "Just add a
step" is added, matching the prototype; once at least one Work Item
exists, `WorkBreakdownPage`/"Edit breakdown" is no longer offered at all
— inline add and inline edit become the only way to manage an existing
breakdown. This reverses the "single entry point" premise of
`docs/decisions/20260815-manual-work-breakdown-draft-state.md` for the
add/edit case — implementation replaced that decision record with a new
one (`docs/decisions/20260818-inline-work-item-management.md`) rather
than editing it in place. **Implemented and merged 2026-08-18** — see
item 3b below and the Status note above.

**Correction 3:** item 3a's "deliberate, scope-driven deviation" —
routing "Yes, help me start" to the same plain `WorkBreakdownPage`
"Break this down" uses — is partially reversed by direct instruction:
"Yes, help me start" should land on a screen offering the prototype's
three "Understand" choices ("Paste what the teacher said" / "Say it in
my own words" / "Help me figure out what it's asking"), not skip
straight to `WorkBreakdownPage`.

**Correction 4:** Correction 3 held before implementation. The gap
Correction 3 itself already named — "Continue" stopping short of
`parseDirections`, with the captured text going nowhere but
`assignment.notes` — is the actual problem, not a defensible YAGNI trim.
Asking a student "what do you have to do?" across three framed choices
and then doing nothing with the answer but silently filing it away reads
as broken, not restrained. Item 3a reverted to its pre-Correction-3
behavior at this point: "Yes, help me start" calling the same
`setBreakingDown(true)` transition "Break this down" used.

**Correction 5 (current):** two more instructions, given in sequence,
land on a design that resolves Correction 4's objection without either
of the two intermediate shapes considered along the way:
1. "Just add a step" (item 3b) makes "Break this down" *redundant*, not
   just optional — a student can already build a full breakdown by using
   it repeatedly. **"Break this down" is removed.**
2. Rather than routing "Yes, help me start" to a standalone screen (the
   shape Correction 3 tried) or to the inline "Just add a step" mechanism
   (a shape considered and set aside in discussion), it becomes the
   **sole** path into `WorkBreakdownPage`, landing on the existing
   "create" step with two new understanding prompts prepended. This keeps
   the wizard's real batch add/estimate/review capability (which the
   inline-only shape would have discarded) while still making the
   captured text genuinely useful — visible during the same step where
   the student is decomposing the assignment, not filed away unread.

See the rewritten item 3a below for the full design and the questions
still open within it (exact prompt-field mechanic, when the captured text
saves, how long it stays visible). **This reverses "no changes to
`WorkBreakdownPage` itself"** (previously listed as Explicitly Out of
Scope) — the create step now needs real, if modest, conditional UI. Not
yet implemented — see the Status note above.

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
above ships) a way into building a breakdown — "Just add a step," and, for
a large not-yet-broken-down assignment, "Yes, help me start" (item 3,
final shape per Correction 5) — adding a third, risk-specific action
button here would compete with those rather than add anything an
equivalent existing button doesn't already cover.

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

**Exact prototype handling** (`assignments.$id.breakdown.tsx:149-202`,
the `step === "understand"` block, re-verified against source rather
than paraphrased from memory) — two of these three prompts are adopted
below, per Correction 5:

```tsx
<ScreenTitle eyebrow={dueLabel(assignment.dueDate)} title="What do you have to do?" />
{mode === null ? (
  <div className="space-y-3">
    <ChoiceCard title="Paste what the teacher said"
      hint="Instructions, an email, the rubric — anything they gave you."
      onClick={() => setMode("paste")} />
    <ChoiceCard title="Say it in my own words"
      hint="A sentence or two is plenty."
      onClick={() => setMode("summary")} />
    <ChoiceCard title="Help me figure out what this is asking"
      hint="We'll read it together and you get the final say."
      onClick={() => setMode("assisted")} />
  </div>
) : (
  <div>
    <Textarea autoFocus value={raw} onChange={(e) => setRaw(e.target.value)} rows={7}
      placeholder={mode === "summary" ? "What do you have to do?" : "Paste the directions here…"} />
    <Button disabled={!raw.trim()} onClick={() => {
      const b = buildBrief(mode, raw);   // parseDirections() — deterministic extraction
      setBrief(b);
      setStep("confirm");                // → the parsed-checklist screen, item 3a doesn't build this
    }}>Continue</Button>
    <Button variant="ghost" onClick={() => setMode(null)}>Back</Button>
  </div>
)}
```

Three tap-to-choose cards (title + one-line hint), each just sets which
`mode` a single shared `Textarea` records against — **"assisted" ("Help
me figure out what this is asking") is not a different interaction from
"paste."** Same textarea, same placeholder as "paste," only the choice
card's own copy differs; there is no conversational/assisted UI hiding
behind it in the prototype, despite what "we'll read it together" implies.
The only placeholder variation is "summary" mode getting "What do you
have to do?" instead of "Paste the directions here…". "Continue" is
disabled until non-empty text is entered, and calls `buildBrief` —
`parseDirections`'s deterministic archetype/deliverable/requirement
extraction — before advancing to the "confirm" step (the parsed checklist
with "(my guess)" tags).

**Decision (2026-08-18, Correction 5 — final design, supersedes
Corrections 3 and 4):** "Break this down" is removed. "Yes, help me
start" becomes the *only* way to reach `WorkBreakdownPage` from
Assignment Detail, and it always arrives on the existing "create" step
(unchanged prompt: "What are the main pieces you'll need to get done?")
with a new preamble in front of it:

- **If `assignment.notes` is already non-empty**, show it read-only and
  go straight to the normal add-step UI — no prompts. Consistent with the
  "never overwrite existing content" rule already established for this
  feature.
- **If `assignment.notes` is empty**, show two tappable labels — "Paste
  what the teacher said" and "Say it in my own words" — matching the
  prototype's own mechanic (tap one, *then* one shared textarea appears),
  not two simultaneous fields. Only two of the prototype's three choices:
  "Help me figure out what this is asking" is dropped, since the
  prototype research above already established it isn't a distinct
  interaction — same textarea, same placeholder as "paste," different
  framing copy only. **Resolved (2026-08-18):** the chosen label's
  textarea saves to `assignment.notes` on blur, and the add-step UI
  becomes usable at that point — not before. Nothing is parsed, tagged,
  or interpreted — same Domain Invariant 6 reasoning as the held
  Correction 3 design. Blurring an empty textarea saves nothing and
  leaves the add-step UI hidden; tapping the wizard's existing top-level
  "← Cancel" before ever blurring the field discards whatever was typed,
  consistent with "Cancel means cancel."

Once the prompt is answered (or skipped, per the two bullets above), the
student adds steps using the wizard's existing "create" step UI exactly
as it works today, then "Next" advances through Estimate → Review →
Confirm unchanged. **"Break this down" being removed narrows when the
wizard is reachable from this screen at all**: only for a fresh
(`workItems.length === 0`), large (`effortMinutes > 45`) assignment — the
same condition that already gates the nudge card itself. A smaller
assignment, or one with any existing Work Item, has no path back into
`WorkBreakdownPage` from Assignment Detail — "Just add a step"/"Add
another step" (item 3b) is the only route for those cases. This is a
deliberate narrowing, not a side effect: it ties the wizard's batch
capability to the same "big enough that a fuller planning session helps"
signal already driving the nudge, rather than making it universally
available regardless of size.

This lands on a different resolution than either intermediate shape
considered: unlike Correction 3's standalone screen, the captured text is
genuinely used — visible on the same step where the student is actually
decomposing the assignment, not filed away unread, which is what made
Correction 4 hold the design in the first place. And unlike routing
through the inline "Just add a step" mechanism instead, the wizard's real
batch add/estimate/review capability survives, just gated more narrowly
than before.

**One thing still open, not resolved by this correction:** how long the
captured/existing note stays visible — only during the "create" step
(where it's actually useful for decomposing), or carried through Estimate
and Review too? Recommend create-step-only as the simpler default, but
not yet confirmed. The prompt-field mechanic and save trigger, both
previously open, are resolved above.

No reusable `CoachNote` component is introduced — one call site, YAGNI,
consistent with this spec's existing position on that component.

**Functional Requirements (3a):**
- Nudge card condition and copy unchanged: *"This one is fairly big.
  Would it help to break it into smaller steps? What do you think should
  happen first?"*, action "Yes, help me start."
- "Break this down" button removed from the Steps section's empty state
  entirely (see item 3b for the updated empty-state inventory).
- `AssignmentDetailPage.tsx`'s `breakingDown`/`setBreakingDown` state has
  exactly one trigger remaining ("Yes, help me start") — no dead code
  risk from the removal, since nothing else in this file calls it (Plan's
  own separate "Break down" entry point, `PlanPage.tsx:541`, is a
  different call site into the same `WorkBreakdownPage` component and is
  unaffected by anything in this item).
- `WorkBreakdownPage` gains a new prop (e.g. `showUnderstandingPrompt:
  boolean`) — `true` only when `AssignmentDetailPage` opens it via "Yes,
  help me start"; omitted/`false` for Plan's own entry, which must not
  show these prompts.
- The create step, when the new prop is set, checks `assignment.notes`:
  non-empty → show read-only, add-step UI usable immediately. Empty →
  show two tappable labels ("Paste what the teacher said" / "Say it in my
  own words"); tapping one reveals a single shared textarea (autofocus,
  matching the prototype's own placeholder split — "What do you have to
  do?" for "Say it in my own words," "Paste the directions here…" for the
  other); **the add-step UI does not render at all until this textarea is
  blurred with non-empty content** — not shown-but-disabled, genuinely
  absent, so there's only ever one reason it's missing (prompt
  unresolved) at a time.
- On blur of a non-empty textarea: save its text to `assignment.notes`
  (only if still empty at that point) via the same `updateAssignment`
  pattern already used elsewhere in this spec (item 3b's effort
  recompute), then reveal the add-step UI. On blur of an empty textarea:
  no save, add-step UI stays hidden. Tapping the wizard's existing
  top-level "← Cancel" before ever blurring the field discards whatever
  was typed — no save.
- Never shown once at least one Work Item exists, regardless of how it
  was created (nudge card itself, unchanged).

**Acceptance Criteria (3a):**
- A newly-captured assignment with a 60-minute estimate and no Work Items
  shows the nudge; the same assignment after adding one Work Item does
  not, on the next render.
- A newly-captured assignment with a 30-minute estimate never shows the
  nudge regardless of Work Item count, and its empty Steps state offers
  only "Just add a step" — no "Break this down," no wizard access at all.
- Tapping "Yes, help me start" opens `WorkBreakdownPage`'s create step.
  If the assignment has no notes, two tappable labels show and the
  add-step UI is not present at all; if it already has notes, they
  display read-only and the add-step UI is immediately usable.
- Tapping a label reveals one textarea with the correct placeholder for
  that label; the other label is no longer shown.
- Blurring that textarea while empty leaves the add-step UI hidden and
  writes nothing to `assignment.notes`.
- Blurring that textarea with content saves it to `assignment.notes` and
  the add-step UI becomes usable.
- Tapping "← Cancel" while the textarea has unsaved, unblurred content
  discards it — `assignment.notes` is unchanged.
- "Break this down" does not appear anywhere on Assignment Detail, for
  any assignment, at any Work Item count.
- Plan's own "Break down '<assignment>'" entry point (`PlanPage.tsx`)
  is unaffected — no prompts shown there.

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

- **Zero Work Items:** as originally written here, "Break this down"
  stayed alongside "Just add a step" for this state. **Superseded by
  Correction 5, item 3a:** "Break this down" is removed entirely, not
  just once items exist — the empty state shows only "Just add a step"
  (inline form: title + effort preset, `WorkBreakdownPage` never opens
  from here). The breakdown-nudge card (item 3a) still shows
  independently when its own condition is met, and its "Yes, help me
  start" is now the *only* remaining path into `WorkBreakdownPage` from
  this screen — see item 3a for the full design.
- **One or more Work Items:** "Break this down"/"Edit breakdown" is
  **removed**. The nudge is already gone (its own condition requires zero
  items). The Steps list itself becomes the only surface: each row gains
  inline editing (tap to edit title/effort, in place — no navigation), and
  a persistent "Add another step" control below the list reuses the exact
  same inline form "Just add a step" used, just relabeled to match the
  prototype's own copy split (`assignments.$id.index.tsx:204` "Just add a
  step" for empty / `:275-277` "+ Add another step" once items exist —
  same `setAdding`/form, different label only).

**Decided (2026-08-18): inline delete is included.** Confirmed per direct
instruction — resolves the flag above in favor of the recommended
default. Each Steps row gets a delete control using the existing
`workItemService.deleteWorkItems`. An incomplete item deletes immediately
(matching `WorkBreakdownPage`'s own no-confirmation draft delete); a
*completed* item (`completedAt !== null`) asks for confirmation first,
mirroring the exact reasoning `AssignmentDetailPage.tsx` already applies
to whole-assignment deletion (`hasCompletedSteps` → "will erase that
progress") — completing a step is real, evidenced work, so removing one
shouldn't be a single accidental tap the way removing an unstarted one
can be.

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
- "Break this down" does not exist anywhere on this screen (Correction
  5, item 3a) — `WorkBreakdownPage` is reachable from Assignment Detail
  only via the nudge card's "Yes, help me start"; "Edit breakdown" is
  removed from the component entirely once `workItems.length > 0`.

**Acceptance Criteria:**
- An assignment with zero Work Items shows "Just add a step" — and, if it
  also qualifies for the nudge (item 3a), the nudge card alongside it.
  Never "Break this down."
- Submitting "Just add a step" adds the item without ever navigating to
  `WorkBreakdownPage`, and the assignment's total estimated effort updates
  to include it.
- Once at least one Work Item exists, no path back into
  `WorkBreakdownPage` exists anywhere on the screen — confirmed by its
  absence, not just by the new controls' presence.
- Editing a Work Item's title or effort inline updates it immediately, and
  the assignment's total estimated effort reflects the change, without
  navigating away from Assignment Detail.
- Deleting an incomplete Work Item removes it immediately and updates the
  total effort, no confirmation.
- Deleting a completed Work Item asks for confirmation first; cancelling
  leaves it untouched.
- The breakdown-nudge card (item 3a) never appears once a Work Item
  exists, regardless of how the assignment's breakdown was started —
  unchanged from item 3a's own criteria.

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
- **Item 3b's inline add/edit/delete — implemented (2026-08-18).**
  `useWorkItems(studentId, assignmentId)` gained `addItem`/`editItem`/
  `deleteItem`, each persisting via the relevant `workItemService`
  function and returning the resulting full array. The "which layer
  recomputes the assignment's effort total and records the
  `DecompositionAttempt`" question this bullet originally raised was
  resolved in favor of `AssignmentDetailPage.tsx` orchestrating across
  both hooks (`recomputeAssignmentEffort`/`recordStepDecompositionAttempt`),
  not either hook alone — `workItemService.ts` gained one new function,
  `updateWorkItem(id, { title, effortMinutes })`; `createWorkItems` and
  `deleteWorkItems` are reused as-is for add/delete. No new tables.
- **Item 3a's understanding prompts (Correction 5) — not yet
  implemented.** `WorkBreakdownPage` needs a new prop
  (`showUnderstandingPrompt` or similar) and, on its "create" step,
  conditional UI: read-only notes display, or two tappable labels →
  one shared textarea (resolved mechanic, see item 3a), ahead of the
  existing add-step list — a new leading sub-state within the "create"
  step rather than a new top-level `Step` value (the existing add-step UI
  on that step doesn't otherwise change, it's just conditionally rendered
  now). Saving prompt text on blur needs the same "call `updateAssignment`
  if notes are empty" pattern item 3b's own effort-recompute already
  established, which means `WorkBreakdownPage` needs either its own
  access to `assignmentService.updateAssignment` or a callback prop back
  into `AssignmentDetailPage` — worth deciding which before
  implementation, same shape of question item 3b's own orchestration
  already had to answer. `AssignmentDetailPage.tsx`'s `breakingDown` state
  and its `WorkBreakdownPage` render branch stay in place (still needed
  for "Yes, help me start"); only the "Break this down" button/trigger is
  deleted.

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
  screen already cover the equivalent actions ("Just add a step"/"Yes,
  help me start"/"Plan work for today").
- A reusable `CoachNote` component — one call site doesn't justify the
  abstraction yet.
- AssignmentType-aware or content-generated coaching copy of any kind —
  still governed by `manual-work-breakdown-reflection-v0.1.md`'s own
  broader Explicitly Out of Scope list; item 3 here is one fixed sentence,
  not a coaching system.
- Any change to Risk Detection's own rules, message text, or action
  labels (`src/domain/riskDetection.ts`) — reused exactly as built.
- Five of `assignments.$id.breakdown.tsx`'s six steps — **only a
  two-prompt subset of "understand" is adopted (item 3a, Correction 5);
  everything past it stays out.** "confirm" (`buildBrief`/`parseDirections`
  — archetype detection, deliverable/requirement extraction, "(my guess)"
  tagging), "sitting," "single," "attempt" (the five-level scaffold
  ladder), and "final" remain fully out of scope, for the same reason
  `manual-work-breakdown-reflection-v0.1.md` already excludes them:
  later-phase Work Breakdown Coaching functionality, not this increment's.
  The adopted prompts save raw text to `assignment.notes` and stop —
  no parsing, no Assignment Brief, no "confirm" checklist screen.
- The prototype's third "understand" choice, "Help me figure out what
  this is asking" — dropped, not adopted even partially, since the
  prototype itself never gives it a distinct interaction from "paste."
- Inline reordering of Work Items — see item 3b's "Flagged, not silently
  decided — reorder." Accepted as a capability lost from
  `WorkBreakdownPage`'s current reorder-via-arrows, not replaced inline.
- `WorkBreakdownPage`'s multi-step estimate/review flow, for any
  assignment that doesn't qualify for the breakdown nudge — see item 3a's
  Decision. Reachable only via "Yes, help me start," which only shows for
  a fresh, large (`effortMinutes > 45`) assignment; "Break this down" no
  longer exists as an unconditional fallback into the wizard.
