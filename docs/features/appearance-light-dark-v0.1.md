# Feature: Appearance — choose light or dark mode

**Status:** Implemented 2026-09-25
(`docs/decisions/20260925-appearance-on-device.md`). Both decisions were
settled by the product owner: **A1**, the choice is saved on the device;
**A2**, a sheet opens from a Settings row. See "Implementation Notes (as
built)" at the end.

## Summary

Today the app follows the device's own light/dark setting and nothing
else. A student can't pick dark mode on a phone kept in light mode, or
light mode on a laptop that's dark. This adds an **Appearance** choice
in Settings with three options: **Match my device** (the default,
today's behaviour), **Light** and **Dark**. The choice applies straight
away, everywhere in the app, including the login screen and the phone's
status bar in the installed app, without a flash of the wrong colours on
load.

Both colour palettes already exist and have been contrast-checked
(`src/index.css`), so no new colours are needed.

## Source

No prototype screen: `../OneStepBeyondPrototype` defines a `.dark` colour
set (`src/styles.css`) but nothing in it sets that class, so it has no
toggle to match. The UI follows the prototype's Settings list style and
this app's existing `ResponsiveSheet`, per CLAUDE.md's rule for features
without a matching prototype screen.

Earlier specs deliberately left this out:
- `design-system-adoption.md` ("A manual light/dark theme toggle control
  … out of scope");
- `mobile-app-shell-and-touch-ergonomics-v0.1.md` ("A light/dark theme
  toggle").

This spec replaces those deferrals.

## Current behaviour

- `src/index.css` switches every colour token inside
  `@media (prefers-color-scheme: dark)`. No component uses Tailwind's
  `dark:` variant; everything reads the tokens. So one switch point
  changes the whole app.
- `index.html` has two `theme-color` meta tags, one per device scheme
  (`#fbf9f3` light, `#020618` dark). The installed app's status bar uses
  them.
- No `color-scheme` is declared. Native controls (time inputs, the date
  picker, scrollbars) follow the browser default, not the app's colours.

## User Story

As a student, I want to choose whether the app is light or dark, rather
than have it always follow my device, so it's comfortable wherever and
whenever I'm using it.

## Decisions required

**A1. Where is the choice saved?** *Decided 2026-09-25 (product owner):
Option A, on the device.*
- **Option A (chosen): on the device** (browser storage), behind a
  small service in `src/services/` like every other data access.
  - It can be read **before** the app loads or anyone signs in, so the
    first paint (including the login screen) is already the right
    colour. A choice saved on the account can't be known until after
    sign-in and a network load, so a dark-mode student would see a light
    flash every time.
  - Appearance is naturally per device: a phone at night and a school
    laptop in class are different settings.
  - No migration.
- **Option B: on the student's account** (a new `student_preferences`
  column, so a migration). It follows the student across devices, but
  flashes the wrong colours on every load until preferences arrive, and
  can't apply to the login screen.

**A2. Where does the choice live in Settings?** *Decided 2026-09-25
(product owner): Option A, a sheet.*
- **Option A (chosen): an "Appearance" row that opens a sheet**
  (`ResponsiveSheet`) with the three choices. It's one small decision,
  the same pattern as Plan's edit sheet.
- **Option B: its own sub-screen**, like Activities or Study hours.
  That's more navigation for three options.

## UX Flow

- Settings gains a row, **Appearance**. Its description is the current
  choice ("Match my device", "Light" or "Dark"), using the same row style
  (icon, title, one-line description, chevron) as Activities, Courses,
  Study hours and Support.
- Tapping it opens a sheet titled **"Appearance"**, with a group of three
  options:
  - **Match my device** — *"Light or dark, following your phone or
    computer."*
  - **Light**
  - **Dark**
- Choosing an option applies it **immediately**: the colours change while
  the sheet is still open, so the student sees the result. The choice is
  saved. There's no Save button, the same as Study hours
  (`docs/decisions/20260925-split-weekend-study-hours.md`, S1). Closing
  the sheet keeps whatever is selected.
- Under **Match my device**, the app keeps following the device,
  including when the device switches (for example, automatic dark mode
  at sunset) while the app is open.

## Functional Requirements

- **Default:** Match my device. A student who never opens Appearance
  sees exactly today's behaviour.
- **Applies everywhere the app renders:** every student screen, sheets
  and menus, the login screen, and the supporter dashboard on the same
  device.
- **No flash of the wrong colours:** the saved choice is applied before
  the first paint, by a tiny inline script in `index.html` that sets an
  attribute on `<html>` before any CSS-dependent content shows. If
  nothing is saved (or storage is blocked), it falls back to Match my
  device.
- **The installed app's status bar** (`theme-color`) and **native
  controls** (`color-scheme`: time inputs, pickers, scrollbars) follow
  the chosen scheme, not the device's.
- **Storage failure** (private browsing, blocked storage): the choice
  still applies for the current visit and falls back to Match my device
  next time. There's no error, since it's a comfort setting.

## Accessibility

- The three options are a radio group (`role="radiogroup"`, each option
  `role="radio"` with `aria-checked`, or native radio inputs). The group
  is labelled "Appearance". Arrow keys move between options, and the
  focus ring is visible in both schemes.
- Each option is at least 48 px tall, with text that wraps, matching the
  other sheets.
- Both palettes already meet WCAG 2.2 AA text contrast (the dark
  destructive colour was fixed on 2026-09-25). No new colour pairs are
  introduced. The implementation should still spot-check the Settings
  row and sheet in both schemes.

## Implementation Notes (for `analyze-feature` to confirm)

- **CSS:** move the dark token block from the media query to a selector
  that the attribute controls. For example, the inline script always sets
  `data-theme="light"` or `"dark"` on `<html>` (working out "Match my
  device" with `matchMedia`), and the CSS has just `:root` (light) and
  `:root[data-theme="dark"]`. That keeps a single dark block rather than
  duplicating it for the media query. Add `color-scheme` alongside.
- **One small module** owns reading, saving and applying (a service for
  storage, plus a pure `resolveScheme(choice, deviceIsDark)` in
  `src/domain/`). The inline script uses the same storage key, and a test
  keeps the two in step.
- **Listening:** under Match my device, a `matchMedia("(prefers-color-scheme:
  dark)")` change listener re-applies the scheme.
- **`theme-color`:** replace the two media-query meta tags with one tag
  whose content the same code sets, or keep both and update their
  `content`. Either way the installed app's status bar matches the
  chosen scheme.
- **Not needed:** a new component library, Tailwind `dark:` variants, or
  new colour tokens.

## Acceptance Criteria

- Settings shows an **Appearance** row whose description is the current
  choice. It opens a sheet with Match my device, Light and Dark.
- Choosing **Dark** turns the whole app dark immediately, on a device
  set to light, and it stays dark after a reload. **Light** does the
  reverse on a dark device.
- **Match my device** follows the device, including a change made while
  the app is open.
- With a saved choice, a reload shows the right colours from the first
  paint, including on the login screen, with no flash of the other
  scheme.
- The installed app's status bar colour and native form controls match
  the chosen scheme.
- A student who never chooses sees exactly today's behaviour.
- If storage is unavailable, choosing still works for the current visit,
  with no error.
- Keyboard: the options can be reached and chosen with arrow keys and
  Space. A screen reader announces them as a group of three with the
  current one checked.
- No horizontal overflow at 320 px. The sheet's options are at least
  48 px tall.

## Testing Notes

- **Unit:** `resolveScheme` (each choice × device light/dark); the
  storage service (save, read, read with storage throwing).
- **Component:** the Settings row's description; the sheet's radio group
  (choosing applies the attribute on `<html>` and saves); Match my device
  reacting to a mocked `matchMedia` change.
- **Real browser:** reload with each choice (first paint correct, no
  flash); emulate device dark/light with each choice; the installed-app
  status bar colour (the `theme-color` meta content); screenshots of
  Settings, a sheet and Plan in both schemes at 320 px.

## Domain Model Touchpoints

None. This is a presentation preference, not part of the student's
planning data. Under A1 option A it isn't stored with the Domain Model's
Preferences (Study hours) at all.

## Explicitly Out of Scope

- Syncing the choice across devices (A1 option B, not chosen).
- A schedule (for example, dark after 9 PM) or any automatic switching
  other than following the device.
- More themes, a high-contrast mode, or font-size settings.
- A different choice for different screens.
- Changing any colour values.

## Implementation Notes (as built, 2026-09-25)

- **Files:**
  - `src/domain/appearance.ts`: the choices, `resolveScheme`, and the
    status-bar colours;
  - `src/services/appearanceService.ts`: browser storage, key
    `osb-appearance`; it never throws;
  - `src/lib/appearanceStore.ts`: applies the choice and follows the
    device;
  - `src/hooks/useAppearance.ts`;
  - the Appearance row and sheet in `SettingsPage.tsx`, using native
    radio inputs;
  - the inline script and a single `theme-color` tag in `index.html`;
  - `:root[data-theme="dark"]` and `color-scheme` in `src/index.css`.
- **Tests:** a unit test checks that `index.html`'s inline script uses
  the same storage key and status-bar colours as the app.
  `src/test/setup.ts` supplies an in-memory `localStorage`, because Node
  25's own global doesn't work in this test environment.
- **Verified in a real browser** (Chromium, 320 px), 16 checks:
  - the first paint is correct for every mix of device setting and saved
    choice, including the login screen, and the status-bar colour
    matches;
  - choosing Dark applies at once, even with the sheet open, and survives
    a reload;
  - native controls follow the choice;
  - "Match my device" follows the device when it changes while the app is
    open;
  - options are at least 48 px tall, with no overflow.
- **What you may see:** when the scheme changes while the sheet is open,
  the sheet's own background fades over about half a second (its
  existing transition). That's expected, not a stuck colour.
