# Synthetic Persona Assessment Report

**Assessment:** initial-setup-assessment (assignment-capture, iteration 1)
**Persona:** Alex Carter — 9th grade student, ADHD, high technical
confidence, no prior experience with this application
**Mission:** evaluate-initial-setup — discover and use course + assignment
creation
**Date:** 2026-08-14
**Viewport:** Mobile (390×844), Chromium

## Executive Summary

Alex completed the full mission: created three courses, then captured a
real assignment (course, title, due date, effort estimate) in a single
smooth pass with zero errors. The capture form itself has no findings
worth acting on — it worked. The one real friction point is that after
saving, the assignment vanishes from view everywhere except the detail
screen just shown; Home and Courses both look untouched. This is expected
and by design (a future feature's job, not this one's), but it's worth
recording as genuine, observed friction rather than assuming it away.

## Overall Impression

Confident and fast through the entire capture flow — the smoothest
assessment run so far. The one dip in confidence came only after saving,
when Alex went looking for confirmation that the assignment "stuck"
somewhere persistent and found none.

## Initial Mental Model

Home now shows two icons (gear, "+") instead of one. Alex correctly read
"+" as "add something new" on the first try, without hesitating between
the two options.

## Workflow Narrative

See `transcript.md` for the full in-character walkthrough. Summary: Home
→ "+" → (no courses yet) → "Add a course" → Courses → add three courses →
back to Home → "+" → full capture form → fill in Algebra I / "Worksheet
12" / default due date / 45m → Save → detail screen confirms everything
entered → back to Home (no trace) → check Courses (no trace either) →
mission complete.

## Working Memory Evolution

| Stage | Alex believes |
|---|---|
| Landing on Home | "Plus button is probably 'add something.'" |
| After tapping + with no courses | "Makes sense, I need a class first." |
| After adding 3 courses | "Easy, no problems." |
| On the full capture form | "This has everything I need." |
| After Save | "That's exactly what I entered — looks like it worked." |
| Back on Home | "Wait, I don't see it anywhere now. Did it save?" |

## Confidence Timeline

Moderate → High → High → High → **High, then dips to moderate** after
the post-save check finds no trace anywhere else.

## Positive Observations

- The capture form's defaults (due date pre-filled to tomorrow, 30m
  effort pre-selected) meant Alex never had to fill in something he
  didn't have an opinion about yet — he only touched the fields he
  actually wanted to set (FINDING-AC-001).
- Course and effort chips read unambiguously as "pick one" — no accidental
  double-selection, no confusion about current state (FINDING-AC-002).
- The "+"/gear pairing was immediately legible (FINDING-AC-003).
- Reaching the capture form with zero courses didn't dead-end — a clear
  explanation plus a direct path to fix it (FINDING-AC-004).

## Sources of Confusion

- Nothing during the capture flow itself.
- Post-save: no visible trace of the new assignment on Home or Courses
  (FINDING-AC-005) — not a defect in what was built, but a real,
  observed moment of doubt for the persona.

## Incorrect Assumptions

None — Alex's expectations at each step matched what he found.

## Findings Summary

Five findings in `findings.yaml`: four positive/preserved-behaviour
observations (capture form quality, chip semantics, "+" discoverability,
zero-courses redirect) and one specification-gap finding
(FINDING-AC-005) about post-save visibility — explicitly scoped as
out-of-scope for `assignment-capture.md` itself (it depends on
`assignment-management.md` and `home-dashboard.md`, both unbuilt, both
already on the Roadmap) and kept at low severity so it doesn't drive
another capture-specific iteration.

## Persona Feedback (in Alex's words)

"Adding the assignment itself was easy — picked my class, typed the
worksheet name, picked a time guess, done. But right after, I went back
to the home screen and it's like nothing happened — no sign of it
anywhere. I'd probably trust it saved since I did see it right after, but
I'd have no idea how to find it again later if I needed to check the due
date or something."

## Evaluator Observations

Zero implementation defects this run — a real contrast with course-setup's
first iteration, and a direct result of applying that iteration's lessons
up front (the migration shipped with its GRANT from the start, error
handling already follows the in-page pattern). FINDING-AC-005 is the
expected shape of the scope decision made during Step 1 analysis
("increment — building the full capture form... deferring the Assignments
list, Home 'Coming up' integration... to assignment-management.md") — it
isn't a surprise, but it's still worth having independent persona
evidence that the deferred gap is felt exactly where predicted, not
somewhere else.

## Recommendations

None for `assignment-capture.md` itself. FINDING-AC-005 is a strong,
concrete argument for prioritizing `assignment-management.md` (at least a
basic Assignments list) soon — Roadmap Phase 2 already sequences it
immediately after this feature, which this assessment now has direct
evidence supporting.

## Human Validation

None required based on this iteration's evidence — capture works
end-to-end against a fresh local stack with no defects.

## Evidence Summary

- `screenshots/i01-01-home-initial.png` — Home before any action.
- `screenshots/i01-02-new-assignment-empty-courses.png` — "+" tapped
  before any course exists.
- `screenshots/i01-03-three-courses.png` — after adding all three sample
  courses.
- `screenshots/i01-04-capture-form.png` — full capture form with courses
  available.
- `screenshots/i01-05-assignment-detail.png` — detail screen shown
  immediately after Save.
- `screenshots/i01-06-home-after-save.png` — Home after returning, no
  trace of the new assignment.
- `screenshots/i01-07-courses-check.png` — Courses screen checked too,
  same result.
- `transcript.md` — full in-character walkthrough.
- No console errors or alert dialogs observed this run.

```yaml
summary:
  assessment:
    id: initial-setup-assessment
    feature: assignment-capture
    persona: student-alex-carter
  outcome:
    status: completed
    completion: true
    final_confidence: high-with-one-doubt
  findings:
    total: 5
    issues: 0
    positives: 4
    hypotheses: 0
  recommendations:
    implementation_defects: 0
    specification_gaps: 1
    ux_improvements: 0
    validation_items: 0
    preserved_behaviour: 4
  highest_severity: low
  supporting_findings:
    specification_gaps:
      - FINDING-AC-005
    preserved_behaviour:
      - FINDING-AC-001
      - FINDING-AC-002
      - FINDING-AC-003
      - FINDING-AC-004
```
