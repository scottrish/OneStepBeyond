# Executive Function Coach — Domain Model

Version 1.1

## Domain Purpose

Support secondary-school students in developing independent executive-function skills by helping them understand commitments, translate assignments into actionable work, create realistic plans, execute those plans, observe outcomes, reflect, recover when plans change, and gradually require less external support.

The system should function as a **scaffold rather than a replacement for executive functioning**.

## Core Domain Principles

1. Complexity belongs in the domain; simplicity belongs in the user experience.
2. Observe behaviour before making inferences.
3. The system coaches rather than replaces executive functioning.
4. The student owns both the Work Breakdown and the Plan.
5. Provide the minimum effective scaffold.
6. Scaffolding is contextual, evidence-based, and reversible: it should fade with demonstrated independent success and may increase temporarily when the current context exceeds demonstrated capability.
7. Success is measured by increasing independence as well as task completion.
8. Context matters; capability in one Skill Context should not automatically generalize to another.
9. External requirements and student planning are separate: an Assignment represents what is expected; a Work Breakdown represents how the student intends to accomplish it.
10. Actual teacher requirements take precedence over inferred assumptions or generic strategies.
11. AI may support Domain Services, but must not replace student thinking when the purpose of the interaction is skill development.
12. Do not add complexity without demonstrated value.

Preferred coaching progression:

> **Student attempts → system observes/reviews → prompt → guided support → structured support → suggestion**

The system stops increasing assistance as soon as the student can proceed successfully.

---

# Bounded Contexts

## Student

Owns:

- Profile
- Preferences
- Courses
- Availability
- Support relationships

## Commitments

Models obligations requiring the student's attention.

Entities / Value Objects:

- Assignment
- Assignment Brief
- Activity
- Course

### Assignment

Represents an academic commitment with a deliverable or preparation requirement.

An Assignment answers:

> **What am I expected to do?**

Typical attributes:

- Title
- Course
- AssignmentType
- Assigned date
- Due date
- Status
- Source / provenance

### AssignmentType

Classifies the general form of an Assignment so the system can apply appropriate planning and coaching knowledge.

Initial values may include:

- Problem Set / Routine Homework
- Reading
- Writing / Essay
- Project
- Presentation
- Lab
- Test / Quiz Preparation
- Other

AssignmentType provides context and must not force a rigid workflow.

### Assignment Brief

Represents the system's current understanding of what the Assignment requires.

May include:

- teacher directions
- student's description
- expected deliverables
- scope
- explicit requirements
- rubric
- source material
- intermediate deadlines
- provenance
- confidence for inferred information

The Assignment Brief may be incomplete.

Information should generally be trusted in this order:

1. actual teacher directions / rubric
2. explicit deliverables
3. student-provided understanding
4. AssignmentType-specific knowledge
5. generic decomposition heuristics

An inferred requirement must never be presented as though it came from the teacher.

### AssignmentBriefItem

A conceptual value object when provenance must be retained at item level.

```text
AssignmentBriefItem
- value
- source
- confidence
```

Possible source values:

```text
Teacher
Student
SystemInferred
```

### Activity

Represents a scheduled non-academic commitment.

Activities constrain realistic planning capacity but are legitimate parts of the student's life rather than obstacles to schoolwork.

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
- Decomposition Attempt

### Planning Session

An episode in which the student reviews commitments and makes planning decisions.

May include:

- reviewing Assignments
- creating or reviewing Work Breakdowns
- estimating effort
- selecting work
- scheduling Work Sessions
- resolving conflicts
- accepting or modifying suggestions

Planning is itself a skill the product is intended to teach.

### Plan

Represents the student's intended allocation of work.

The student owns the Plan. System recommendations remain proposals until accepted or modified.

### Availability

Represents realistic time in which academic work could reasonably occur.

Availability is **not equivalent to unscheduled time**.

It may account for:

- school
- activities
- travel
- meals
- sleep
- personal downtime
- configured study limits

### Work Breakdown

Represents the student's actionable interpretation of how an Assignment will be accomplished.

An Assignment answers:

> **What am I expected to do?**

A Work Breakdown answers:

> **How am I going to accomplish it?**

A Work Breakdown may be:

- created independently by the student
- created with prompts or guided questions
- developed using a structural hint
- based on a suggested skeleton
- based on a suggested breakdown the student reviews and confirms

The student owns the Work Breakdown.

System-generated or AI-generated Work Items remain proposals until accepted or edited by the student.

### Work Item

A manageable unit of work within a Work Breakdown.

A useful Work Item is generally:

- clear enough to start
- clear enough to know when it is finished
- small enough to reasonably fit into a Work Session
- estimable
- meaningfully connected to the Assignment

These are guidelines rather than rigid invariants.

### Decomposition Attempt

An episode in which the student attempts to create or improve a Work Breakdown.

```text
DecompositionAttempt
- assignmentId
- skillContext
- initialWorkItems
- assistanceRequested
- initialScaffoldIntensity
- highestScaffoldIntensity
- scaffoldsProvided
- revisionCount
- resultingWorkItems
- outcome
- occurredAt
```

A Decomposition Attempt exists even when no assistance is provided.

Example:

```text
highestScaffoldIntensity = None
```

### Work Session

Represents planned or actual time spent on a Work Item and distinguishes intention from behaviour.

---

## Execution

Models actual behaviour.

Entities:

- Work Session Outcome
- Blocker

Possible Work Session Outcomes:

- Completed
- Partially Completed
- Need More Time
- Blocked
- Skipped
- Rescheduled

Possible Blockers:

- Don't know how to start
- Don't understand it
- Need something I don't have
- It feels too big
- Distracted
- Not enough time
- Other

---

## Observation

Captures objective evidence and derived assessments.

Entities:

- Behavior Observation
- Skill Evidence
- Decomposition Review
- Risk Assessment

### Behavior Observation

Records what happened without attaching a judgment to the student.

Examples:

- Student estimated 30 minutes; actual duration was 47 minutes.
- Student independently created five Work Items for a Writing / Essay Assignment.
- Student requested Guided assistance while decomposing a Project.
- Student missed a planned Work Session.

### Skill Evidence

Connects an observation or interaction outcome to a Skill and Skill Context.

Possible attributes:

- Skill
- Skill Context
- observation or interaction evidence
- ScaffoldIntensity required
- outcome
- date

### Decomposition Review

A derived review of a proposed Work Breakdown used to decide whether coaching may be useful and, if so, the next useful coaching interaction.

Possible internal dimensions:

- Completeness
- Startability
- Sizing
- Ordering
- Estimability

The student does not see scores or dimension labels.

A Decomposition Review produces observations for the Coaching Service and does not directly modify the Work Breakdown.

### Risk Assessment

A derived assessment of whether a Commitment is likely to be completed successfully.

Possible inputs include deadline proximity, remaining effort, Availability, current Plan, missed Work Sessions, incomplete Work Breakdown, and unresolved Blockers.

Student-facing language should remain simple.

---

## Coaching & Learning

Models development of executive-function capability.

Entities / Value Objects:

- Skill
- Skill Context
- Skill Competency
- Zone of Proximal Development
- Scaffold
- ScaffoldIntensity
- Scaffold Strategy
- Decomposition Strategy
- Intervention
- Reflection

### Skill

A learnable executive-function behaviour.

Initial Skills may include:

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

```text
Task Decomposition + AssignmentType: Problem Set
Task Decomposition + AssignmentType: Writing / Essay
Task Decomposition + AssignmentType: Project
Time Estimation + Routine Homework
Reflection + Time Estimation
```

### Skill Competency

An evidence-based estimate of what the student can perform independently for a Skill in a particular Skill Context.

It is not a diagnostic score.

### Zone of Proximal Development

Represents the space between what the student can perform independently and what the student can perform successfully with appropriate assistance.

The ZPD is contextual and dynamic. Appropriate support may move both down and up as complexity, novelty, context, or demonstrated performance changes.

### ScaffoldIntensity

A skill-independent representation of how much assistance is provided or required.

Canonical values:

```text
None
Light
Guided
Structured
Suggested
Direct
```

### Scaffold

A specific instance of assistance, such as:

- open prompt
- guided question
- multiple-choice cues
- structural hint
- worked example
- suggested estimate
- suggested skeleton
- suggested breakdown
- suggested plan
- reminder
- reflection prompt

Each Scaffold has a ScaffoldIntensity.

### Scaffold Strategy

A Skill- and Skill Context-specific policy for selecting, escalating, fading, or restoring assistance.

Example for Task Decomposition:

```text
None       Student creates Work Breakdown independently.
Light      Open coaching prompt.
Guided     Targeted question or choices.
Structured Structural framework such as Prepare → Create → Check.
Suggested  Suggested skeleton.
Direct     Suggested full breakdown for student review.
```

Reflection can use the same intensity values with different interventions.

### Decomposition Strategy

Contextual coaching knowledge associated with an AssignmentType.

A Decomposition Strategy is **not a fixed template** and must not automatically generate the student's Work Breakdown.

Examples:

**Problem Set / Routine Homework**
- determine scope
- determine whether one sitting is realistic
- divide into natural ranges if needed

**Reading**
- determine reading scope
- use natural page / chapter boundaries if needed
- include notes or questions when required

**Writing / Essay**
- understand prompt
- gather evidence
- organize ideas
- outline
- draft
- revise
- submit

**Project**
- understand requirements
- identify deliverables
- research / gather materials
- plan
- create
- review
- submit / present

**Presentation**
- understand requirements
- gather content
- outline
- create materials
- rehearse
- revise
- present

The student's own approach and actual Assignment Brief take precedence over the generic Decomposition Strategy.

### Intervention

A deliberate coaching action intended to support a Skill or behaviour.

Examples:

- Breakdown Prompt
- Estimate Comparison
- Plan Repair
- Reflection Prompt

### Reflection

Captures lightweight student thinking about what happened and, when useful, what they want to change next time.

A Reflection may relate to:

- Assignment
- Work Breakdown
- Work Item
- Work Session
- Plan

Reflection should be brief, specific, actionable, and student-owned.

---

## Support Network

Models trusted adults.

Entities:

- Supporter
- Support Relationship

Possible roles include Parent, Guardian, Executive Function Coach, Counselor, Teacher, and Tutor.

---

# Ubiquitous Language

| Term | Definition |
|---|---|
| Assignment | Academic commitment with a deliverable or preparation requirement. |
| AssignmentType | Classification used as contextual information for planning and coaching. |
| Assignment Brief | Current understanding of directions, deliverables, scope, requirements, and provenance. |
| Work Breakdown | Student-owned actionable interpretation of how an Assignment will be accomplished. |
| Work Item | Manageable unit of work within a Work Breakdown. |
| Decomposition Attempt | Episode in which the student attempts to create or improve a Work Breakdown. |
| Decomposition Review | Derived review used to determine whether and what coaching may be useful. |
| Decomposition Strategy | AssignmentType-specific coaching knowledge; never a mandatory template. |
| Skill | Learnable executive-function behaviour. |
| Skill Context | Situation in which a Skill is exercised. |
| Skill Competency | Evidence-based estimate of independent performance in context. |
| Zone of Proximal Development | Space between independent and supported performance in context. |
| ScaffoldIntensity | Skill-independent description of how much assistance is provided or required. |
| Scaffold | Specific assistance provided. |
| Scaffold Strategy | Skill- and context-specific policy for selecting, escalating, fading, or restoring assistance. |
| Reflection | Student thinking about what happened and what, if anything, to change next time. |

---

# Learning Model

```text
External Reality
      ↓
Assignment + Assignment Brief
      ↓
Student Creates Work Breakdown
      ↓
Planning
      ↓
Execution
      ↓
Observation
      ↓
Reflection
      ↓
Skill Evidence
      ↓
Learning / ZPD Update
      ↓
Adjusted Scaffolding
```

---

# Assignment Understanding Service

## Purpose

Construct or update an Assignment Brief from available Assignment information while preserving provenance and uncertainty.

Possible inputs:

- Assignment title
- AssignmentType
- teacher directions
- student summary
- rubric
- intermediate deadlines
- later, LMS-provided information

Possible implementations:

- direct student entry
- deterministic parsing
- AI-assisted interpretation

## Coaching Constraint

The Assignment Understanding Service exists to help the student **understand the external requirements of the Assignment so the student can practice decomposition**.

It must not treat understanding as permission to perform the planning task for the student.

Preferred interaction:

```text
Clarify what is required
        ↓
Student interprets / attempts
        ↓
Observe or prompt only when necessary
```

The service may:

- restate teacher directions
- identify explicit deliverables
- identify explicit requirements
- surface ambiguity
- ask the student to confirm understanding
- ask a question that helps the student notice a requirement
- distinguish teacher-provided information from inference

The service must not, by itself:

- generate a complete Work Breakdown
- silently convert requirements into Work Items
- choose the student's planning sequence
- remove the student's opportunity to attempt decomposition

If stronger decomposition assistance is appropriate, it is provided through the separate Decomposition Review / Coaching / Scaffold flow and remains governed by minimum-effective-scaffold and student-ownership principles.

---

# Key Domain Services

- **Assignment Understanding Service** — builds or updates the Assignment Brief while preserving provenance, uncertainty, and the student's opportunity to perform decomposition.
- **Planning Service** — helps determine what work should be planned and whether it fits realistic Availability.
- **Scheduling Service** — supports placement and adjustment of Work Sessions.
- **Risk Assessment Service** — derives whether an Assignment needs attention.
- **Work Breakdown Review Service** — reviews the student's proposed Work Breakdown and produces observations about whether coaching may be useful.
- **Decomposition Strategy Service** — provides AssignmentType-specific coaching knowledge; it does not automatically create a Work Breakdown.
- **Coaching Service** — selects the minimum useful Scaffold.
- **Reflection Service** — determines when a brief, actionable Reflection may support learning and what ScaffoldIntensity is appropriate.

---

# Domain Events

- Assignment Captured
- Assignment Updated
- Assignment Brief Updated
- Assignment Brief Confirmed
- Work Breakdown Started
- Work Item Proposed
- Work Item Created
- Work Breakdown Reviewed
- Work Breakdown Confirmed
- Decomposition Attempt Completed
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

# Domain Invariants

1. An Assignment and its Work Breakdown are separate concepts.
2. The student owns the Work Breakdown.
3. The student owns the Plan.
4. System suggestions require student acceptance or modification before becoming part of the Work Breakdown or Plan.
5. Actual teacher requirements take precedence over generic Decomposition Strategies.
6. Inferred Assignment information remains distinguishable from teacher-provided information.
7. The Assignment Understanding Service supports understanding; it does not automatically perform decomposition.
8. A Work Breakdown should not be made more complex than necessary.
9. Assistance should not escalate when the student can proceed independently.
10. ScaffoldIntensity may decrease or increase as evidence and context change.
11. Observations remain distinguishable from interpretations.
12. Skill Competency is contextual rather than global.
13. Internal competency, ZPD, risk, review, and scaffold machinery remain hidden from the student-facing UI.
14. Reflection should not be required when it cannot plausibly inform future behaviour or planning.

---

# Explicitly Outside the Domain

- authentication
- notifications
- AI provider or model
- LMS implementation
- analytics platform
- reporting implementation
- persistence technology
- UI framework
- hosting

AI may implement or assist Domain Services, but AI itself is not a domain concept.

---

# Model Status

Version 1.1 is a focused reconciliation of v1.0.

Primary changes:

- standardized `AssignmentType`
- replaced `Assignment Archetype` with `DecompositionStrategy`
- added `DecompositionAttempt` explicitly to Planning
- added shared `ScaffoldIntensity`
- clarified Skill-specific `ScaffoldStrategy`
- made scaffold fading reversible and contextual
- added explicit Work Breakdown ownership
- strengthened Assignment Brief provenance
- added Assignment Understanding Service
- explicitly constrained Assignment Understanding so it supports decomposition skill rather than generating a Work Breakdown
- clarified Reflection relationships
- added related Domain Events

This model is the canonical domain vocabulary for the next implementation increments.
