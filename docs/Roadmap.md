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

# Phase 3 — Understanding & guided breakdown

| Feature | Spec | Status |
|---|---|---|
| Assignment Understanding & Guided Breakdown | [assignment-understanding-and-breakdown.md](features/assignment-understanding-and-breakdown.md) | Not started |

**Why its own phase:** flagged in its own spec as "the most domain-rich
feature in this increment" and "the prototype's most sophisticated and
most Domain-Model-aligned screen." It depends on Assignment Management
existing (it's reached from Assignment Detail) but nothing later depends
on it being done first — Daily Planning can select single-Work-Item
assignments that never went through a breakdown. Isolating it protects the
rest of the roadmap from its complexity (six-step flow, five-level scaffold
ladder, per-archetype content) and lets it get focused review on its own,
per CLAUDE.md's "small focused pull requests."

**Demoable at the end of this phase:** a student with a large, vague
assignment can reach a confirmed, workable Work Breakdown using the
graduated scaffold ladder, without ever seeing an internal score or level.

---

# Phase 4 — Planning and execution

| Feature | Spec | Status |
|---|---|---|
| Daily Planning | [daily-planning.md](features/daily-planning.md) | Not started |
| Today Execution (incl. reflection Loop 1) | [today-execution.md](features/today-execution.md) | Not started |
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

Today Execution's reflection step is Loop 1 ("Calibration") of the much
larger design in
[metacognition-reflection.md](features/metacognition-reflection.md).
Building only Loop 1 here — one fixed question, three tap choices, always
skippable — is correct scope for this phase; see Backlog below for the
rest of that document.

**Demoable at the end of this phase:** a student can run a full planning
session in under five minutes, execute today's plan one task at a time,
answer the one reflection question after each session, and glance at the
week to see where it's crowded.

---

# Phase 5 — Cross-cutting intelligence and Home

| Feature | Spec | Status |
|---|---|---|
| Risk Detection | [risk-detection.md](features/risk-detection.md) | Not started |
| Home Dashboard (full content) | [home-dashboard.md](features/home-dashboard.md) | Not started (nav shell already done — Phase 1) |

**Why last:** Risk Detection is a derived read-time computation over
Assignments, Work Items, Activities, and Planning signals — it has nothing
to compute correctly until Phases 1–4 exist. Home Dashboard's full content
(Next card, Needs Attention, Coming up) composes data from every prior
phase and introduces no new domain concepts of its own — it is
deliberately the last thing wired up, once every section it composes
already has real data to show instead of placeholders. Building Home last
also avoids a stretch of the project where the landing screen looks "done"
but is actually silently showing stale or fixture data.

**Demoable at the end of this phase:** Increment 1 is feature-complete —
the full three-question promise ("What do I need to do? What should I do
next? Am I on track?") is answerable from Home within five seconds, per
`Product-Vision.md`'s Primary Goal.

---

# Backlog — known, not yet scheduled

Everything below is either explicitly deferred by an existing decision
record, or flagged as out-of-scope inside a Phase 1–5 spec. Listed here so
it isn't lost, not because it's scheduled next.

## Increment 2+ — multi-role (highest-value next increment)

- **Parent Dashboard**, **Coach Dashboard**, **Support Relationships**
  (inviting/connecting a parent or coach to a student) — deferred by
  `docs/decisions/20260813-student-only-first-increment.md` pending
  validation of the student experience above. Depends on multi-user
  accounts and per-role auth that Increment 1 does not build.
  `Playwright-Test-Personas.md` already has parent/coach acceptance
  criteria drafted for when this starts.

## Metacognition & Reflection — Loops 2 and 3

`metacognition-reflection.md` specifies a much larger design than Phase
4's Loop 1. Two more loops are explicitly named as natural extensions of
already-built flows, not new screens:

- **Loop 2 — Missed Work Session.** Extends Today Execution's "I'm stuck"
  flow (Moment C: "What happened?" / "What would help next time?").
- **Loop 3 — Weekly Pattern.** Extends Daily Planning's `estimationDrift`
  coaching note (Moment D: one evidence-based pattern per review, e.g.
  "Algebra usually took about 15 minutes longer than you planned").

## Adaptive scaffolding (ZPD / Skill Competency)

Both the breakdown scaffold ladder (Phase 3) and reflection scaffolding
(§13 of `metacognition-reflection.md`) are explicitly built as **fixed**
progressions in Increment 1 — they record the evidence
(`DecompositionEpisode`s, Skill Evidence) needed to eventually adapt, but
don't adapt yet. `assignment-understanding-and-breakdown.md` calls out that
this shared ZPD/Skill Competency infrastructure "should serve both rather
than being implemented twice" when it's eventually built — schedule it as
one piece of work, not two.

## Smaller open items inside already-built specs

- Course Setup: deleting a course (and whatever in-use protection that
  needs), manual color selection, and archiving a course at the end of a
  term/year — all deferred by the 2026-08-14 resolution in
  `course-setup.md`, worth revisiting once real students have used the
  create/rename/list-only version from Phase 1.
- A true calendar grid/month view (`week-lookahead.md` explicitly scopes
  out anything beyond the 7-day list).
- Cross-day drag-and-drop rescheduling (`daily-planning.md`).
- A running timer/time-tracking UI for Today Execution (deliberately
  excluded per Design-Principles.md's "no elapsed-time pressure").
- One-off exceptions to a recurring Activity (`activities.md`) — e.g. "no
  practice this Friday."

---

# Non-goals (unchanged from Product-Vision.md)

Still out of scope for any increment currently planned: LMS integration,
AI-generated grades/predictions, school administration or teacher
workflows, gamification, native mobile apps. Revisit only if
`Product-Vision.md` itself changes.
