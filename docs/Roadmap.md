# Roadmap & Feature Prioritization

This document sequences *build order*, not just scope. `Product-Vision.md`
already splits work into "Increment 1 — Student Experience" vs. "Later
Increments — Deferred" (see
`docs/decisions/20260813-student-only-first-increment.md`). This doc adds
the layer that decision doesn't: in what order the ten feature specs under
`docs/features/` should actually be built within Increment 1, and why —
plus a prioritized backlog for everything already known to come after it.

It is a living document. Update it as increments land or priorities change;
it does not need its own decision record for routine re-sequencing, only
for a genuine change of direction.

---

# How this is sequenced

Two things drive the order below, in this priority:

1. **Data dependencies.** Several specs say outright that they depend on
   another: Assignment Capture needs Course Setup to have something real to
   attach to; Daily Planning needs Activities to compute honest capacity;
   Today Execution needs a confirmed Plan to execute. Building out of this
   order means building against fixtures/hardcoded data that get thrown
   away — the prototype's own hardcoded five-course list is exactly the
   trap Course Setup exists to fix.
2. **Design-Principles.md's Decision Framework**, applied to *sequencing*
   rather than inclusion: within Increment 1 everything is already
   in-scope, so the framework's seven questions are used here to break ties
   between independent features — favor whichever gets the student to
   "What do I need to do? What should I do next? Am I on track?" fastest.

Each phase below is independently testable end to end before the next one
starts, matching CLAUDE.md's "small, independently testable increments."

---

# Phase 1 — Foundations (no feature dependencies)

**Status: done (2026-08-15).**

| Feature | Spec | Status |
|---|---|---|
| Course Setup | [course-setup.md](features/course-setup.md) | Done |
| Activities | [activities.md](features/activities.md) | Done |
| Navigation shell (bottom tab bar + header, no content yet) | subset of [home-dashboard.md](features/home-dashboard.md) | Done |

**Why first:** both features are leaves in the dependency graph — nothing
in Increment 1 depends on anything *they* depend on, and two other specs
name them as prerequisites (`assignment-capture.md` for Course Setup;
`daily-planning.md`, `week-lookahead.md`, and `risk-detection.md`'s
`availableMinutes` calculation for Activities). The navigation shell is the
literal container every other student screen renders inside, so standing
it up early — even empty — means every later phase has somewhere to plug
into rather than a last-minute integration.

**Note:** Course Setup had no prototype screen to match, so its design was
proposed rather than ported. Its two open questions are now resolved
(2026-08-14): colors are auto-assigned and non-editable, and course
deletion is deferred entirely rather than shipped as a hard block or a
cascading delete — this phase ships create/rename/list only. See
`course-setup.md`'s "Deviation from the prototype — resolved" section and
Backlog below.

**Demoable at the end of this phase (achieved):** a signed-in student can
manage their course list and weekly activities, reached through a
Settings list behind Home's header gear icon; the bottom tab bar (Home /
Plan / Assignments) renders everywhere, with Plan and Assignments showing
honest "coming soon" placeholders until Phases 2–5 give them real content.

---

# Phase 2 — Commitments: capture and manage

**Status: done (2026-08-15).**

| Feature | Spec | Status |
|---|---|---|
| Assignment Capture | [assignment-capture.md](features/assignment-capture.md) | Done |
| Assignment Management | [assignment-management.md](features/assignment-management.md) | Done |

**Why next:** Assignment Capture explicitly depends on Course Setup
(Phase 1). Assignment Management (list + detail) is the natural
second half of the same loop — capture without a way to view, edit, or
complete what you captured is not independently useful. Both predate
Planning in the domain model's own learning loop (`External Reality →
Commitments → ...`).

**Demoable at the end of this phase (achieved):** a student can log an
assignment in under a minute, see it in a sorted list, open its detail,
edit it, and mark it complete — the full basic commitment-tracking loop,
with no planning or coaching yet.

---

# Phase 3 — Manual work breakdown + reflection foundation

**Status: done (2026-08-16).**

| Feature | Spec | Status |
|---|---|---|
| Manual Work Breakdown + Reflection | [manual-work-breakdown-reflection-v0.1.md](features/manual-work-breakdown-reflection-v0.1.md) | Done |

**Supersedes:** the old `assignment-understanding-and-breakdown.md` plan
for this phase (now marked Superseded in that file) — it described the
full scaffolded/archetype-aware breakdown experience, which is now the
*target state* of a longer phased strategy
(`docs/reference/work-breakdown-coaching-feature-spec-v0.2.md`,
6 phases) rather than this phase's actual scope. This phase builds only
that strategy's **Phase 1**: an intentionally *unassisted* student-led
Work Breakdown (create / edit / reorder / estimate / confirm Work Items,
zero coaching, zero AI) plus the first Work Breakdown Reflection prompt
from the companion metacognition strategy
(`docs/reference/metacognition-reflection-feature-spec-v0.2.md`, its own
Phase 1 / Reflection Moment A). See CLAUDE.md's Project Documentation
section for when to consult these two strategy docs.

**Why its own phase:** still the most domain-rich feature built so far —
it introduces `DecompositionAttempt` and `Reflection` as real, persisted
entities for the first time. It depends on Assignment Management existing
(reached from Assignment Detail) but nothing later depends on it being
done first — Daily Planning can select single-Work-Item assignments that
never went through a breakdown. The scaffold ladder, archetype detection,
and AI-assisted coaching described in the old spec are deliberately
**not** part of this phase; see Backlog below for where those live now.

**Demoable at the end of this phase (achieved):** a student can turn an
Assignment into their own ordered, estimated Work Breakdown with no
system-generated suggestions, and — after completing it — answer one
question about whether their breakdown actually worked.

---

# Phase 4 — Planning and execution

**Status: mostly done.** Daily Planning and Today Execution are both
built; Week Look-Ahead is the one piece of this phase not yet started.

| Feature | Spec | Status |
|---|---|---|
| Daily Planning | [daily-planning.md](features/daily-planning.md) | Done (2026-08-16) |
| Student Preferences (Study Hours) | [student-preferences.md](features/student-preferences.md) | Done (2026-08-17) |
| Today Execution (incl. Reflection Moment C) | [today-execution.md](features/today-execution.md) | Done (2026-08-16) |
| Week Look-Ahead | [week-lookahead.md](features/week-lookahead.md) | Not started |

**Why next:** Daily Planning needs open Work Items (Phase 2/3) and
Activities (Phase 1) to compute realistic capacity. Today Execution is
reached only from a confirmed Plan, so it cannot be built or meaningfully
tested before Daily Planning exists — build it immediately after so the
"Planning (intention) → Execution (behaviour)" loop closes end to end
rather than leaving Planning as a dead end. Week Look-Ahead lives inside
the Planning screen (a tab, not a separate nav destination) and reuses
Planning's own `availableMinutes` calculation, so it is a thin, low-risk
addition once Daily Planning's capacity logic already exists — build it
last in this phase, not first.

**Daily Planning implementation note:** built across four iterations —
the initial 5-step wizard, then three rounds of fixes/additions driven by
persona-assessment findings and (iteration 4) direct product-owner
review: the breakdown-prerequisite signal and its "plan as one task
instead" alternative, tab-navigation state persistence, an
already-scheduled-elsewhere indicator, a directly-editable Schedule-step
time control, and a "Move to another day" action. See
`daily-planning.md`'s own Status note,
`docs/features/iterations/daily-planning/`, and
`docs/playwright/daily-planning/` for full detail. Its Select step's
fully-empty-state copy and missing "Add assignment" escape hatch were
also corrected after the fact (2026-08-17) — see `daily-planning.md`'s
own Amendment section.

**Today Execution implementation note (2026-08-16):** built immediately
after Daily Planning per the "Why next" reasoning above — one task at a
time, "Need more time"/"I'm stuck" actions, the after-Done reflection
prompt, and the all-done confirmation screen, matching
`today-execution.md`'s Acceptance Criteria. Owned by `App.tsx` (an
`executingToday` boolean sibling to the active tab) rather than by Plan
alone, so it's reachable from both Plan's own entry points and — once
Phase 5 shipped — Home's Next card, without duplicating the screen; see
`docs/decisions/20260816-today-execution-interim-entry-point.md` for how
that ownership evolved. Daily Planning's own confirm step still shows an
inline success state as its primary path, per
`docs/decisions/20260816-daily-planning-confirm-write-order.md`.

Today Execution's reflection step is Reflection Moment C ("After-Work
Calibration") of the much larger phased design in
[docs/reference/metacognition-reflection-feature-spec-v0.2.md](reference/metacognition-reflection-feature-spec-v0.2.md)
— Moment A ("Work Breakdown Reflection") is now built earlier, in Phase 3
above. Building only Moment C here — one fixed question, a few tap
choices, always skippable — is correct scope for this phase; see Backlog
below for the rest of that document.

**Student Preferences (2026-08-17):** added after Daily Planning and
Today Execution both shipped, replacing the fixed `WEEKDAY_WINDOW`/
`WEEKEND_WINDOW` constants their capacity math had used until then with
a per-student weekday finish time and weekend hours budget. Not part of
this phase's original sequencing — folded in here because it's a direct
amendment to Daily Planning's own capacity calculation (and, once built,
Risk Detection's below) rather than an independent feature. See
`student-preferences.md`'s own Status note.

**Demoable at the end of this phase (achieved, except Week Look-Ahead):**
a student can run a full planning session in under five minutes on their
own configured study hours, execute today's plan one task at a time, and
answer the one reflection question after each session. Glancing at the
week to see where it's crowded is not yet possible — Week Look-Ahead
remains the one unbuilt piece of this phase (see Backlog).

---

# Phase 5 — Cross-cutting intelligence and Home

**Status: done (2026-08-17).**

| Feature | Spec | Status |
|---|---|---|
| Risk Detection | [risk-detection.md](features/risk-detection.md) | Done (2026-08-17) |
| Home Dashboard (full content) | [home-dashboard.md](features/home-dashboard.md) | Done (2026-08-17) |

**Why last:** Risk Detection is a derived read-time computation over
Assignments, Work Items, Activities, and Planning signals — it has nothing
to compute correctly until Phases 1–4 exist. Home Dashboard's full content
(Next card, Needs Attention, Coming up) composes data from every prior
phase and introduces no new domain concepts of its own — it is
deliberately the last thing wired up, once every section it composes
already has real data to show instead of placeholders. Building Home last
also avoids a stretch of the project where the landing screen looks "done"
but is actually silently showing stale or fixture data.

**Implementation note:** Risk Detection's two rules (not-enough-time,
due-soon-unscheduled) and three next-actions ("Break it down" / "Find
time" / "Make a plan") are built exactly as specced and consumed by
Home's Needs Attention section. It is not yet consumed by Assignment
Detail, despite `risk-detection.md`'s own Summary naming
`assignment-management.md` as a consumer — see the Backlog item below on
Assignment Detail's CTA hierarchy, which covers this gap. Home Dashboard
shipped all of its UX Flow except item 7 (the Ownership note), deferred
by explicit product-owner direction — see `home-dashboard.md`'s own
Explicitly Out of Scope section. A few small correctness fixes landed
after the initial build: the Next card now distinguishes "all done" from
"nothing planned" (previously showed the empty state even once every
session was complete) and the "Today's plan: N tasks" summary no longer
lingers once everything it describes is finished.

**Demoable at the end of this phase (achieved):** the full three-question
promise ("What do I need to do? What should I do next? Am I on track?")
is answerable from Home within five seconds, per `Product-Vision.md`'s
Primary Goal. Increment 1 is not quite feature-complete even so — Week
Look-Ahead (Phase 4) is the one spec across all five phases still
unbuilt; see Backlog.

---

# Backlog — known, not yet scheduled

Everything below is either explicitly deferred by an existing decision
record, or flagged as out-of-scope inside a Phase 1–5 spec. Listed here so
it isn't lost, not because it's scheduled next.

## Increment 2+ — multi-role (highest-value next increment)

- **Support Relationships** (inviting/connecting a parent or coach to a
  student, per-role authentication, a real second account type) —
  deferred by `docs/decisions/20260813-student-only-first-increment.md`
  pending validation of the student experience above. Depends on
  multi-user accounts and per-role auth that Increment 1 does not build.
  `Playwright-Test-Personas.md` already has parent/coach acceptance
  criteria drafted for when this starts.
- **Coach / Parent / Diagnostic Dashboard — Phase 1: done (2026-08-16),
  built ahead of Support Relationships above.** See
  [coach-parent-dashboard-feature-spec-v0.1.md](features/coach-parent-dashboard-feature-spec-v0.1.md)
  and `docs/decisions/20260816-dashboard-reuses-student-auth.md`. Reached
  at its own desktop-oriented `/dashboard` URL, entirely outside the
  mobile `AppShell`; signs in with the *same* student account rather than
  a real coach/parent identity, and Coach/Parent/Diagnostic are a
  client-side display toggle only — not backend-enforced access levels.
  Real third-party parent/coach access remains blocked on Support
  Relationships above. The dashboard's own Phases 2–6 (Skills &
  Capability, Behavior Trends, Scaffolding, AI-assisted sections) stay
  not-yet-scheduled, same as the strategy docs' own later phases below —
  no real data exists yet for any of them.

## Work Breakdown Coaching — Phases 2–6

`docs/reference/work-breakdown-coaching-feature-spec-v0.2.md` specifies a
much larger design than Phase 3's Phase 1 (manual, unassisted). Later
phases, not yet scheduled:

- **Phase 2 — AssignmentType + Simple Heuristic Coaching.** Sitting check,
  deterministic review heuristics, one Light coaching prompt at a time.
- **Phase 3 — Assignment Brief + Deterministic Scaffolded Coaching.**
  Paste/summarize teacher directions, deterministic extraction, the full
  scaffold ladder (Light → Guided → Structured → Suggested → Direct).
- **Phase 4 — Execution-Aware Reflection**, **Phase 5 — AI-Assisted
  Understanding and Coaching**, **Phase 6 — Adaptive ZPD** (see next
  section).

## Metacognition & Reflection — remaining Moments and Phases

`docs/reference/metacognition-reflection-feature-spec-v0.2.md` specifies
four Reflection Moments and 6 delivery phases in total. Phase 3 above
builds Moment A (Phase 1 of that doc); Phase 4 above builds Moment C
(part of that doc's Phase 4). Not yet scheduled:

- **Moment B — Before-Work Prediction.** Requires Work Items to be
  estimated and planned (depends on Phase 4's Daily Planning).
- **Moment D — Periodic Pattern Reflection.** Requires enough accumulated
  Behavior Observations to show a real pattern, not a guess.
- That doc's own Phases 2–3 (simple/structured reflection coaching tied to
  Work Breakdown Coaching's own Phases 2–3, above) and Phases 5–6
  (AI-assisted, adaptive ZPD).

## Adaptive scaffolding (ZPD / Skill Competency)

Both the Work Breakdown scaffold ladder (its strategy doc's Phase 3+) and
reflection scaffolding (the metacognition strategy doc's §5) are
explicitly built as **fixed** progressions through Increment 1 — Phase 3
above records the evidence (`DecompositionAttempt`, `Reflection`, with
`ScaffoldIntensity` values already present in the data model) needed to
eventually adapt, but nothing adapts yet. The work-breakdown strategy doc
calls out that this shared ZPD/Skill Competency infrastructure "should
serve both rather than being implemented twice" when it's eventually
built — schedule it as one piece of work, not two.

## Week Look-Ahead — the one unbuilt Phase 4 spec

[week-lookahead.md](features/week-lookahead.md) was deliberately sequenced
last within Phase 4 (it's a thin layer over Daily Planning's own
`availableMinutes`), and stayed unbuilt when Today Execution and Student
Preferences were prioritized instead. Nothing further blocks it — Daily
Planning's capacity logic it depends on has existed since Phase 4 started,
and now also reflects per-student Preferences. Picking this up doesn't
require revisiting any other phase first.

## Smaller open items inside already-built specs

- **Assignment Detail's CTA hierarchy needs reconsidering, not just
  completing.** `assignment-management.md` specs two primary actions side
  by side — "Plan work for today" and "Mark assignment complete" — but
  only "Mark assignment complete" was ever built (its partner was
  deferred pending Daily Planning, which now exists but was never
  revisited). With no partner action, "Mark assignment complete" reads as
  the screen's single dominant CTA, including for a just-created,
  never-worked-on assignment. Raised 2026-08-16: does "Mark assignment
  complete" even make sense there? It's a "record already-done or
  unplanned work" action, not a "plan what's next" one — **this is a
  planning tool, not a tool for recording unplanned work** — so simply
  adding the missing "Plan work for today" button back may not be enough;
  the relative prominence of "Mark complete" itself (always secondary, or
  conditioned on some state) deserves its own look before either is
  touched. The spec's related, also-never-built "offer a coaching prompt
  suggesting a breakdown (does not force one)" line is the same shape of
  gap — see `docs/decisions/20260816-plan-directly-without-breakdown.md`
  for the equivalent capability already built in Daily Planning, not yet
  wired into Assignment Detail's own "Break this down." Risk Detection
  (Phase 5, now built) is the same story a third time: `risk-detection.md`
  names Assignment Detail as a consumer, but nothing there calls it yet —
  worth folding into this same reconsideration rather than wiring it in
  separately ahead of the CTA-hierarchy decision.
- Course Setup: deleting a course (and whatever in-use protection that
  needs), manual color selection, and archiving a course at the end of a
  term/year — all deferred by the 2026-08-14 resolution in
  `course-setup.md`, worth revisiting once real students have used the
  create/rename/list-only version from Phase 1.
- A true calendar grid/month view (`week-lookahead.md` explicitly scopes
  out anything beyond the 7-day list, once the base view above is built).
- Cross-day drag-and-drop rescheduling (`daily-planning.md`).
- A running timer/time-tracking UI for Today Execution (deliberately
  excluded per Design-Principles.md's "no elapsed-time pressure").
- One-off exceptions to a recurring Activity (`activities.md`) — e.g. "no
  practice this Friday."
- Home Dashboard's Ownership note (UX Flow item 7) — deferred
  2026-08-17 by explicit product-owner direction; see
  `home-dashboard.md`'s Explicitly Out of Scope section.
- Daily Planning's Confirm step still shows an inline success state with
  an explicit "Start today's plan" button rather than navigating straight
  into Today Execution, even though Today Execution has shipped — a
  follow-up `docs/decisions/20260816-daily-planning-confirm-write-order.md`
  flagged as needed once that happened, never done. Discovered
  2026-08-17 while auditing this same file for the Assignment Detail
  global-overlay change; not fixed as part of that unrelated work.

---

# Non-goals (unchanged from Product-Vision.md)

Still out of scope for any increment currently planned: LMS integration,
AI-generated grades/predictions, school administration or teacher
workflows, gamification, native mobile apps. Revisit only if
`Product-Vision.md` itself changes.
