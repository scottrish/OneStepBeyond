# Executive Function Coach

## Current Increment — Manual Work Breakdown + Reflection Foundation

Version 0.1

**Status:** Implemented (2026-08-16), merged to `main`. The "Break this
down" flow (create → estimate → confirm, with reorder) and the Work
Breakdown Reflection prompt (primary question + optional adjustment
follow-up) are built and tested, including the draft-vs-confirmed
semantics (§4 "Draft vs Confirmed Semantics") and Assignment Estimated
Effort derivation (§5) — see
`docs/decisions/20260815-manual-work-breakdown-draft-state.md` for how
draft state is kept client-side-only rather than persisted. `DecompositionAttempt`
and `Reflection` are both recorded with `ScaffoldIntensity = None` per
§5/§12, as specified. AssignmentType (§6), Assignment Brief (§7), and
everything else this spec marks explicitly out of scope (§14) were not
built. See `docs/Roadmap.md` Phase 3.

---

# Authoritative References

This increment is an implementation slice of the following canonical documents:

1. `reference/Domain-Model.md`
   - Defines ubiquitous language, bounded contexts, domain invariants, ownership rules, and the shared Scaffold / ZPD model.

2. `reference/work-breakdown-coaching-feature-spec-v0.2.md`
   - Defines the target-state Work Breakdown Coaching capability and its phased delivery strategy.
   - This increment implements **Phase 1 only**.

3. `reference/metacognition-reflection-feature-spec-v0.2.md`
   - Defines the target-state Metacognition & Reflection capability and its phased delivery strategy.
   - This increment implements only the **Phase 1 Work Breakdown Reflection foundation**.

## Interpretation and Precedence

When implementing this increment:

1. **This Current Increment specification defines what is in scope now.**
2. **The Domain Model defines canonical terminology, relationships, and invariants.**
3. **The Work Breakdown and Metacognition feature specifications provide capability context and future direction.**
4. Requirements described in later phases of those feature specifications are **not implementation requirements for this increment unless explicitly included here**.

Do not pull future-phase functionality into this increment merely because it appears in an upstream feature specification.

In particular, do not implement:

- decomposition review
- heuristic coaching
- Assignment Understanding parsing
- scaffold escalation
- generated Work Breakdowns
- AI assistance
- adaptive ZPD behavior
- execution-aware reflection

The data model and implementation should remain compatible with those future capabilities without implementing them prematurely.

---

# Implementation Intent

This increment intentionally establishes an **unassisted decomposition baseline**.

The student creates the Work Breakdown themselves.

The product records what the student did and, after the student has had an opportunity to use the breakdown, asks the student to reflect on whether it worked.

The absence of decomposition assistance is intentional. It is **not** an incomplete implementation of the Work Breakdown Coaching specification.

The implementation should preserve the architectural seams required for later:

- Assignment Understanding
- Decomposition Review
- Scaffold Strategy
- AI-assisted coaching
- ZPD-driven adaptation

without activating those capabilities in this increment.

---

# 1. Purpose

Define the exact implementation scope for the next product increment.

Current baseline:

- Courses can be created.
- Assignments can be created.

This increment adds the first student learning loop:

> **Assignment → Student-created Work Breakdown → Reflection on whether the breakdown worked**

The increment deliberately does **not** provide decomposition coaching yet.

Its purpose is to:

- introduce the core domain objects
- validate how students naturally break down Assignments
- begin collecting behavioral and reflection evidence
- create a stable foundation for later heuristic, AI-assisted, and adaptive coaching

## User Story

> As a student, I want to turn an Assignment into a short list of things I can actually start doing, without the app doing the planning for me.

This is also an implementation test for the increment: the experience should make decomposition easier to express and use without introducing decomposition assistance.

---

# 2. Governing Principles

1. The student owns the Work Breakdown.
2. The student performs the decomposition.
3. The system does not evaluate or generate the Work Breakdown in this increment.
4. Work Items should be easy to create and edit.
5. Reflection should be brief.
6. The implementation records evidence needed by future phases without adapting current behavior.
7. Student-facing UX remains simpler than the underlying domain model.

---

# 3. In Scope

## Assignment Detail → Break Down Assignment

Provide an action such as:

> **Break this down**

The student enters a dedicated Work Breakdown flow.

---

# 4. Work Breakdown Flow

## Step 1 — Create Work Items

Prompt:

> **What are the main pieces you'll need to get done?**

The student can:

- add a Work Item
- edit a Work Item
- delete a Work Item
- reorder Work Items

Do not:

- suggest steps
- review wording
- identify missing steps
- tell the student a step is too large
- generate a breakdown
- parse teacher directions
- classify decomposition quality

This is an intentionally unassisted baseline.

## Step 2 — Estimate Work Items

For each Work Item, allow the student to estimate duration.

Suggested quick values may include:

- 10 min
- 20 min
- 30 min
- 45 min
- 1 hr
- Other

The estimate belongs to the student.

Do not provide a system-recommended duration in this increment.

## Step 3 — Final Review

Prompt:

> **Does this look like how you want to tackle it?**

Actions:

- Looks good
- Edit the steps

Only after confirmation does the Work Breakdown become the active breakdown for the Assignment.

### Draft vs Confirmed Semantics

Work Items being created or edited in this flow form a **draft Work Breakdown** until the student explicitly confirms them.

Technical persistence of draft state is allowed, but draft Work Items must not be treated as the authoritative Work Breakdown for planning or execution.

If the Assignment already has a confirmed Work Breakdown:

- the existing confirmed Work Breakdown remains authoritative while the student edits a revision
- the revision remains draft until explicitly confirmed
- confirmation replaces or versions the active Work Breakdown according to the implementation's persistence model
- cancelling or abandoning the edit must not silently replace the existing confirmed Work Breakdown

From the domain perspective, confirmation should be treated as one logical transaction.

---

# 5. Domain Behavior

## Work Breakdown

Create one Work Breakdown associated with the Assignment.

The student owns it.

The implementation must distinguish draft Work Breakdown state from the confirmed active Work Breakdown.

Only a confirmed Work Breakdown is authoritative for later planning and execution.

## Work Item

Each confirmed step becomes a Work Item.

Work Items should support:

- title
- sequence / ordering
- estimated duration
- status as required by the existing application

## Assignment Estimated Effort

When a Work Breakdown is confirmed, the Assignment's total estimated effort should be derived from the confirmed Work Items:

```text
Assignment estimated effort
=
sum(confirmed Work Item estimated durations)
```

If the current application stores an Assignment-level estimate, prefer treating that value as derived from the confirmed Work Breakdown rather than maintaining two independently editable estimates that can drift apart.

Draft Work Item estimates must not change the authoritative Assignment estimate until the revised Work Breakdown is confirmed.

If an Assignment has no confirmed Work Breakdown, the existing Assignment estimate behavior may remain unchanged.

## Decomposition Attempt

Record a `DecompositionAttempt` for the interaction.

At minimum capture, where practical:

```text
assignmentId
initialWorkItems
resultingWorkItems
revisionCount
assistanceRequested = false
initialScaffoldIntensity = None
highestScaffoldIntensity = None
scaffoldsProvided = []
outcome
occurredAt
```

This is evidence for future coaching development and does not influence current behavior.

---

# 6. AssignmentType

If AssignmentType already exists cleanly in the current data model, it may be captured.

Recommended values:

- Problem Set / Routine Homework
- Reading
- Writing / Essay
- Project
- Presentation
- Lab
- Test / Quiz Preparation
- Other

However:

- no type-specific coaching is implemented
- no Decomposition Strategy is shown
- AssignmentType does not alter the student experience in this increment

If introducing AssignmentType materially complicates the build, defer it to the next increment.

---

# 7. Assignment Brief

Do not build Assignment Brief interpretation in this increment.

The existing Assignment may retain whatever description or directions fields already exist.

Do not add:

- deterministic parsing
- AI interpretation
- deliverable extraction
- requirement extraction
- Assignment Brief confirmation

These belong to a later phase.

---

# 8. No Assignment Understanding Coaching Yet

The Domain Model includes an Assignment Understanding Service for later phases.

This increment does not implement active Assignment Understanding coaching.

Most importantly, no component should take Assignment directions and automatically produce Work Items.

The student's opportunity to perform decomposition must remain intact.

---

# 9. Reflection Foundation

Introduce the first metacognitive Reflection specifically around Work Breakdown quality **from the student's perspective**.

Use selectively when there is a meaningful outcome.

Preferred trigger:

- Assignment is marked complete and had a Work Breakdown

Optional secondary trigger:

- the student substantially restructures the Work Breakdown while completing the Assignment

Avoid prompting simply because a Work Breakdown was created; the student needs some experience using it before reflecting on whether it worked.

---

# 10. Reflection Question

Primary question:

> **Did the way you broke this down work?**

Structured responses:

- The steps were about right
- Some steps were too big
- I missed a step
- I made too many steps
- Not sure
- Something else

If `Something else` is selected, allow free text.

Free text is optional.

---

# 11. Optional Adjustment Question

After a response indicating a problem, optionally ask:

> **What would you change next time?**

Possible responses:

- Make smaller steps
- Make fewer steps
- Add a step I missed
- Start earlier
- Nothing
- Something else

If `Something else` is selected, allow optional free text.

This question should not be mandatory.

---

# 12. Reflection Domain Behavior

Create a `Reflection` associated with the Assignment and/or Work Breakdown.

Capture:

```text
related Assignment / Work Breakdown
trigger
structured response
optional free text
optional proposed adjustment
ScaffoldIntensity
occurredAt
```

For the structured-choice UI:

```text
ScaffoldIntensity = Structured
```

This does not mean the student has low skill. It records the form of assistance used in the interaction.

The student's Reflection is not an objective Behavior Observation.

---

# 13. Student Experience Requirements

The experience should:

- be mobile-first
- use one question at a time
- make Work Items quick to add
- make reordering easy
- avoid project-management terminology
- avoid ZPD / Skill / Scaffold language
- avoid scores
- avoid moral or corrective language
- avoid turning breakdown or reflection into another assignment

---

# 14. Explicitly Out of Scope

Do not implement in this increment:

- `Can you finish this in one sitting?`
- AssignmentType-specific decomposition coaching
- Decomposition Strategy
- Decomposition Review
- completeness / startability / sizing / ordering / estimability checks
- heuristic prompts
- `I need help` scaffold ladder
- suggested skeletons
- suggested Work Breakdowns
- Assignment Brief extraction
- pasted-direction parsing
- AI
- adaptive ZPD
- Skill Competency updates that affect behavior
- actual-duration calibration
- missed Work Session reflection
- blocker reflection
- end-of-day reflection
- weekly pattern reflection
- parent / coach views

---

# 15. Events

Recommended Domain Events:

```text
Work Breakdown Started
Work Item Created
Work Breakdown Confirmed
Decomposition Attempt Completed
Reflection Recorded
```

Use existing event conventions if the implementation already has an established pattern.

---

# 16. Acceptance Criteria

## Manual Breakdown

Given an Assignment, the student can create multiple Work Items without receiving system-generated decomposition advice.

## Editability

The student can add, edit, delete, and reorder Work Items before confirmation.

## Estimation

The student can estimate each Work Item.

## Ownership

Nothing becomes the confirmed Work Breakdown until the student confirms it.

If a confirmed Work Breakdown already exists, editing a draft revision does not replace the active breakdown until the student confirms the revision.

## Derived Effort

When a Work Breakdown is confirmed, the Assignment's estimated effort reflects the sum of the confirmed Work Item estimates where the current data model supports an Assignment-level estimate.

Draft estimates do not change the authoritative Assignment estimate.

## No Coaching

The system does not evaluate, improve, or generate the student's Work Breakdown.

## Evidence

A Decomposition Attempt can be recorded with `ScaffoldIntensity = None`.

## Reflection

After a meaningful outcome, the student can answer:

> Did the way you broke this down work?

with one tap.

## Optional Free Text

Free text is available but not required.

## Reflection Semantics

The student's Reflection remains distinguishable from objective Observation.

---

# 17. Test Scenarios

## Scenario A — Simple Homework

Assignment:

> Algebra worksheet

Student creates:

```text
Questions 1–10
Questions 11–20
```

Student confirms.

No coaching occurs.

## Scenario B — Vague Writing Breakdown

Assignment:

> Book report

Student creates:

```text
Finish book
Write report
```

Student confirms.

The system **does not** tell the student that `Write report` is too large.

That behavior belongs to a later heuristic-coaching phase.

After the Assignment is completed, the student may reflect:

> Some steps were too big.

This provides useful evidence for future feature development.

## Scenario C — Edit Existing Confirmed Breakdown

Assignment already has a confirmed Work Breakdown.

Student opens it and changes the steps.

Until the student confirms the revision:

- the existing confirmed Work Breakdown remains authoritative
- draft changes do not replace active Work Items
- draft estimates do not change the Assignment's authoritative estimated effort

Student cancels.

The existing confirmed Work Breakdown remains unchanged.

## Scenario D — Reflection

Assignment had four Work Items.

Student completes the Assignment.

Prompt:

> Did the way you broke this down work?

Student selects:

> I missed a step.

Optional follow-up:

> What would you change next time?

Student selects:

> Add a step I missed.

Record the Reflection.

Do not automatically change future Work Breakdowns yet.

---

# 18. Product Learning Questions

This increment should help answer:

1. Will students voluntarily create Work Items?
2. How many Work Items do they create for different Assignments?
3. What language do students naturally use for steps?
4. Do students tend to over-decompose or under-decompose?
5. Do students estimate individual Work Items?
6. Do students perceive Work Breakdown as helpful?
7. Can students recognize after the fact that their steps were too large, incomplete, or excessive?
8. Are the structured Reflection options adequate?
9. Does Reflection feel useful or annoying?
10. What evidence should Phase 2 heuristics actually respond to?

---

# 19. Exit Criteria

The next phase should not be justified merely because it is on the roadmap.

Move toward AssignmentType-specific heuristic coaching when testing demonstrates clear recurring decomposition problems that lightweight prompts could plausibly address.

The implementation should emerge from observed student behavior rather than assumptions about what the student needs.

---

# 20. Next Planned Capability

Expected next phase:

> **AssignmentType + Simple Heuristic Coaching**

Likely initial types:

- Problem Set / Routine Homework
- Writing / Essay
- Other / Generic

That phase may introduce:

- sitting check
- simple Decomposition Strategies
- limited Decomposition Review
- one Light coaching prompt at a time

It should still preserve student-first decomposition.
