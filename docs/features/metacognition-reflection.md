# Executive Function Coach

## Metacognition & Reflection — Feature Specification

Version 0.1

---

# 1. Purpose

Help students develop metacognitive awareness of how they plan, estimate, execute, and adjust their work.

The feature should help the student learn to notice:

- what they expected to happen
- what actually happened
- why there was a difference
- what they want to change next time

The feature should not become a journaling burden or a survey.

The core learning loop is:

> **Predict → Act → Compare → Explain → Adjust**

---

# 2. Core Principles

## Reflection Must Be Actionable

Do not ask a reflection question unless the answer can inform future planning, coaching, or student decision-making.

## Keep Reflection Lightweight

Default to:

- one question at a time
- one-tap responses
- optional free text
- short interactions

Avoid long forms or repeated open-ended prompts.

## Structured First, Open-Ended When Useful

Default to structured response options because they:

- reduce cognitive load
- make reflection easier to complete
- create comparable data
- support future pattern detection

Always provide:

> Something else

and allow optional free text when the student's experience does not fit the available choices.

## Student Experience Stays Simple

The student should not see:

- metacognition scores
- reflection quality scores
- executive-function labels
- prediction accuracy ratings
- ZPD terminology

The system may use these concepts internally.

## Reflection Should Fade as Independence Grows

The system should provide more structure when the student needs support and less when the student can reflect independently.

---

# 3. Domain Concepts Used

This feature uses or extends the following domain concepts:

- Plan
- Work Item
- Work Session
- Work Session Outcome
- Behavior Observation
- Skill
- Skill Context
- Skill Evidence
- Reflection
- Zone of Proximal Development
- Scaffold
- Scaffold Strategy
- Intervention

Primary Skills include:

- Time Estimation
- Self-Monitoring
- Plan Adjustment
- Reflection
- Task Initiation
- Prioritization

---

# 4. Metacognitive Moments

The product should not ask reflection questions continuously.

Use four primary moments.

## Moment A — Before Work

Purpose:

> **Prediction**

The student predicts effort, difficulty, or likely challenges.

Examples:

> How long do you think this will take?

> How sure are you?

> What do you think will be the hardest part?

## Moment B — Immediately After Work

Purpose:

> **Calibration**

Compare the student's expectation with actual experience.

Examples:

> You planned 30 min. It took 47.

Then:

> How did that compare with what you expected?

## Moment C — When the Plan Breaks

Purpose:

> **Causal Awareness + Recovery**

Examples:

> What happened?

> What would help next time?

Reflection should end with an adjustment, not simply a reason.

## Moment D — Periodic Review

Purpose:

> **Pattern Recognition + Generalization**

Examples:

> Algebra took longer than you expected three times this week.

Then:

> What should we plan next time?

Periodic reflection should be based on actual observed patterns.

---

# 5. Before-Work Reflection

## Time Estimate

Before scheduling or starting a meaningful Work Item, ask:

> **How long do you think this will take?**

Suggested responses:

- 10 min
- 20 min
- 30 min
- 45 min
- 1 hr
- Other

Allow direct manual entry when needed.

The student's estimate should be preserved even if the system has a different suggestion.

## Confidence

Use selectively, not for every task.

Question:

> **How sure are you?**

Responses:

- Pretty sure
- Not sure

Use when:

- the task is unfamiliar
- the student historically has difficulty estimating this Skill Context
- the assignment is large or ambiguous

## Anticipated Challenge

Use selectively for larger or unfamiliar tasks.

Question:

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

The system should use assignment context to tailor options when possible.

---

# 6. After-Work Reflection

The system should use data it already knows.

Do not ask the student to re-enter:

- planned duration
- actual duration
- whether the task was completed

Instead, present the comparison.

Example:

> **You planned 30 min. It took 47.**

Then ask:

> **How did that compare with what you expected?**

Responses:

- Took longer than expected
- About what I expected
- Took less time than expected

---

# 7. Why Was It Different?

Ask only when there is a meaningful discrepancy or when the student explicitly wants to reflect.

Example:

> **Any idea why?**

Possible responses:

- There was more work than I realized
- One part was harder than expected
- I got distracted
- I got stuck
- I took a break
- I was more focused than usual
- I already knew more than I expected
- Something else

Free text should be optional.

---

# 8. When a Plan Does Not Happen

When a planned Work Session is missed, delayed, or abandoned:

Do not ask:

> Why didn't you do your work?

Ask:

> **What happened?**

Possible responses:

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

Avoid moral or judgmental language.

---

# 9. Convert Reflection Into Adjustment

After identifying what happened, ask:

> **What would help next time?**

Suggested responses may depend on the previous answer.

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

The system may suggest one likely option but should not automatically change the student's plan.

---

# 10. End-of-Day Reflection

Do not require a daily journal.

Use short end-of-day reflection only when useful.

Example:

> **How did today's plan fit?**

Responses:

- Too much
- About right
- I could have done more

Optional follow-up:

> **Anything you'd change tomorrow?**

Responses:

- Start earlier
- Plan less
- Leave more buffer
- Break something down more
- Nothing — today worked
- Something else

Target completion time:

> **Under 30 seconds**

---

# 11. Periodic / Weekly Reflection

Periodic review should help the student recognize patterns.

The system should show evidence first.

Example:

> **Something we noticed**
>
> You planned about 30 minutes for Algebra three times this week.
> It usually took closer to 45.

Then ask:

> **What should we plan next time?**

Responses:

- 30 min
- 40 min
- 45 min
- Other

## Pattern Example — Delayed Start

> You moved your English work later three times this week.

Question:

> **What do you think was happening?**

Responses:

- I didn't know how to start
- It felt too big
- I kept choosing something else first
- That time of day doesn't work well
- I was tired
- I'm not sure
- Something else

Then:

> **Want to try anything differently next week?**

The system may suggest a single adjustment.

---

# 12. Structured vs Open Response Policy

Use this hierarchy:

## Level 1 — Structured Choice

Default interaction.

Example:

> What got in the way?

- I ran out of time
- I got distracted
- I didn't know how to start
- It felt too big
- Something else

## Level 2 — Structured + Optional Explanation

After selection:

> Want to add anything?

Free text is optional.

## Level 3 — Open Reflection

Use when the student demonstrates sufficient independence in the relevant Skill Context.

Example:

> What do you think happened?

Provide:

> Give me some ideas

as an optional scaffold.

---

# 13. ZPD-Based Reflection Scaffolding

Metacognitive reflection should itself be scaffolded.

## Level 0 — Recognition

Student selects from provided explanations.

Example:

> What happened?

The system supplies likely choices.

## Level 1 — Guided Interpretation

Student receives fewer choices or a targeted question.

Example:

> Was this mostly about time, getting started, or the task being harder than expected?

## Level 2 — Independent Explanation

Ask:

> Why do you think this happened?

Optional:

> Give me some ideas

## Level 3 — Independent Adaptation

Ask:

> What would you change next time?

System remains quiet unless assistance is requested.

## Level 4 — Self-Initiated Reflection

The student notices the mismatch or pattern without a system prompt and chooses to adjust the plan.

This is a long-term outcome, not a V1 requirement.

---

# 14. Scaffold Escalation

Provide additional support when:

- the student selects "Not sure"
- the student repeatedly skips reflection
- the student identifies a problem but cannot suggest an adjustment
- the student explicitly asks for help
- the same planning failure repeats without adaptation

The system should not escalate merely because it can provide more analysis.

---

# 15. Scaffold Fading

Reduce structured support when:

- the student repeatedly identifies relevant causes independently
- prediction accuracy improves
- student-generated adjustments lead to better outcomes
- the student no longer needs canned response options in a Skill Context

Example progression:

```text
Early:
"What happened?"
[structured choices]

Later:
"What do you think happened?"
[Give me some ideas]

Later:
"What would you change next time?"

Eventually:
No prompt unless there is a meaningful mismatch.
```

---

# 16. Reflection Trigger Rules

Do not trigger reflection after every Work Item.

Prioritize reflection when:

- actual duration differs meaningfully from estimate
- a Work Session is missed
- a Work Item is blocked
- the student requests more time
- a task is completed much faster than expected
- the same planning issue repeats
- a major Assignment is completed
- a weekly pattern is worth noticing

Suppress reflection when:

- the task was routine and matched expectations
- the student has already reflected on the same issue recently
- asking would add more burden than value
- there is no plausible action that could result

---

# 17. Example Trigger Thresholds for Prototype

These are prototype heuristics, not domain truths.

Consider asking a time-calibration question when:

- actual duration is more than 25% above estimate
- actual duration is more than 25% below estimate
- difference exceeds 15 minutes

Consider asking a plan-repair reflection when:

- a planned Work Session is missed
- a Work Session is rescheduled twice
- the student selects "Need more time"
- the student selects "I'm stuck"

These thresholds should be configurable and validated through testing.

---

# 18. Reflection Data

A `Reflection` may capture:

- related Assignment / Work Item / Work Session
- prompt type
- trigger
- structured response
- optional free text
- student-proposed adjustment
- scaffold level
- date / time

The system should preserve the distinction between:

- what the student said
- what the system observed
- what the system inferred

---

# 19. Skill Evidence

Reflection interactions may create Skill Evidence.

Example:

```text
Skill:
Time Estimation

Context:
Routine Algebra Homework

Observation:
Student estimated 30 min; actual duration 45 min.

Reflection:
Student identified "more work than I realized."

Adjustment:
Student chose 45 min for next similar task.
```

Example:

```text
Skill:
Plan Adjustment

Context:
Evening Homework After Football

Observation:
Planned Work Session missed.

Reflection:
Student identified "too tired."

Adjustment:
Student chose earlier study time for next similar task.
```

The student should not see these as formal records or scores.

---

# 20. AI Responsibilities

AI may assist with:

- selecting contextually relevant response choices
- summarizing observed patterns
- proposing one likely adjustment
- interpreting optional free text into candidate themes
- identifying when no reflection is needed

AI should not:

- claim to know why the student behaved a certain way
- replace the student's explanation with its own
- psychoanalyze the student
- create diagnostic labels
- automatically change the student's plan based on inferred causes

---

# 21. Student Ownership

The system may say:

> Here's one thing you could try next time.

The student should choose whether to:

- use it
- modify it
- ignore it
- choose another approach

Reflection should support self-regulation, not external control.

---

# 22. Initial Prototype Scope

Implement three metacognitive loops first.

## Prototype Loop 1 — Time Estimation

Before:

> How long do you think this will take?

After:

> You planned 30 min. It took 47.

Then:

> How did that compare with what you expected?

Optional:

> Any idea why?

## Prototype Loop 2 — Missed Work Session

When planned work is missed:

> What happened?

Then:

> What would help next time?

Use structured one-tap choices.

## Prototype Loop 3 — Weekly Pattern

Show one evidence-based pattern.

Example:

> Algebra usually took about 15 minutes longer than you planned this week.

Then:

> What should we plan next time?

Do not show more than one primary pattern per review.

---

# 23. Explicitly Deferred

Not required for initial prototype:

- full adaptive ZPD algorithms
- long-form journaling
- sentiment analysis
- emotion tracking
- automatic psychological interpretation
- parent / coach reflection dashboards
- multi-week competency scores
- student-facing analytics
- gamification of reflection
- daily mandatory reflection

---

# 24. Functional Requirements

The prototype must allow the application to:

- capture a student prediction before work
- compare planned and actual duration
- present structured reflection choices
- allow optional free text
- capture reasons for missed or disrupted work
- capture a student-selected adjustment
- show one periodic pattern based on observed behavior
- record scaffold level
- reduce or increase reflection support by Skill Context in future iterations

---

# 25. Acceptance Criteria

## Prediction

Given a Work Item with no estimate,

the student can enter an estimate with minimal effort.

## Comparison

Given estimated and actual durations,

the system presents the comparison without asking the student to re-enter known data.

## Structured Reflection

The first reflection response can normally be completed with one tap.

## Optional Open Response

The student can provide their own explanation when canned responses do not fit.

Free text is not mandatory.

## Missed Plan

A missed Work Session triggers a non-judgmental reflection and an opportunity to choose an adjustment.

## Actionability

Every reflection question must have a plausible connection to a future planning or coaching decision.

## ZPD

The system records the amount of assistance required in the relevant Skill Context without exposing scaffold levels to the student.

## Cognitive Load

No reflection interaction should present more than one primary question at a time.

---

# 26. Prototype Learning Questions

Testing should help answer:

1. Will students complete one-tap reflections without finding them annoying?
2. Which moments produce useful reflection versus unnecessary interruption?
3. Are canned answers sufficient for most situations?
4. Which categories are missing from the initial response taxonomy?
5. Do students use optional free text?
6. Does showing objective evidence improve reflection?
7. Can students identify useful adjustments after a planning failure?
8. Do structured responses eventually become unnecessary in familiar contexts?
9. How often should reflection be triggered before it becomes burdensome?
10. Does reflection lead to visibly better future planning decisions?

---

# 27. Definition of Success

This feature succeeds when the student increasingly moves from:

> "The plan didn't work."

to:

> "I understand what happened, and I know what I want to change next time."

The deeper success criterion is that the system needs to ask fewer metacognitive questions over time because the student increasingly predicts, notices, explains, and adjusts independently.
