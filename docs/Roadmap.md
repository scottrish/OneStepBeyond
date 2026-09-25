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

**Status: done (2026-08-17).**

| Feature | Spec | Status |
|---|---|---|
| Daily Planning | [daily-planning.md](features/daily-planning.md) | Done (2026-08-16) |
| Student Preferences (Study Hours) | [student-preferences.md](features/student-preferences.md) | Done (2026-08-17) |
| Today Execution (incl. Reflection Moment C) | [today-execution.md](features/today-execution.md) | Done (2026-08-16) |
| Week Look-Ahead | [week-lookahead.md](features/week-lookahead.md) | Done (2026-08-17) |

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

**Week Look-Ahead implementation note (2026-08-17):** built as a second
tab on the Plan screen (`{ name: "wizard" } | { name: "lookahead" }`,
lifted to `App.tsx` alongside `planDate`/`planStep` — see
`docs/decisions/20260816-plan-tab-state-lifted-not-reset-on-retap.md`'s
own update), reusing `studyCapacity.ts`'s existing `availableMinutes` plus
a newly-ported `capacityPhrase` qualitative-phrase function. Assignment
links go through the same global Assignment Detail overlay every other
screen uses (`docs/decisions/20260817-assignment-detail-global-overlay.md`),
resolving the one open question the earlier build plan had flagged.
Session data comes from a new `useWeekSessions` hook (a real
loadError/retry surface, unlike `useAllWorkSessions`'s deliberately
non-critical one) rather than reusing Daily Planning's own single-date
hook. Live browser testing (not just the automated test suite) caught and
fixed one bug before considering this done: opening Assignment Detail
from Look Ahead and tapping Back was landing on the wizard's Day step
instead of back in Look Ahead.

**Demoable at the end of this phase (achieved):** a student can run a
full planning session in under five minutes on their own configured
study hours, execute today's plan one task at a time, answer the one
reflection question after each session, and glance at the week to see
where it's crowded.

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
Primary Goal. With Week Look-Ahead (Phase 4) also since shipped, every
spec across all five phases of Increment 1 is now built.

---

# Phase 6 — Real role-based access + supporter invitation (Increment 2 begins)

**Status: partially done (2026-08-19 / 2026-08-20).**

| Feature | Spec | Status |
|---|---|---|
| Real Role-Based Access | [supporter-role-based-access-feature-spec-v0.1.md](features/supporter-role-based-access-feature-spec-v0.1.md) | Done (2026-08-19) |
| Supporter Invitation & Onboarding — Primary Flow | [supporter-invitation-feature-spec-v0.1.md](features/supporter-invitation-feature-spec-v0.1.md) | Partially done (2026-08-20) |

**Why this, why now:** `docs/decisions/20260813-student-only-first-increment.md`
deferred Support Relationships and per-role auth "to be specified once the
student experience has been built and validated" — by the end of Phase 5,
it had been. A spec review of `supporter-invitation-feature-spec-v0.1.md`
(2026-08-19) found its own Acceptance Criteria ("Parent receives Parent
dashboard access") had nothing to enforce them: the Coach/Parent/
Diagnostic Dashboard (Backlog, below) was still a client-side toggle
anyone signed in as the student could flip. Real Role-Based Access was
built first, specifically because it's what makes the invitation flow
safe to build at all — inviting a real third party into the product
without it would have handed them the entire student account.

**Real Role-Based Access implementation note (2026-08-19):** a
`support_relationships` table (student, supporter, role, status) and a
`superusers` table now back real Postgres RLS — a Supporter can read a
Student's data only via an Active relationship, and Diagnostic Mode
requires superuser status, never a Support Relationship (direct
product-owner instruction: *"Diagnostic mode should require a superuser
level of access. It is not intended to be used by a supporter."*). RLS is
scoped to the five tables the dashboard actually queries
(`courses`/`assignments`/`work_items`/`decomposition_attempts`/
`reflections`), not every Student-scoped table, per Domain-Model.md's
"do not add complexity without demonstrated value." The dashboard's old
`ModeProvider`/`useMode()` toggle and its `localStorage` persistence are
gone. See `docs/decisions/20260819-dashboard-mode-toggle-replaced-by-real-access.md`.

**Supporter Invitation implementation note (2026-08-20):** the Primary
Flow (Student invites Parent/Guardian, Coach, or Teacher — Teacher stores
the exact same `role` as Coach, direct product-owner instruction: *"there
is no need to distinguish teacher and coach"*) is built, with one
deliberate delivery substitution: no real email is sent (*"this is just
for testing"*) — the invite screen displays the constructed link
directly, built with the same real, expiring, email-locked, one-time-use
token it will use once real email delivery exists. A
schema-migration-reviewer pass caught a genuine privilege-escalation gap
in the accept/decline RLS policy before this shipped (an invited user
could have rewritten `student_id` on their own legitimate invitation to
forge Supporter access to an arbitrary student) — closed with a
column-level `GRANT` restricting that policy to only the three columns it
needs, verified via live attack queries against the running database.
Not built this pass: resend, cancel, Remove Supporter, Supporter-leaves-
relationship, and the entire Secondary/adult-initiated flow (§20+ of that
spec, P2 by its own priority marking) — see that spec's own Status note.

**Demoable at the end of what's built so far:** a Student can invite a
real Parent/Guardian, Coach, or Teacher by email from Settings → Support,
get a shareable link, and that person can sign up or sign in as
themselves, accept, and immediately see the correct Coach- or Parent-
mode dashboard for that one Student — enforced by the database, not by
which screen the client renders.

---

# Phase 7 — Prototype parity: mobile-first redesign + planning, completion & coaching

**Status: in progress. Steps 1 (2026-09-24) and 2 (2026-09-25) done; steps 3–13 proposed.**

**Why this, why now:** `../OneStepBeyondPrototype` (this app's visual and
behavioral source of truth, per CLAUDE.md) has moved on a lot since
this app's specs were last synced from it (2026-08-18/20). There are
about 280 commits on its `main` (`744026a`), plus a 44-commit
`mobile-redesign` branch (`1ce3145`, not yet merged there) that reworks
the student app for phones. A prototype-sync audit (2026-09-24) turned
that gap into the six specs below. Together they bring this app to
parity. The same audit also recorded the decision to build a PWA in two
phases (`docs/decisions/20260924-pwa-in-two-phases.md`). Phase 1 ships
inside step 1 below; Phase 2 waits until after parity.

**How it's sequenced:** by dependency first, then by readiness. Almost
every later step reuses step 1's shared primitives (bottom sheet,
sticky action bar, overflow menu, touch-target sizes). Plan's capacity
and study windows (step 4) feed the planning work. Daily planning's own
items build on each other in the order shown. Execution coaching comes
last because it needs pieces from steps 1, 6, and 10. **Each step lists
the open product decision that must be settled before it starts.**
Settling decisions just in time keeps work moving. The ones at steps 3
and 4 are needed soonest, because they unblock Phase B while step 1 is
being built.

Each numbered step is one `analyze-feature` → "Implement" cycle, with the
normal Definition of Done and tag proposals.

## Phase A — Foundation

| # | Step | Spec | Decision needed first | Notes |
|---|---|---|---|---|
| 1 | ✅ **Done 2026-09-24.** Mobile shell & touch ergonomics, **plus PWA phase 1** (manifest, icons, meta tags, no service worker) | [mobile-app-shell-and-touch-ergonomics-v0.1.md](features/mobile-app-shell-and-touch-ergonomics-v0.1.md) | Approve the app-icon mark (drafts in `public/icons/`). A decision record for lifting capture and Settings into `App.tsx` overlays | Touches every student screen. Tag `v-pre-mobile-shell`. Adds shadcn `Sheet` + `DropdownMenu` |
| 2 | ✅ **Done 2026-09-25.** Swipe-to-reveal removal (existing lists: Assignments, Assignment Detail steps, breakdown draft steps, Activities, Week Look-Ahead; Courses joins in step 3) | [mobile-gestures-reorder-and-swipe-v0.1.md](features/mobile-gestures-reorder-and-swipe-v0.1.md) §2 | **D2**: the step-delete confirmation rule | Needs step 1's overflow menu. Drag (§1) waits for step 10 |

## Phase B — Independent setup features (any order)

| # | Step | Spec | Decision needed first | Notes |
|---|---|---|---|---|
| 3 | Course color, cascading course delete, "add your courses first" Home state | [course-management-v2-proposal.md](features/course-management-v2-proposal.md) | Reopen `course-setup.md`'s two 2026-08-14 resolutions (color non-editable, deletion deferred) | Delete uses step 2's swipe/menu pattern |
| 4 | Separate Saturday / Sunday study hours | [study-hours-v2-proposal.md](features/study-hours-v2-proposal.md) | Does `PROTECTED_MINUTES` (90 min) survive? (§3, options a/b) | **Schema migration**: tag, and run `schema-migration-reviewer`. Must land before Phase C |

## Phase C — Daily planning & completion

All items are from [daily-planning-and-completion-v2-proposal.md](features/daily-planning-and-completion-v2-proposal.md).

| # | Step | Items | Decision needed first | Notes |
|---|---|---|---|---|
| 5 | "Find time" / "Make a plan" pass the assignment through to Plan | 1 (implements `home-dashboard-followthrough.md` item 4) | — | Everything else in Plan builds on this |
| 6 | "No steps yet" / "All steps done" rows; the shared finishable-assignment rule; Detail's all-done card; turned-in reminder; return-to-Plan context | 4, 5 | — | Step 12 reuses the finishable rule and the reminder |
| 7 | "Plan it as one piece" moves to Assignment Detail | 3 | Decision record moving it off Plan (supersedes part of `20260816-plan-directly-without-breakdown.md`) | Needs step 5's single-item pre-select |
| 8 | Select: full list, "Planned today" note, same-day items disabled | 6a–6c | **6a** (drop the three-candidate cap?) and **6c** (disable same-day items?) | 6a replaces a `daily-planning.md` acceptance criterion |
| 9 | Existing-day view | 10 | Decision record partly reopening `20260818-plan-day-step-removed.md` | Moves "Move to another day" into the edit sheet |
| 10 | Reorder, re-chain, and retime (edit sheet), **plus drag** | 2 + gestures spec §1 | **D1** (`@dnd-kit` drag vs. Earlier/Later buttons only); how to re-chain on weekends (item 2, a vs. b) | Needs step 9's view and edit sheet. Covers the Schedule step, the day view, and Look Ahead |
| 11 | Next card "Working on" and late start; per-assignment Look Ahead warning | 7, 8 | — | Small and independent. Can fill any gap in Phases B–C |

## Phase D — Coaching

| # | Step | Spec | Decision needed first | Notes |
|---|---|---|---|---|
| 12 | Execution coaching: friction picker, interventions, repair flow, completion checks, automatic elapsed time, revised estimates | [execution-coaching-v0.1.md](features/execution-coaching-v0.1.md) | — (the spec already resolves its own open point by omitting the Assignment-Brief action) | Largest step. **New table + work-session changes**: tag, and run migration review. Needs steps 1, 6, and Plan. After it ships: add a friction-panel addendum to `coach-parent-dashboard-feature-spec-v0.1.md` |

## After parity

| # | Step | Spec |
|---|---|---|
| 13 | PWA phase 2: service worker, offline, background sync, push | Not written yet. Needs its own spec + decision record (`docs/decisions/20260924-pwa-in-two-phases.md` lists what it must answer) |

**Critical path:** step 1 → steps 4–6 → step 9 → step 10 → step 12.
Steps 3 and 11 are off the critical path and can happen while a decision
is pending elsewhere.

**If the prototype's `mobile-redesign` branch changes before it merges**,
re-check daily planning items 2, 6, and 10 first. Those are where it most
recently diverged from the prototype's `main`.

**Demoable at the end of this phase:**
- A student can install the app to their phone's home screen and run
  the full plan → execute → finish loop there, with thumb-reachable
  controls, familiar gestures, and non-gesture alternatives.
- Planning surfaces every open assignment honestly, including
  never-broken-down and finished-but-not-closed ones.
- A student who gets stuck mid-session can say why and get one calm,
  concrete suggestion or a real reschedule.

---

# Backlog — known, not yet scheduled

Everything below is either explicitly deferred by an existing decision
record, or flagged as out-of-scope inside a Phase 1–5 spec. Listed here so
it isn't lost, not because it's scheduled next.

## Increment 2 — multi-role (in progress; see Phase 6 above)

- **Support Relationships and real role-based access — done.** See
  Phase 6 above. `docs/decisions/20260813-student-only-first-increment.md`'s
  deferral of this work is now superseded for the access-control portion;
  its point about starting from a fresh `analyze-feature` pass against
  the validated student data model is exactly what happened.
- **Supporter Invitation — Primary Flow done, Secondary Flow and a few
  Primary-Flow actions not yet.** See Phase 6 above and that spec's own
  Status note for the precise list (resend, cancel, Remove Supporter,
  Supporter-leaves-relationship, adult-initiated onboarding).
  `Playwright-Test-Personas.md`'s parent/coach acceptance criteria are
  now actionable against a real build, not just drafted ahead of one.
- **Coach / Parent / Diagnostic Dashboard — Phase 1 content: done
  (2026-08-16); its access model: replaced (2026-08-19), see Phase 6
  above.** See
  [coach-parent-dashboard-feature-spec-v0.1.md](features/coach-parent-dashboard-feature-spec-v0.1.md).
  Still reached at its own desktop-oriented `/dashboard` URL, entirely
  outside the mobile `AppShell` — that part is unchanged. What changed:
  it no longer signs in with the student's own account or lets a
  client-side toggle pick Coach/Parent/Diagnostic; a real Supporter signs
  in as themselves and the mode is derived from their actual Active
  relationship, enforced by RLS (`docs/decisions/20260819-dashboard-mode-toggle-replaced-by-real-access.md`,
  superseding `docs/decisions/20260816-dashboard-reuses-student-auth.md`
  for this part). The dashboard's own Phases 2–6 (Skills & Capability,
  Behavior Trends, Scaffolding, AI-assisted sections) stay not-yet-
  scheduled, same as the strategy docs' own later phases below — no real
  data exists yet for any of them.

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
- Course Setup: archiving a course at the end of a term/year — deferred
  by the 2026-08-14 resolution in `course-setup.md`. (Deleting a course
  and manual color selection, deferred by that same resolution, are now
  scheduled in Phase 7, step 3.)
- A true calendar grid/month view (`week-lookahead.md` explicitly scopes
  out anything beyond the 7-day list).
- Cross-day drag-and-drop rescheduling (`daily-planning.md`). Phase 7's
  drag-to-reorder is same-day only. Cross-day moves stay a tap-based
  action in the edit sheet.
- A running timer/time-tracking UI for Today Execution (deliberately
  excluded per Design-Principles.md's "no elapsed-time pressure").
  Phase 7, step 12 records elapsed time silently at completion and
  never shows a timer, so this exclusion stands.
- Supporter Invitation's deferred resend / cancel / Remove Supporter
  actions (Phase 6). When they're built, their Support rows use the
  swipe/overflow pattern from `mobile-gestures-reorder-and-swipe-v0.1.md`.
- PWA phase 2 (offline, background sync, push) — see Phase 7's "After
  parity".
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
