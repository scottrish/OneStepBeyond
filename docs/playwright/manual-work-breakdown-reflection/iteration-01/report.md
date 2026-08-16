# Synthetic Persona Assessment Report

**Assessment:** manual-work-breakdown-reflection-assessment (manual-work-breakdown-reflection, iteration 1)
**Persona:** Alex Carter — 9th grade student, ADHD, high technical
confidence, no prior experience with this application
**Mission:** evaluate-manual-work-breakdown-reflection — turn a big,
vague assignment into a real plan, revise it, and see what happens
afterward
**Date:** 2026-08-16
**Viewport:** Mobile (390×844), Chromium

## Executive Summary

Alex completed the full mission: broke a vague Biology project into
concrete steps, tested both cancelling and confirming a revision to it,
completed it, and answered (then genuinely skipped a follow-up to) the
resulting reflection question. The core "Break this down" flow and the
reflection prompt both work cleanly and match their spec closely. One
real implementation defect surfaced — the exact same bug class as
`assignment-management`'s previously-fixed `FINDING-AM-001`, but on the
Assignments tab this time, meaning that fix was never generalized. Two
more findings are spec-compliant but still genuinely confusing in
practice: raw-minute totals ("150 min") breaking the app's otherwise
consistent h/m formatting, and the assignment's original estimate
silently changing with no on-screen acknowledgment.

## Overall Impression

Confident throughout, with two real dips: rediscovering the tab-bar dead
end (this time on Assignments, not Home), and a moment of doing mental
math when "150 min" appeared instead of a formatted duration. Both
recovered quickly and neither stopped the mission.

## Initial Mental Model

Alex checked the Assignments list first, saw one small assignment and
one vague 3-hour guess, and correctly identified the vague one as the
target before even looking for a "break it down" feature — the mission's
own framing ("the kind of thing where you don't actually know what
'doing it' looks like") matched his own read of the assignment.

## Workflow Narrative

See `transcript.md` for the full in-character walkthrough. Summary: set
up Biology and World History, captured both sample assignments →
Assignments list → opened the Biology project → discovered "Break this
down" under "Steps" → created 3 pieces (with a quick, self-corrected
reorder test) → estimated each → reviewed ("150 min total") → confirmed
→ tapped the bottom-nav "Assignments" tab from inside Detail (no-op,
used "← Back" instead) → reopened the project, added a 4th step,
cancelled (verified nothing changed) → reopened again, added the same
step, confirmed (verified a clean replace, no duplicates) → marked it
complete → answered "I missed a step" → skipped the optional follow-up →
landed on a clean "Completed" screen with all 4 steps checked.

## Working Memory Evolution

| Stage | Alex believes |
|---|---|
| Checking the Assignments list | "The Biology project is the one I don't actually know how to start." |
| Opening the project's Detail screen | "'Break this down' — that's clearly what I want." |
| After creating 3 pieces | "This is quick, nothing's telling me I'm doing it wrong." |
| After confirming | "That saved — I can see exactly what I entered. Wait, my original 3-hour guess is just gone now?" |
| Tapping the Assignments tab from Detail | "Did that seriously just not work? Same thing as before." |
| After cancelling a test edit | "Good — nothing changed just because I typed something and left." |
| After confirming the real revision | "It did exactly what I wanted, no duplicates." |
| After skipping the follow-up reflection | "That's what skip should actually do." |

## Confidence Timeline

High → dips to moderate (assignment-tab dead end) → recovers to high →
brief dip (raw-minutes total) → high through the revision test → ends
high after a clean completion + reflection.

## Positive Observations

- "Break this down" was immediately understood with zero hesitation
  (FINDING-WB-005).
- Cancelling an in-progress edit correctly discarded every change, even
  a real added step (FINDING-WB-006).
- Confirming a revision cleanly replaced the old breakdown — verified
  both on screen and directly against the database: two
  `decomposition_attempts` rows, exactly 4 final `work_items`
  (FINDING-WB-007).
- The reflection follow-up's "Skip" produced no nagging or second
  prompt — a real, working skip (FINDING-WB-008).
- Previously-set step estimates carried forward correctly when
  re-entering the flow to add one more step (FINDING-WB-009).

## Sources of Confusion

- The bottom-nav "Assignments" tab doing nothing while nested in
  Assignment Detail reached from the Assignments list itself
  (FINDING-WB-001) — the same architectural gap already fixed for the
  Home tab, just never generalized.
- "About 150 min total" reading as raw minutes rather than the app's
  usual "1h" / "45m" style (FINDING-WB-002).
- The assignment's estimate changing from "3h" to "150 min" with no
  on-screen explanation of why (FINDING-WB-003).

## Incorrect Assumptions

- Alex assumed the bottom-nav Assignments tab would behave like a
  normal tab bar (always navigate somewhere sensible); it silently
  didn't, from inside a nested Detail screen reached via the list.

## Findings Summary

Nine findings in `findings.yaml`: one implementation defect
(FINDING-WB-001, high severity — reachable on a very common path), two
UX-improvement findings that are spec-compliant but still confusing in
practice (FINDING-WB-002 raw-minute formatting, FINDING-WB-003 silent
estimate change), one low-confidence validation item worth a human
decision (FINDING-WB-004 — can a completed assignment's breakdown still
be edited, and what should that even do), and five positive/preserved-
behaviour findings covering discoverability, draft safety, clean
replace-on-revision, reflection skippability, and estimate persistence
across edits.

## Persona Feedback (in Alex's words)

"Breaking the project down actually helped — I could see the pieces
instead of just '3 hours' staring at me. Cancelling and redoing my
changes worked exactly how I'd want, and skipping the second reflection
question actually skipped it, which I wasn't sure would happen. Two
things bugged me: tapping Assignments in the bottom bar did nothing
while I was already looking at one assignment — I've hit that exact
same dead end before with the Home button — and the total time showing
as '150 min' instead of '2h 30m' made me stop and do math for a second."

## Evaluator Observations

FINDING-WB-001 is the most actionable finding here: it's not a new bug
class, it's the *same* bug (`assignment-management`'s FINDING-AM-001,
fixed via `App.tsx`'s `homeResetKey` remount pattern) recurring on a
second tab because the fix was scoped to "Home" specifically rather than
generalized to "any tab with its own nested internal navigation." Worth
checking whether the Plan tab has (or will eventually have) the same
latent issue once it grows internal navigation of its own.
FINDING-WB-002 and FINDING-WB-003 are both spec-compliant — neither is a
deviation from `manual-work-breakdown-reflection-v0.1.md` — but both are
concrete, reproducible evidence of real friction for exactly the
persona this feature is meant to serve.

## Recommendations

- Fix FINDING-WB-001 by generalizing the `homeResetKey` pattern (or
  extracting a shared "reset this tab's own nested view on repeat tap"
  mechanism) to `AssignmentsPage.tsx`'s own `view` state.
- Give `effortLabel()` a real duration formatter as its fallback instead
  of raw `"{minutes} min"` (FINDING-WB-002) — this will render on most
  real multi-step breakdowns, not just edge cases.
- Consider a lightweight on-screen acknowledgment when a Work Breakdown
  confirmation changes the assignment's estimated effort
  (FINDING-WB-003).
- Decide and document whether editing a completed assignment's Work
  Breakdown should be possible, and if so, what it does to already-
  completed steps (FINDING-WB-004) — currently unspecified either way.

## Human Validation

Recommend a human confirm FINDING-WB-001 firsthand (one-tap repro: open
any assignment directly from the Assignments list, then tap the
Assignments tab) and make a product call on FINDING-WB-004 before it's
either fixed or explicitly deferred.

## Evidence Summary

- `screenshots/i01-01-assignments-list.png` — initial list, both sample
  assignments captured.
- `screenshots/i01-02-project-detail-break-this-down.png` — "Break this
  down" discoverability moment.
- `screenshots/i01-03-step1-create-pieces.png` — three pieces created,
  reordered and restored.
- `screenshots/i01-04-step3-review-150min.png` — raw-minutes total on
  the review screen.
- `screenshots/i01-05-confirmed-effort-updated.png` — confirmed
  breakdown; assignment estimate silently changed to 150 min.
- `screenshots/i01-06-assignments-tab-noop.png` — bottom-nav Assignments
  tab no-op from nested Detail.
- `screenshots/i01-07-list-with-progress.png` — list showing step
  progress after returning via Back.
- `screenshots/i01-08-cancel-preserved-original.png` — cancelled edit
  left the original breakdown untouched.
- `screenshots/i01-09-revised-confirmed.png` — clean 4-step replace
  after the real revision.
- `screenshots/i01-10-reflection-question.png` — primary reflection
  question.
- `screenshots/i01-11-completed-with-reflection.png` — final completed
  state after skipping the follow-up.
- `transcript.md` — full in-character walkthrough.
- Database cross-check (psql): two `decomposition_attempts` rows, one
  `reflections` row with `structured_response = "I missed a step"` and
  null free text/adjustment, `assignments.effort_minutes = 165`,
  `completed_at` set — all matching what was observed on screen.
- No console errors observed this run.

```yaml
summary:
  assessment:
    id: manual-work-breakdown-reflection-assessment
    feature: manual-work-breakdown-reflection
    persona: student-alex-carter
  outcome:
    status: completed-with-friction
    completion: true
    final_confidence: high
  findings:
    total: 9
    issues: 4
    positives: 5
    hypotheses: 0
  recommendations:
    implementation_defects: 1
    specification_gaps: 0
    ux_improvements: 2
    validation_items: 1
    preserved_behaviour: 5
  highest_severity: high
  supporting_findings:
    implementation_defects:
      - FINDING-WB-001
    ux_improvements:
      - FINDING-WB-002
      - FINDING-WB-003
    validation_items:
      - FINDING-WB-004
    preserved_behaviour:
      - FINDING-WB-005
      - FINDING-WB-006
      - FINDING-WB-007
      - FINDING-WB-008
      - FINDING-WB-009
```
