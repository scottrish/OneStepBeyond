# Executive Function Coach

## Coach / Parent Dashboard — Feature & Phased Delivery Specification

Version 0.1

---

# 1. Purpose

Provide a desktop-oriented dashboard that makes the application's increasingly sophisticated executive-function model observable to trusted adults **without exposing that complexity in the student experience**.

The dashboard serves two distinct purposes:

1. **Product testing and model validation**
   - inspect the state produced by Playwright-driven student journeys
   - verify that domain events, observations, reflections, Skill Evidence, Scaffold usage, and later ZPD / Skill Competency projections are being recorded and derived correctly
   - make backend behavior explainable enough to identify incorrect assumptions, rules, or adaptations

2. **Human coaching and parent support**
   - help an Executive Function Coach understand current capability in context and behavior trends over time
   - help a parent know when support may be useful without turning the product into a surveillance system
   - support evidence-informed coaching conversations while preserving student ownership of the Work Breakdown and Plan

The dashboard is **not mobile-first**. It should favor information density, filtering, comparison, timelines, drill-down, and extensibility.

---

# 2. Canonical References

Interpret this specification with:

1. `reference/Domain-Model.md`
2. `reference/work-breakdown-coaching-feature-spec-v0.2.md`
3. `reference/metacognition-reflection-feature-spec-v0.2.md`
4. the active current-increment specification

Precedence:

- Domain Model defines terminology and invariants.
- Feature specifications define target behavior and phasing.
- Current increment defines which data can legitimately exist now.
- This dashboard specification defines how those data are projected and inspected.

The dashboard must not imply that a capability exists before the student application and backend implement it.

---

# 3. Product Principle

The dashboard exposes the **evidence and model sophistication** while the student experience stays simple.

```text
STUDENT EXPERIENCE
simple questions / choices / next actions
        ↓
DOMAIN EVIDENCE
Assignments
Work Breakdowns
Decomposition Attempts
Work Sessions
Behavior Observations
Reflections
Scaffolds
Skill Evidence
        ↓
COACH MODEL
Skill Competency
Skill Context
ZPD
Behavior Trends
Scaffold Effectiveness
        ↓
COACH / PARENT DASHBOARD
role-appropriate evidence + trends + interpretation
```

The dashboard is primarily a **read model / projection over the domain**, not a second planning application.

---

# 4. Core Principles

1. **Evidence first.** Show what happened before what the system thinks it means.
2. **Observation and inference remain distinguishable.**
3. **Capability is contextual.** Never present one global executive-function score.
4. **Avoid false precision.** Prefer evidence, trends, confidence, and contextual descriptions over arbitrary percentages.
5. **Show why the model changed.** Capability and ZPD projections must be traceable to supporting evidence.
6. **Trend matters more than snapshot.**
7. **Scaffolding is reversible.** Increased support in a novel or difficult context is not automatically regression.
8. **Student ownership remains intact.** Adults do not silently edit the student's Work Breakdown or Plan.
9. **Parent support is not surveillance.**
10. **Testability is a first-class requirement.**
11. **Extensibility matters.** New Skills and evidence types should fit without redesigning the dashboard.

---

# 5. Dashboard Modes

## Coach Mode

Purpose:

> Understand the student's planning behavior, current capability in context, and where coaching may be useful.

May expose:

- Skill
- Skill Context
- Skill Evidence
- ScaffoldIntensity
- Decomposition Review
- Skill Competency
- ZPD
- Behavior Observation
- Reflection

Coach Mode should be evidence-rich but human-readable.

## Parent Mode

Purpose:

> Understand whether the student is generally managing commitments and where a supportive conversation may be useful.

Prefer:

- upcoming work
- Needs Attention
- planning consistency
- broad trends
- appropriately shareable Reflection themes
- supportive conversation prompts

Do not show by default:

- raw Skill Competency / ZPD
- technical Scaffold history
- raw event streams
- all free-text Reflections
- minute-by-minute monitoring

## Diagnostic / Test Mode

Purpose:

> Validate the product and backend model.

May expose:

- entity IDs
- Domain Events
- structured observations
- derived projections
- provenance
- rule / model version
- timestamps
- test fixture identifiers
- structured AI outputs when AI is introduced

Diagnostic Mode must remain separate from normal Parent access and never appear in the student experience.

---

# 6. Information Architecture

Recommended extensible navigation:

```text
Overview
Assignments & Work
Skills & Capability
Behavior Trends
Reflections
Evidence Timeline
Scaffolding
Diagnostics
```

For the current manual Work Breakdown + Reflection phase, implement only:

```text
Overview
Assignments & Work
Reflections
Evidence Timeline
Diagnostics
```

Add future sections only when real underlying data exists.

---

# 7. Overview

## Coach Overview

Potential panels:

### Current Commitments

- upcoming Assignments
- due dates
- Work Breakdown status
- planned / remaining effort when available
- Needs Attention state

### Recent Behavior

Examples:

- Work Breakdown created or revised
- Reflection recorded
- Work Session missed
- Blocker recorded
- Scaffold requested

### Current Capability Hypotheses

Only when Skill Competency / ZPD exists.

Example:

```text
Task Decomposition
Context: Writing / Essay

Independent capability:
Usually identifies major essay stages.

Supported capability:
Can resize large writing steps after a Guided prompt.

Current challenge:
Draft-writing steps are often too large.

Evidence:
6 recent relevant attempts

Confidence:
Moderate
```

Do not collapse this to a percentage.

### Emerging Patterns

Examples:

- Writing Work Items are often reflected on as "too big."
- Routine Algebra estimates are usually close to actual duration.
- ScaffoldIntensity for Writing / Essay has decreased across recent attempts.

Each pattern links to supporting evidence.

## Parent Overview

Prefer:

### What's Coming Up
Major upcoming Assignments and deadlines.

### What Looks Okay
A small amount of positive evidence.

### May Need Support
Only meaningful issues.

### Recent Progress
Examples of increasing independence.

Avoid framing the student as a collection of deficits.

---

# 8. Assignments & Work

Provide a filterable table/list.

Possible columns:

- Assignment
- Course
- AssignmentType
- due date
- status
- Work Breakdown state
- Work Item count
- estimated effort
- recent Reflection
- Needs Attention

Selecting an Assignment opens Assignment Detail.

## Assignment Detail

Show:

### Assignment
- title
- Course
- AssignmentType
- due date
- status

Later:
- Assignment Brief
- requirements
- provenance
- confirmed vs inferred information

### Work Breakdown
- confirmed Work Breakdown
- Work Items
- order
- estimated duration
- completion state
- draft revision if one exists

### Decomposition Attempt History
Current fields:
- initial Work Items
- resulting Work Items
- revision count
- assistance requested
- ScaffoldIntensity
- outcome
- timestamp

Later:
- Decomposition Review findings
- Scaffold sequence
- student response after each Scaffold
- related Skill Evidence

### Reflection
Show student Reflection separately from objective evidence.

Example:

```text
Student Reflection:
"Some steps were too big."

Proposed adjustment:
"Make smaller steps next time."
```

Do not translate this into an objective claim that the student lacks a skill.

---

# 9. Work Breakdown Comparison

Provide a comparison view:

```text
Initial student attempt
        ↓
Revisions
        ↓
Confirmed Work Breakdown
        ↓
Later execution-time changes
```

Later show:

- items added
- items split
- items removed
- items reordered
- changes following a Scaffold

This is especially useful for assessing whether coaching supports student thinking rather than passive acceptance of generated work.

---

# 10. Reflections

Allow filtering by:

- date
- Assignment
- AssignmentType
- Reflection type
- structured response
- proposed adjustment
- related Skill

Current Work Breakdown responses include:

- steps were about right
- some steps were too big
- missed a step
- too many steps
- not sure
- something else

Later Reflection types include Time Estimation, missed Work Session, Blocker, Plan Adjustment, and periodic pattern Reflection.

Coach Mode may show structured response, optional free text where appropriate, proposed adjustment, and related objective evidence.

Parent Mode should default to a more conservative projection. Do not assume every free-text Reflection is parent-visible.

---

# 11. Evidence Timeline

Provide a chronological, evidence-first view.

Possible events:

- Assignment Captured
- Work Breakdown Started
- Work Item Created
- Work Breakdown Confirmed
- Decomposition Attempt Completed
- Reflection Recorded
- Work Session Scheduled / Completed / Missed
- Scaffold Provided
- Skill Evidence Recorded
- capability projection changed

Each entry shows:

- timestamp
- event type
- related Assignment / Work Item / Skill Context
- concise description

Coach / Diagnostic Mode can drill into structured details.

Parent Mode should not expose the raw event stream.

---

# 12. Skills & Capability

Introduce only when Skill Evidence and Skill Competency exist.

Never create a global EF score.

## Skill List

Examples:

- Task Decomposition
- Time Estimation
- Prioritization
- Scheduling
- Task Initiation
- Plan Adjustment
- Self-Monitoring
- Reflection

Selecting a Skill shows Skill Contexts, for example:

```text
Task Decomposition
├── Problem Set
├── Writing / Essay
├── Project
└── Presentation
```

## Skill Context Detail

Show:

### Independent Capability
What evidence suggests the student can do without assistance.

### Supported Capability
What the student can do successfully with Scaffolds.

### Current Challenge
The next meaningful capability beyond independent performance.

### Evidence Confidence

```text
Insufficient evidence
Low
Moderate
High
```

Confidence is about the **model's evidence**, not the student's ability.

### Supporting Evidence
Evidence behind the working hypothesis.

### Contradictory Evidence
Meaningful evidence that does not fit the current interpretation.

The dashboard should not hide contradictory evidence.

---

# 13. Capability History

For each Skill Context, show how the working hypothesis changes over time.

Example:

```text
Sep 08 — Suggested skeleton required
Oct 12 — Guided prompts sufficient
Nov 03 — Independent workable breakdown
Nov 19 — Structured support used for unusually complex assignment
```

A later increase in support is not automatically regression.

---

# 14. Behavior Trends

Use longitudinal modules rather than one score.

Potential modules:

## Task Decomposition
- attempts over time
- independent vs assisted attempts
- highest ScaffoldIntensity
- common Review findings
- Work Item count
- later splitting / restructuring
- Reflection themes
- AssignmentType comparisons

## Time Estimation
When execution data exists:
- estimated vs actual
- estimation error
- direction of error
- trends by context

## Planning
Later:
- Work Sessions planned
- completed as planned
- reschedules
- missed sessions
- plan repairs

## Reflection
- Reflection completion when prompted
- structured vs open
- student-proposed adjustments
- whether later outcomes changed

Avoid treating repeated behavior as a fixed trait.

---

# 15. Scaffolding

Introduce only when scaffolding exists.

Show by Skill Context:

- first ScaffoldIntensity
- highest ScaffoldIntensity
- Scaffolds provided
- whether the student continued successfully
- whether more help was requested
- resulting behavior

Example:

```text
Writing / Essay

Attempt 1  Suggested
Attempt 2  Structured
Attempt 3  Guided
Attempt 4  None
Attempt 5  None
Attempt 6  Structured — unusually complex assignment
```

Do not label the last entry regression automatically.

Later support questions:

- Which Scaffolds most often enable continuation?
- Is the system escalating unnecessarily?
- Is it failing to escalate when needed?
- Does Direct assistance lead to passive acceptance?
- Does support fade after repeated independent success?

---

# 16. Model Decision Explanation

When adaptation exists, expose a structured decision explanation.

Example:

```text
Decision:
Begin this attempt at Light assistance.

Inputs:
- Skill: Task Decomposition
- Context: Writing / Essay
- 4 recent relevant attempts
- 2 recent independent successes
- most recent attempt required Guided support
- evidence confidence: Moderate

Reason:
Independent performance is emerging but inconsistent.

Outcome:
Student proceeded after one Light prompt.
```

This is a structured domain explanation.

Do **not** depend on or store hidden AI chain-of-thought.

If AI is used, persist structured inputs, outputs, provenance, confidence, and model/policy metadata needed for validation.

---

# 17. Diagnostic / Test Mode

## Entity Inspector

Inspect structured state for domain objects that currently exist, eventually including:

- Assignment
- Assignment Brief
- Work Breakdown
- Work Item
- Decomposition Attempt
- Work Session
- Behavior Observation
- Reflection
- Skill Evidence
- Skill Competency
- ZPD
- Scaffold
- Intervention

## Event Inspector

Allow filtering by:

- Domain Event
- Assignment
- Skill Context
- date/time

Show structured payload and correlation/trace ID if implemented.

## Projection Inspector

For derived values show:

- current interpretation
- last updated
- source evidence
- rule / projection / model version
- confidence
- structured reason for update

---

# 18. Test Data Controls

Only in non-production / authorized diagnostic environments.

Recommended capabilities:

- select a known test student
- reset test student to fixture
- seed deterministic scenario data
- optionally advance simulated date/time
- load named scenarios
- inspect expected scenario outcome

Possible scenarios:

```text
manual-essay-breakdown
manual-problem-set-breakdown
breakdown-reflection-too-big
breakdown-reflection-missed-step

later:
guided-essay-decomposition
scaffold-fading-writing
estimation-underprediction
missed-session-plan-repair
```

Scenario data should be deterministic.

---

# 19. Playwright Testability Requirements

## Stable Selectors

Use accessible roles/labels first and stable test identifiers only where needed for:

- student selector
- Assignment rows
- Work Breakdown state
- Work Items
- Decomposition Attempts
- Reflections
- Skill Context cards
- ScaffoldIntensity
- timeline entries
- diagnostic event rows

Avoid visual-position or generated-class selectors.

## Deterministic Fixtures

Automated tests should establish known state without manually creating large histories through the UI on every run.

Prefer reusable fixture setup through test infrastructure.

The dashboard can expose fixture controls, but Playwright should not be required to click through it merely to seed tests.

## Assertion Surfaces

Tests should verify both:

```text
Student-facing result
+
Backend/domain result
```

Example:

```text
Student:
Creates "Finish book" and "Write report"

Dashboard:
DecompositionAttempt exists
assistanceRequested = false
highestScaffoldIntensity = None
confirmed Work Items = 2
```

## AI Testing Later

When AI arrives:

- support deterministic stubbed AI responses for regression tests
- record model / prompt / policy versions
- test student behavior against structured AI output
- keep live-model evaluation as a separate test layer

---

# 20. Parent View

Parent Mode is a projection of the same domain, not a separate model.

## Parent Should See

Potentially:

- major upcoming Assignments
- whether important work has a Plan
- Needs Attention
- broad planning consistency
- meaningful positive progress
- broad trends
- supportive conversation prompts

Example:

> The English essay is due Friday. The steps are defined, but no time has been planned for the draft yet.

Conversation prompt:

> "When are you thinking you'll work on the draft?"

## Parent Should Normally Not See

- raw Skill Competency
- raw ZPD
- numerical internal capability scores
- raw Decomposition Review dimensions
- internal ScaffoldIntensity history
- raw system inference
- all student free-text Reflections
- detailed timestamp surveillance

---

# 21. Coach Actions

Initial Coach Dashboard should be primarily **read-only**.

Potential later actions:

- mark evidence reviewed
- add a private coaching note
- propose an Intervention
- record an external coaching observation
- flag a model interpretation as questionable
- propose a Scaffold Strategy change

A coach should not silently alter the student's confirmed Work Breakdown, Plan, or Reflection.

Future coach-generated planning changes remain proposals the student can accept or modify.

---

# 22. Model Validation Workflow

The dashboard should support:

```text
Run student scenario
        ↓
Inspect domain evidence
        ↓
Inspect model interpretation
        ↓
Compare with human coach judgment
        ↓
Identify mismatch
        ↓
Adjust rule / model / prompt
        ↓
Re-run scenario
```

It should make it easy to answer:

- What evidence did the backend receive?
- What did it infer?
- Why?
- How confident was it?
- What support did it select?
- What happened afterward?
- Was the support useful?
- Did the model update?
- Was that update justified?

---

# 23. Delivery Phases

## Phase 1 — Current Manual Work Breakdown + Reflection

Implement:

- Overview
- Assignments & Work
- Assignment Detail
- confirmed Work Breakdown / draft distinction
- Decomposition Attempt history
- Reflection view
- Evidence Timeline
- Diagnostic Inspector

Show current Decomposition Attempt values such as:

```text
assistanceRequested = false
initialScaffoldIntensity = None
highestScaffoldIntensity = None
scaffoldsProvided = []
```

Do **not** invent:

- Decomposition Review
- Skill Competency
- ZPD
- scaffold effectiveness
- execution trends

## Phase 2 — Heuristic Decomposition Coaching

Add:

- AssignmentType filters
- heuristic Review observations
- Light Scaffold
- student response
- before/after Work Breakdown comparison

## Phase 3 — Assignment Brief + Deterministic Scaffolding

Add:

- Assignment Brief
- provenance
- confirmed vs inferred information
- Decomposition Review dimensions
- Scaffold sequence
- first/highest ScaffoldIntensity
- deterministic rule/strategy identifiers

Use the dashboard to assess whether Assignment Understanding supports the student's decomposition skill rather than replacing it.

## Phase 4 — Execution-Aware Metacognition

Add:

- planned vs actual duration
- missed Work Sessions
- Blockers
- reschedules
- estimation trends
- Work Item sizing outcomes
- Reflection → Adjustment links

## Phase 5 — AI-Assisted Coaching

Add:

- structured AI input provenance
- Assignment Understanding output
- proposed coaching action
- selected ScaffoldIntensity
- model / policy version
- confidence
- student response
- resulting evidence

Make AI over-intervention and unsupported inference visible.

## Phase 6 — Adaptive ZPD

Add:

- Skill Competency by Skill Context
- current ZPD hypothesis
- independent capability
- supported capability
- current challenge
- confidence
- supporting and contradictory evidence
- fading/restoration history
- structured model decision explanation

---

# 24. Visualization Guidelines

Recommended:

- timelines
- event markers
- simple estimation-calibration charts
- categorical ScaffoldIntensity trends
- before/after Work Breakdown comparisons
- small multiples by Skill Context
- evidence tables

Avoid:

- radar charts of "executive function"
- global score gauges
- traffic-light judgments about the student
- vanity metrics
- charts that imply unsupported precision

Every derived visualization should drill down to evidence.

---

# 25. Filtering and Comparison

Coach Mode should eventually filter by:

- date range
- Course
- AssignmentType
- Skill
- Skill Context
- Assignment
- ScaffoldIntensity
- outcome
- Reflection response

Primary comparison:

> **this student over time and across contexts**

Do not compare students against one another in the initial product.

---

# 26. Privacy and Trust

The dashboard contains information hidden from the student UI because it would add cognitive load or invite self-labeling. That does not mean it should be exposed indiscriminately.

Principles:

- minimum necessary adult access
- clear role separation
- no covert monitoring
- no diagnostic labeling
- special care for student Reflection privacy
- internal inference is not parent-visible fact
- adult access must not undermine student ownership

---

# 27. Non-Functional Requirements

## Desktop First

Optimize for laptop/desktop. Target comfortable use at approximately 1280px width and above; tablet support is useful but secondary.

## Extensibility

New Skills, Skill Contexts, Reflection types, Scaffold types, and evidence sources should use reusable components.

## Auditability

Derived model state retains enough metadata to determine:

- when it changed
- what evidence supported it
- what rule / model version produced it

## Performance

Large event histories should use pagination or virtualization where necessary.

## Accessibility

Use semantic controls and keyboard navigation despite higher information density.

---

# 28. Acceptance Criteria — Initial Dashboard

1. **Current-state accuracy:** dashboard and student application show the same authoritative Assignment and confirmed Work Breakdown state.
2. **Decomposition evidence:** a manual Decomposition Attempt shows initial/resulting Work Items and correctly reports no Scaffold.
3. **Reflection separation:** student Reflection is labeled as student-reported rather than objective Observation.
4. **Draft safety:** draft Work Breakdown revisions are distinguishable from the confirmed active breakdown.
5. **Event traceability:** tester can follow Assignment → Work Breakdown → Decomposition Attempt → Reflection.
6. **No future-state fiction:** no fabricated Skill Competency, ZPD, or scaffold trend appears before implementation.
7. **Playwright visibility:** automated tests can identify key entities and verify hidden domain state after student journeys.

---

# 29. Acceptance Criteria — Future Adaptive Dashboard

When ZPD behavior exists:

- Skill Competency is contextual, not global.
- Independent and supported capability are distinct.
- confidence is separate from capability.
- supporting and contradictory evidence are inspectable.
- scaffold fading is visible over time.
- temporary increases in support are not automatically framed as regression.
- model decisions are traceable to structured inputs/evidence.
- Coach interpretations do not silently alter student-owned Plans or Work Breakdowns.

---

# 30. Suggested Initial Screen Set

Build only:

```text
1. Student Overview
2. Assignments & Work
3. Assignment Detail
4. Reflections
5. Evidence Timeline
6. Diagnostic Inspector
```

Do not build empty Skill / ZPD / Scaffolding screens just to match future navigation.

---

# 31. Product Learning Questions

1. Can a coach reconstruct what the student actually did from recorded evidence?
2. Are we collecting enough evidence to assess Task Decomposition without unnecessary surveillance?
3. Do Reflections add useful information beyond objective behavior?
4. Can testers identify domain-state errors quickly after Playwright journeys?
5. Do Decomposition Attempt records preserve enough history for later capability modeling?
6. When heuristics arrive, can coaches distinguish useful interventions from annoying ones?
7. When scaffolding arrives, does ScaffoldIntensity accurately describe assistance?
8. When Skill Competency arrives, does the model match experienced coach judgment?
9. Can every capability interpretation be traced to evidence?
10. Does Parent Mode support useful conversations without encouraging micromanagement?

---

# 32. Definition of Success

The dashboard succeeds initially when a tester can run a student journey and answer:

> **What happened in the domain, and did the backend record it correctly?**

It succeeds as a Coach Dashboard when a knowledgeable adult can answer:

> **What can this student currently do independently, where do they still benefit from support, what evidence supports that view, and how is that changing over time?**

It succeeds as a Parent Dashboard when a parent can answer:

> **Is my student generally on track, and is there a useful supportive conversation I should have?**

The dashboard should make the backend model more observable without making the student experience more complicated or turning adult support into surveillance.
