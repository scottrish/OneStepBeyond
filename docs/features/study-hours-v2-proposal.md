# Feature: Study Hours — Split Saturday/Sunday Budgets (v2 proposal)

**Status:** Proposed, not yet approved. Produced from a prototype-sync
audit of `../OneStepBeyondPrototype` (baseline commit `834368f`; `main`
HEAD `744026a`; re-synced 2026-09-24 against the unmerged
`mobile-redesign` branch at `1ce3145`, whose only change to this screen
is larger stepper buttons — see §1). `src/routes/study-hours.tsx` is a new
prototype screen (120 lines); `student-preferences.md` explicitly said no
prototype route existed to match against at the time it was written.

**How to read this document:** UX/behavior/copy evidence only, per
`daily-planning-and-completion-v2-proposal.md`'s note on the prototype's
status as a localStorage-backed mock, not code to port.

## Summary

`student-preferences.md` resolved (2026-08-17) on a single weekend-hours
budget applied to any Saturday or Sunday, plus a fixed protected-minutes
subtraction shared with the weekday formula. The prototype has since
built a genuinely different, more granular model: independent Saturday
and Sunday hour budgets, a tap-based stepper instead of free-text entry,
different default values, and (separately) a capacity formula that no
longer subtracts a protected-minutes block on either weekday or weekend.
This document proposes the model change and flags the protected-minutes
question for explicit resolution rather than silent adoption.

## Source

Prototype: `src/routes/study-hours.tsx`, `src/lib/domain/types.ts`
(`StudyHours`), `src/lib/domain/seed.ts` (`DEFAULT_STUDY_HOURS`),
`src/lib/domain/derive.ts` (`availableMinutes`, `studySlots`).

## Current production behavior (for contrast)

`src/pages/PreferencesPage.tsx` (already titled "Study hours," reached
from Settings exactly where the prototype's new screen also lives — no
navigation change needed either way): one free-text `time` input for
`weekdayFinishTime`, one free-text decimal `Input` for a single
`weekendHours` value applied to either weekend day. `src/domain/
studyCapacity.ts`: `PROTECTED_MINUTES = 90`, subtracted from both
weekday and weekend availability.

## 1. Independent Saturday and Sunday budgets

**What the prototype now does:** `StudyHours` becomes `{ weekdayDoneBy:
string, saturdayHours: number, sundayHours: number }` — two separate
numbers, not one shared value. Each is edited with a stepper card (label,
a live "{N} hour(s)" / "No study time" description, −/+ buttons),
clamped to [0, 8] in 0.5-hour increments, saving immediately per tap (no
separate Save step — matching this app's existing "no confirm step"
precedent on this same screen). Defaults: Saturday 2 hours, Sunday 3
hours (5 total) — a materially different default budget from this app's
current single 10-hour weekend default, not just a reshaping of the same
number.

**Relationship to the existing design principle:**
`student-preferences.md`'s "weekends are not a special case" principle
argues weekday and weekend study time must both be first-class,
independently configured values, never one derived from the other. A
Saturday/Sunday split is the same argument applied one level further,
not a contradiction of it — a student with Saturday-morning practice and
a free Sunday is exactly the kind of "normal case, not an edge case" that
principle already names for weekday-vs-weekend. Recommend treating this
as an extension warranting the same kind of explicit, dated resolution
the original weekday/weekend split got, not a default-yes.

**Functional Requirements:**
- Replace the single weekend-hours field with two independent fields,
  Saturday and Sunday, each a stepper (not free text) clamped [0, 8] in
  0.5 steps. The −/+ buttons are 44×44 px (`size-11`, per
  `mobile-redesign`; `main` had 36 px), with accessible names "Less time
  on {day}" / "More time on {day}". **Two improvements beyond the
  prototype**, which clamps silently and announces nothing: disable −
  at 0 and + at 8, and put the "{N} hour(s)" / "No study time" text in
  a polite live region. Without that, a screen-reader user gets no
  feedback when they tap.
- Weekday's "done by" time field is unchanged in shape (a `time` input);
  only whether it's renamed from `weekdayFinishTime` to `weekdayDoneBy`
  is a naming question for implementation, not a behavior change —
  both already mean the same thing ("study should be finished by this
  clock time on a school night").
- Existing saved preferences with only a single `weekendHours` value need
  a read-time migration: apply that same value to both Saturday and
  Sunday until the student changes either (avoids silently resetting
  every existing student's weekend budget to the new 2+3 default).

**Acceptance Criteria:**
- A student can set different hour budgets for Saturday and Sunday
  independently; each saves immediately on change.
- Each stepper button is at least 44×44 px and has a distinct accessible
  name. The − button is disabled at 0 and the + button at 8.
- A student who has already set a single weekend-hours value sees that
  same number for both days until they change one.
- Planning capacity for a Saturday uses only `saturdayHours`; for a
  Sunday, only `sundayHours` — never a combined or averaged figure.

## 2. Open question: `studySlots`'s weekend behavior is inconsistent even within the prototype

**Flag, not a proposal.** The prototype's `availableMinutes` (capacity)
correctly uses the new per-day hours budget for weekends. Its
`studySlots` (the function generating suggested time-of-day chips for
the Schedule step) does **not** — it still generates chips from a fixed
10:00–20:00 weekend window, regardless of the chosen hours budget. This
app's own current, deliberate decision (`student-preferences.md`,
2026-08-17) is that weekend `studySlots` returns **no** suggested chips
at all, since a bare hours budget has no clock-time anchor to carve
chips from, and the Schedule step already falls back to manual time
entry with no gap in the UI. **Recommend keeping this app's existing "no
weekend chips" behavior** rather than adopting the prototype's
inconsistent fixed-window chips — the prototype's own capacity/chips
mismatch looks like an artifact of an incomplete refactor, not a
deliberate design worth porting.

## 3. Resolve: does the protected-minutes buffer survive this change?

**Flag, not a proposal — must be resolved explicitly, not silently.**
This app's current formula subtracts a fixed `PROTECTED_MINUTES = 90`
from both weekday and weekend availability, cited directly to Design-
Principles.md's Eighth Principle, "Protect What Matters." The
prototype's new formula:

- **Weekday:** no explicit protected-minutes subtraction — the
  configurable "done by" time is the only boundary. Arguably the
  protection is now implicit in that boundary rather than a separate
  buffer subtracted from it, which may be an acceptable reframing.
- **Weekend:** no protected-minutes subtraction of any kind — the chosen
  hours budget, minus activities, is the full available time. This is
  not a reframing; it's the buffer being dropped with no replacement.

**Recommend one of two explicit resolutions**, decided by whoever owns
Design-Principles.md's Eighth Principle, not assumed by this document:

(a) **Keep `PROTECTED_MINUTES`** subtracted from both weekday and
weekend availability exactly as today, treating the "done by" time and
the Saturday/Sunday hours budgets as the *window*, not the *net
available time* — the same relationship the current formula already
has. This is the smaller change: only the weekend model's shape (budget
vs. window) changes, the protection stays.

(b) **Retire `PROTECTED_MINUTES` as a separate constant**, on the
reasoning that a configurable "done by" time and a configurable
Saturday/Sunday budget are themselves already the protection — the
student is choosing how much time to give up, so a further silent
subtraction on top is redundant rather than protective. This is the
larger change and needs explicit sign-off against the named design
principle, not an implementation-time judgment call.

This app's existing tests (`src/domain/studyCapacity.test.ts`) encode
option (a)'s current behavior exactly (`availableMinutes(...) ===
total - PROTECTED_MINUTES`) — whichever resolution is chosen, those
tests are the concrete acceptance check to update or preserve.

## Domain Model Touchpoints

- `Preferences` (or equivalent): `weekendHours: number` → `saturdayHours:
  number, sundayHours: number`; `weekdayFinishTime` possibly renamed to
  `weekdayDoneBy` (naming only).
- `src/domain/studyCapacity.ts`'s `availableMinutes` gains a day-of-week
  branch for which weekend value to use, and needs the resolution from
  §3 above before implementation.

## Explicitly Out of Scope (this proposal)

- Any change to the weekday start-time being fixed (unconfigurable) —
  unchanged from `student-preferences.md`'s existing, still-current
  decision.
- Adopting the prototype's fixed-window weekend `studySlots` chips — see
  §2; explicitly recommend against.
- The prototype Settings screen's dev-only reset affordances, reached
  from the same navigational area as this feature — not proposed here.
