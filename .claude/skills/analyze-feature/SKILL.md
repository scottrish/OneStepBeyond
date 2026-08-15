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
3. Do not modify any files.
4. Treat this as a planning exercise only.
5. Review the feature and produce a build plan.
6. Wait for explicit approval before implementation.

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
