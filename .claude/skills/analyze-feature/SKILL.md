---
name: analyze-feature
description: Analyze a feature specification and produce a build plan.
---

# Feature Spec Analysis
Use this skill whenever the user asks to analyze, review, assess, plan, estimate, or produce a build plan for a feature specification in docs/features/*.md.

## Inputs
The user should provide a feature spec path, usually:

`docs/features/<feature>.md`

If no feature path is provided, ask for it.

## Workflow
1. Read `CLAUDE.md`.
2. Read the requested feature specification.
3. Read `docs/reference/Domain-Model.md`, plus any other document CLAUDE.md's
   "Project Documentation" section names as relevant to this feature (e.g.
   the work-breakdown or metacognition/reflection strategy docs, when the
   feature touches those areas).
4. Do not modify any files.
5. Treat this as a planning exercise only.
6. Review the feature and produce a build plan.
7. If the Domain Review step below surfaces a genuine conflict, flag it
   plainly rather than silently picking a resolution — see that step for
   what counts as a conflict.
8. Wait for explicit approval before implementation.

## Build plan format
1. **Feature Summary**
   * Summarize the feature in your own words.
   * Identify the user value.

2. **Requirements Review**
   * Identify ambiguities, inconsistencies, or missing acceptance criteria.
   * Suggest improvements to the feature specification.

3. **Domain Review**
   * Identify which parts of this application's domain model are involved.
   * Identify any project-specific domain considerations.
   * **Check for conflicts against `docs/reference/Domain-Model.md`.**
     Compare the spec's stated entities, relationships, cardinalities, and
     lifecycle rules against what the Domain Model documents. A conflict is
     the spec *contradicting* something modeled — e.g. assuming a
     one-to-one relationship the model defines as one-to-many, a different
     owner for a piece of data, or a lifecycle/state transition the model
     rules out. It is not a conflict for the spec to simply not implement
     part of the model yet — per CLAUDE.md's "You Aren't Going to Need It"
     section, the Domain Model is a guide to correctness, not a
     prescription for what ships this increment, so a narrower increment
     is expected and not itself a finding.
   * If a genuine conflict is found, do not resolve it yourself or quietly
     write the plan around one interpretation. List it under its own
     **Domain Conflicts** subsection here, state the spec's position and
     the Domain Model's position side by side, and say plainly that the
     rest of this build plan (Architecture Review onward) proceeds on an
     *assumed* resolution until the user confirms one — per CLAUDE.md's
     "If requirements are ambiguous, stop and ask." Repeat the flag when
     presenting the plan for approval; do not let it get buried.

4. **Architecture Review**
   * Describe the components, services, routes, and data model changes required.
   * Explain how the implementation fits the existing architecture.
   * Note anything with mobile-specific implications (touch interaction,
     viewport constraints, offline/connectivity behavior).

5. **Implementation Plan**
   * Break the work into logical implementation steps.
   * Identify dependencies between the steps.
   * Recommend any small refactorings that should occur first.

6. **Testing Plan**
   * Identify unit, component, and integration tests required.
   * Map each acceptance criterion to one or more tests.

7. **Risks**
   * Identify technical risks.
   * Identify future extensibility considerations.
   * Recommend anything that should be deferred to a later increment.

Do not implement any code.

Wait for approval before making changes.
