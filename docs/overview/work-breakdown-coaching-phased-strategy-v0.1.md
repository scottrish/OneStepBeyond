# Executive Function Coach

## Reconciled Work Breakdown Coaching — Phased Feature Strategy

Version 0.1

---

# 1. Purpose

Reconcile the two existing work-breakdown specifications into one phased development strategy.

The long-term goal is to move the product from:

> a student manually creating tasks for an assignment

to:

> a scaffolded coaching system that helps the student learn how to decompose assignments, provides only the minimum assistance required, and gradually fades that assistance as the student becomes more capable.

This feature should work closely with the Metacognition & Reflection feature so the application develops both:

- **planning skill** — how to turn an assignment into actionable work
- **self-awareness** — how to notice what worked, what did not, and what to change next time

Together, these capabilities are intended to differentiate the application from a conventional task or assignment manager.

---

# 2. Reconciliation of the Existing Specifications

The two existing specifications are highly compatible, but they operate at different levels.

## Specification A — Assignment Understanding & Guided Breakdown

This specification is implementation-oriented.

Its strengths are:

- concrete UX flow
- deterministic parsing
- explicit provenance for teacher / student / inferred information
- a fixed scaffold ladder
- decomposition episodes recorded as behavioral evidence
- no dependency on generative AI
- clear separation between student-facing language and internal review logic
- immediate fit for a prototype

It is best treated as an **intermediate implementation phase**, not the final product model.

---

## Specification B — Scaffolded Work Breakdown Assistance

This specification is product- and domain-oriented.

Its strengths are:

- explicit ZPD model
- broader assignment archetype strategy
- AI-assisted assignment understanding
- AI-assisted breakdown review and suggestions
- adaptive fading over time
- stronger articulation of the long-term coaching model
- explicit Skill Context and Skill Evidence concepts

It is best treated as the **target-state capability model**.

---

# 3. Recommended Product Direction

Do not attempt to build the full target-state feature immediately.

Develop the capability in phases so each phase can be tested independently.

The progression should be:

> **Manual → Heuristic → Scaffolded Heuristic → AI-Assisted → Adaptive ZPD**

Each phase should preserve the same core domain concepts so later phases extend rather than replace earlier work.

---

# 4. Architectural Principle

Separate the feature into two related but distinct capabilities.

## Assignment Understanding

Answers:

> **What is this assignment actually asking me to do?**

Responsible for:

- assignment instructions
- student summary
- deliverables
- requirements
- deadlines
- assignment archetype
- provenance
- uncertainty

---

## Work Breakdown Coaching

Answers:

> **How am I going to accomplish it?**

Responsible for:

- student-created Work Items
- decomposition review
- scaffold selection
- suggested structure
- breakdown confirmation
- evidence of independence

These should remain separate services / modules even if they appear in one student workflow.

Conceptually:

```text
Assignment
    ↓
Assignment Understanding
    ↓
Assignment Brief
    ↓
Student Breakdown Attempt
    ↓
Work Breakdown Coaching
    ↓
Confirmed Work Breakdown
```

---

# 5. Stable Product Invariants

These principles should apply in every phase.

1. **Student attempts first whenever reasonably possible.**
2. **The system must not improve a workable breakdown merely because it can produce a better one.**
3. **The student owns the final Work Breakdown.**
4. **Nothing becomes part of the confirmed breakdown without student acceptance.**
5. **Actual teacher directions take precedence over inferred assumptions.**
6. **Inferred requirements must be visibly distinguishable from teacher-provided requirements when shown to the student.**
7. **The student should never see decomposition scores, scaffold levels, ZPD terminology, or competency ratings.**
8. **The system should provide at most one primary coaching intervention at a time.**
9. **Simple assignments should remain simple.**
10. **The data model should preserve evidence needed for later adaptation even when early phases do not use it yet.**

---

# 6. Common Domain Concepts

Preserve these concepts from the beginning:

- Assignment
- Assignment Brief
- Assignment Archetype
- Work Breakdown
- Work Item
- Decomposition Episode
- Decomposition Review
- Scaffold
- Scaffold Level / Intensity
- Skill Context
- Skill Evidence

Later phases add active use of:

- Skill Competency
- Zone of Proximal Development
- Scaffold Strategy
- adaptive fading

---

# 7. Data to Capture From the Beginning

Even early versions should record enough information to support later learning and adaptation.

For each decomposition interaction, capture where practical:

- Assignment ID
- assignment archetype
- source of assignment description
- whether instructions were available
- student's initial Work Items
- number of edits
- whether help was requested
- first scaffold level used
- highest scaffold level used
- final Work Items
- whether breakdown was confirmed
- total estimated effort
- timestamps

This data should not affect behavior in early phases.

It exists so later ZPD logic can be introduced without redesigning the data model.

---

# 8. Phase 1 — Manual Work Breakdown

## Objective

Validate whether students can and will create Work Items for assignments when the application provides no coaching.

This is the simplest useful implementation.

---

## Student Experience

From Assignment Detail:

> **Break this down**

Student sees:

> **What are the main pieces you'll need to get done?**

The student manually adds Work Items.

Examples:

```text
Finish reading
Find quotes
Write report
```

or:

```text
Questions 1–10
Questions 11–20
```

The student can:

- add
- edit
- reorder
- delete
- estimate time
- confirm

---

## Assistance

None.

No:

- review
- hints
- archetype suggestions
- AI
- assignment parsing
- scaffold ladder

---

## Assignment Understanding

Use only:

- title
- course
- due date
- optional student-entered description / directions

Do not interpret the description yet.

---

## What This Phase Tests

- Will students create Work Items?
- Do they understand the concept?
- How many steps do they naturally create?
- Do students over- or under-decompose?
- Which assignment types create the most difficulty?
- Is decomposition itself perceived as useful?

---

## Exit Criteria

Proceed when:

- the manual interaction is understandable
- Work Items integrate cleanly with planning
- real examples demonstrate where students need assistance

---

# 9. Phase 2 — Assignment Archetypes + Simple Heuristics

## Objective

Introduce lightweight assistance without AI.

The system starts recognizing that different assignment types require different decomposition approaches.

---

## Supported Archetypes

Start with three:

### Problem Set / Routine Homework

Typical strategy:

- determine whether it fits in one sitting
- if not, divide into natural ranges or sections

Example:

```text
Questions 1–10
Questions 11–20
```

---

### Writing / Essay

Typical strategy:

```text
Understand prompt
Gather evidence
Outline
Draft
Revise
Submit
```

Use as a strategy, not a mandatory template.

---

### Generic / Unknown

Use neutral questions such as:

> What do you have to turn in?

> What needs to happen before you can start?

---

## Optional Fourth Archetype

Add **Reading** if implementation cost is low.

Typical strategy:

- divide by chapter / page ranges
- include notes / questions if required

---

## Sitting Check

Introduce:

> **Can you finish this in one sitting?**

Responses:

- Yes
- Probably not
- Not sure

If Yes:

Create or retain one Work Item.

Do not force decomposition.

---

## Simple Heuristics

Examples:

- detect question ranges
- detect page ranges
- detect chapter ranges
- detect words such as essay, report, presentation, project
- detect obvious oversized Work Items such as:
  - "write essay"
  - "do project"
  - "study test"

Use deterministic rules.

---

## Student Experience

The student still creates the breakdown.

The application may provide a light prompt such as:

> **"Write essay" looks pretty big. Could you split it into a couple smaller steps?**

No deeper scaffold ladder yet.

---

## What This Phase Tests

- Do assignment archetypes improve the experience?
- Are heuristic prompts accurate enough to be useful?
- Does the sitting check prevent unnecessary decomposition?
- Which archetypes deserve deeper support?

---

# 10. Phase 3 — Deterministic Scaffolded Coaching

## Objective

Implement the full scaffold ladder using deterministic, archetype-based coaching.

This phase closely corresponds to the existing **Assignment Understanding & Guided Breakdown** specification.

---

## Assignment Understanding

Support:

- paste teacher directions
- student summary
- deterministic parsing

Extract when possible:

- page count
- question range
- chapter range
- quotation / source count
- draft / final requirements
- named weekday deadlines
- rubric references

Preserve provenance:

- teacher
- student
- inferred

---

## Confirmation

Before coaching:

> **Did I get that right?**

Student confirms or edits the Assignment Brief.

---

## Decomposition Review

Review student-created Work Items using:

- completeness
- startability
- sizing
- ordering
- estimability

Do not expose these dimensions to the student.

Surface only one useful coaching prompt.

---

## Scaffold Ladder

Implement:

### Level 0 — Independent

No coaching required.

### Level 1 — Light Prompt

Example:

> What's the first thing you'll need to do?

### Level 2 — Guided Options

Example:

> Before you write, do you need to find evidence, organize ideas, or make an outline?

### Level 3 — Structural Hint

Example:

> Prepare → Create → Check

### Level 4 — Suggested Skeleton

Example:

```text
Gather evidence
Plan
Draft
Revise
```

### Level 5 — Suggested Breakdown

Provide a full deterministic archetype-based suggestion.

Student may:

- accept
- edit
- reject

---

## Adaptation

None yet.

Every student begins from the same default interaction.

Record scaffold evidence but do not alter future behavior from it.

---

## What This Phase Tests

- Is the scaffold ladder useful?
- Is escalation annoying or supportive?
- Which scaffold levels are actually used?
- Do students stop needing help within an interaction?
- Are deterministic archetype scripts sufficient?

---

# 11. Phase 4 — AI-Assisted Assignment Understanding and Review

## Objective

Use AI where deterministic rules become limiting, while preserving the student-first coaching model.

AI should improve **understanding and context**, not take over planning.

---

## AI Capability A — Assignment Understanding

AI may interpret:

- pasted teacher directions
- student summaries
- complex project descriptions
- multiple deliverables
- rubrics
- intermediate deadlines

AI produces a proposed Assignment Brief.

The student confirms it.

AI must distinguish:

- explicit requirements
- interpretation
- inference

---

## AI Capability B — Breakdown Review

AI reviews the student's proposed Work Breakdown against:

- Assignment Brief
- assignment archetype
- Work Item quality heuristics

AI should return:

- observations
- possible gaps
- one recommended coaching prompt

It should not immediately generate a replacement breakdown.

---

## AI Capability C — Context-Aware Suggestions

Only at higher scaffold levels, AI may produce:

- structural hints
- suggested skeleton
- suggested Work Items

Suggestions should reflect the actual Assignment Brief rather than only the archetype.

---

## Example

Teacher directions:

> Build a model of a cell, label 12 organelles, write a one-page explanation, and prepare a 3-minute presentation.

AI may understand the deliverables as:

- cell model
- organelle labels
- written explanation
- presentation preparation

The student confirms this.

The AI can then review whether the student's Work Breakdown accounts for all four.

---

## What This Phase Tests

- Does AI materially improve complex assignment understanding?
- Are AI review prompts better than heuristics?
- Does student ownership remain intact?
- Does AI over-help?
- How often does the student accept versus modify AI suggestions?

---

# 12. Phase 5 — Adaptive ZPD + Fading Assistance

## Objective

Use historical Skill Evidence to change the level of assistance provided for a student in a specific assignment context.

This is where the full ZPD model becomes operational.

---

## Core Model

Assistance is contextual to:

> **Student + Skill + Skill Context**

Example:

```text
Student:
Alex

Skill:
Task Decomposition

Context:
Writing / Essay
```

Do not infer that competence with essays automatically transfers to science projects.

---

## ZPD Behavior

The system should estimate:

- what the student can do independently
- what they can do with light support
- what requires stronger support
- which scaffolds have previously been effective

---

## Example Progression

```text
September
Writing / Essay
Suggested skeleton required

November
Guided prompts sufficient

January
Light prompt sufficient

March
Independent
```

Future essays should begin with less scaffolding.

---

## Fading Principle

The system should provide:

> **the minimum support likely to produce successful performance**

If the student repeatedly succeeds independently:

- stop proactive prompts
- retain "I need help"

If performance worsens or context changes:

- increase assistance temporarily

Fading should be reversible.

---

## Important Constraint

Do not equate:

> less assistance

with:

> success

unless the resulting Work Breakdown remains workable.

Independence and effectiveness must both be present.

---

# 13. Phase 6 — Integration With Metacognition & Reflection

This capability should share the same learning infrastructure as the Metacognition & Reflection feature.

Do not build separate adaptation engines.

Both should use common concepts:

- Skill
- Skill Context
- Skill Evidence
- Scaffold
- Scaffold Strategy
- ZPD

---

## Decomposition Reflection Examples

After completing a large assignment:

> **Did the way you broke this down work?**

Structured options:

- Yes, the steps were about right
- Some steps were too big
- I missed something important
- I made too many steps
- Not sure

Optional follow-up:

> **What would you change next time?**

Possible responses:

- Make smaller steps
- Make fewer steps
- Start earlier
- Add a review step
- Nothing
- Something else

---

## Learning Loop

```text
Understand Assignment
        ↓
Student Attempts Breakdown
        ↓
Scaffold if Needed
        ↓
Confirm Work Breakdown
        ↓
Plan
        ↓
Execute
        ↓
Reflect
        ↓
Skill Evidence
        ↓
Update ZPD
        ↓
Adjust Future Scaffold
```

This is the long-term differentiating loop.

---

# 14. Recommended Development Sequence

## Phase 1

Manual Work Items only.

**Build first.**

## Phase 2

Problem Set + Writing archetypes, Sitting Check, basic heuristics.

**Very low complexity; likely high learning value.**

## Phase 3

Deterministic Assignment Brief parsing + full scaffold ladder.

**Establishes the coaching UX without AI dependency.**

## Phase 4

AI understanding + AI review + AI context-aware suggestions.

**Adds flexibility for real assignments.**

## Phase 5

ZPD-based adaptive starting level and fading.

**Turns scaffolding from a feature into a personalized coaching system.**

## Phase 6

Integrate decomposition learning with Metacognition & Reflection.

**Creates the full executive-function learning loop.**

---

# 15. Recommended Initial Prototype Archetypes

Prioritize:

1. **Problem Set / Routine Homework**
2. **Writing / Essay**
3. **Generic fallback**

Reason:

These create two useful extremes.

Problem Set tests:

> Can the system recognize when very little decomposition is needed?

Writing / Essay tests:

> Can the system support a genuinely multi-stage assignment without doing the thinking for the student?

The Generic fallback ensures unsupported assignments remain usable.

Add Reading next.

Add Project / Presentation after the core interaction has been validated.

---

# 16. What Not to Build Early

Defer:

- automatic long-term competency scoring
- opaque AI recommendations
- fully automatic breakdown generation
- parent / coach tuning of scaffold levels
- every assignment archetype
- complex rubrics for decomposition quality
- predictive ML
- broad cross-context skill generalization

The early objective is to validate the learning interaction, not build an adaptive intelligence platform.

---

# 17. Phase Exit Questions

Each phase should earn the next one.

## Before Phase 2

Do students create Work Items at all?

## Before Phase 3

Do simple heuristics identify useful coaching moments?

## Before Phase 4

Does deterministic coaching reach its limits on real assignment instructions?

## Before Phase 5

Do we have enough repeated evidence to justify adapting assistance?

## Before Phase 6

Can we demonstrate that Work Breakdown behavior is meaningfully related to later execution and reflection?

---

# 18. Product Differentiation

A conventional task manager stores:

> Research paper — due Friday.

A more advanced planner stores:

> Research → Outline → Draft → Revise.

The intended product should eventually ask:

> Can you figure out the pieces?

Then observe what the student can do independently.

When needed, it provides exactly enough help to let the student succeed.

Afterward, it helps the student reflect on whether the breakdown worked.

Over time, it provides less help.

That progression is the product differentiation:

> **The application is not simply storing a better task list. It is teaching the student how to create one.**

---

# 19. Definition of Long-Term Success

The feature succeeds when a student who initially needs substantial assistance to decompose a complex assignment eventually sees a similar assignment and independently creates a workable plan.

The system's success is demonstrated by:

- effective Work Breakdowns
- increasing independence
- decreasing scaffold intensity
- improved planning calibration
- successful transfer to similar assignment contexts

The ideal outcome is not greater dependence on the feature.

It is that the student gradually learns to perform the skill themselves.
