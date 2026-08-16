# Feature: Assignment Understanding & Guided Breakdown

**Status:** Superseded. Retained for prototype/history only.

Long-term capability strategy (target state, phased):
- `docs/reference/work-breakdown-coaching-feature-spec-v0.2.md`

Current increment's implementation scope (Phase 1 of that strategy —
unassisted student-led breakdown, no coaching yet):
- `docs/features/manual-work-breakdown-reflection-v0.1.md`

## Summary

The most domain-rich feature in this increment. Helps a student turn an
Assignment ("what am I expected to do?") into a Work Breakdown ("how am I
going to accomplish it?") — first by building an honest understanding of
what's actually required (the Assignment Brief), then by coaching the
student toward a workable set of Work Items using the minimum assistance
necessary, per Design-Principles.md's "Minimum Effective Intervention."

This is not conversational or generative AI. It is deterministic,
pattern-based logic (text pattern matching for common phrasings like page
counts, question ranges, chapter ranges, "at least N quotations," rubric
mentions, and weekday references; a fixed per-archetype scaffold script).
It does not conflict with the "no chatbot" / "AI-generated" non-goals in
Product-Vision.md.

## Source

Prototype: `src/routes/assignments.$id.breakdown.tsx`,
`src/lib/domain/breakdown.ts`. This is the prototype's most sophisticated
and most Domain-Model-aligned screen — recommend building it close to
verbatim.

## User Story

As a student, I want help turning a confusing assignment into a short list
of things I can actually start doing, without the app just doing it for
me.

## UX Flow

Reached from Assignment Detail ("Break this down" / "Break it down"). Six
possible steps, not all always visited:

### 1. Understand — "What do you have to do?"

Three entry choices (student picks how they want to describe it):
- **Paste what the teacher said** — instructions/email/rubric text.
- **Say it in my own words** — a sentence or two.
- **Help me figure out what this is asking** — same free-text entry, but
  frames the system as reading it together with the student, who "gets the
  final say."

The text is parsed into: an assignment archetype (`writing`, `problem_set`,
or `generic`, detected from keywords), candidate deliverables (page counts,
"compare N things," question ranges, chapter ranges), candidate
requirements ("at least N quotations/sources," rubric mentions), and
candidate intermediate dates (draft/final tied to a named weekday, resolved
to the next real occurrence of that weekday). Every extracted item is
tagged with its source: `teacher` (pasted directions), `student` (own
words), or `inferred` (a guess made only when nothing concrete was found).

### 2. Confirm — "Did I get that right?"

Shows the parsed understanding as a checklist, each inferred item marked
"(my guess)" so a guess is never presented as a teacher requirement (Domain
Invariant 4: actual teacher requirements take precedence over generic
assumptions). Student can edit the raw text and re-parse, or confirm. On
confirm, this becomes the assignment's Assignment Brief
(`brief_confirmed` observation) and the assignment's inferred type is
saved.

### 3. Sitting check — "Can you finish this in one sitting?"

- **Yes** → skip straight to a single time estimate (step 3b) and save one
  Work Item matching the whole assignment.
- **Probably not** → go straight to the attempt step.
- **Not sure** → a coaching note explains the tradeoff neutrally ("If it
  takes more than one work session, breaking it into a few pieces makes it
  easier to plan. Up to you.") and offers both paths — the student decides
  either way (Domain Invariant 2/3: the student owns the plan).

### 4. Attempt — "What are the main pieces?"

The student types their own list first, always. Only after they say "That's
my plan" does the system run an internal review (never shown as a score)
across five dimensions — completeness against the confirmed Brief,
startability, sizing, ordering, estimability — and surfaces **at most one**
coaching prompt at a time (e.g. *"'Write report' looks pretty big. Could
you split it into two or three smaller pieces?"*). If the attempt passes
review, it proceeds straight to step 5 with no prompt at all.

If the student taps "I need help" (or keeps getting flagged), a five-level
scaffold ladder engages, one rung at a time, escalating only on request via
"Still stuck — show me more":

1. Light open prompt ("What's the first thing you'll need to do before you
   can write?")
2. Multiple-choice options (e.g. "Find evidence / Organize my ideas / Make
   an outline / Finish the reading")
3. A structural hint (e.g. "Prepare → Create → Check")
4. A suggested skeleton the student fills in
5. A full suggested breakdown the student can accept as-is or edit

The ladder content differs by archetype (writing / problem set / generic),
each with its own realistic default breakdown. The system must never jump
ahead of the level the student actually needs, and must stop escalating the
moment the student can proceed (Design-Principles.md, Tenth Principle).

### 5. Final review — "Does this look like how you want to tackle it?"

Each item gets an editable effort estimate, pre-filled from a keyword-based
default (e.g. "revise/edit" → 30m, "draft/write" → 45m) the student can
change. "Looks good" confirms the breakdown (Domain Event: `Work Breakdown
Confirmed`) — this is the only point at which Work Items actually get
created/replace prior ones for this assignment. "Edit the steps" goes back
to step 4.

## Functional Requirements

- Nothing here becomes part of the student's actual plan or Work Breakdown
  until explicitly confirmed (Domain Invariant 3).
- Every decomposition attempt is recorded as a `DecompositionEpisode`
  (sitting answer, first/highest scaffold level reached, edit count, final
  items, outcome) — kept as behavioral evidence for future coaching
  calibration, but **not used to adapt behavior yet**. This increment only
  collects the evidence; see Out of Scope.
- The student-facing UI never shows scaffold level numbers, review
  dimension names, or any score — only the resulting coaching sentence
  (Domain Invariant 11).
- Confirming a breakdown updates the assignment's total estimate to the sum
  of its Work Items' estimates.

## Acceptance Criteria

- A student with a large, vague assignment can reach a confirmed, workable
  breakdown without ever being shown a review label, a scaffold level, or a
  score.
- A student who produces a workable breakdown unaided sees no coaching
  prompt at all (Domain Invariant: don't improve a workable breakdown
  merely because a more sophisticated one is possible).
- Guessed (inferred) requirements are visually distinguishable from
  confirmed teacher requirements everywhere they appear.

## Domain Model Touchpoints

- Commitments → Assignment Brief; Planning → Work Breakdown, Work Item;
  Coaching & Learning → Scaffold, Scaffold Strategy (the ladder),
  Decomposition Review, Reflection is out of scope here (see
  today-execution.md).
- Domain Events: `Assignment Brief Updated`, `Work Breakdown Started`,
  `Work Item Proposed`, `Work Breakdown Reviewed`, `Work Breakdown
  Confirmed`, `Scaffold Provided`.
- Directly implements the "Assignment Breakdown Learning Loop" diagram in
  Domain-Model.md.

## Explicitly Out of Scope (this increment)

- Adaptive scaffolding driven by Skill Competency / Zone of Proximal
  Development (Domain-Model.md describes this fully; V1 spec explicitly
  defers "Adaptive scaffolding," "ZPD implementation," and "Skill
  competency tracking"). Episodes are recorded now so this can be built
  later without a data migration, but the ladder's starting point and
  content do not vary by student history yet. metacognition-reflection.md
  §13 specifies the same escalate/fade pattern applied to reflection
  coaching instead of decomposition coaching — when ZPD/Skill Competency
  infrastructure is eventually built, it should serve both rather than
  being implemented twice.
- Generative/conversational AI assistance of any kind.
- Photo/OCR capture of a rubric or handout.

No deviations from the prototype are proposed for this feature — it is
recommended to build it close to verbatim, including the exact five-level
ladder structure and per-archetype content as a starting point, subject to
whatever the real backend's persistence layer requires.
