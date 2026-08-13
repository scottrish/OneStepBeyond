---
name: generate-requirements-from-persona-assessment
description: >
  Analyze a synthetic persona assessment and generate an enhancement
  requirements specification from findings.yaml. Distinguish implementation
  defects, specification gaps, UX improvements, and validation items.
---

# Generate Requirements from Synthetic Persona Assessment

## Purpose

Convert the results of a synthetic persona assessment into one or more proposed
product enhancements.

Do not assume every finding becomes a new requirement.

Determine whether each finding represents:

- an implementation defect;
- a specification gap;
- a UX improvement opportunity;
- a finding requiring human validation; or
- positive behaviour that should be preserved.

Generate a requirements specification that is evidence-based and fully
traceable to the assessment.

## Inputs

Read the following in order:

1. CLAUDE.md
2. findings.yaml
3. report.md (if present)
4. Existing feature specification
5. Project requirements template

Treat findings.yaml as the authoritative assessment artifact.

Use report.md only for supporting narrative.

Do not invent findings that are not represented in findings.yaml.

## Phase 1 – Review Findings

Review every finding independently.

Capture:

- identifier
- title
- category
- workflow stage
- severity
- evaluator confidence
- status
- persona observation
- evaluator observation
- expected behaviour
- observed behaviour
- recommendation
- evidence

Preserve all stable identifiers.

## Phase 2 – Determine Disposition

Assign exactly one disposition to every finding.

### Implementation Defect

The implementation fails to satisfy an approved requirement.

Output:
- Recommend a bug fix.
- Identify the requirement that was violated.
- Do not generate a new requirement.

### Specification Gap

The implementation satisfies the specification but the specification is
incomplete.

Output:
- Generate new requirements.

### UX Improvement

Neither the implementation nor specification is incorrect.

The assessment suggests an opportunity to improve the experience.

Output:
- Generate enhancement requirements.

### Human Validation Required

Evidence is insufficient.

Output:
- Create a validation recommendation.
- Do not generate requirements.

### Preserve

Positive behaviour that should remain unchanged.

Output:
- Generate design constraints rather than new functionality.

Explain the reasoning behind every disposition.

## Phase 3 – Consolidate Product Problems

Group related findings into coherent product problems.

Do not generate one requirement per finding.

Each product problem should include:

- summary
- affected users
- impact
- supporting findings

## Phase 4 – Review Existing Specification

Compare every product problem against the existing specification.

Determine whether it is:

- Existing Requirement
- Missing Requirement
- Ambiguous Requirement
- Out of Scope

## Phase 5 – Generate Requirement Candidates

Generate requirement candidates only for:

- specification gaps
- approved UX improvements

Do not generate requirements for implementation defects.

Reference all supporting finding identifiers.

## Phase 6 – Generate Enhancement Specification

Create a new feature specification.

Do not overwrite the existing specification.

Include:

# Goal

# Background

Summarize assessment evidence.

# Users

# Functional Requirements

Organize requirements by product problem.

Reference supporting findings for every requirement.

# Design Constraints

Capture positive findings that should be preserved.

# Non-functional Requirements

# Acceptance Criteria

Acceptance criteria must be observable and independently verifiable.

Avoid subjective language such as:

- intuitive
- user-friendly
- obvious

Describe observable behaviour instead.

# Out of Scope

# Assumptions

# Open Questions

# Human Validation Recommendations

# Evidence Traceability

Include a table (using this assessment's own finding identifiers):

| Requirement | Supporting Findings |
|-------------|---------------------|
| FR-1 | FINDING-XX-001, FINDING-XX-003 |

## Quality Rules

Every requirement must:

- be traceable to findings;
- describe observable behaviour;
- avoid implementation details;
- avoid duplicating existing requirements;
- preserve authorization boundaries;
- identify affected users.

Implementation defects must be reported separately from enhancement
requirements.

## Completion

Before writing the specification produce:

1. Assessment Summary
2. Finding Dispositions
3. Product Problems

Then generate the enhancement requirements specification.

Finally report:

- specification filename;
- implementation defects;
- new requirements;
- design constraints;
- validation recommendations;
- open questions.
