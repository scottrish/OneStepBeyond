# Executive Function Coach

## Work Breakdown Coaching — Feature & Phased Delivery Specification

Version 0.2

---

# 1. Purpose

Help a student learn to convert an Assignment into a workable, student-owned Work Breakdown.

The capability should evolve from simple student-created Work Items to context-aware coaching that:

- helps the student understand what the Assignment requires
- lets the student attempt decomposition first
- identifies when assistance may be useful
- provides only the minimum effective Scaffold
- preserves student ownership
- records evidence of independence
- gradually fades or restores assistance as appropriate

The long-term purpose is not to generate better task lists for the student.

It is to help the student **learn how to create better task lists independently**.

---

# 2. Core Product Principles

1. Student attempts first whenever reasonably possible.
2. The student owns the Work Breakdown.
3. Understanding the Assignment and decomposing it are separate capabilities.
4. The Assignment Understanding Service supports understanding; it does not generate the Work Breakdown.
5. A workable student-created breakdown should not be replaced merely because the system can produce a better one.
6. Simple Assignments should remain simple.
7. Provide at most one primary coaching intervention at a time.
8. Increase support only when needed.
9. Scaffolding may fade or increase as context and evidence change.
10. Student-facing UX hides ZPD, ScaffoldIntensity, review dimensions, and competency scores.
11. Teacher-provided requirements take precedence over inference.
12. AI is an implementation mechanism for Domain Services, not a license to do the student's planning.

---

# 3. Domain Concepts

This capability uses:

- Assignment
- AssignmentType
- Assignment Brief
- Work Breakdown
- Work Item
- Decomposition Attempt
- Decomposition Review
- Decomposition Strategy
- Skill
- Skill Context
- Skill Evidence
- Scaffold
- ScaffoldIntensity
- Scaffold Strategy
- Skill Competency
- Zone of Proximal Development

Primary Skill:

> **Task Decomposition**

Example Skill Contexts:

```text
Task Decomposition + AssignmentType: Problem Set
Task Decomposition + AssignmentType: Writing / Essay
Task Decomposition + AssignmentType: Reading
Task Decomposition + AssignmentType: Project
```

---

# 4. Assignment Understanding

Assignment Understanding answers:

> **What is this Assignment actually asking me to do?**

It does not answer:

> **What steps should I use to complete it?**

That second question belongs to Work Breakdown Coaching.

## Assignment Brief

The Assignment Brief may contain:

- teacher directions
- student's description
- deliverables
- explicit requirements
- scope
- rubric
- intermediate deadlines
- provenance
- confidence for inferred information

## Input Modes Over Time

The capability may eventually support:

- student types a summary
- student pastes teacher directions
- deterministic parsing
- AI-assisted interpretation
- later, LMS-provided material

## Coaching Constraint

The Assignment Understanding Service must preserve the student's opportunity to practice decomposition.

It may:

- clarify teacher language
- identify an explicit deliverable
- point out that a requirement appears in the directions
- ask the student what a requirement means
- identify ambiguity
- ask for confirmation
- make a targeted observation only when needed

It must not:

- automatically generate a complete Work Breakdown
- silently turn every deliverable into a Work Item
- choose the student's sequence
- skip the student's decomposition attempt

Preferred flow:

```text
Understand external requirements
        ↓
Student attempts decomposition
        ↓
Review / coaching only when needed
```

---

# 5. Student-Led Work Breakdown

Prompt:

> **What are the main pieces you'll need to get done?**

The student can:

- add Work Items
- edit Work Items
- reorder Work Items
- delete Work Items
- estimate Work Items
- confirm the Work Breakdown

A Work Item should generally be:

- startable
- finishable
- reasonably sized
- estimable

Do not require the student to use a system-provided template.

---

# 6. Decomposition Attempt

Each meaningful attempt should be capable of recording:

- Assignment
- AssignmentType
- Skill Context
- initial Work Items
- revisions
- whether assistance was requested
- initial ScaffoldIntensity
- highest ScaffoldIntensity
- Scaffolds provided
- resulting Work Items
- outcome

Early phases record:

```text
ScaffoldIntensity = None
```

Later phases use the same structure for coaching evidence.

---

# 7. Does the Assignment Need Decomposition?

Not every Assignment needs multiple Work Items.

A later phase may ask:

> **Can you finish this in one sitting?**

Responses:

- Yes
- Probably not
- Not sure

If Yes:

- allow one Work Item
- estimate it
- continue to planning

Do not force artificial decomposition.

This question also creates a lightweight metacognitive prediction.

---

# 8. Decomposition Review

A Decomposition Review is internal.

Possible dimensions:

- Completeness
- Startability
- Sizing
- Ordering
- Estimability

Do not show scores, labels, percentages, or rubric-style grading.

Translate the review into at most one useful observation or prompt.

Example:

Internal:

> "Write report" appears too broad to start and estimate.

Student-facing:

> **"Write report" looks pretty big. Could you split it into a couple smaller steps?**

The system should remain quiet when the student's breakdown is workable.

---

# 9. Shared Scaffold Model

Use canonical ScaffoldIntensity values:

```text
None
Light
Guided
Structured
Suggested
Direct
```

Task Decomposition maps these to interventions:

## None

Student proceeds independently.

## Light

Open prompt.

> What's the first thing you'll need to do?

## Guided

Targeted question or choices.

> Before you write, do you need to find evidence, organize ideas, or make an outline?

## Structured

Provide a conceptual framework.

> Prepare → Create → Check

The student fills in the meaning.

## Suggested

Provide a partial structure or skeleton.

```text
Gather evidence
Plan
Draft
Revise
```

The student adapts it.

## Direct

Provide a possible full breakdown only when stronger support is warranted or explicitly requested.

The student must review, edit, accept, or reject it.

Direct assistance is a scaffold of last resort, not the default behavior.

---

# 10. Decomposition Strategies by AssignmentType

A Decomposition Strategy is coaching knowledge, not a mandatory template.

## Problem Set / Routine Homework

Typical considerations:

- overall scope
- whether one sitting is realistic
- natural ranges or sections

Example:

```text
Questions 1–10
Questions 11–20
```

Avoid one Work Item per question unless there is a real reason.

## Reading

Typical considerations:

- page / chapter scope
- natural boundaries
- notes or response requirements

## Writing / Essay

Typical considerations:

- understand prompt
- gather evidence
- organize ideas
- outline
- draft
- revise
- submit

## Project

Typical considerations:

- understand requirements
- identify deliverables
- research / gather materials
- plan
- create
- review
- submit / present

## Presentation

Typical considerations:

- understand requirements
- gather content
- outline
- create materials
- rehearse
- revise
- present

## Other / Unknown

Use generic coaching questions rather than forcing the Assignment into an unsupported type.

---

# 11. Reflection Touchpoints

Work Breakdown should connect to Metacognition & Reflection from the first implementation phase.

Early reflection does not require execution telemetry.

Example after Assignment completion or meaningful breakdown revision:

> **Did the way you broke this down work?**

Structured responses:

- The steps were about right
- Some steps were too big
- I missed a step
- I made too many steps
- Not sure
- Something else

Optional follow-up:

> **What would you change next time?**

This creates early Skill Evidence without claiming the system can objectively judge the student's decomposition skill yet.

---

# 12. Delivery Phases

## Phase 1 — Student-Led Work Breakdown + Reflection Foundation

### In Scope

- create Work Breakdown from Assignment
- add / edit / reorder / delete Work Items
- estimate Work Items
- confirm Work Breakdown
- record Decomposition Attempt
- record ScaffoldIntensity = None
- basic Work Breakdown Reflection

### Out of Scope

- sitting check
- Assignment Brief parsing
- AssignmentType-specific coaching
- Decomposition Review
- heuristics
- scaffold ladder
- AI
- adaptive ZPD

### Primary Learning Questions

- Will students create Work Items?
- How do they naturally decompose Assignments?
- Which Work Items appear too broad or too small?
- Does reflection help students notice problems with their own breakdown?
- What terminology makes sense to students?

---

## Phase 2 — AssignmentType + Simple Heuristic Coaching

### Add

- AssignmentType
- Problem Set / Routine Homework
- Writing / Essay
- Other / Generic
- optional Reading
- sitting check
- simple deterministic review heuristics
- Light coaching prompts

### Example Heuristics

- vague Work Item such as "do project"
- oversized Work Item such as "write essay"
- large problem range that may need splitting
- Work Item difficult to estimate

Provide one prompt only.

### Still Out of Scope

- full scaffold ladder
- Assignment Brief parsing
- AI
- adaptive behavior

---

## Phase 3 — Assignment Brief + Deterministic Scaffolded Coaching

### Assignment Understanding

Support:

- paste teacher directions
- type student summary
- deterministic extraction when reliable

Possible extraction:

- page / chapter ranges
- problem ranges
- required quotations / sources
- page count
- draft / final milestones
- rubric references

Preserve provenance.

### Important Constraint

The Assignment Understanding Service still does **not** generate the Work Breakdown.

It may clarify requirements and ask the student to confirm them.

The student then attempts decomposition.

### Add

- Decomposition Review
- full deterministic Scaffold Strategy
- recording of first / highest ScaffoldIntensity and Scaffolds provided

### Adaptation

None yet. Every student begins from the same student-first interaction.

---

## Phase 4 — Execution-Aware Reflection

Once Work Sessions or equivalent execution tracking exists, add:

- planned vs actual duration
- Need More Time
- Blocked
- missed / rescheduled work

This enables reflection on whether the Work Breakdown actually produced manageable Work Items.

No adaptive ZPD is required yet.

---

## Phase 5 — AI-Assisted Understanding and Coaching

### Assignment Understanding Service

AI may:

- clarify complex directions
- identify explicit requirements
- identify deliverables
- point out ambiguity
- propose AssignmentType
- ask the student to confirm interpretation

### Non-Negotiable Constraint

AI-assisted Assignment Understanding must **support the student's decomposition skill, not bypass it**.

It should prefer:

> **clarification → student attempt → observation → targeted prompt**

over:

> **directions → generated Work Breakdown**

AI must not generate a full Work Breakdown merely because enough information is available.

### Work Breakdown Review Service

AI may review the student's attempt against:

- Assignment Brief
- AssignmentType
- known deliverables
- decomposition heuristics

Normal output:

> **one recommended coaching intervention**

not a replacement breakdown.

### Decomposition Strategy Service

At higher ScaffoldIntensity, AI may provide:

- guided prompts
- structural hints
- suggested skeletons
- eventually a suggested breakdown

A full suggested breakdown is provided only when stronger assistance is justified or explicitly requested.

---

## Phase 6 — Adaptive ZPD + Fading / Restoring Support

Use accumulated Skill Evidence by:

```text
Student + Skill + Skill Context
```

Example:

```text
Skill:
Task Decomposition

Skill Context:
AssignmentType = Writing / Essay
```

Estimate:

- demonstrated independent capability
- supported capability
- effective Scaffolds
- current challenge

Future interactions begin with the minimum likely useful ScaffoldIntensity.

Repeated successful independence allows support to fade.

Struggle, novelty, or context change may cause support to increase temporarily.

`I need help` remains available even when proactive support has faded.

---

# 13. AI Responsibilities and Constraints

AI may:

- interpret directions
- summarize explicit requirements
- flag ambiguity
- review student-created Work Items
- generate one coaching prompt
- generate hints or structures when allowed by Scaffold Strategy

AI must not:

- silently alter the Assignment Brief
- present inference as teacher fact
- automatically create the student's Work Breakdown
- silently add Work Items
- skip the student's attempt because it can generate a plausible solution
- over-decompose simple Assignments
- expose internal confidence as certainty
- turn the experience into a generic chatbot

---

# 14. Acceptance Criteria by Phase

## Phase 1

- Student can create a Work Breakdown manually.
- Student confirms their own Work Items.
- No system-generated Work Items are required.
- Decomposition Attempt is recorded.
- Basic Work Breakdown Reflection is available.

## Phase 2

- AssignmentType can influence a simple coaching prompt.
- A simple Assignment can remain one Work Item.
- The system stays quiet when no obvious heuristic concern exists.

## Phase 3

- Student can paste or summarize directions.
- Assignment Brief preserves provenance.
- Student confirms the Assignment Brief.
- Student still creates the initial Work Breakdown.
- Deterministic coaching escalates only as needed.

## Phase 5

- AI improves Assignment Understanding without automatically generating a Work Breakdown.
- AI review normally returns one coaching intervention.
- Stronger AI-generated structures require appropriate ScaffoldIntensity.
- Student acceptance remains required.

## Phase 6

- Support can fade with repeated independent success.
- Support can increase again when the student struggles in context.
- Adaptation is contextual rather than global.

---

# 15. Explicitly Deferred

Until later phases:

- OCR / photo capture
- LMS integration
- teacher accounts
- parent / coach intervention controls
- global executive-function scoring
- predictive ML
- automatic cross-context generalization
- automatic Work Breakdown generation as the normal flow

---

# 16. Definition of Success

The immediate feature succeeds when the student can turn:

> **"I have to do this assignment."**

into:

> **"I know the pieces and I decided how to tackle them."**

The long-term capability succeeds when a student who once required significant decomposition support can approach a similar Assignment and independently create a workable Work Breakdown.

The product should become less necessary as the student's skill grows.
