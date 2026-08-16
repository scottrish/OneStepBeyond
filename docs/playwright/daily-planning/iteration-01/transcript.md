# Transcript — daily-planning-assessment (corrected re-run)

Persona: Alex Carter. Viewport: 390x844 (mobile). Server: http://localhost:5174/
(the previous run against 5173 hit a different, unbuilt app and is invalid —
superseded by this run).

1. Navigated to http://localhost:5174/. Expected to already be authenticated
   per the assessment's starting_point. Instead landed on a "Login" screen
   (Email/Password fields, disabled Sign in/Sign up buttons until filled).
   Filled in playwright-test-student@local.test /
   playwright-local-test-password and clicked "Sign in". Landed on Home:
   heading "Home", buttons "New assignment" and "Settings", text "You are
   logged in as playwright-test-student@local.test".
2. Verification gate: navigated to the "Plan" tab before doing anything
   else. It rendered a real 5-step wizard ("Let's plan today." / day
   picker / "Continue"), NOT the "Planning is coming soon" placeholder seen
   at port 5173 in the invalid prior run. Confirmed safe to proceed.
   Screenshot: 01-plan-tab-today-sunday.png.
3. Noticed the app's "Today" is Sunday, August 16 — the mission describes
   a weekday. Checked Assignments: all four seeded assignments were
   already present ("Cell structure reading" due Aug 17, "Essay draft" due
   Aug 17, "Worksheet 15" due Aug 18, "Reading response — Chapter 10" due
   Aug 20), matching the mission's data exactly. Checked Settings →
   Activities: "Football practice," 3:30 PM–5:30 PM, +15m travel, Mon–Fri
   pressed — also already present. Per the run instructions, did not
   re-add any of this. Screenshot: 02-activities-football-confirmed.png.
4. In character: since "Today" (Sunday) has no football and no due items,
   it doesn't exercise the scenario the mission describes, while tomorrow
   (Monday) does — school day, football practice, two assignments due.
   Decided to use Plan's own day-selector to plan for "Mon," playing this
   as Alex sitting down Sunday night to get ahead of Monday.
5. Selected "Mon" in the day picker. Step 1 updated to "Let's plan
   Monday.", listing "Due: Cell structure reading Biology", "Due: Essay
   draft English Literature", and "Football practice 3:30 PM–5:30 PM",
   with "That leaves about 2h of study time." Screenshot:
   03-plan-step1-monday-overview.png.
6. Tapped "Continue". Step 2 ("What should you work on?") showed: "Nothing
   to plan yet. Break an assignment into steps first, then come back." No
   button or link forward from this screen. Screenshot:
   04-plan-step2-nothing-to-plan-dead-end.png.
7. Left Plan, went to Assignments, opened "Cell structure reading". Detail
   page showed Due/Remaining/"Mark assignment complete" and a "Steps"
   section with only a "Break this down" button (no steps yet). Screenshot:
   05-assignment-detail-no-steps.png.
8. Tapped "Break this down" → 4-screen mini-wizard:
   a. "What are the main pieces you'll need to get done?" — typed "Read
      the chapter", tapped Add.
   b. "How long will each piece take?" — selected 45m.
   c. "Does this look like how you want to tackle it?" — "Read the chapter
      · 45m", "About 45m total" — tapped "Looks good".
   Landed back on assignment detail: Remaining now "45m of work left · you
   estimated 45m in total", Steps list showing "Read the chapter · 45m"
   with a disabled "not yet complete" checkbox. Screenshots:
   06-break-down-flow-start.png, 07-breakdown-one-piece-added.png,
   08-breakdown-time-estimate.png, 09-breakdown-confirm.png,
   10-cell-structure-steps-added.png.
9. Back to Assignments, opened "Essay draft" (1.5h, no steps). Tapped
   "Break this down". Added two pieces: "Outline" and "Write draft".
   Estimated Outline = 30m, Write draft = 1h ("About 1.5h total").
   Screenshot: 11-essay-breakdown-two-pieces.png. Tapped "Looks good".
10. Returned to the Plan tab. It had reset entirely: day picker back on
    "Today" (Sunday), step back to 1 of 5 — the earlier "Mon" selection
    and progress were gone. Re-selected "Mon".
11. Step 1 for Monday again showed the same due items/football summary.
    Tapped "Continue". Step 2 now listed three selectable step-items:
    "Read the chapter" (Cell structure reading · Biology · Due tomorrow ·
    45m), "Outline" (Essay draft · English Literature · Due tomorrow ·
    30m), "Write draft" (Essay draft · English Literature · Due tomorrow ·
    1h). Screenshot: 12-plan-step2-what-to-work-on.png.
12. Selected all three (2h15m total vs. ~2h available — deliberately
    testing the over-capacity path). "Next: estimate time" became enabled.
    Screenshot: 13-plan-step2-all-selected-overcapacity.png.
13. Step 3 ("How long do you think these will take?") showed each step
    with -/+ time controls, "Selected: 2h 15m", and the message "This is
    15m more than you have that day. That is worth knowing now rather than
    at 10pm." — informative, non-blocking; "Next: when" remained enabled.
    Screenshot: 14-plan-step3-time-overcapacity-message.png.
14. Tapped "Decrease" once on "Write draft" (1h → 55m) to test the
    adjuster. Total live-updated to "2h 10m" and the message to "This is
    10m more than you have that day." Left it at 2h10m (small overage,
    matching how Alex would realistically not fuss over 10 minutes) and
    tapped "Next: when". Screenshot: 15-plan-step3-adjusted-time.png.
15. Step 4 ("When will you do them?") showed each step defaulted to a
    suggested time after football practice, sequentially: "Read the
    chapter" at 5:45 PM (radio "After football practice · 5:45 PM",
    checked), "Outline" at 6:30 PM, "Write draft" at 7:00 PM (custom-time
    text fields pre-filled, editable). Tapped "Next: review" without
    changing anything — the suggested sequence looked reasonable.
    Screenshot: 16-plan-step4-suggested-times.png.
16. Step 5 ("Your plan for Monday, August 17") showed a clean numbered
    list: 1. Read the chapter 5:45 PM · 45m, 2. Outline 6:30 PM · 30m,
    3. Write draft 7:00 PM · 55m, with "2h 10m planned of 2h available."
    and buttons "Adjust" / "Looks good". Screenshot:
    17-plan-step5-review.png.
17. Tapped "Looks good". Result: "Plan confirmed. 2h 10m planned for
    Monday. You can come back anytime to adjust it." with a "Plan another
    day" button. Screenshot: 18-plan-confirmed.png.
18. Navigated to Home to see whether it now reflected the confirmed plan.
    It did not — identical to before any planning (heading, "New
    assignment"/"Settings" buttons, static login-status line).
19. Navigated back to Plan, re-selected "Mon" to verify the plan actually
    persisted (rather than trusting the confirmation screen alone). Step 1
    now showed a new "Already planned" section listing all three steps
    with their scheduled times and a "Remove ... from Monday's plan"
    button each, and "That leaves about 0m of study time." — confirming
    the plan was durably saved. Screenshot:
    19-plan-monday-persisted-with-already-planned.png.
20. Mission's completion_condition reached: a confirmed plan for Monday
    exists (with a conscious decision not to also plan "Worksheet 15" or
    "Reading response — Chapter 10," both due later and already over
    Monday's capacity), and a clear opinion had formed on speed and
    trustworthiness. Stopped here.

Elapsed interaction: the 5-step Plan wizard itself, once both assignments
already had steps, was fast — well under two minutes of taps. Getting both
assignments to that starting condition first (two separate "Break this
down" flows, ~15 additional taps/screens total) was the dominant cost and
is very unlikely to read as "well under five minutes" to a first-time user
under the persona's stated patience constraints.
