# One Step Beyond

## Product Vision

Version 1.1 — Proposed

One Step Beyond is a mobile-first web application that helps secondary school students (Grades 8–12) develop independent executive-function skills through planning, organization, task management, reflection, and coaching.

Unlike traditional task managers, the application is designed to **teach planning and self-management**, not simply track tasks.

The long-term goal is for the student to maintain successful academic performance while progressively requiring less external support.

The product should help the student learn to:

> **understand the work → make a plan → act → notice what happened → adjust**

---

# Product Goals

## Primary Goal

Help students answer three questions with confidence:

1. What do I need to do?
2. What should I do next?
3. Am I on track?

## Learning Goal

Help students become increasingly able to perform the executive-function skills behind those answers independently.

Important Skills include:

- Assignment Capture
- Task Decomposition
- Prioritization
- Time Estimation
- Scheduling
- Task Initiation
- Plan Adjustment
- Self-Monitoring
- Reflection

## Secondary Goals

- Reduce overwhelm.
- Increase planning consistency.
- Improve task initiation.
- Improve time estimation.
- Develop Task Decomposition skill.
- Develop metacognitive awareness.
- Encourage brief, actionable Reflection.
- Support parent and coach involvement without creating surveillance.

---

# Non-Goals

The product is not intended to:

- replace the student's planning with automatic planning
- automatically generate a Work Breakdown as the normal workflow
- diagnose ADHD or assign executive-function scores
- expose ZPD, Skill Competency, risk scores, or ScaffoldIntensity to students
- turn Reflection into required journaling
- gamify executive-function development with points, streaks, or badges

## Deferred From the Initial Student Experience

- LMS integration
- school administration features
- teacher workflows
- native mobile applications
- parent and coach dashboards
- fully adaptive ZPD personalization
- AI assistance that depends on sufficient product and behavioral evidence

AI may later assist Domain Services, but AI itself is not the product model.

---

# Design Principles

- **Mobile-first.**
- **Student experience must remain simple.**
- **Complexity belongs in the domain, not the UI.**
- **Student attempts first.**
- **Observe before inferring.**
- **Provide the minimum effective Scaffold.**
- **The student owns the Work Breakdown and the Plan.**
- **System suggestions remain proposals until the student accepts or modifies them.**
- **Assignment Understanding supports the student in understanding requirements; it must not automatically perform decomposition.**
- **AI supports student thinking rather than replacing it.**
- **Scaffolding is contextual and reversible.** It should fade with demonstrated independent success and may increase temporarily when the student needs more support in a particular context.
- **Reflection should be brief, specific, and actionable.**
- **Success means increasing independence, not simply completing more tasks.**

A preferred coaching progression is:

> **Student attempts → system observes/reviews → prompt → guided support → structured support → suggestion**

The system should remain quiet when the student can proceed successfully.

---

# Primary Users

## Student

A Grade 8–12 student managing schoolwork and extracurricular commitments.

The Student is the primary user of the initial product.

## Parent

Supports planning without becoming the student's executive function.

Parent functionality is deferred until the student experience is validated.

## Executive Function Coach

Uses behavioral evidence to understand planning patterns and adjust support strategies.

Coach functionality is deferred until the student experience is validated.

---

# Core Student Journey

1. Capture an Assignment.
2. Understand what the Assignment requires.
3. Create a Work Breakdown when useful.
4. Estimate effort.
5. Plan when to do the work.
6. Complete planned work.
7. Reflect briefly on what happened.
8. Adjust future planning when useful.

The student should perform as much of this thinking independently as they can.

The system provides additional support only when needed.

---

# Functional Capabilities

## Assignment Management

- Create Assignments.
- Edit Assignments.
- Mark Assignments complete.
- Associate Assignments with Courses.
- Track due dates.
- Capture AssignmentType when useful.

---

## Assignment Understanding

Assignment Understanding answers:

> **What is this Assignment actually asking me to do?**

It may eventually support:

- teacher directions pasted by the student
- a student-written summary
- explicit deliverables
- requirements
- intermediate deadlines
- rubric information
- provenance and uncertainty
- deterministic or AI-assisted interpretation

The student confirms important interpretations.

### Critical Constraint

Assignment Understanding exists to **support the student in developing Task Decomposition skill**.

It may clarify, ask questions, or make targeted observations when required.

It must not automatically transform Assignment directions into a complete Work Breakdown.

Preferred flow:

> **Clarify requirements → student attempts decomposition → observe or prompt only when necessary**

---

## Work Breakdown Coaching

A Work Breakdown represents:

> **How am I going to accomplish this Assignment?**

The student owns the Work Breakdown.

### Initial Capability

The student:

- creates Work Items
- edits and reorders them
- estimates effort
- confirms the Work Breakdown

The initial implementation intentionally provides no decomposition assistance so the product can observe how students naturally approach the skill.

### Progressive Coaching

Later phases may add:

1. AssignmentType-aware heuristics
2. lightweight Decomposition Review
3. deterministic Scaffold Strategies
4. AI-assisted Assignment Understanding and review
5. context-aware suggestions at stronger ScaffoldIntensity
6. adaptive ZPD-based fading and restoration of support

The system should not improve a workable student-created Work Breakdown merely because it could produce a more sophisticated one.

A full suggested Work Breakdown is a strong Scaffold, not the default interaction.

---

## Planning

- Daily planning workflow.
- Schedule Work Sessions.
- View daily plans.
- Reschedule work.
- Preserve student ownership of the Plan.

---

## Week Look-Ahead

A read-only, seven-day orientation view reached from Planning rather than a standalone calendar.

Its role is to help the student notice where the week is crowded.

- Display Assignments due, Activities, and planned Work Sessions.
- Only call attention to a missing Plan when it is consequential.
- Describe available study capacity realistically rather than treating all unscheduled time as homework time.

---

## Risk Detection

Identify work requiring attention using available evidence such as:

- due date proximity
- remaining effort
- planned effort
- missed Work Sessions
- absent or incomplete Work Breakdown
- unresolved Blockers

Student messaging should be simple and actionable.

When things are on track, silence may be the correct experience.

When something needs attention, identify one useful next action such as:

- Break it down
- Find time
- Make a plan
- Adjust the plan

Avoid vague prompts when the system already knows the useful next action.

---

# Metacognition & Reflection

Reflection is a cross-cutting learning capability, not an end-of-session survey.

The learning loop is:

> **Predict → Act → Compare → Explain → Adjust**

Reflection should be:

- selective
- brief
- actionable
- student-owned
- structured by default
- open-ended only when useful

Structured one-tap answers should normally be offered first.

`Something else` and optional free text should remain available.

## Initial Reflection

The first Reflection capability should focus on the student's Work Breakdown.

After the student has had an opportunity to use the breakdown:

> **Did the way you broke this down work?**

Possible responses:

- The steps were about right
- Some steps were too big
- I missed a step
- I made too many steps
- Not sure
- Something else

This provides an early learning loop without requiring Work Session telemetry.

## Later Reflection

Once execution behavior is available, Reflection may expand to:

- duration prediction
- planned vs actual comparison
- missed Work Session reflection
- Blocker reflection
- Plan repair
- periodic pattern recognition

The system should not ask Reflection questions after every action.

---

# Coaching & Learning

The long-term differentiating capability is a shared learning model across Task Decomposition, Reflection, and other executive-function Skills.

Conceptually:

```text
Student attempts
        ↓
Behavior is observed
        ↓
Reflection / Skill Evidence
        ↓
Minimum useful Scaffold
        ↓
Student tries again
        ↓
Skill develops
        ↓
Support fades when appropriate
```

Support may increase again when context or difficulty changes.

The product should not treat support intensity as a permanent attribute of the student.

---

# Parent Dashboard

Deferred until the student experience is validated.

Potential future capabilities:

- overall status
- upcoming deadlines
- work needing attention
- planning consistency
- useful trends without surveillance

---

# Coach Dashboard

Deferred until the student experience is validated.

Potential future capabilities:

- planning behaviors
- Time Estimation trends
- Task Decomposition trends
- Scaffold usage
- Skill Evidence
- potential coaching opportunities

---

# Success Measures

## Long-Term Student Outcomes

- Reduced missed deadlines.
- Increased planning consistency.
- Improved Time Estimation calibration.
- Improved Task Decomposition.
- Improved ability to recover when plans change.
- Increasingly independent Reflection and Plan Adjustment.
- Effective performance with progressively less support in familiar Skill Contexts.

Reduced Scaffold use is meaningful only when scaffolding has been introduced and successful independent performance is maintained.

## Product Outcomes

- Student engagement.
- Planning Session completion.
- Work Session completion.
- Work Breakdown use.
- Reflection completion when prompted.
- Student perception that the product reduces rather than adds cognitive load.
- Student satisfaction.

## Early Product Learning Measures

During the manual Work Breakdown phase, prioritize learning over outcome claims:

- Do students create Work Items?
- How do they naturally decompose different Assignments?
- Do they recognize when their breakdown did not work?
- Which Reflection options are useful?
- Where do recurring decomposition difficulties appear?

---

# Delivery Strategy

The product should be delivered progressively rather than implementing the target-state coaching model all at once.

## Current Build Phase

### Student-Led Work Breakdown + Reflection Foundation

Implement:

- student-created Work Breakdown
- Work Items
- student duration estimates
- Work Breakdown confirmation
- Decomposition Attempt recording
- brief Work Breakdown Reflection

Do not yet implement:

- Assignment Understanding parsing
- Decomposition Review
- heuristic coaching
- scaffold escalation
- AI-generated coaching
- adaptive ZPD
- execution-aware Reflection

The lack of decomposition assistance in this phase is intentional.

It establishes a baseline and creates evidence for later coaching development.

## Later Phases

Progressively introduce:

1. AssignmentType + simple heuristics
2. Assignment Brief + deterministic Scaffold Strategies
3. execution-aware metacognition
4. AI-assisted understanding and coaching
5. adaptive ZPD-based fading and restoration of support

Detailed delivery requirements belong in the canonical feature specifications and current-increment specification rather than this Product Vision.

---

# Canonical Supporting Documents

The Product Vision should be interpreted with:

1. `Executive-Function-Coach-Domain-Model-v1.1.md`
2. `work-breakdown-coaching-feature-spec-v0.2.md`
3. `metacognition-reflection-feature-spec-v0.2.md`
4. `current-increment-manual-work-breakdown-reflection-v0.1.md`

Precedence:

- The **Domain Model** defines canonical language, relationships, and invariants.
- The **feature specifications** define target capabilities and phasing.
- The **current increment specification** defines what is actually being built now.
- The Product Vision defines product direction and should not override implementation phasing.

---

# Product Differentiation

A conventional task manager helps a student remember:

> **What do I need to do?**

One Step Beyond should eventually help the student learn:

> **How do I figure out what to do, make a realistic plan, notice whether it worked, and adjust next time?**

The differentiating loop is:

```text
Assignment
    ↓
Student understands the requirement
    ↓
Student attempts a Work Breakdown
    ↓
System supports only when needed
    ↓
Student plans and acts
    ↓
Student reflects
    ↓
Skill Evidence accumulates
    ↓
Future support changes
```

The desired outcome is not greater dependence on the application.

It is a student who increasingly knows how to plan without it.
