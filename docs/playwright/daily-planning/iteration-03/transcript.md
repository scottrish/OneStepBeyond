# Assessment Transcript — Daily Planning, Iteration 3

Persona: Alex Carter. Mobile viewport (390x844). Server: http://localhost:5174/.

## 1. Landing

Navigated to http://localhost:5174/. Landed pre-authenticated on Home
directly (unlike iteration 1, which hit a login screen first). Home shows
the same bare heading, "New assignment"/"Settings" buttons, and
logged-in-as line as every prior iteration.

*What I think this page is:* Home base — nothing new here since last
time. *What I should do next:* go to Plan, same as always.

## 2. Opening Plan

Tapped "Plan." Landed on "Today" (Sunday, August 16) — the same
football-free day every prior iteration's clock also landed on. Shows
"Nothing else on that day... 8h 30m of study time" and names "Reading
response — Chapter 10" as needing to be broken into steps.

*Observation:* the account clearly carried forward everything from
iterations 1 and 2 — same outstanding assignment, same phrasing.

## 3. Selecting Wednesday

Tapped "Wed" in the day picker. Header updated to "Wednesday, August 19."
Day step shows:
- "Reading response — Chapter 10" still needing breakdown, with a
  "Break down..." button.
- "Football practice — 3:30 PM–5:30 PM."
- "That leaves about 2h of study time."

Tapped "Continue."

## 4. Select step — the mixed case

Step 2 of 5, "What should you work on?" Shows:
- The breakdown notice for "Reading response — Chapter 10" (unchanged
  wording from the Day step).
- Three real candidates: "Read the chapter" (Cell structure reading),
  "Outline" (Essay draft), "Write draft" (Essay draft) — each tagged
  "Already planned for Monday."

*This is the exact scenario iteration 2 got wrong* — real candidates
present, but an un-broken-down assignment silently missing with no
explanation. This time it's named and linked, right alongside the real
list. Confidence rising.

Tapped "Show more assignments." A fourth candidate, "Do the worksheet"
(Worksheet 15), appeared, tagged "Already planned for Tuesday."

*(screenshot: i03-05-select-already-planned-warning.png)*

## 5. Testing the double-booking warning

Tapped "Do the worksheet" to select it. It selected normally — "Next:
estimate time" became enabled, not blocked. Confirms the warning is
informative, not gating.

Tapped it again to deselect (didn't want to actually double-book it for
real).

## 6. Using the breakdown link

Tapped "Break down 'Reading response — Chapter 10'." Landed in the
familiar 3-step breakdown flow ("What are the main pieces you'll need to
get done?"). Added one piece: "Read Chapter 10." Estimated it at 30m.
Reviewed ("About 30m total") and tapped "Looks good."

## 7. Returned to Select, same step

Landed back on Select (Step 2 of 5), still on Wednesday — not reset to
Today/Step 1. The four pre-existing candidates were unchanged, and "Read
Chapter 10" now appeared as a fifth candidate with no "Already planned"
tag (correct — it has no prior commitment).

*(screenshot: i03-06-select-mixed-case-and-new-candidate.png)*

## 8. Completing Wednesday's plan

Selected "Read Chapter 10." Advanced through Estimate (kept default 30m;
"Selected: 30m · about 1.5h still available"), Schedule (accepted the
suggested "After football practice · 5:45 PM"), and Confirm ("Your plan
for Wednesday, August 19" — 1 item, 5:45 PM, 30m; "30m planned of 2h
available"). Tapped "Looks good."

Result: "Plan confirmed. 30m planned for Wednesday. You can come back
anytime to adjust it."

*(screenshot: i03-07-plan-confirmed-wednesday.png)*

## 9. Regression check — Monday

Tapped "Mon" in the day picker. Iteration 1's plan was intact: "Read the
chapter" (5:45 PM, 45m), "Outline" (6:30 PM, 30m), "Write draft" (7:00
PM, 55m), all under "Already planned," remaining capacity "about 0m." No
data loss.

## 10. The gap — Thursday

Tapped "Thu." Day step: "Reading response — Chapter 10" due, football
correct, "about 2h of study time" (the breakdown notice no longer shows,
since it now has steps). Tapped "Continue."

Select step: the four original candidates still correctly tagged
("Already planned for Monday"/"Tuesday"). Tapped "Show more" — "Read
Chapter 10" (the item just confirmed for Wednesday one step ago)
appeared as a plain, *unwarned* candidate — no "Already planned for
Wednesday" tag.

*Expected the same warning treatment as every other item. Did not get
it.* Confidence dipped slightly.

*(screenshot: i03-08-thursday-missing-warning-for-just-confirmed-wednesday-item.png)*

## 11. Evaluator cross-check

Switched from persona voice to evaluator voice for one verification step
(not part of Alex's own in-character interaction): queried the local
database directly to confirm whether a session actually existed for
"Read Chapter 10" on Wednesday. Confirmed: a `work_sessions` row exists
for that work item, dated 2026-08-19, status `planned`. The data is
correct — the UI's warning simply didn't pick it up, most likely because
the "all sessions" fetch backing the warning only runs once when the
page first loads, not after a new plan is confirmed later in the same
visit.

## 12. Ending the session

Mission complete: reached a confirmed plan for Wednesday, exercised both
of this iteration's fixes directly, found one working correctly (mixed
candidates) and one partially working (already-scheduled warning — correct
for pre-existing data, stale for same-session commitments). Confidence:
high overall, tempered by the one gap found.
