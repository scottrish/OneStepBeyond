# Light/dark choice: saved on the device, applied before the first paint

Date: 2026-09-25

## Context

`appearance-light-dark-v0.1.md` adds an Appearance setting (Match my
device, Light, Dark). The app previously followed the device only, through
a `prefers-color-scheme` media query in `src/index.css`. Two questions
were open: where to keep the choice (A1) and where to put the control
(A2). The product owner chose the recommendations on 2026-09-25.

## Decision

1. **A1 — kept on the device** (`localStorage`, key `osb-appearance`),
   through `src/services/appearanceService.ts`, like every other data
   access. It's the first thing this app keeps in browser storage. It's a
   presentation preference, not planning data, so it isn't in
   `student_preferences`.
2. **Applied before the first paint** by a small inline script in
   `index.html`. It reads the key, works out "Match my device" with
   `matchMedia`, and sets `data-theme` and `color-scheme` on `<html>` and
   the `theme-color` meta tag. `src/lib/appearanceStore.ts` takes over
   once the app loads, and follows device changes while "Match my device"
   is chosen. A test checks that the inline script and the app use the
   same storage key and colours.
3. **One dark colour block**, `:root[data-theme="dark"]`, replacing the
   media query. No component uses `dark:` variants, so nothing else
   changed.
4. **A2 — a sheet** opened from a Settings row, with native radio inputs.
   A choice applies immediately, with no Save button.

## Alternatives considered

- **Saving on the account** (a `student_preferences` column): it follows
  the student across devices, but it can't be known until after sign-in
  and a network load. The app would flash the wrong colours on every
  load, and the login screen couldn't follow it.
- **Keeping the media query and adding an override class:** that
  duplicates the whole dark block, once in the media query and once for
  the class. The inline script already resolves "Match my device", so one
  block is enough.
- **Its own sub-screen:** too much for three options.

## Consequences

- Without JavaScript the app shows light. It's a React app, so that
  doesn't arise in practice.
- The supporter dashboard, which uses the same stylesheet, follows the
  device's saved choice too, though its only control is in the student's
  Settings.
- Tests run on Node 25, whose own `localStorage` global doesn't work
  here, so `src/test/setup.ts` supplies an in-memory one.
