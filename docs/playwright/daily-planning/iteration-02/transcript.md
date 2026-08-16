# Transcript — Daily Planning Assessment (Iteration 2)

Persona: Alex Carter (student-alex-carter)
Mission: evaluate-daily-planning
Date: 2026-08-16
Viewport: 390x844 (mobile)

This is a re-run against a newer build. The account already has seed data
from iteration 1: Football practice (Mon-Fri, 3:30-5:30pm), three courses,
four assignments, two assignments already broken into steps ("Cell
structure reading," "Essay draft"), and a previously-confirmed Monday plan.
Nothing was re-added; everything below re-checks it through the UI as Alex
himself would, picking up where he left off.

---

## 1. Landing on Home

**Expectation before action:** I'm supposed to already be logged in. Let's
see what's here.

**Observed:** Landed directly on Home — "You are logged in as
playwright-test-student@local.test," a "New assignment" button, a
"Settings" button, and the bottom nav (Home / Plan / Assignments). No login
screen this time.

**After:** That's what I expected. Confidence: high, no surprises yet.

*(screenshot: i02-01-home-initial.png)*

---

## 2. Checking Assignments first

**Expectation:** Before I let the app tell me what to do, let me make sure
my stuff from before is still there.

**Observed:** Four assignments, exactly what I remembered: Cell structure
reading (Biology, due Aug 17, "About 45m left of 45m planned"), Essay draft
(English Lit, due Aug 17, "0 of 2 steps complete · about 1.5h left"),
Worksheet 15 (Algebra I, due Aug 18, "About 30m left" — no step info),
Reading response — Chapter 10 (English Lit, due Aug 20, "About 30m left" —
no step info).

**After:** Good, nothing's missing. I can already tell Worksheet 15 and the
reading response haven't been broken into steps yet — no step count shown
for them like there is for Essay draft. Confidence: high.

*(screenshot: i02-02-assignments-list.png)*

---

## 3. Checking Settings → Activities

**Expectation:** Let me just double check football is still set up before I
trust the app's schedule math.

**Observed:** Football practice, 3:30 PM–5:30 PM, +15m travel, Mon/Tue/Wed/
Thu/Fri all pressed. Exactly as before.

**After:** Confirmed. Confidence: high.

*(screenshot: i02-03-activities-football-confirmed.png)*

---

## 4. Opening Plan

**Expectation:** This is where I actually get told what to do. Let's see.

**Observed:** "Plan" heading, "Sunday, August 16," a day-picker radiogroup
(Today/Mon/Tue/Wed/Thu), "Step 1 of 5," heading "Let's plan today," "Nothing
else on that day," "That leaves about 8h 30m of study time," and a
"Continue" button. Real wizard, not a placeholder — confirmed before going
further.

**After:** Today (Sunday) is useless for this — no football, nothing due.
I need a real weekday. Confidence: high.

*(screenshot: i02-04-plan-tab-today-sunday.png)*

---

## 5. Selecting Monday

**Expectation:** Monday's the next school day — let's see what's on it.

**Observed:** "Monday, August 17." Due: Cell structure reading, Essay
draft. Football practice 3:30–5:30 PM. An "Already planned" section with
all three steps already scheduled (5:45 PM, 6:30 PM, 7:00 PM) and "That
leaves about 0m of study time."

**After:** Oh — I already planned Monday, apparently, from before. That's
kind of neat that it's still sitting here. But it's fully booked already,
nothing new to decide. Not the day I want for this session. Confidence:
high, mildly surprised it was already fully planned (in a good way — it
remembered).

*(screenshot: i02-05-plan-monday-already-planned.png)*

---

## 6. Selecting Tuesday

**Expectation:** Let's check Tuesday — Worksheet 15 was due Aug 18, and it
didn't have step info on the Assignments screen. This should be a day where
I actually have to decide something.

**Observed:** "Tuesday, August 18." Due: Worksheet 15, Algebra I. Football
practice 3:30–5:30 PM. "That leaves about 2h of study time." No
"Already planned" section — clean day.

**After:** Good, this is exactly what I wanted to test. Continuing.
Confidence: high.

*(screenshot: i02-06-plan-tuesday-overview.png)*

---

## 7. Step 2 — Worksheet 15 is missing

**Expectation:** It should show me Worksheet 15 to pick, since that's what's
due today.

**Observed:** Tapped Continue. Step 2, "What should you work on?" showed
three items: Read the chapter (Cell structure reading), Outline (Essay
draft), Write draft (Essay draft) — all labelled "Due tomorrow." Worksheet
15 was nowhere on the screen. No message explaining why, no dead-end
banner like last time — just... not there.

**After:** Wait, where's my worksheet? That's the one thing actually due
Tuesday and it's not in the list. Did I already do it? Is this broken? I'm
confused — nothing on this screen tells me what's going on. Confidence:
dropped to medium-low.

*(screenshot: i02-07-plan-step2-worksheet15-missing.png)*

---

## 8. Checking Worksheet 15's detail

**Expectation:** Let me go check Worksheet 15 directly and see what's up
with it.

**Observed:** Left Plan, opened Assignments, tapped Worksheet 15. Detail
page: Due August 18, Remaining 30m, "Mark assignment complete" button, a
"Steps" heading with no list under it, and a "Break this down" button.

**After:** Ah — it doesn't have steps yet, same as last time with the other
two. That's presumably why it's not showing up in Plan, but the Plan screen
itself never said so. Confidence: back up to medium-high now that I
understand why, but annoyed it made me go detective-work this out myself.

*(screenshot: i02-08-worksheet15-detail-no-steps.png)*

---

## 9. Breaking Worksheet 15 down

**Expectation:** Fine, let's just do this. It's a worksheet, one piece is
enough.

**Observed:** Tapped "Break this down." Screen 1: "What are the main
pieces you'll need to get done?" Typed "Do the worksheet," tapped Add — it
appeared as an editable step-1 row. Tapped Next.

*(screenshot: i02-09-breakdown-piece-added.png)*

**Screen 2:** "How long will each piece take?" Picked 30m (matches what
Assignments already estimated). Tapped Next.

*(screenshot: i02-10-breakdown-time-estimate.png)*

**Screen 3:** "Does this look like how you want to tackle it?" Showed "Do
the worksheet — 30m," "About 30m total." Tapped "Looks good."

*(screenshot: i02-11-breakdown-confirm.png)*

**Result:** Back on Worksheet 15's detail page. Steps now shows "Do the
worksheet" with a disabled checkbox and "30m." Remaining now reads "30m of
work left · you estimated 30m in total."

**After:** That part was quick — three short screens, no friction.
Confidence: high again.

*(screenshot: i02-12-worksheet15-step-added.png)*

---

## 10. Back to Plan — does it remember where I was?

**Expectation:** Let's see if it kept me on Tuesday, Step 2, or if it reset
like it apparently used to.

**Observed:** Tapped Plan in the bottom nav. Landed on "Tuesday, August 18,"
"Step 2 of 5," "What should you work on?" — same three items as before,
plus a new "Show more assignments" button.

**After:** It remembered! Still Tuesday, still Step 2, exactly where I left
off. That's what I'd expect an app to do. Confidence: high, pleasantly
surprised.

*(screenshot: i02-13-plan-step2-state-preserved-show-more.png)*

---

## 11. Show more assignments

**Expectation:** My worksheet must be behind that "Show more" button.

**Observed:** Tapped it. A fourth item appeared: "Do the worksheet —
Worksheet 15 · Algebra I · Due Tuesday · 30m."

**After:** There it is. A little annoying that the thing actually due today
was hidden behind a second tap while stuff due "tomorrow" (relative to some
other day, not this one) was shown by default — but at least it's there now
that it has steps. Confidence: high.

*(screenshot: i02-14-plan-step2-worksheet15-appears.png)*

---

## 12. Selecting and continuing

**Expectation:** I just want this one thing — nothing else is due today.

**Observed:** Tapped "Do the worksheet." It became selected/pressed, and
"Next: estimate time" became enabled.

*(screenshot: i02-15-plan-step2-worksheet-selected.png)*

Tapped Next. Step 3: "How long do you think these will take?" — "Do the
worksheet," 30m with +/- controls, "Selected: 30m · about 1.5h still
available." Left it as-is.

*(screenshot: i02-16-plan-step3-time-estimate.png)*

Tapped "Next: when." Step 4: "When will you do them?" — "After football
practice · 5:45 PM" pre-selected, with a custom-time textbox alternative.
Left the suggestion as-is.

*(screenshot: i02-17-plan-step4-suggested-time.png)*

Tapped "Next: review." Step 5: "Your plan for Tuesday, August 18" — "1. Do
the worksheet — Worksheet 15 · Algebra I — 5:45 PM · 30m," "30m planned of
2h available." "Adjust" / "Looks good" buttons.

**After:** This part was genuinely fast — pick the one thing, leave the
time, take the suggested slot, review. No typing, no second-guessing.
Confidence: high.

*(screenshot: i02-18-plan-step5-review.png)*

---

## 13. Confirming the plan

**Expectation:** Let's lock it in.

**Observed:** Tapped "Looks good." Screen changed to "Plan confirmed." "30m
planned for Tuesday. You can come back anytime to adjust it." "Plan another
day" button.

**After:** Done. That felt real — a specific step, a specific time, done.
Confidence: high.

*(screenshot: i02-19-plan-confirmed.png)*

---

## 14. Checking Home for any trace of the plan

**Expectation:** Now that I've made a plan, does Home show it?

**Observed:** Tapped Home. Same as the very first screen — heading, "New
assignment"/"Settings" buttons, logged-in-as line. No mention of the plan
anywhere.

**After:** Nothing changed here at all. I'd have expected at least a "You
have a plan for Tuesday" line. Confidence: unchanged, but this is a real gap.

*(screenshot: i02-20-home-no-plan-trace.png)*

---

## 15. Back into Plan — is Tuesday still there?

**Expectation:** Let's make sure the plan actually stuck.

**Observed:** Tapped Plan. Opened on "Tuesday, August 18" (day selection
carried over), Step 1, with a new "Already planned" section: "Do the
worksheet ... 5:45 PM · 30m" and a "Remove ... from Tuesday's plan" button.
"That leaves about 1.5h of study time."

**After:** Good, it's really there, and I can see and undo it if I want.
Confidence: high.

*(screenshot: i02-21-plan-tuesday-persisted-already-planned.png)*

---

## 16. Checking Thursday (curiosity, before wrapping up)

**Expectation:** Let me see what's coming up before I'm done for today.

**Observed:** Selected "Thu." "Thursday, August 20." Due: Reading response —
Chapter 10, English Literature. Football practice. "About 2h of study
time." Tapped Continue. Step 2 showed the same three "due tomorrow" items
as before — Reading response (which also has no steps) was not there.
Tapped "Show more assignments" — a fourth item appeared, but it was "Do the
worksheet · Worksheet 15 · Algebra I · Due Tuesday" (the thing already
scheduled for Tuesday), not Reading response. Tapped it to see what would
happen — it selected normally, with no warning that it was already
committed to Tuesday. Deselected it again without confirming, since I
wouldn't actually want to double-book the same worksheet.

**After:** Two things stood out: the assignment actually due that day
(Reading response) is invisible here for the same reason Worksheet 15 was —
no steps yet — with no explanation on-screen either time. And separately,
something already scheduled for Tuesday just showed up as pickable again
for Thursday with zero warning. Backed out of that one since it's not what
I'd actually do. Confidence: this dropped my trust a bit — it feels like
the "what's actually available to plan" logic isn't quite right yet.

*(screenshots: i02-22-plan-thursday-worksheet-reappears-and-response-missing.png,
i02-23-plan-thursday-deselected.png)*

---

## 17. Wrapping up

**Expectation:** I've got a real plan for Tuesday. That's what I came for.

**Observed:** Checked Assignments one more time — Worksheet 15 now shows
"About 30m left of 30m planned," matching what was confirmed. No stray
duplicate booking left behind from the Thursday probe.

**After:** A workable plan for Tuesday exists: one 30-minute worksheet
after practice, nothing else. Done for today. Confidence at end: moderate —
good on the parts it does well, but the missing-assignment behavior and the
lack of any double-booking warning would make me double-check its output
rather than fully trust it blind.

*(screenshot: i02-24-final-assignments-state.png)*

---

## Session end

Mission completion condition met: reached a confirmed plan for Tuesday, and
formed a clear opinion — fast and trustworthy once an assignment already has
steps, but still capable of quietly hiding the one thing that's actually due
that day, and willing to let you double-book work across days without
saying anything.
