# Feature: Home Dashboard & Navigation Shell

**Status:** Implemented (2026-08-17), merged to `main` as Phase 5. The
"Navigation" section (bottom tab bar, header Settings list) shipped
earlier in Phase 1. The rest of the UX Flow — Next card, Today's plan
summary, Needs Attention, Today's activities, Coming up — is now built
and tested against this spec's Acceptance Criteria, composing Daily
Planning, Risk Detection, and Activities data as designed. UX Flow item 7
(the Ownership note) is the one deliberate exception — deferred by
product-owner direction (2026-08-17), see Explicitly Out of Scope below.
Two correctness fixes landed after the initial build: the Next card now
shows a calm all-done confirmation (reusing Today Execution's own copy)
instead of the "no plan" empty state once every session for the day is
complete, and the "Today's plan: N tasks" summary no longer lingers once
everything it describes is finished.

## Summary

The student's landing screen and the app shell around every other student
screen. Must answer *"What should I do next?"* within about five seconds
(Product-Vision.md's Primary Goal; V1 spec's Screen 1 purpose), and nothing
else on this increment competes with that.

## Source

Prototype: `src/routes/index.tsx`, `src/components/efc/AppShell.tsx`.

## User Story

As a student opening the app between classes or after school, I want to
instantly know the one thing I should do next, without scrolling past
things that don't matter right now.

## Navigation

Bottom tab bar, three destinations only (validated in the prototype's
v1.1 iteration, down from an original five-item nav that included a
standalone Today, Calendar, and Profile):

- **Home** (this feature)
- **Plan** — see [daily-planning.md](daily-planning.md); Week Look-Ahead
  lives inside it, not as its own tab.
- **Assignments** — see [assignment-management.md](assignment-management.md).

Today's execution ([today-execution.md](today-execution.md)) is reached
from Home's "Next" card or from confirming a plan for today — it is not a
nav destination, since Home already represents "what's happening today."

The header's gear icon opens a small **Settings** surface rather than
going straight to any one screen — it lists [Activities](activities.md),
[Courses](course-setup.md), and Sign Out. None of these are daily
destinations, so none belong in the tab bar, but there are now enough of
them that the icon needs to open a short list rather than jump straight to
Activities as in the prototype (which had no course management or real
auth to account for).

## UX Flow

Content order, top to bottom (preserve exactly — this hierarchy is the
whole point of the screen):

1. **Header** — date, "Hi {first name}." greeting, small quiet icon
   buttons for Add Assignment (+) and Settings (gear, see Navigation above)
   — sized and placed so neither competes visually with the primary action
   below.
2. **Next** — the single largest, most prominent element on the screen: a
   solid-color card showing the next not-done planned item for today
   (title, course, duration) and one primary CTA, **"Start"** (not "Start
   work" — context already makes it obvious). If nothing is planned for
   today, this becomes an empty state inviting planning instead: "No plan
   for today yet. Planning takes about five minutes and makes the rest of
   the day easier." → "Plan today."
3. **Today's plan summary** (only shown if there's a plan) — one line:
   "Today's plan: about {X} · {N} tasks · View plan," contextualized
   against the next Activity when relevant ("...before football"). Never
   phrased as "work left" (framing remaining homework as debt).
4. **Needs Attention** (only shown if something qualifies — see
   [risk-detection.md](risk-detection.md)) — at most **one** item, the
   most urgent, with its specific action.
5. **Today's activities** (only shown if any exist today) — simple list,
   name + time range.
6. **Coming up** — the next three distinct open assignments by due date,
   **excluding** whatever is already shown in Needs Attention (never
   duplicate an assignment across both sections). Links to full
   Assignments list. Empty state invites capturing a first assignment.
7. **Ownership note** *(deferred this increment — see Explicitly Out of
   Scope)* — dismissible reminder ("You decide the plan. This app only
   helps you see it clearly.") shown only during onboarding (while the
   student has completed fewer than three planning sessions) and never
   occupying permanent space once the student has internalized the
   product.

## Functional Requirements

- "Coming up" must actively filter out the Needs Attention item, not just
  happen to differ by sort order.
- This screen renders nothing until the student's data has finished
  loading (no flash of empty/wrong state).

## Acceptance Criteria

- A first-time student identifies today's next task within five seconds.
- Exactly one dominant primary action is visible above the fold.
- No assignment ever appears in both Needs Attention and Coming Up
  simultaneously.

## Domain Model Touchpoints

- Composes Commitments, Planning, and Observation/Risk Assessment data;
  introduces no new domain concepts of its own.
- Design-Principles.md Third Principle ("Simplicity at the Edge") and
  Thirteenth Principle ("Design for Calm") apply most directly here.

## Explicitly Out of Scope (this increment)

- Any parent- or coach-facing view (deferred, see
  `docs/decisions/20260813-student-only-first-increment.md`).
- Push notifications (Product-Vision.md Non-Goals).
- Any Profile/Account screen beyond the bare Sign Out entry in Settings —
  Domain-Model.md's Student context eventually owns "Profile" and
  "Preferences" in full, but nothing here builds toward that yet.
- **UX Flow item 7, the Ownership note, including its persisted dismiss
  state.** Deferred per product-owner direction (2026-08-17): not
  integral to the screen's core "what's next" promise, and its FR (a
  dismiss flag persisted per student, surviving past the derived
  "fewer than three planning sessions" threshold) would need a new
  table for a single boolean — more persistence complexity than
  warranted for this increment. The other six UX Flow items are
  unaffected and remain in scope. Revisit once the rest of Home has
  been in front of real students.

## Deviation from the prototype — resolved

The prototype has **no account/settings/sign-out surface anywhere**,
because it mocked authentication entirely. OneStepBeyond already has real
Supabase auth scaffolded (`useAuth.ts`, `LoginPage.tsx`), so a real student
needs somewhere to sign out. Resolved here as a minimal Settings list
(Activities, Courses, Sign Out) behind the existing gear icon — no new nav
destination, no profile screen, nothing beyond what's needed to not be
stuck signed in. This is new UI with no prototype reference, unlike the
rest of this spec, which is why it's called out separately.
