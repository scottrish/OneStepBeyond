---
name: analyze-feature
description: Analyze a feature specification and produce a build plan.
---

# Feature Spec Analysis

Use this skill whenever the user asks to analyze, review, assess, plan,
estimate, or produce a build plan for a feature specification in
`docs/features/*.md`.

## Inputs

The user should provide a feature spec path, usually:

`docs/features/<feature>.md`

The user may also identify a specific independently deliverable increment
within a larger proposal. If no feature path is provided, ask for it.

## Context Selection

Analyze the smallest implementation scope requested by the user.

If the feature specification contains multiple independently deliverable
increments and the user identifies one, analyze that increment rather than
treating the entire document as implementation scope. Read enough shared
material from the specification to understand the feature's intent,
dependencies, domain touchpoints, and out-of-scope boundaries, but do not
analyze unrelated increments merely because they appear in the same file.

Use progressive context discovery:

1. Apply the project instructions in `CLAUDE.md`; do not reread it if it is
   already active project context.
2. Read the requested feature specification or requested increment.
3. Identify relevant domain concepts, architectural areas, decisions, strategy
   documents, and referenced features from the requested scope.
4. Consult only the relevant sections of canonical documents required to
   validate those concerns. For the Domain Model, locate the relevant concepts
   first, then read enough surrounding context to verify relationships,
   cardinalities, ownership, lifecycle, and state-transition rules.
5. Follow references only when necessary to resolve an implementation
   dependency, ambiguity, or potential conflict. Do not recursively read every
   document referenced by the feature merely because it is referenced.
6. Inspect the existing application code needed to understand the affected
   architecture and current behavior.
7. Use prototype evidence already captured in the feature specification before
   reopening prototype source files. Inspect prototype source only when the
   recorded evidence is insufficient, appears stale, or exact visual or
   interaction details are required.

The goal is sufficient evidence for a correct implementation plan, not
exhaustive context loading.

## Workflow

1. Select context using the rules above.
2. Do not modify any files.
3. Treat this as a planning exercise only.
4. Review the requested scope and produce a build plan.
5. If the Domain Review step below surfaces a genuine conflict, flag it plainly
   rather than silently picking a resolution — see that step for what counts as
   a conflict.
6. Wait for explicit approval before implementation.

## Build plan format

1. **Feature Summary**
   * Summarize the requested scope in your own words.
   * Identify the user value.
   * If analyzing an increment within a larger spec, state what is in scope and
     what remains outside this implementation increment.

2. **Requirements Review**
   * Identify ambiguities, inconsistencies, or missing acceptance criteria.
   * Suggest improvements to the feature specification.

3. **Domain Review**
   * Identify which parts of this application's domain model are involved.
   * Identify any project-specific domain considerations.
   * **Check for conflicts against the relevant sections of
     `docs/reference/Domain-Model.md`.** Compare the spec's stated entities,
     relationships, cardinalities, and lifecycle rules against what the Domain
     Model documents. A conflict is the spec *contradicting* something modeled
     — e.g. assuming a one-to-one relationship the model defines as
     one-to-many, a different owner for a piece of data, or a lifecycle/state
     transition the model rules out. It is not a conflict for the spec to
     simply not implement part of the model yet — per CLAUDE.md's "You Aren't
     Going to Need It" section, the Domain Model is a guide to correctness, not
     a prescription for what ships this increment, so a narrower increment is
     expected and not itself a finding.
   * If a genuine conflict is found, do not resolve it yourself or quietly
     write the plan around one interpretation. List it under its own **Domain
     Conflicts** subsection here, state the spec's position and the Domain
     Model's position side by side, and say plainly that the rest of this build
     plan (Architecture Review onward) proceeds on an *assumed* resolution
     until the user confirms one — per CLAUDE.md's "If requirements are
     ambiguous, stop and ask." Repeat the flag when presenting the plan for
     approval; do not let it get buried.

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
