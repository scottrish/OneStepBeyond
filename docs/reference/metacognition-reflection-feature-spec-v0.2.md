# Executive Function Coach

## Metacognition & Reflection — Feature & Phased Delivery Specification

Version 0.2

---

# 1. Purpose

Help students develop metacognitive awareness of how they understand work, make plans, estimate effort, execute, notice outcomes, and adjust future behavior.

The core learning loop is:

> **Predict → Act → Compare → Explain → Adjust**

Reflection should not become a journal, survey, or compliance ritual.

Its purpose is to help the student increasingly notice:

- what they expected
- what actually happened
- why there may have been a difference
- what they want to do differently next time

---

# 2. Core Principles

1. Reflection must be actionable.
2. Keep it lightweight: one question at a time and one-tap choices by default.
3. Use structured responses first, with open-ended response when useful.
4. Always allow `Something else` and optional free text.
5. Use observed data the system already has; do not ask the student to re-enter known facts.
6. Student explanation takes precedence over system inference about internal causes.
7. Reflection is not objective Observation; it is student-provided meaning.
8. Reflection itself may be scaffolded.
9. Reflection uses the same `ScaffoldIntensity` model as Task Decomposition.
10. Support may fade or increase contextually as evidence changes.
11. Do not expose ZPD, Skill Competency, ScaffoldIntensity, or reflection-quality scores.

---

# 3. Domain Concepts

This feature uses:

- Assignment
- AssignmentType
- Work Breakdown
- Work Item
- Plan
- Work Session
- Work Session Outcome
- Behavior Observation
- Skill
- Skill Context
- Skill Evidence
- Reflection
- Scaffold
- ScaffoldIntensity
- Scaffold Strategy
- Skill Competency
- Zone of Proximal Development
- Intervention

Primary Skills may include:

- Time Estimation
- Self-Monitoring
- Plan Adjustment
- Reflection
- Task Initiation
- Task Decomposition

---

# 4. Reflection as a Domain Concept

A Reflection captures the student's interpretation of an experience and, when useful, a proposed adjustment.

A Reflection may relate to:

- Assignment
- Work Breakdown
- Work Item
- Work Session
- Plan

Possible attributes:

```text
Reflection
- relatedEntity
- promptType
- trigger
- structuredResponse
- optionalFreeText
- proposedAdjustment
- ScaffoldIntensity
- occurredAt
```

The system must preserve the distinction between:

```text
Observation:
A Work Item took 47 minutes.

Reflection:
"It took longer because I got stuck on one section."

Inference:
The system suspects this type of Work Item may need more planning support.
```

These are not interchangeable.

---

# 5. Shared Scaffold Model

Canonical `ScaffoldIntensity`:

```text
None
Light
Guided
Structured
Suggested
Direct
```

Reflection maps skill-specific interventions onto those intensities.

## None

Student notices and adjusts independently.

## Light

Open question.

> What do you think happened?

## Guided

Targeted prompt.

> Was this mostly about time, getting started, or the task being harder than expected?

## Structured

One-tap choices or categories.

> What got in the way?

- I ran out of time
- I got distracted
- I didn't know how to start
- It felt too big
- Something else

## Suggested

The system proposes a possible interpretation or adjustment while preserving student choice.

> One thing you could try is making the first step smaller. Does that fit?

## Direct

Generally avoid for Reflection because the student's own interpretation is the skill being developed.

If used, it should support action rather than claim knowledge of the student's internal state.

---

# 6. Reflection Moments

The capability has four major moments, introduced as prerequisites become available.

## A. Work Breakdown Reflection

Purpose:

> **Did the decomposition itself work?**

Can be introduced immediately with manual Work Breakdown.

## B. Before-Work Prediction

Purpose:

> **What do I expect?**

Requires Work Items and planning.

## C. After-Work Calibration / Plan Repair

Purpose:

> **What actually happened, and what should I change?**

Requires execution observations.

## D. Periodic Pattern Reflection

Purpose:

> **What pattern do I notice across multiple experiences?**

Requires sufficient Behavior Observations.

---

# 7. Work Breakdown Reflection

This is the first Reflection capability to implement.

Trigger selectively when:

- an Assignment using a Work Breakdown is completed
- the student meaningfully restructures the Work Breakdown during the Assignment
- later, execution evidence suggests the decomposition was not workable

Question:

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

Possible choices:

- Make smaller steps
- Make fewer steps
- Add a step I missed
- Start earlier
- Nothing
- Something else

This Reflection may contribute to future Skill Evidence for:

```text
Task Decomposition + relevant AssignmentType
```

but the student's answer is not an objective decomposition score.

---

# 8. Before-Work Prediction

Introduce once Work Items are estimated and planned.

## Duration Prediction

> **How long do you think this will take?**

Suggested choices:

- 10 min
- 20 min
- 30 min
- 45 min
- 1 hr
- Other

Preserve the student's estimate even if the system later has historical evidence suggesting another duration.

## Confidence

Use selectively:

> **How sure are you?**

- Pretty sure
- Not sure

## Anticipated Challenge

Use selectively for unfamiliar or complex work:

> **What do you think will be the hardest part?**

Possible choices:

- Getting started
- Figuring out what to do
- Finding information
- Doing the main work
- Staying focused
- Checking / revising
- Not sure
- Something else

Do not ask all of these for every Work Item.

---

# 9. After-Work Calibration

Prerequisite:

- planned duration
- actual duration or a meaningful completion signal

Use known data.

Example:

> **You planned 30 min. It took 47.**

Then ask only when useful:

> **How did that compare with what you expected?**

Responses:

- Took longer than expected
- About what I expected
- Took less time than expected

If the difference is meaningful:

> **Any idea why?**

Possible responses:

- There was more work than I realized
- One part was harder than expected
- I got distracted
- I got stuck
- I took a break
- I was more focused than usual
- I already knew more than expected
- Something else

Free text is optional.

---

# 10. When a Plan Does Not Happen

Prerequisite:

- missed, delayed, blocked, or rescheduled Work Session or equivalent behavior

Avoid:

> Why didn't you do your work?

Use:

> **What happened?**

Possible choices:

- I forgot
- I didn't feel like starting
- Something else came up
- I ran out of time
- Earlier work took longer
- I was too tired
- I got distracted
- I didn't understand what to do
- It felt too big
- Something else

Then:

> **What would help next time?**

Possible actions:

- Start earlier
- Give it more time
- Make the first step smaller
- Break it into more pieces
- Move it to a better time
- Leave more buffer
- Ask for help
- Remove a distraction
- Not sure
- Something else

Reflection should end in adaptation when possible, not simply explanation.

---

# 11. Periodic Pattern Reflection

Only introduce after sufficient Behavior Observations exist.

Example:

> **Something we noticed**
>
> You planned about 30 minutes for Algebra three times this week. It usually took closer to 45.

Then:

> **What should we plan next time?**

Possible responses:

- 30 min
- 40 min
- 45 min
- Other

Another example:

> You moved your English work later three times this week.

Then:

> **What do you think was happening?**

The system should show evidence before asking the student to interpret a pattern.

Do not generate "patterns" from sparse or ambiguous data.

---

# 12. Structured vs Open Response Policy

Default hierarchy:

## Structured

One-tap response.

## Structured + Optional Free Text

After selection:

> Want to add anything?

Optional.

## Open Reflection

Use when evidence suggests the student can reflect more independently.

Example:

> What do you think happened?

Optional:

> Give me some ideas

This progression should be implemented through Scaffold Strategy, not a separate global numbered ladder.

---

# 13. Trigger Rules

Do not trigger Reflection after every action.

Prioritize when:

- a Work Breakdown has been meaningfully used or revised
- actual duration differs substantially from estimate
- a Work Session is missed
- work is blocked
- the student needs more time
- a major Assignment is completed
- a repeated pattern is worth noticing

Suppress when:

- the task was routine and matched expectations
- the same issue was reflected on recently
- there is no plausible future adjustment
- prompting would add more burden than learning value

Prototype thresholds, if used, are heuristics rather than domain truths.

---

# 14. AI Responsibilities

AI may eventually assist the Reflection Service by:

- selecting contextually relevant structured choices
- summarizing observed patterns
- interpreting optional free text into candidate themes
- proposing one possible adjustment
- identifying when no Reflection is needed

AI must not:

- claim to know the student's internal cause
- replace the student's explanation with its own
- psychoanalyze the student
- create diagnostic labels
- automatically change the student's Plan
- present inference as fact

---

# 15. Delivery Phases

## Phase 1 — Work Breakdown Reflection Foundation

Prerequisite:

- manual Work Breakdown

Implement:

- `Did the way you broke this down work?`
- structured responses
- optional free text
- optional `What would you change next time?`
- record Reflection
- structured response UI

Do not implement:

- actual-duration comparisons
- missed Work Session reflection
- weekly patterns
- adaptive ZPD

---

## Phase 2 — Reflection Around Simple Decomposition Coaching

As AssignmentType and heuristic coaching are introduced:

- retain Work Breakdown Reflection
- optionally ask whether the number or size of Work Items felt right
- record the relationship between Reflection and Decomposition Attempt

Still no adaptation.

---

## Phase 3 — Structured Reflection Coaching

As deterministic Scaffold Strategy infrastructure exists:

- use shared ScaffoldIntensity
- vary between open prompts and structured choices in fixed ways
- collect Skill Evidence
- do not personalize starting intensity from history yet

---

## Phase 4 — Execution-Aware Metacognition

Prerequisite:

- Work Session or equivalent execution telemetry

Add:

- duration prediction
- planned vs actual comparison
- blocker reflection
- missed-work reflection
- plan repair
- selective end-of-day reflection

---

## Phase 5 — AI-Assisted Reflection

AI may:

- tailor prompts
- interpret free text
- summarize patterns
- propose one adjustment

Student explanation and ownership remain primary.

---

## Phase 6 — Adaptive ZPD

Use:

```text
Student + Skill + Skill Context
```

Examples:

```text
Reflection + Time Estimation
Reflection + Work Breakdown Evaluation
Plan Adjustment + Evening Homework
```

Adapt:

- how much structure is provided
- whether choices are shown immediately
- whether a Reflection prompt is needed at all

As independence increases:

```text
Structured choices
        ↓
Guided question
        ↓
Open reflection
        ↓
No prompt unless useful
```

Support can increase again if context changes or the student struggles.

---

# 16. Functional Requirements by Near-Term Phase

## Phase 1

The platform must:

- create a Reflection related to a Work Breakdown / Assignment
- show structured response choices
- support `Something else`
- support optional free text
- optionally capture a student-selected future adjustment
- preserve the student's answer separately from system Observation

Later requirements activate only when prerequisite behavior data exists.

---

# 17. Acceptance Criteria

## Actionability

Every Reflection prompt has a plausible connection to future planning or coaching.

## Cognitive Load

One primary question is shown at a time.

## Structured First

The initial Reflection can normally be completed with one tap.

## Student Meaning

The student's explanation is stored as Reflection rather than converted into objective fact.

## No Forced Journaling

Free text is never required in the initial implementation.

## Shared Scaffolding

Reflection uses canonical ScaffoldIntensity and Skill-specific Scaffold Strategy rather than an incompatible numbered level system.

## ZPD Readiness

The data model can later relate Reflection support to Skill Context and Skill Evidence without exposing that machinery to the student.

---

# 18. Definition of Success

The near-term feature succeeds when a student moves from:

> **"I made some steps."**

to:

> **"I noticed whether those steps actually worked."**

The long-term capability succeeds when the student increasingly predicts, notices, explains, and adjusts independently—and the system needs to ask less.
