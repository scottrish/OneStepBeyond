# One Step Beyond

## Product Vision

One Step Beyond is a mobile-first web application that helps secondary school students (Grades 8–12) develop independent executive functioning skills through planning, organization, task management, reflection, and coaching.

Unlike traditional task managers, the application is designed to **teach planning**, not simply track tasks.

The long-term goal is for the student to require progressively less assistance while maintaining successful academic performance.

---

# Product Goals

## Primary Goal

Help students answer three questions with confidence:

1. What do I need to do?
2. What should I do next?
3. Am I on track?

## Secondary Goals

- Reduce overwhelm.
- Increase planning consistency.
- Improve task initiation.
- Improve time estimation.
- Encourage reflection.
- Support parent and coach involvement without creating surveillance.

---

# Non-Goals (V1)

- LMS integration (Google Classroom, Canvas, etc.)
- AI-generated grades or predictions
- School administration features
- Teacher workflows
- Gamification
- Native mobile applications

---

# Design Principles

- Mobile-first.
- Student experience must remain simple.
- Complexity belongs in the domain, not the UI.
- AI proposes; the student decides.
- Coaching should gradually fade as independence increases.

---

# Primary Users

## Student

A Grade 8–12 student managing schoolwork and extracurricular commitments.

## Parent

Supports planning without becoming the student's executive function.

## Executive Function Coach

Reviews progress and recommends adjustments to support strategies.

---

# Core User Journeys

## Student

1. Capture new assignment.
2. Break large assignment into manageable work.
3. Estimate effort.
4. Schedule work.
5. Complete today's work.
6. Reflect briefly.

---

## Parent

1. Review overall status.
2. Identify assignments needing support.
3. Encourage planning conversations.

---

## Coach

1. Review planning behaviors.
2. Identify recurring difficulties.
3. Adjust scaffolding recommendations.

---

# Functional Requirements

## Assignment Management

- Create assignments.
- Edit assignments.
- Mark complete.
- Associate assignments with courses.
- Track due dates.

---

## Work Breakdown

- Understand the assignment before breaking it down: capture teacher directions (pasted, summarized in the student's own words, or built with guided help), and distinguish confirmed requirements from the system's own inferred guesses. The student always confirms this understanding before proceeding.
- Create work items.
- Estimate effort.
- Track completion.
- Guided decomposition coaching: when a student struggles to produce a workable breakdown, offer graduated, rule-based support (a light prompt, then options, then structure, then a suggested skeleton, then a suggested breakdown) that escalates only as far as needed and stops as soon as the student can proceed independently. This is deterministic, pattern-based logic — not conversational or generative AI — and does not conflict with the "no chatbot" non-goal below.

---

## Planning

- Daily planning workflow.
- Schedule work sessions.
- View daily and weekly plans.
- Reschedule work.

---

## Week Look-Ahead

A read-only, 7-day orientation view reached from the Planning workflow rather than a standalone calendar screen. Its role is to help the student notice where the week is crowded, not to be the primary planning surface.

- Display assignments due, activities, and planned work sessions per day.
- Only call attention to a missing plan when it is actually consequential (e.g. something is due soon and unscheduled) — do not repeat "nothing planned" on every empty day.
- Describe available time qualitatively ("About 2 hr study time available," "Mostly open," "Tight day") rather than presenting all unscheduled time as a raw number of free hours. Personal time is not automatically homework time.

---

## Risk Detection

Identify work requiring attention using:

- Due date proximity.
- Remaining effort.
- Planned effort.
- Missed work sessions.

Student messaging should be simple and, when something needs attention, actionable:

- No message when things are on track — silence is itself reassuring.
- A single "Needs Attention" message paired with a specific next action chosen from what is actually missing (e.g. "Break it down," "Find time," "Make a plan") rather than a vague prompt. The system should never surface a generic "take a look" when it already knows the useful next step.

---

## Reflection

After a work session is completed, ask one short question with a small set of tap-to-answer choices (e.g. "Did this take longer than you expected?" → shorter / about right / longer). No free-text journaling and no multi-question surveys in v1 — one thoughtful question beats ten.

---

## Parent Dashboard

Display:

- Overall status.
- Upcoming deadlines.
- At-risk work.
- Planning consistency.

---

## Coach Dashboard

Display:

- Planning behaviors.
- Time estimation trends.
- Task decomposition trends.
- Suggested coaching opportunities.

---

# Success Metrics

Student outcomes:

- Daily planning completed in under five minutes.
- Reduced missed deadlines.
- Increased planning consistency.
- Improved estimation accuracy.
- Reduced scaffold usage over time.

Product outcomes:

- Daily active use.
- Planning session completion.
- Work session completion.
- Student satisfaction.
- Parent satisfaction.

---

# MVP Deliverables

See `docs/Roadmap.md` for the build order within Increment 1 and the
prioritized backlog beyond it.

## Increment 1 — Student Experience

- Student dashboard (Home)
- Assignment management, including Assignment Brief capture and guided decomposition coaching
- Work items and work sessions
- Planning workflow
- Week look-ahead
- Activities
- Risk engine (needs-attention detection)
- Reflection prompt

This increment scopes to the student experience only, matching what was validated in the prototype. See `docs/decisions/` for the reasoning.

## Later Increments — Deferred

- Parent dashboard
- Coach dashboard
- Support relationships (inviting/connecting a parent or coach to a student)

These depend on multi-user accounts and persistence that increment 1 does not require, and should not be built ahead of validating the student experience.

Everything else is deferred until validated by user testing.