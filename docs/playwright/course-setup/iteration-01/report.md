# Synthetic Persona Assessment Report

**Assessment:** initial-setup-assessment (iteration 1)
**Persona:** Alex Carter — 9th grade student, ADHD, high technical
confidence, no prior experience with this application
**Mission:** evaluate-initial-setup — discover and use course + assignment
creation
**Date:** 2026-08-14
**Viewport:** Mobile (390×844), Chromium

## Executive Summary

Alex could not complete any part of the mission. Course creation — the
entire scope of what's built so far — fails outright due to a server-side
403 on every request to the `courses` table, and the failure is
communicated to the student as a cryptic `[object Object]` alert rather
than a real message. A secondary defect compounds this: the add-course
form clears itself after a failed save exactly as it would after a
successful one, so there's no reliable signal telling the student the save
didn't happen. Alex tried twice, checked Home to see if it had secretly
worked, and gave up. He never reached assignment creation because no
affordance for it exists yet, and because course creation itself was
never a usable stepping stone.

## Overall Impression

Bad first impression, entirely due to a functional defect rather than a
design problem. The one screen that exists (Courses) is simple, readable,
and the empty-state copy and add-form pattern are reasonable — Alex didn't
express confusion about *what* to do, only about *whether it worked*.

## Initial Mental Model

Home shows only an email confirmation, a gear icon, and Sign out — no
courses, assignments, or "next step" messaging. Alex correctly guessed the
gear was the only path to "set things up," but had nothing to compare it
against (it was the only non-sign-out button available).

## Workflow Narrative

See `transcript.md` for the full in-character walkthrough. Summary:
Home → tap gear → Courses screen (with a flashed, unreadable error) →
type course name → Add course → same unreadable error, form silently
resets, course list still empty → retry once, same result → back to Home
to check → still no evidence of a saved course → abandon.

## Working Memory Evolution

| Stage | Alex believes |
|---|---|
| Landing on Home | "This is the app after logging in. Gear icon must be settings." |
| After first popup | "Something looked broken for a second, but I'm on a Courses page now." |
| After first failed add | "Not sure if that saved. The box cleared but the list still says empty." |
| After second failed add | "This isn't me doing it wrong — the screen itself is broken." |
| After checking Home | "No sign it saved anywhere. I'd stop and ask someone." |

## Confidence Timeline

Moderate → Low → Low → Very low → Very low (abandoned)

## Positive Observations

- The gear icon was found and tapped without hesitation (FINDING-IS-006),
  though this is weak evidence of discoverability since it was the only
  option available.
- The empty-state copy ("No courses yet. Add your first class so you can
  start capturing assignments.") is plain and readable, and the add form
  being immediately visible (per the spec's requirement) meant Alex didn't
  have to hunt for how to add a course.
- The single-field add form ("What's it called?") matched Alex's
  expectation of something quick — he didn't hesitate over what to type.

## Sources of Confusion

- The `[object Object]` alert, appearing twice, with no indication of what
  went wrong or what to do about it.
- The add form clearing itself after a failed submission, which reads
  identically to a successful one.

## Incorrect Assumptions

- Alex initially assumed the popup might be unrelated / a glitch he could
  ignore, and proceeded anyway — a reasonable persona choice that cost him
  a second failed attempt before he trusted that something was actually
  broken.

## Findings Summary

Six findings recorded in `findings.yaml`: four implementation defects
(one high-severity root cause — missing table grants — plus two
compounding UX defects in error handling, and one high-severity but
distinct raw-error-message defect), one specification gap noted for
completeness but out of scope for this feature (no assignment-creation
path exists yet — that's `assignment-capture.md`'s feature), and one
preserved-behaviour/positive observation. See `findings.yaml` for full
detail, evidence, and severity/confidence ratings.

## Persona Feedback (in Alex's words)

"I tried to add my math class and it just... didn't. Some weird error
popped up that didn't say anything useful, and then it looked like it
cleared like it worked but it didn't actually show up. I tried again and
same thing happened. I'd probably just close the app and figure my mom or
somebody would have to help me set it up later, or just not bother."

## Evaluator Observations

The root cause (FINDING-IS-001) is an infrastructure/migration gap, not a
design flaw: RLS policies are correctly scoped, but PostgREST also
requires an explicit `GRANT` to the `authenticated` role, and local
Supabase's `auto_expose_new_tables` default is now off. This wasn't caught
by unit tests (which mock the Supabase client) or by the schema-migration
review (which checks RLS-policy correctness and clone/copy-function
coverage, not GRANT statements) — this assessment is what surfaced it.
The two compounding UX defects (FINDING-IS-002, FINDING-IS-003) are
independent bugs in `useCourses.ts` / `CoursesPage.tsx` that would affect
any future error, not just this one.

## Recommendations

1. Add explicit `GRANT`s for `authenticated` on `public.courses` (or
   re-enable `auto_expose_new_tables`) — this alone would very likely have
   let Alex complete the mission's course-creation portion.
2. Fix the error-message fallback in `useCourses.ts` so a Supabase error
   object's `.message` is surfaced instead of `String(error)` producing
   `"[object Object]"`.
3. Only clear the add-course input on confirmed success, not
   unconditionally.
4. Give the initial course-list fetch a distinct error state instead of
   rendering the same empty-state copy as "zero courses."

## Human Validation

Recommend a human confirm, after the fixes above land, that a real course
create/list/rename round-trip works end-to-end against the local stack
before the next persona assessment — the current defects are severe
enough that no UX-level findings beyond error handling could be gathered
this iteration.

## Evidence Summary

- `screenshots/i01-01-home-initial.png` — Home on first load.
- `screenshots/i01-02-courses-after-failed-add.png` — Courses screen after
  a failed add: empty state still showing, input cleared.
- `screenshots/i01-03-home-after-abandon.png` — Home after Alex gave up
  and navigated back.
- `transcript.md` — full in-character walkthrough.
- Console errors (via Playwright MCP `browser_console_messages`): repeated
  `403 (Forbidden)` on `GET`/`POST` to
  `/rest/v1/courses`.

```yaml
summary:
  assessment:
    id: initial-setup-assessment
    feature: course-setup
    persona: student-alex-carter
  outcome:
    status: blocked
    completion: false
    final_confidence: very-low
  findings:
    total: 6
    issues: 4
    positives: 1
    hypotheses: 0
  recommendations:
    implementation_defects: 4
    specification_gaps: 1
    ux_improvements: 0
    validation_items: 0
    preserved_behaviour: 1
  highest_severity: high
  supporting_findings:
    implementation_defects:
      - FINDING-IS-001
      - FINDING-IS-002
      - FINDING-IS-003
      - FINDING-IS-004
    specification_gaps:
      - FINDING-IS-005
    preserved_behaviour:
      - FINDING-IS-006
```
