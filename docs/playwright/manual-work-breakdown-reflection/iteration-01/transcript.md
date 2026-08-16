# Transcript — manual-work-breakdown-reflection-assessment (manual-work-breakdown-reflection, iteration 1)

Persona: Alex Carter (student-alex-carter). Mobile viewport (390×844,
Chromium). Authenticated as the fixed local Playwright test account,
returning with prior data already present (two "Book report" assignments
already marked Finished from earlier sessions, one existing "English
Literature" course).

---

**[Setup — courses and assignments]**

*Thinking:* I don't have Biology or World History set up yet, and I need
something real to work with. Let me add those two classes, then log the
two assignments I actually have.

*Action:* Settings → Courses → add "Biology," add "World History" → back
to Home → "+" → capture "Cell structure and function project" (Biology,
due Aug 22, guessed 3h) → "+" → capture "Reading response - Chapter 9"
(World History, due Aug 18, left at the default 30m).

*Observed:* Both captured cleanly, landing on each one's detail screen
right after saving, same as always.

*Reflection:* No surprises here — I already know this part. Confidence:
high.

---

**[Finding the big one]**

*Thinking:* Okay, I've got two things due. The reading response is
small, I know exactly what that looks like. But the cell structure
project — "3 hours" was just a guess, and I genuinely don't know what
"doing it" looks like step by step. Let me see what's on its page.

*Action:* Assignments tab → tap "Cell structure and function project."

*Observed:* Detail screen shows Due, Remaining (3h), a "Mark assignment
complete" button, and a "Steps" section with a single button: "Break
this down."

*Reflection:* That's clearly labeled — I didn't have to guess what it
does. This is exactly the kind of thing I'd want for something this
vague. Confidence: high.

*(Screenshot: i01-02-project-detail-break-this-down.png)*

---

**[Breaking it into pieces]**

*Thinking:* "What are the main pieces you'll need to get done?" — okay,
for a project like this I'd need to actually look up the organelles,
make some kind of diagram or model, and write it up. Let me put those in.

*Action:* Type "Research the organelles" → Add. Type "Make the diagram"
→ Add. Type "Write it up" → Add.

*Observed:* Each one appears as its own row immediately, with up/down
arrows and a delete button. Order is Research → Diagram → Write it up,
which is the order I'd actually do them in.

*Reflection:* Quick, no friction, nothing telling me my pieces are wrong
or too big. Confidence: high.

*Action:* Just to see what it does, tap the up-arrow on "Write it up."

*Observed:* It jumps to position 2, ahead of "Make the diagram" — which
doesn't actually make sense for how I'd do this. I move it back down.

*Reflection:* The reorder itself works exactly like I'd expect — I just
picked a silly order to test it with. Confidence: high.

*(Screenshot: i01-03-step1-create-pieces.png)*

*Action:* Tap "Next."

---

**[Guessing how long each piece takes]**

*Thinking:* "How long will each piece take?" Research feels like a 45
minute thing. The diagram is probably the biggest chunk — an hour.
Writing it up, another 45 minutes.

*Action:* Tap 45m for Research, 1h for the diagram, 45m for writing it
up.

*Observed:* Each piece gets its own row of time buttons, clearly
labeled with which piece I'm estimating. Next lights up once all three
have a pick.

*Reflection:* This didn't feel like a test — more like just filling in
a guess, same as the regular "how long will this take" question I
already know from adding assignments. Confidence: high.

*Action:* Tap "Next."

---

**[Reviewing before committing]**

*Observed:* "Does this look like how you want to tackle it?" — all
three pieces listed with their times, and "About 150 min total" at the
bottom.

*Reflection:* Wait — 150 minutes? I get that that's 2 hours 30 minutes,
but everywhere else in this app effort shows up as "45m" or "1h," not
raw minutes. I had to do the math myself for a second. Small thing, but
it stood out because nothing else in the app makes me do that.
Confidence: still high, just a little bit of friction on that one
number.

*(Screenshot: i01-04-step3-review-150min.png)*

*Action:* Tap "Looks good."

---

**[Back on the assignment — did it actually save?]**

*Observed:* Back on the detail screen. "Remaining: 150 min of work left
· you estimated 150 min in total." The three steps are listed with
checkboxes (greyed out, can't tap them) and their times. My original "3h"
guess is nowhere to be seen anymore.

*Reflection:* Two things here. First — good, it clearly saved, I can see
exactly what I entered. Second — my original 3-hour guess for the whole
project just quietly turned into 2h30 once I broke it down, with nothing
telling me that's what happened or why. I know why, because I just did
the math in my head a second ago, but if I'd walked away and come back
tomorrow I might wonder if the app dropped part of my project.
Confidence: high that it saved correctly, a little uncertain about
whether the numbers are telling a consistent story.

*(Screenshot: i01-05-confirmed-effort-updated.png)*

---

**[Trying to get back to my list — a real dead end]**

*Thinking:* Let me check my other assignment too. I'll just tap
"Assignments" at the bottom since I'm already looking at the tab bar.

*Action:* Tap "Assignments" in the bottom nav.

*Observed:* Nothing happens. Still looking at the same Cell structure
project detail screen. The tab bar shows "Assignments" as already
active — I guess I never actually left that tab, since I got here by
tapping a card in the list, not through Home.

*Reflection:* This is exactly the kind of thing that happened to me
before with the Home tab — tapping a tab I'm already "on" just does
nothing, even though I'm clearly stuck on one specific assignment's
page and want to get back to the list. I used the "← Back" button
instead, which did work. Confidence: dented for a second — genuinely
thought something was broken.

*(Screenshot: i01-06-assignments-tab-noop.png)*

**[Evaluator note: newly discovered instance of the same bug class as
FINDING-AM-001, on the Assignments tab instead of Home.]**

---

**[Back on the list]**

*Action:* "← Back."

*Observed:* Real Assignments list — "Reading response" and "Cell
structure and function project," the latter now showing "0 of 3 steps
complete · about 150 min left" with what looks like a progress
indicator.

*Reflection:* Good, that's clearly working and shows real progress
info, not just a flat number. Confidence: high again.

*(Screenshot: i01-07-list-with-progress.png)*

---

**[Changing my mind — testing whether I actually can]**

*Thinking:* Thinking about it more, I bet my teacher wants me to check
my work against the rubric before I turn it in — I almost forgot that
part. Let me see if I can go back and add that.

*Action:* Open the Cell structure project again → tap "Edit breakdown."

*Observed:* Same three pieces, pre-filled, editable — not starting over
from scratch.

*Action:* Type "Check it against the rubric," tap Add. It shows up as a
fourth step.

*Reflection:* Actually, let me back all the way out first and make sure
it didn't just add itself for real without me confirming — I want to
see what happens if I just leave.

*Action:* Tap "← Cancel."

*Observed:* Back on the detail screen — still only the original three
steps, still 150 min. The fourth step I typed is completely gone, like
I never touched it.

*Reflection:* That's reassuring — nothing changed just because I typed
something and wandered off. I trust this more now. Confidence: high.

*(Screenshot: i01-08-cancel-preserved-original.png)*

*Action:* Tap "Edit breakdown" again, re-add "Check it against the
rubric," tap Next.

*Observed:* My three original estimates (45m, 1h, 45m) are still set
from before — only the new step needs a time. I pick 15m for it.

*Action:* Next → review shows all four steps, "About 165 min total" →
tap "Looks good."

*Observed:* Detail screen now shows all four steps, "165 min of work
left · you estimated 165 min in total." No leftover duplicate steps,
no trace of the version I cancelled earlier.

*Reflection:* This is exactly what I wanted — I changed my mind, tried
it, backed out safely once, then actually went through with it, and it
did the right thing both times. Confidence: high.

*(Screenshot: i01-09-revised-confirmed.png)*

---

**[Finishing it]**

*Action:* Tap "Mark assignment complete."

*Observed:* Instead of just marking it done, a new screen appears:
"Did the way you broke this down work?" with tap choices — "The steps
were about right," "Some steps were too big," "I missed a step," "I
made too many steps," "Not sure," "Something else" — plus a "Skip this
question" option.

*Reflection:* Honestly? I did almost miss a step — the rubric check.
That's a real answer, not one I have to make up.

*Action:* Tap "I missed a step."

*(Screenshot: i01-10-reflection-question.png)*

*Observed:* Follow-up: "What would you change next time?" with its own
choices ("Make smaller steps," "Make fewer steps," "Add a step I
missed," "Start earlier," "Nothing," "Something else") and its own Skip
option.

*Thinking:* I already fixed it though — I don't really have anything
else to add. Let me see if Skip actually skips, or if it's going to
guilt-trip me into answering anyway.

*Action:* Tap "Skip this question."

*Observed:* Immediately back on the assignment's detail screen. It says
"Completed," all four steps show as checked and struck through, and
nothing indicates I "failed" to answer the second question.

*Reflection:* That's exactly what I wanted a skip to do — actually
skip, no nagging, no second prompt asking if I'm sure. Confidence:
high, and honestly this whole thing felt less like a chore than I
expected.

*(Screenshot: i01-11-completed-with-reflection.png)*

---

**Mission ended:** the big assignment was broken into real pieces,
revised once (both the cancelled attempt and the confirmed one were
tested), completed, and reflected on with one question answered
honestly and the follow-up genuinely skipped. All parts of the
completion condition were met. Stopping here — further exploration
would only repeat what's already been observed.
