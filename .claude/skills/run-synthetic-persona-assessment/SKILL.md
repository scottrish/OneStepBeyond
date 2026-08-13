---
name: run-synthetic-persona-assessment
description: >
  Execute a synthetic persona assessment using Playwright MCP. Read the
  assessment definition, load the referenced persona, mission, protocol,
  findings schema, and feature specification, interact with the application as
  the synthetic persona, and generate assessment artifacts without modifying
  application code.
---

# Run Synthetic Persona Assessment

## Purpose

Execute a synthetic persona assessment of an application feature from the
perspective of a defined synthetic persona.

This is not a functional or regression test. The objective is to evaluate the
feature through the eyes of the specified persona and produce evidence-based
feedback grounded in observable interaction.

## Inputs

Read in this order:

1. CLAUDE.md
2. Assessment definition (entry point)
3. Persona definition
4. Mission definition
5. Assessment protocol
6. Findings schema
7. Existing feature specification

Read the feature specifications referenced by the assessment.

If a primary specification is defined, treat it as the authoritative
description of the feature under assessment.

Read all supporting specifications to understand:

- prerequisite behavior;
- related workflows;
- authorization rules;
- shared terminology;
- downstream interactions.

When multiple specifications describe overlapping behavior, identify any
conflicts or ambiguities rather than resolving them silently.

Resolve referenced files relative to the assessment.

## Browser Interaction

Use Playwright MCP.

Authentication is infrastructure only and is not part of the assessment unless
explicitly stated.

Interact only through the visible user interface.

Do not inspect:

- source code
- browser developer tools
- network requests
- DOM implementation
- database
- application logs

## Persona Behaviour

Remain in character throughout the assessment.

Do not optimize for successful completion.

Optimize for authentic behaviour based on the persona.

Record expectations before significant actions.

Record observations afterwards.

Maintain an evolving working memory representing what the persona currently
believes.

If the persona would realistically stop or seek help, end the assessment.

## Findings

Follow the referenced findings schema.

Generate findings continuously.

Each finding must:

- describe one underlying observation
- distinguish persona observations from evaluator observations
- include evidence
- include severity
- include evaluator confidence
- include recommendation

Preserve stable identifiers from existing findings.yaml where appropriate.

## Evidence

Capture:

- screenshots
- transcript
- working memory
- confidence timeline

Reference evidence from findings.

## Outputs

Generate every output defined by the assessment configuration.

Typical outputs:

- report.md
- findings.yaml
- transcript.md
- working-memory.md
- confidence-timeline.md
- screenshots/

The structured findings file is the authoritative source for findings.

## Assessment Summary

Before completing the assessment, generate a concise machine-readable summary.

Include this summary in both:

- report.md
- findings.yaml

Example structure (illustrative field names only — substitute this
application's own assessment id, feature, and persona):

```yaml
summary:
  assessment:
    id: <assessment-id>
    feature: <feature-name>
    persona: <persona-id>

  outcome:
    status: completed-with-friction
    completion: true
    final_confidence: moderate

  findings:
    total: 8
    issues: 5
    positives: 2
    hypotheses: 1

  recommendations:
    implementation_defects: 2
    specification_gaps: 1
    ux_improvements: 2
    validation_items: 1
    preserved_behaviour: 2

  highest_severity: high

  supporting_findings:
    implementation_defects:
      - FINDING-XX-001
      - FINDING-XX-004
    specification_gaps:
      - FINDING-XX-007
    ux_improvements:
      - FINDING-XX-002
      - FINDING-XX-003
    validation_items:
      - FINDING-XX-009
    preserved_behaviour:
      - FINDING-XX-005
      - FINDING-XX-006
```

Derive the summary directly from the completed findings.

Do not estimate values.

## Human-readable Report

Include:

- Executive Summary
- Overall Impression
- Initial Mental Model
- Workflow Narrative
- Working Memory Evolution
- Confidence Timeline
- Positive Observations
- Sources of Confusion
- Incorrect Assumptions
- Findings Summary
- Persona Feedback
- Evaluator Observations
- Recommendations
- Human Validation
- Evidence Summary

## Restrictions

Do not:

- modify application code
- modify feature specifications
- implement enhancements
- generate regression tests

Assessment only.

## Completion

1. Save all outputs.
2. Verify findings.yaml and report.md describe the same findings.
3. Verify evidence references are valid.
4. Preserve stable finding identifiers.
5. Present a concise completion summary.
