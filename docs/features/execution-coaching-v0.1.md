# Feature: Execution Coaching (self-service "what's getting in the way?")

**Status:** Proposed, not yet approved. Produced from a prototype-sync
audit of `../OneStepBeyondPrototype` (baseline commit `834368f`; `main`
HEAD `744026a`; re-synced 2026-09-24 against the unmerged
`mobile-redesign` branch at `1ce3145`, which moves this feature's
coaching panels into bottom sheets — see "Presentation" below). This is
a genuinely new capability layered onto Today Execution — not a copy
edit to `today-execution.md`, which it amends but does not replace.

**How to read this document:** the prototype is read here as UX/behavior/
copy evidence only (localStorage-backed mock, no real backend) — see
`daily-planning-and-completion-v2-proposal.md`'s own note on this. The
specific copy quoted below is the prototype's exact wording, included
because getting this tone right (calm, non-diagnostic, never "failure,"
never "late") is the actual point of the feature, not incidental detail.

## Summary

Today Execution currently offers two fixed, hardcoded responses to
friction: "Need more time" (silently adds a fixed increment) and "I'm
stuck" (one hardcoded note, "Move to tomorrow" or "Keep going"). The
prototype replaces both with a single, richer, student-initiated
pipeline: report what's specifically getting in the way (a short,
named list of friction kinds, different before starting vs. mid-session),
get one calm, concrete suggestion in return, and either act on it,
dismiss it, or open a real repair (reschedule) flow. It also adds two
new completion-time checks this app doesn't have at all today — "is this
the last time slot for this task?" and "was that the last step for the
whole assignment?" — plus switches from asking the student to type
actual minutes at completion to observing elapsed time automatically.

## Source

Prototype: `src/lib/domain/execution-coaching.ts` (new, 205 lines),
`src/routes/today.tsx` (541 lines changed on `main`; a further 78 on
`mobile-redesign`), `src/lib/domain/store.tsx` (coaching-interaction
actions), `src/lib/domain/types.ts` (`CoachingInteraction`,
`ExecutionStage`, `FrictionKind`), `src/components/efc/MobileSurface.tsx`
(`ResponsiveSheet`, `mobile-redesign` only).

## Already covered — do not re-propose

- The single-current-task-at-a-time model, the "After that" list,
  Start/Done actions, the empty state, the all-done confirmation screen
  ("That's everything for today. / You did what you said you would. The
  evening is yours."), and the one-question skippable reflection —
  `today-execution.md` and `TodayExecutionPage.tsx` already match the
  prototype here and need no change.

## User Story

As a student in the middle of (or about to start) a work session, I want
a quiet way to say what's actually getting in my way and get one useful
suggestion back, so being stuck doesn't mean either silently grinding or
abandoning the plan.

## UX Flow

### Trigger

Always student-initiated — nothing here is proactive or automatic.

- **Before starting** (session `planned`): the task card gains two ghost
  actions beneath "Start" — **"I'm stuck"** and **"Not now"**. "I'm
  stuck" opens the friction picker; "Not now" skips straight to the
  repair (reschedule) flow with no friction question asked.
- **In progress** (session `in_progress`): **"Need more time"** now
  routes into the friction picker with `taking_longer` pre-selected
  (rather than silently adding a fixed increment, as it does today) and
  **"I'm stuck"** opens the friction picker with no kind pre-selected.

### Friction picker — "What's getting in the way?"

Options differ by stage (a "Never mind" ghost button closes the picker
with nothing recorded):

- **Before starting** (5 options): "I can't get started," "I don't
  understand what to do," "It feels too big," "I'm distracted,"
  "Something else."
- **In progress** (6 options): "I don't know what to do next," "I don't
  understand this," "This is bigger than I thought," "I'm distracted,"
  "It's taking longer than I expected," "Something else."

Selecting an option records a `CoachingInteraction` (session, work item,
assignment, stage, friction kind) and immediately offers exactly one
intervention.

### The seven interventions

Each friction kind maps to exactly one intervention — headline, one
line of body copy, and a short list of concrete actions, always
including a "stop and replan" escape:

| Friction | Headline | Actions |
|---|---|---|
| Can't get started | "Getting started is the hard part right now." | Open what I need · Read the first instruction · Pick my own first action · Stop and change the plan |
| Don't understand the task | "Not being sure what's being asked is worth sorting out first." | Read the directions again · *Look at the assignment brief (only if one exists — see Dependency below)* · Write down the question I need answered · Ask someone · Stop and repair the plan |
| Feels too big | "This step may be too large for one sitting." | Decide on a smaller piece myself · Revisit the breakdown · Stop and replan |
| Distracted | "Attention drifts. That's normal, and you can steer it back." | Try five focused minutes · Change where I'm working · Put one distraction away · Stop and replan |
| Taking longer than expected | "Your first estimate may need updating." | Add 10 min to my estimate · Keep going without changing it · Stop and replan |
| Don't know what's next | "You've started — the next move is the only thing that matters now." | Re-read the step I'm on · Name my next action · Look at the breakdown · Stop and replan |
| Something else | "Thanks for saying so." | Keep going · Note what's in the way · Change the plan |

Every card also has a persistent **"Not helpful right now"** action,
separate from the listed choices, that dismisses the whole card.

**Action kinds, concretely:**
- *Return to task* (most actions): closes the overlay, no other change.
- *Own first action* ("Pick my own first action," "Name my next
  action," "Decide on a smaller piece myself," "Write down the question
  I need answered"): a single optional text field — *"In your own
  words — what comes first?"* — with "That's my first step" or "Skip";
  both close back to the task either way. Never forced.
- *Add 10 minutes*: revises the session's current estimate by +10
  minutes (see Revised estimate, below) and closes.
- *Revisit the breakdown / Look at the breakdown*: navigates to the
  assignment's breakdown flow.
- *Look at the assignment brief*: shows the confirmed brief's
  deliverables/requirements inline. **Dependency, not yet resolved:**
  this app doesn't have an Assignment Brief concept — `manual-work-
  breakdown-reflection-v0.1.md` explicitly excludes Assignment
  Understanding parsing for the current increment. **Recommend
  omitting this one action** (fall back to "Read the directions again"
  and "Ask someone" only for `unclear_task`) until/unless Assignment
  Brief ships as its own feature — do not build a bespoke brief just to
  support this one action.
- *Stop and replan / Stop and change the plan / Change the plan*: opens
  the repair flow (below).

**Repeated-dismissal fallback:** if the student has dismissed the same
intervention twice or more recently, the picker skips the normal mapping
and offers the "Something else" intervention instead — never re-offering
a strategy the student has already rejected twice in a row.

### Repair (reschedule) flow — "When would you rather do this?"

If the assignment is due today or already overdue, one calm line appears
first: "Worth knowing: this is due today." (never "late"). Four choices:

- **Later today** — reschedules to today at a fixed 19:30.
- **Tomorrow** — reschedules to tomorrow; if the due date is before
  tomorrow, a hint appears ("This is due before then — you can still
  choose it") without blocking the choice.
- **Choose another day** — navigates to Plan, no in-overlay date picker.
- **Cancel** — closes with no change.

Rescheduling genuinely moves the session (new date/time, status reset to
`planned`) — distinct from today's existing "defer," which only removes
a session from today's list without picking a new date. If reached via
an intervention's "stop and replan" action, choosing "Later today" or
"Tomorrow" also resolves that `CoachingInteraction` as `replanned`.

### Completion-time checks (new)

Two checks run when a student marks a session **Done**, before the
existing reflection prompt:

1. **"Is the whole task done?"** — only when the *same work item* has
   other still-open sessions on different days. *"You also have time
   set aside for this on {dates}..."* — **"Yes — clear the other
   time"** (completes this session, removes the other sessions for this
   item) or **"Not yet — keep the rest of the plan"** (completes this
   session but leaves the work item itself open, its other sessions
   intact).
2. **"Is the whole assignment done?"** — only when completing the work
   item (from check 1, or trivially when there was only one session)
   leaves every other work item under the same assignment already
   complete. *"Is the whole assignment done?"* — **"Yes, mark it
   complete"** (completes the assignment, then shows the "mark it
   turned in at school" reminder — see `daily-planning-and-completion-
   v2-proposal.md` item 5, which this document's completion path also
   triggers) or **"Not yet."**

If neither condition applies, completion behaves exactly as it does
today — no new screens.

### Automatic elapsed-time capture (behavior change)

Today, completing a session doesn't ask for actual minutes at all — this
app's existing "no timer required" design already assumes actual =
planned. The prototype computes elapsed wall-clock time automatically
(`completedAt - startedAt`) at completion and records it, tagged as to
whether it was derivable, without ever showing a live timer or asking
the student to type a number. **This is worth adopting**: it's silent,
adds no UI, and gives Risk Detection and the coach/parent dashboard a
real duration signal this app currently has no way to collect at all
(today, `actualMinutes` is simply never populated). It does not change
the reflection prompt, which stays the same qualitative-only question.

### Presentation: bottom sheets, not inline panels

On `main`, the friction picker, intervention card, own-first-action
field, brief view, and repair flow were each inserted into the page
beneath the task card. `mobile-redesign` moves all five into a
**responsive sheet** — a bottom sheet on phones, a centered dialog at
`sm:` and up — using the shared primitive specified in
`mobile-app-shell-and-touch-ergonomics-v0.1.md` §3. Build them that way
from the start; there's no reason to ship the inline version first.

| Overlay | Sheet title | Sheet description |
|---|---|---|
| Friction picker | "What's getting in the way?" | "Choose the closest answer. You can change the plan next." |
| Intervention | the intervention's headline | the intervention's body line |
| Own first action | "What comes first?" | "Name one small action in your own words." |
| Repair | "When would you rather do this?" | — (the "Worth knowing: this is due today." line stays in the body) |

- Every option inside a sheet is a full-width button at least 48 px tall
  (`min-h-12`), with left-aligned text that wraps rather than
  truncating.
- **Closing a sheet by any means other than an action** (swipe down,
  tapping the backdrop, Escape, the close button) behaves like its
  explicit cancel: "Never mind" for the friction picker, "Skip" for own
  action, "Cancel" for repair. **For the intervention sheet, closing it
  counts as "Not helpful right now"**: it records a dismissal, which
  feeds the repeated-dismissal fallback above. This is the one
  behavioral consequence of the sheet treatment, and it needs its own
  test.
- The **completion-time checks** below ("Is the whole task done?", "Is
  the whole assignment done?") and the turned-in reminder stay
  **full-screen steps** in `mobile-redesign`, not sheets. The prototype's
  own plan note said they would move into sheets, but the code didn't do
  it. Keep them full-screen: each one is a single decision that must be
  answered before continuing, and a dismissable sheet would let a
  student swipe past it without answering.
- The primary Start / Done button stays the dominant thumb-zone action on
  the task card. The ghost "I'm stuck" / "Not now" / "Need more time"
  actions stay beneath it, unchanged.

### Revised estimate, shown honestly

Once a session's `currentEstimateMinutes` diverges from what was
originally planned (via "Add 10 min" above), both Today Execution's
current-task card and its "After that" list show the current number,
with the original noted alongside it ("about {current} · first planned
{original}") rather than silently overwriting history.

## Domain Model Touchpoints

- New: `CoachingInteraction` (session, work item, assignment, stage,
  friction kind, intervention offered, response: selected / dismissed /
  replanned, optional student note).
- Work Session gains: a distinction between the immutable original
  commitment and a student-revisable current estimate; a recorded
  duration-source tag (observed-elapsed vs. unknown) instead of a
  student-typed actual-minutes field.
- New Domain Events (naming to be finalized at implementation, matching
  this app's existing event-naming conventions): friction reported,
  intervention offered/selected/dismissed, session estimate revised,
  session rescheduled, session repair opened.
- Future consumer, not this increment's scope: the coach/parent
  dashboard's "Friction and support" panel (prototype's
  `dashboard.index.tsx`, currently 100% mock data there) is clearly
  intended to eventually surface this data — `coach-parent-dashboard-
  feature-spec-v0.1.md` should get its own addendum once this feature is
  real, not before.

## Explicitly Out of Scope (this increment)

- The "Look at the assignment brief" intervention action — blocked on
  Assignment Brief not existing; omit until that feature ships
  separately (see Dependency above).
- Any proactive/automatic trigger (e.g. surfacing a nudge when
  `startTimePassed` fires on its own) — this feature is entirely
  student-initiated, matching the prototype's own current behavior
  (`startTimePassed` exists in prototype domain code but is unwired to
  anything, including this feature).
- A live, running timer or any UI implying one — elapsed time is
  computed silently at completion, never displayed mid-session.
- Any coaching content that adapts to assignment type or generates
  copy dynamically — the seven interventions above are fixed, written
  copy, same restriction `manual-work-breakdown-reflection-v0.1.md`
  already places on this app's other coaching-shaped features.
- Reworking "defer" — it stays as today's simpler "drop from today's
  list" action; the repair flow is additive, not a replacement.
