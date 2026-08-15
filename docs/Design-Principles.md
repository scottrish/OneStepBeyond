# Executive Function Coach

## Design Principles

Version 1.0

---

# Purpose

This document defines the guiding principles for the Executive Function Coach project.

Unlike the Product Requirements Document, these principles are intended to remain stable as the product evolves.

Every significant product, UX, engineering and AI decision should be evaluated against these principles.

If a proposed feature violates these principles, it should be reconsidered regardless of its technical feasibility.

---

# Mission

Help secondary school students develop the executive functioning skills needed to independently manage school, extracurricular activities and life commitments.

The application should act as a temporary scaffold that gradually becomes less necessary as the student develops confidence and competence.

**The goal is not to build a better planner.**

The goal is to help students become better planners.

---

# Vision

Every student should be able to answer three questions with confidence.

> What do I need to do?

> What should I do next?

> Am I on track?

The application exists to make those questions easier to answer until the student can answer them independently.

---

# Core Philosophy

The application is not a productivity tool.

It is a learning tool.

Planning is a skill.

Organization is a skill.

Time estimation is a skill.

Task initiation is a skill.

Reflection is a skill.

The application should help students practice these skills rather than performing them on the student's behalf.

---

# First Principle

## Coach. Don't Replace.

The application should never become the student's executive function.

Whenever possible

Instead of

> Automatically deciding

Prefer

> Helping the student decide.

Instead of

> Completing work for the student

Prefer

> Helping the student understand how to complete the work.

The application should always encourage active participation.

---

# Second Principle

## Build Independence

Every interaction should move the student toward greater independence.

Support should gradually decrease as confidence and competence increase.

Success is measured not only by completed work but by requiring progressively less assistance.

---

# Third Principle

## Simplicity at the Edge

The domain model may be sophisticated.

The student experience must not be.

The student should see

- Today's work
- Next action
- Upcoming commitments
- Simple coaching

The student should never see

- Executive function scores
- Behaviour analytics
- Risk calculations
- Complex planning models

Complexity belongs inside the application.

Not inside the user's head.

---

# Fourth Principle

## Reduce Cognitive Load

The application should make thinking easier.

Never harder.

Avoid

Large task lists.

Too many choices.

Complicated workflows.

Information overload.

Prefer

One next step.

One decision.

One coaching prompt.

One reflection question.

Whenever possible

Reduce.

Do not add.

---

# Fifth Principle

## Reality Before Automation

The application should faithfully represent reality.

Assignments.

Activities.

Available time.

Student decisions.

Automation should improve planning.

It should never hide reality.

If work cannot realistically be completed before a deadline, the application should acknowledge this and help the student create a better plan.

---

# Sixth Principle

## Observe Before Inferring

Store observations.

Derive conclusions.

Avoid assumptions.

The system should know

The student missed two work sessions.

The student underestimated this assignment.

The student completed planning four days this week.

The system should avoid concluding

The student is lazy.

The student is unmotivated.

The student has poor executive functioning.

The application observes behaviour.

Humans interpret behaviour.

---

# Seventh Principle

## The Student Owns the Plan

The student is responsible for accepting, rejecting or modifying plans.

The application may suggest.

The application should not silently decide.

Ownership builds commitment.

Commitment builds independence.

---

# Eighth Principle

## Protect What Matters

The application should help students make time for the things that matter to them.

Friends.

Family.

Sports.

Music.

Rest.

Planning is not about filling every available minute.

Planning is about making intentional choices.

The application should demonstrate that thoughtful planning creates more freedom rather than less.

---

# Ninth Principle

## Support, Don't Surveillance

Parents and coaches should receive enough information to provide meaningful support.

They should not become full-time project managers.

Parent dashboards should answer

Does my child need help?

Coach dashboards should answer

How can I help this student improve?

Neither should encourage constant monitoring.

---

# Tenth Principle

## Minimum Effective Intervention

Whenever assistance is required

Provide the smallest amount of support likely to produce success.

Examples

Instead of

"Here is the complete plan."

Prefer

"What do you think should happen first?"

Instead of

Breaking every assignment into tasks.

Prefer

Asking whether the student would like help.

Scaffolding should always move toward independence.

---

# Eleventh Principle

## Learning Happens Through Reflection

Completion is not the end.

Reflection completes the learning cycle.

Reflection should be

Short.

Actionable.

Specific.

Never burdensome.

One thoughtful question is more valuable than a ten-question survey.

---

# Twelfth Principle

## AI Should Augment Human Judgment

Artificial intelligence should

Suggest.

Clarify.

Summarize.

Coach.

Encourage.

Artificial intelligence should not

Take ownership.

Make important decisions without the student.

Hide uncertainty.

Replace conversations with parents or coaches.

AI is a coach.

Not a substitute for the student.

---

# Thirteenth Principle

## Design for Calm

The application should reduce stress.

Not increase it.

Visual design should feel

Clean.

Predictable.

Quiet.

Focused.

Notifications should be rare.

Every screen should answer

"What is the most useful thing this student needs right now?"

The prototype (`OneStepBeyondPrototype`) is the concrete reference for
what this looks like in practice — new UI should feel like it belongs in
the same application, not like a different one bolted on beside it.

---

# Fourteenth Principle

## Progress Is More Important Than Perfection

Students will miss assignments.

Plans will fail.

Schedules will change.

The application should respond by helping the student recover.

Never by making them feel they have failed.

Recovery is a skill.

The application should teach it.

---

# Fifteenth Principle

## Build for Learning

The first versions of this application are experiments.

Every feature should answer a question.

Does this reduce overwhelm?

Does this improve planning?

Does this encourage independence?

Does this help parents support without taking over?

If a feature does not demonstrably help students develop executive functioning skills, it should be removed regardless of how impressive it appears.

---

# Decision Framework

When evaluating a new feature, ask:

1. Does it reduce cognitive load?
2. Does it increase student ownership?
3. Does it build executive functioning skills?
4. Does it preserve student autonomy?
5. Does it support rather than replace planning?
6. Does it help parents support without micromanaging?
7. Will the student still need this feature in two years?

If the answer to the final question is **yes**, reconsider the design.

The best outcome is that the application gradually becomes less necessary because the student has internalized the skills it was designed to teach.

---

# Closing Principle

The ultimate measure of success is not how often students use the application.

The ultimate measure of success is that, over time, they need it less because they have become confident, independent planners.

**The product succeeds when the student no longer depends on it.**