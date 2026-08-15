# Executive Function Coach - Domain Model (v1.0)

## Domain Purpose

Support secondary school students in developing independent executive functioning skills by helping them understand commitments, translate assignments into actionable work, create realistic plans, execute those plans, observe outcomes, recover when plans change, reflect on their experiences, and gradually require less external support.

The system should function as a scaffold for executive functioning rather than a replacement for it.

---

# Core Domain Principles

1. **Complexity belongs in the domain; simplicity belongs in the user experience.**
2. **Observe behaviour before making inferences.**
3. **The system coaches rather than replaces executive functioning.**
4. **Scaffolding should decrease as independence increases.**
5. **Success is measured by increasing independence, not merely task completion.**
6. **Provide the minimum effective scaffold.** Prefer: student attempts → app reviews → app prompts → app hints → app suggests.
7. **Context matters.** A student's independence in a skill may differ by assignment type and situation.
8. **The student owns the plan.** Suggestions do not become authoritative until the student accepts or modifies them.
9. **External requirements and student planning are separate.** An Assignment represents what is expected; a Work Breakdown represents how the student intends to accomplish it.
10. **Do not add complexity without demonstrated value.** The model should evolve through prototype and user testing.

---

# Bounded Contexts

## Student

Owns:

- Profile
- Preferences
- Courses
- Availability
- Support relationships

---

## Commitments

Models obligations requiring the student's attention.

Entities / Value Objects:

- Assignment
- Assignment Brief
- Activity
- Course

### Assignment

Represents an academic commitment with a deliverable or preparation requirement.

An Assignment describes **what the external world expects**.

Typical attributes may include:

- Title
- Course
- Assignment type
- Assigned date
- Due date
- Status
- Source / provenance

Possible assignment types include:

- Problem Set / Routine Homework
- Reading
- Writing / Essay
- Project
- Presentation
- Lab
- Test / Quiz Preparation
- Other

Assignment type provides context. It must not force a rigid workflow.

### Assignment Brief

Represents the system's current understanding of what the assignment requires.

May include:

- Teacher instructions
- Expected deliverables
- Scope
- Requirements
- Rubric
- Relevant source material
- Provenance
- Confidence when information is inferred

The Assignment Brief may be incomplete.

When interpreting an assignment, information should generally be trusted in this order:

1. Actual teacher instructions / rubric
2. Explicit deliverables
3. Student-provided understanding
4. Assignment archetype
5. Generic decomposition heuristics

Generic assumptions must not override explicit teacher requirements.

---

## Planning

Models intentional planning.

Entities:

- Planning Session
- Plan
- Work Breakdown
- Work Item
- Work Session
- Availability

### Planning Session

An episode in which the student reviews commitments and makes planning decisions.

A Planning Session may include:

- reviewing assignments
- creating or reviewing Work Breakdowns
- estimating effort
- selecting work
- scheduling Work Sessions
- resolving planning conflicts
- accepting or modifying suggestions

The process of planning is part of what the application is intended to teach.

### Plan

Represents the student's intended allocation of work.

The student owns the Plan.

The system may recommend changes, but should not silently create or alter an authoritative Plan.

### Availability

Represents realistic time in which academic work could reasonably occur.

Availability is **not equivalent to unscheduled time**.

It may eventually account for:

- school
- activities
- travel
- meals
- sleep
- personal downtime
- configured study limits

### Work Breakdown

Represents the student's actionable interpretation of an Assignment.

An Assignment answers:

> What am I expected to do?

A Work Breakdown answers:

> How am I going to accomplish it?

Example:

```text
Assignment:
Industrial Revolution research paper

Work Breakdown:
- Choose a focus
- Find three sources
- Take research notes
- Create outline
- Write draft
- Revise
- Submit
```

A Work Breakdown may be:

- created independently by the student
- created with prompts or hints
- based on a suggested skeleton
- based on a system-generated suggestion that the student reviews and confirms

The distinction between student-created and system-suggested work should be preserved because it provides evidence of independence.

### Work Item

A manageable unit of work within a Work Breakdown.

A useful Work Item is generally:

- clear enough to start
- clear enough to know when it is finished
- small enough to reasonably fit into a work session
- estimable
- meaningfully connected to completing the Assignment

These are guidelines, not rigid invariants.

A Work Item should not be decomposed further merely because it is technically possible.

Examples:

```text
Problem Set:
- Questions 1–10
- Questions 11–20
```

```text
Book Report:
- Finish reading chapters 15–20
- Choose three examples from the book
- Create outline
- Write first draft
- Revise using rubric
- Submit
```

### Work Session

Represents planned or actual time spent on a Work Item.

It distinguishes intention from behaviour.

Typical attributes may include:

- Work Item
- Planned start
- Planned duration
- Actual start
- Actual duration
- Outcome

---

## Execution

Models actual behaviour.

Entities:

- Work Session Outcome
- Blocker

### Work Session Outcome

Possible outcomes include:

- Completed
- Partially Completed
- Need More Time
- Blocked
- Skipped
- Rescheduled

### Blocker

Captures what prevented successful progress.

Possible student-facing categories include:

- Don't know how to start
- Don't understand it
- Need something I don't have
- It feels too big
- Distracted
- Not enough time
- Other

The student-facing vocabulary may be simpler than the internal domain vocabulary.

---

## Observation

Captures objective evidence.

Entities:

- Behavior Observation
- Skill Evidence
- Decomposition Review
- Risk Assessment

### Behavior Observation

Records what actually happened without attaching a judgment to the student.

Examples:

- Student estimated 30 minutes; actual duration was 47 minutes.
- Student independently created five useful Work Items for an essay.
- Student requested a structural hint before decomposing a project.
- Student missed a planned Work Session.

### Skill Evidence

Connects an observation to a learnable skill and context.

Possible attributes:

- Skill
- Skill Context
- Observation
- Assistance required
- Outcome
- Date

### Decomposition Review

A derived review of a student's proposed Work Breakdown.

The review exists to determine the **next useful coaching interaction**, not to create a score for the student.

A Work Breakdown may be reviewed for:

- **Completeness** — does it account for important deliverables?
- **Startability** — would the student know how to begin each Work Item?
- **Sizing** — are Work Items reasonably manageable?
- **Ordering** — are important dependencies or sequencing represented?
- **Estimability** — can the student make a meaningful time estimate?

Internal observation:

> "Write report" is too broad to be easily started or estimated.

Student-facing translation:

> "Write report" looks pretty big. Could you split it into two or three smaller steps?

### Risk Assessment

A derived assessment of whether a commitment is likely to be completed successfully.

Possible signals include:

- deadline proximity
- remaining estimated effort
- available study capacity
- planned work
- missed Work Sessions
- incomplete or absent Work Breakdown
- unresolved Blockers

The domain may retain detailed reasons.

The student experience should normally reduce these to simple concepts such as:

- On Track
- Needs Attention
- Let's Adjust

---

## Coaching & Learning

Models development of executive functioning.

Entities:

- Skill
- Skill Context
- Skill Competency
- Zone of Proximal Development
- Scaffold
- Scaffold Strategy
- Intervention
- Reflection

### Skill

A learnable executive-function behaviour.

Initial Skill areas may include:

- Assignment Capture
- Task Decomposition
- Prioritization
- Time Estimation
- Scheduling
- Task Initiation
- Plan Adjustment
- Self-Monitoring
- Reflection

### Skill Context

Represents the situation in which a Skill is exercised.

Examples:

- Task Decomposition + Problem Set
- Task Decomposition + Essay
- Task Decomposition + Research Project
- Time Estimation + Routine Homework
- Time Estimation + Long-Term Project

Performance should not automatically be generalized across contexts.

### Skill Competency

Represents current evidence of what the student can perform independently for a Skill in a particular Skill Context.

It should not be represented as a diagnostic or global executive-function score.

Conceptually:

```text
Student
+
Skill
+
Skill Context
+
Evidence of Independent Performance
```

### Zone of Proximal Development

Represents the space between:

- what the student can currently perform independently
- what the student can successfully perform with appropriate assistance

For every Skill + Skill Context, the system may attempt to determine:

- independent capability
- supported capability
- current challenge
- scaffolds that have been effective
- confidence in the current interpretation

The application should provide the minimum assistance required for successful performance.

### Scaffold

A specific instance of assistance.

Examples:

- Light Prompt
- Guided Question
- Hint
- Worked Example
- Suggested Estimate
- Suggested Skeleton
- Suggested Breakdown
- Suggested Plan
- Reminder
- Reflection Prompt

### Scaffold Strategy

Defines how support should be selected, escalated, and faded for a Skill in a Skill Context.

For task decomposition, a typical progression is:

#### Level 0 — Independent

The student creates a workable breakdown.

The system remains quiet.

#### Level 1 — Light Prompt

Example:

> What will you need to do first?

#### Level 2 — Guided Prompt

Example:

> Do you need to research, outline, write, or prepare anything before you can finish this?

#### Level 3 — Structural Hint

Example:

> It may help to think about preparation, creating the work, and checking it afterward.

#### Level 4 — Suggested Skeleton

Example:

```text
Research
Plan
Create
Review
```

The student fills in or modifies the structure.

#### Level 5 — Suggested Breakdown

The system proposes specific Work Items for the student to review, modify, and confirm.

The system should stop escalating as soon as the student can proceed successfully.

Repeated independent success should allow scaffolding to fade.

### Assignment Decomposition Strategies

The system may maintain contextual knowledge for common assignment archetypes.

These are strategies, not rigid templates.

#### Problem Set / Routine Homework

Typical approach:

- determine scope
- determine whether one sitting is realistic
- divide into natural ranges if needed

Example:

```text
Questions 1–10
Questions 11–20
```

#### Reading

Typical approach:

- determine reading scope
- divide by page range or chapter if needed
- include notes or questions when required

#### Writing / Essay

Typical approach:

- understand prompt
- collect evidence
- outline
- draft
- revise
- submit

#### Project

Typical approach:

- understand requirements
- identify deliverables
- research / prepare
- create
- review
- submit or present

#### Presentation

Typical approach:

- understand requirements
- research
- outline
- create materials
- rehearse
- revise
- present

The actual Assignment Brief takes precedence over these archetypes.

### Intervention

A deliberate coaching action intended to support a Skill or desired behaviour.

Examples:

- Daily Planning Prompt
- Breakdown Prompt
- Estimate Comparison
- Plan Repair
- Reflection Prompt

Representing interventions explicitly allows the product to eventually evaluate:

> Which forms of support actually improve independent behaviour?

rather than merely measuring feature usage.

### Reflection

Captures lightweight student reflection on an outcome.

Examples:

- That took longer than I expected.
- I should split this kind of assignment earlier next time.
- I didn't know how to start.

Reflection should remain short, specific, and actionable.

---

## Support Network

Models trusted adults.

Entities:

- Supporter
- Support Relationship

Possible supporter roles include:

- Parent
- Guardian
- Executive Function Coach
- Counselor
- Teacher
- Tutor

This context remains part of the long-term domain even when a prototype implements only the student experience.

---

# Ubiquitous Language

| Term | Definition |
|------|------------|
| Commitment | Something requiring the student's attention. |
| Assignment | Academic commitment with a deliverable or preparation requirement. |
| Assignment Brief | Current understanding of the assignment's instructions, deliverables, scope, and requirements. |
| Activity | Scheduled non-academic commitment. |
| Availability | Realistic time in which academic work could reasonably occur. |
| Work Breakdown | Student's actionable interpretation of how an Assignment will be accomplished. |
| Work Item | Manageable unit of work within a Work Breakdown. |
| Decomposition Attempt | An episode in which the student attempts to create or improve a Work Breakdown. |
| Decomposition Review | Derived review of a Work Breakdown used to determine the next useful coaching action. |
| Assignment Archetype | Contextual decomposition knowledge for a common type of assignment; a strategy, not a fixed template. |
| Plan | Student's intended allocation of work. |
| Planning Session | Episode of planning and decision-making. |
| Work Session | Planned or actual work period associated with a Work Item. |
| Observation | Objective behavioural evidence. |
| Skill | Learnable executive-function behaviour. |
| Skill Context | Situation in which a Skill is exercised. |
| Skill Competency | Current evidence of independent performance for a Skill in a Skill Context. |
| Zone of Proximal Development | Space between independent and supported performance for a Skill in context. |
| Scaffold | Specific assistance provided to enable successful performance. |
| Scaffold Strategy | Policy for selecting, escalating, and fading assistance. |
| Intervention | Deliberate coaching action intended to support learning or behaviour. |
| Reflection | Student learning from experience. |
| Risk Assessment | Derived assessment of likelihood that a commitment can be completed successfully. |
| Supporter | Trusted adult who may assist the student. |

---

# Learning Model

```text
External Reality
      ↓
Commitments
      ↓
Understand Assignment
      ↓
Work Breakdown
      ↓
Planning
      ↓
Execution
      ↓
Observation
      ↓
Learning
      ↓
Adjusted Scaffolding
```

The important separation remains:

```text
External Reality
"What am I expected to do?"
        ↓
Commitments

Student Interpretation
"How will I accomplish it?"
        ↓
Work Breakdown

Intention
"When am I going to do it?"
        ↓
Plan

Behaviour
"What actually happened?"
        ↓
Execution + Observation

Learning
"What can I increasingly do independently?"
        ↓
Skill Evidence + ZPD + Adjusted Scaffolding
```

---

# Assignment Breakdown Learning Loop

For task decomposition specifically:

```text
Understand Assignment
        ↓
Student Attempts Breakdown
        ↓
Review Attempt
        ↓
Is it workable?
   ┌────┴────┐
  Yes        No
   │          │
Confirm     Minimum useful prompt
   │          │
   │       Student tries again
   │          │
   │       Still struggling?
   │          │
   │       Increase scaffold
   │          │
   └──────────┴────→ Confirm Breakdown
                         ↓
                     Plan Work
                         ↓
                     Execute
                         ↓
                     Observe
                         ↓
                  Update Skill Evidence
```

The system should not improve a student's breakdown merely because a more sophisticated breakdown is possible.

A student-created breakdown that is workable should generally be accepted.

---

# Zone of Proximal Development

For every Skill in a relevant Skill Context, the system may attempt to determine:

- What the student can perform independently.
- What the student can perform with assistance.
- What challenge is just beyond current independent performance.
- Which scaffolds are currently effective.
- When scaffolding can safely be reduced.

The application should always provide the minimum assistance required for successful performance.

For example:

```text
Skill:
Task Decomposition

Context:
Written assignments

Independent capability:
Recognizes that an essay requires multiple work sessions.

Supported capability:
Can create a useful sequence of Work Items after one or two prompts.

Current challenge:
Independently generating appropriately sized Work Items.
```

---

# Domain Events (Initial)

- Assignment Captured
- Assignment Updated
- Assignment Brief Updated
- Work Breakdown Started
- Work Item Proposed
- Work Item Created
- Work Breakdown Reviewed
- Work Breakdown Confirmed
- Planning Session Started
- Planning Session Completed
- Plan Confirmed
- Work Session Scheduled
- Work Session Started
- Work Session Completed
- Work Session Extended
- Work Session Blocked
- Work Session Missed
- Work Session Rescheduled
- Risk Assessment Changed
- Skill Evidence Recorded
- Reflection Recorded
- Scaffold Provided

---

# Key Domain Services

## Planning Service

Helps the student determine what work should be planned and whether selected work fits into realistic Availability.

---

## Scheduling Service

Supports placement and adjustment of Work Sessions around existing commitments and Availability.

---

## Risk Assessment Service

Derives whether an Assignment needs attention based on deadlines, remaining effort, current planning, missed Work Sessions, and other relevant signals.

---

## Work Breakdown Review Service

Reviews a student's proposed Work Breakdown using:

- Assignment Brief
- teacher requirements
- explicit deliverables
- the student's existing breakdown
- assignment archetype
- decomposition heuristics

Produces observations and the next useful coaching prompt.

---

## Decomposition Strategy Service

Provides contextual decomposition knowledge for common assignment archetypes.

It should suggest specific structures only when the current Scaffold Strategy calls for that level of support.

---

## Coaching Service

Selects the minimum useful Scaffold based on:

- Skill
- Skill Context
- available Skill Evidence
- current Zone of Proximal Development
- student behaviour in the current interaction

---

## Reflection Service

Determines when a brief reflection may support learning.

---

# Domain Invariants

1. An Assignment and its Work Breakdown are separate concepts.
2. The student owns the Plan.
3. System suggestions require student acceptance or modification before becoming part of the student's Plan or Work Breakdown.
4. Actual teacher requirements take precedence over generic assignment archetypes.
5. A Work Breakdown should not be made more complex than necessary.
6. Assistance should not escalate when the student can proceed independently.
7. Observations remain distinguishable from interpretations.
8. Skill Competency is contextual rather than global.
9. Risk Assessment is derived rather than manually authored as a judgment of the student.
10. Scaffold intensity must be capable of decreasing over time.
11. Internal competency, ZPD, risk, and decomposition machinery should normally remain hidden from the student-facing UI.

---

# Explicitly Out of Scope

The domain intentionally excludes:

- Authentication
- Notifications
- AI implementation
- LMS integrations
- Analytics implementation
- Reporting
- Persistence
- UI design
- Database technology
- Hosting
- Specific frontend frameworks

AI may implement or assist Domain Services, but AI itself is not a domain concept.

These are application or infrastructure concerns.

---

# Model Status

This model updates v0.9 without replacing its original structure.

The original bounded contexts remain intact:

- Student
- Commitments
- Planning
- Execution
- Observation
- Coaching & Learning
- Support Network

The primary additions are:

- Assignment Brief
- Work Breakdown as a first-class planning concept
- explicit separation between Assignment and Work Breakdown
- decomposition attempts and reviews as evidence of skill development
- assignment archetype strategies
- graduated decomposition scaffolding
- contextual Skill Competency and ZPD
- more explicit student ownership and minimum-effective-scaffold invariants

The model should now be treated as a stable working model for prototype development.

It should evolve when prototype or user testing demonstrates that the model does not adequately explain real student behaviour—not merely because additional concepts can be imagined.
