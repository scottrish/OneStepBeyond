# Transcript — assignment-management-assessment (assignment-management, iteration 2)

Persona: Alex Carter (student-alex-carter). Mobile viewport (390×844,
Chromium). Authenticated as the fixed local Playwright test account,
continuing from iteration 1's data (one open assignment with a step,
one completed assignment). Focus of this pass: verify the three fixes
derived from iteration 1's findings, and check nothing else regressed.

---

**[Re-checking the Home tab dead end — FINDING-AM-001]**

*Thinking:* Last time, capturing a new assignment and then tapping
"Home" in the bottom bar left me stuck looking at the assignment I'd
just added, even though the tab bar said I was on Home. Let me try that
exact sequence again and see if it's still broken.

*Action:* Home → "+" → select "Biology," type "Lab report," Save.

*Observed:* Landed on the "Lab report" detail screen, same as before.

*Action:* Tap "Home" in the bottom tab bar.

*Observed:* This time it actually worked — I'm back on Home's landing
view ("You are logged in as...", the "+" and gear icons), not stuck on
the detail screen anymore.

*Reflection:* That's a real fix. I don't have to remember to use the
back arrow instead anymore — the Home tab does what I'd expect a tab to
do. Confidence: high, relief that this got fixed.

*(Screenshot: i02-01-home-tab-fixed.png)*

---

**[Re-checking the "Remaining" number — FINDING-AM-006 / FR-2]**

*Thinking:* Last time, "Worksheet 12" confused me — I added one step
worth 15 minutes and the "Remaining" number dropped from 45m to 15m with
no explanation, like the rest of the worksheet just vanished. Let me look
at it again.

*Action:* Assignments tab → open "Worksheet 12."

*Observed:* Now it says "15m of work left · you estimated 45m in total"
— both numbers are right there together. Same thing on the Assignments
list itself: "About 15m left of 45m planned."

*Reflection:* That actually makes sense now. I can see it's only counting
the one step I've written down so far, and it's not pretending the rest
of the worksheet doesn't exist anymore. Confidence: high, this cleared up
exactly what confused me before.

---

**[Re-checking instant delete — FINDING-AM-005 / FR-1]**

*Thinking:* Last time, deleting "Essay outline" happened instantly with
zero warning and no way to undo it, which felt risky given how fast I
tap things. Let me delete "Lab report" (the one I just added, no
completed steps) and see if anything's different.

*Action:* Tap the trash icon on "Lab report."

*Observed:* It disappeared from the list right away, same as before —
but this time a message showed up: "'Lab report' deleted." with an
"Undo" button right next to it.

*Reflection:* That's exactly what I wanted last time. If I'd hit that by
accident, I'd have a few seconds to fix it instead of it just being gone.
Confidence: high.

*(Screenshot: i02-02-undo-banner.png)*

*Thinking:* Let me see what happens if I just leave it alone instead of
tapping Undo.

*Action:* Wait without touching anything.

*Observed:* After a few seconds, the "Undo" message went away on its own
and "Lab report" was gone for good — checked by reloading the list, it
didn't come back.

*Reflection:* Makes sense — the undo window isn't forever, which is
fine, I got my chance. Confidence: high, this feels much safer than
before without adding an annoying extra confirmation tap for every
delete.

*(Screenshot: i02-03-delete-committed-after-window.png)*

---

**[General check — nothing else changed]**

*Thinking:* Let me make sure the rest of the app still works the way it
did before — I don't want the fixes to have broken something else.

*Observed:* "Worksheet 12" and "Cell structure reading" (still marked
Finished, still struck through) both look exactly like they did at the
end of last time. Editing, completing, and the plain list view all still
behave the same.

*Reflection:* Nothing else seems to have changed. Confidence: high overall.

---

**Mission ended:** All three fixes derived from iteration 1 verified
working as intended, with no new issues found and no regressions to
previously-working behavior.
