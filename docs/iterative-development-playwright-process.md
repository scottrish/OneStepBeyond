# Iterative Development and Playwright Feedback Process

## Purpose

This process defines an experiment for developing software through repeated, bounded development and user-experience review cycles using Claude and Playwright.

The objective is to:

- implement a feature, or a meaningful increment of a feature;
- evaluate the resulting application from the perspective of an independently defined persona and mission;
- capture evidence and observations from that evaluation;
- use those findings to create the specification for the next development iteration; and
- repeat until the feature is complete and no substantive improvements are identified, or a maximum of three development iterations has been completed.

The feature specification, Playwright persona, and Playwright mission are independent inputs. The persona and mission must not be derived from the feature specification.

---

## Inputs

Each run of the process requires:

1. **Feature Specification**  
   Defines the capability to be developed.

2. **Playwright Persona**  
   Defines the characteristics, goals, constraints, behaviors, and perspective of the user who will evaluate the application.

3. **Playwright Mission**  
   Defines the outcome the persona is attempting to achieve using the application.

The persona and mission should be reusable and should exist independently of the feature specification.

---

## Iteration Limit

The process runs for a maximum of **three development iterations**.

The process stops earlier when:

- the feature is complete; and
- the Playwright evaluation produces no substantive recommendations for improvement.

A development iteration consists of:

1. feature analysis;
2. codebase tagging;
3. implementation;
4. independent Playwright evaluation;
5. evidence capture;
6. Git commit;
7. generation of the next feature specification, when required.

---

# Process

## 1. Analyze the Feature Specification

Claude reads and analyzes the current feature specification before modifying the codebase.

The analysis should determine:

- the user value described by the feature;
- functional and non-functional requirements;
- acceptance criteria;
- dependencies and constraints;
- likely implementation impact;
- areas of ambiguity or risk; and
- the estimated size and complexity of the work.

Claude should then decide whether the current iteration should:

- implement the entire feature; or
- implement a coherent increment of the feature.

An increment should deliver meaningful user value and should not be an arbitrary technical slice where a user-facing slice is reasonably possible.

The purpose of this step is to establish implementation scope. It does not alter the separately defined Playwright persona or mission.

---

## 2. Tag the Codebase

Before implementation begins, create a Git tag identifying the starting state of the codebase for the development iteration.

### Git Tag Naming Convention

Use:

```text
dev-<feature-slug>-i<iteration>-start
```

Examples:

```text
dev-assignment-planning-i1-start
dev-assignment-planning-i2-start
dev-assignment-planning-i3-start
```

Where:

- `<feature-slug>` is a stable, lowercase, hyphen-separated identifier for the feature;
- `<iteration>` is the development iteration number: `1`, `2`, or `3`.

The tag provides an unambiguous reference point for the codebase before changes made during that iteration.

---

## 3. Build the Feature or Feature Increment

Claude implements the scope identified during feature analysis.

Depending on the assessed size and complexity, this may be:

- the entire feature; or
- a meaningful increment of the feature.

Implementation should:

- follow the existing architecture and development conventions;
- remain within the scope of the current feature specification;
- avoid unrelated refactoring or feature expansion;
- include appropriate automated tests; and
- leave the application in a state that can be exercised with Playwright.

If only an increment is implemented, the increment should be sufficiently complete for the Playwright persona to interact with meaningfully.

---

## 4. Run the Playwright Persona and Mission

After implementation, Claude switches from development to evaluation.

The Playwright evaluation must use the independently supplied:

- persona; and
- mission.

### Critical Separation

During this evaluation, Claude must **not reference the feature specification**.

The purpose of this separation is to reduce confirmation bias.

The evaluator should not ask:

> Did the implementation satisfy the feature specification?

Instead, it should ask:

> Can this persona accomplish this mission effectively using the application as it now exists?

The evaluator should interact with the application through the UI and attempt to accomplish the mission as the persona would.

The evaluator may explore alternate paths, make mistakes, encounter uncertainty, and react to the interface according to the characteristics defined by the persona.

Observations should focus on actual interaction with the application, including:

- confusion;
- friction;
- unclear terminology;
- unnecessary steps;
- missing information;
- difficult navigation;
- unexpected behavior;
- errors;
- poor feedback;
- inaccessible interactions;
- dead ends; and
- opportunities that would materially improve the persona's ability to accomplish the mission.

The evaluator should not invent improvements merely to produce feedback.

It is valid for an iteration to produce no substantive observations.

---

## 5. Capture Screenshots and Observations

Playwright evidence must be retained for each development iteration.

### Evidence Directory Naming Convention

Store evidence under:

```text
docs/playwright/<feature-slug>/iteration-<NN>/
```

Examples:

```text
docs/playwright/assignment-planning/iteration-01/
docs/playwright/assignment-planning/iteration-02/
```

### Screenshot Naming Convention

Use:

```text
i<NN>-<sequence>-<short-description>.png
```

Examples:

```text
i01-01-mission-start.png
i01-02-assignment-entry.png
i01-03-confusing-plan-state.png
i01-04-mission-complete.png
```

### Observation File

Record observations in:

```text
observations-i<NN>.md
```

For example:

```text
observations-i01.md
```

Each observation should identify:

- what the persona was attempting to do;
- what was observed;
- why it matters to the persona or mission;
- supporting screenshot(s), where useful; and
- the suggested improvement, if one is warranted.

Observations should distinguish substantive issues from minor or cosmetic comments.

---

## 6. Commit the Development Iteration

After implementation and Playwright evaluation are complete, commit the code and relevant Playwright evidence to Git.

Use a commit message that identifies the feature and development iteration.

### Commit Naming Convention

```text
feat(<feature-slug>): development iteration <N>
```

Example:

```text
feat(assignment-planning): development iteration 1
```

The commit should include:

- implementation changes;
- automated tests associated with the implementation;
- Playwright screenshots intended to be retained;
- Playwright observations; and
- other directly relevant artifacts from the iteration.

The commit establishes the completed state of that development iteration.

---

## 7. Build the Next Feature Specification

If the feature is not complete, or substantive Playwright improvements are identified, create a new feature specification for the next development iteration.

The new specification is derived from:

- the current feature specification;
- the implemented behavior;
- Playwright observations; and
- relevant screenshots.

The new specification should preserve requirements that remain valid while incorporating the improvements justified by the Playwright evaluation.

It should not expand scope merely because additional features are conceivable.

### Derived Feature Specification Naming Convention

Each feature specification should have a stable feature identifier and an iteration number.

Use:

```text
<feature-slug>.i<NN>.md
```

Examples:

```text
assignment-planning.i01.md
assignment-planning.i02.md
assignment-planning.i03.md
```

Every derived specification must explicitly identify its parent specification in front matter:

```yaml
---
feature: assignment-planning
iteration: 2
derived_from: assignment-planning.i01.md
playwright_evidence: docs/playwright/assignment-planning/iteration-01/
---
```

This provides both a standardized filename and explicit specification lineage.

The derived specification becomes the input specification for the next development iteration.

---

## 8. Repeat

Repeat the process beginning at **Step 1 — Analyze the Feature Specification** using the newly derived feature specification.

The next iteration therefore operates on:

```text
Derived Feature Specification
        ↓
Analyze
        ↓
Tag Codebase
        ↓
Build
        ↓
Independent Persona + Mission Evaluation
        ↓
Screenshots + Observations
        ↓
Commit
        ↓
Derived Feature Specification
```

Continue until one of the stopping conditions is reached.

---

# Stopping Conditions

## Stop: Feature Complete

Stop before the three-iteration limit when both conditions are true:

1. the feature described by the current specification is complete; and
2. the Playwright persona and mission evaluation identifies no substantive improvements.

Minor cosmetic preferences or speculative enhancements do not require another iteration.

The process is intended to converge, not to pursue unlimited optimization.

## Stop: Maximum Iterations Reached

Stop after development iteration 3 regardless of whether additional improvements have been identified.

If substantive findings remain, record them as unresolved findings or candidates for future work.

Do not automatically begin a fourth development iteration.

---

# Iteration Traceability

The artifacts from an example three-iteration experiment should provide a clear chain such as:

```text
Feature Specification
assignment-planning.i01.md

Git Tag
dev-assignment-planning-i1-start

Playwright Evidence
docs/playwright/assignment-planning/iteration-01/

Git Commit
feat(assignment-planning): development iteration 1

        ↓ derived from

Feature Specification
assignment-planning.i02.md

Git Tag
dev-assignment-planning-i2-start

Playwright Evidence
docs/playwright/assignment-planning/iteration-02/

Git Commit
feat(assignment-planning): development iteration 2

        ↓ derived from

Feature Specification
assignment-planning.i03.md
```

This traceability makes it possible to reconstruct:

- what Claude was asked to build;
- what code existed before each iteration;
- what was implemented;
- what the Playwright persona actually experienced;
- what evidence drove the next specification; and
- how the feature evolved over the experiment.

---

# Experimental Principle

The central hypothesis of this development process is:

> A feature can be progressively improved by separating specification-driven implementation from persona-and-mission-driven evaluation, then using observed user experience as input to the next bounded development iteration.

The feature specification represents the current design intent.

The Playwright persona and mission provide an independent test of whether that design intent produces a satisfactory user experience.

The next iteration is driven by the difference between the two.
