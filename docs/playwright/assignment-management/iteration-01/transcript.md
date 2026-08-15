# Transcript — assignment-management-assessment (assignment-management, iteration 1)

Persona: Alex Carter (student-alex-carter). Mobile viewport (390×844,
Chromium). Authenticated as the fixed local Playwright test account,
fresh (zero courses, zero assignments) at the start of this run.

---

**[Checking Assignments first]**

*Thinking:* I already know this app has a plus button for adding
homework, but the mission is about finding my list of assignments. Let me
check the bottom tab bar — there's an "Assignments" tab, that seems like
the obvious place to look first before I go add anything.

*Action:* Tap "Assignments" in the bottom tab bar.

*Observed:* Empty state: "No assignments yet." / "Tap + on Home to add
your first one." with a "Go to Home" button.

*Reflection:* Makes sense, I don't have anything yet. At least it tells
me exactly where to go instead of just sitting there empty. Confidence:
high, clear next step.

---

**[Adding courses and the first assignment]**

*Thinking:* I don't have any classes set up yet either. Let me go add
those first, then log some real homework.

*Action:* Tap "Go to Home" → "+" → (redirected, no courses) → "Add a
course" → add "Algebra I," "Biology," "English Literature" → back to Home
→ "+".

*Observed:* Full capture form with my three classes as buttons.

*Action:* Tap "Algebra I," type "Worksheet 12," leave the due date at its
default, tap "45m," tap "Save."

*Observed:* Landed on the assignment's detail screen: "Algebra I,"
"Worksheet 12," "Due: August 16, 2026," "Remaining: 45m," a "Mark
assignment complete" button, and a "Steps" section with "Add another
step."

*Reflection:* That's everything I just entered. Feels like it worked.
Confidence: high.

---

**[Trying to get back to Home from here]**

*Thinking:* I want to add my next assignment too. The bottom bar still
shows "Home," "Plan," "Assignments" — let me just tap "Home" since I'm
already looking at the tab bar.

*Action:* Tap "Home" in the bottom tab bar.

*Observed:* Nothing changed. Still looking at "Worksheet 12"'s detail
screen. The "Home" tab in the bar looks selected/active, but the screen
itself didn't move.

*Reflection:* That's weird — it looks like it's telling me I'm on Home,
but I'm clearly not. I tried tapping it again just in case I mis-tapped,
same result. I don't want to get stuck, so let me just use the "← Back"
button at the top instead, since that's always worked before. Confidence:
dented — this felt like a dead end for a second.

*(Screenshot: i01-03-home-tab-noop.png)*

**[Evaluator note: FINDING-AM-001]**

---

**[Second and third assignments]**

*Action:* "← Back" → Home → "+" → select "Biology," type "Cell structure
reading," leave the time estimate at its default (30m), Save.

*Observed:* Detail screen for "Cell structure reading" — Biology, due
August 16, 30m remaining. Worked exactly the same as the first one.

*Action:* "← Back" → Home → "+" → select "English Literature," type
"Essay outline," tap "1h," Save.

*Observed:* Detail screen for "Essay outline" — English Literature, due
August 16, 1h remaining.

*Reflection:* Good, three real assignments logged now, and using "←
Back" instead of the bottom "Home" tab avoided that stuck screen again.
Confidence: high, but I'll remember not to trust that Home tab button
from inside an assignment.

---

**[Finding the assignments list]**

*Thinking:* Now let me actually check the Assignments tab like I meant to
at the start.

*Action:* Tap "Assignments" in the bottom tab bar.

*Observed:* This time it worked fine — a real list: "Worksheet 12" (
Algebra I, due Aug 16, about 45m left), "Cell structure reading" (
Biology, due Aug 16, about 30m left), "Essay outline" (English
Literature, due Aug 16, about 1h left). Each one has small edit and
delete icons off to the side. No progress bars on any of them.

*Reflection:* This is exactly what I wanted — I can see what's due and
roughly how much work is left without opening anything. Confidence:
high.

*(Screenshot: i01-04-assignments-list.png)*

---

**[Opening one and changing something]**

*Action:* Tap directly on the "Worksheet 12" card (not the icons).

*Observed:* Opens the same detail screen as before — course, title, due
date, remaining time, "Mark assignment complete," and Steps.

*Thinking:* Let me change the due date, since that's realistic — my
teacher pushed the deadline back a day.

*Action:* Tap the pencil ("Edit assignment") icon, change the due date
from August 16 to August 17, tap "Save."

*Observed:* Immediately back on the detail view, now showing "Due:
August 17, 2026."

*Reflection:* That was fast and I could see right away that it took my
change. Confidence: high.

---

**[Marking one done]**

*Action:* "← Back" → tap "Cell structure reading" → tap "Mark assignment
complete."

*Observed:* The "Mark assignment complete" button disappeared, replaced
by the word "Completed." The "Remaining" label also changed to
"Estimated time," still showing 30m.

*Reflection:* Clear — no doubt this one's done now. Confidence: high.

*(Screenshot: i01-05-assignment-completed.png)*

*Action:* "← Back" to the list.

*Observed:* "Cell structure reading" is gone from the main list and now
sits under a new "Finished" heading, title crossed out. It's just plain
text now — no edit or delete icons next to it.

*Reflection:* Makes sense that it moved out of the way. I didn't try to
tap it since there's nothing left to change on a completed assignment.

---

**[Deleting one I don't need]**

*Thinking:* Let's say I don't need "Essay outline" anymore — maybe the
teacher canceled it. Let me see what it takes to remove it.

*Action:* Tap the trash ("Delete Essay outline") icon on its card.

*Observed:* It vanished immediately — no "are you sure?" screen, no
undo button, nothing. Just gone.

*Reflection:* That was... fast. Faster than I expected, honestly. If I'd
hit that by accident I don't think there'd be any way to get it back.
Kind of nice that it didn't make me confirm something obvious, but also a
little unsettling that there's no safety net at all. Confidence: high
that it worked, lower on whether I'd trust myself not to fat-finger that
button by mistake sometime.

*(Screenshot: i01-06-after-delete.png)*

**[Evaluator note: FINDING-AM-005]**

---

**[Checking out the Steps section]**

*Thinking:* I noticed "Worksheet 12" has this "Add another step" thing.
Let me see what that does — maybe I can break my homework into smaller
pieces and check them off as I go, which is exactly the kind of thing
that would actually help me.

*Action:* Open "Worksheet 12" → "Add another step" → type "Problems
1-10," leave the time at 15m (default) → "Add step."

*Observed:* A new row appears under "Steps": a checkbox, "Problems
1-10," "15m." But the checkbox looks grayed out and I can't tap it. Also
— the "Remaining" number at the top changed from 45m down to 15m, just
because I added that one step.

*Reflection:* Wait, that's confusing. I only broke off one small piece of
the worksheet, but now it's telling me the whole thing only has 15
minutes left, like the other 30 minutes just disappeared. I know the rest
of the worksheet still needs doing. Also I can't even check the step off
— so what's the point of adding it if I can't mark it done from here? I'm
not sure I'd keep using this part of the app; I'd probably just leave
steps alone and stick to the plain remaining-time number on the list.
Confidence: dropped to moderate here — I don't fully trust what
"Remaining" means anymore.

*(Screenshot: i01-07-step-shrinks-remaining.png)*

**[Evaluator note: FINDING-AM-006, FINDING-AM-007]**

---

**Mission ended:** Alex viewed the assignments list, opened an
assignment and edited its due date, marked a different one fully
complete, and deleted a third with no completed steps. All four
mission actions were completed. Stopping here — further exploration of
the Steps/breakdown flow would only re-confirm the read-only-checkbox
behavior already observed, and Alex has already formed a stable (if
mixed) opinion of the feature.
