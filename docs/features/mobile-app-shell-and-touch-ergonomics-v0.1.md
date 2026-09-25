# Feature: Mobile App Shell & Touch Ergonomics

**Status:** Proposed, not yet approved. Produced 2026-09-24 from a
prototype-sync audit of `../OneStepBeyondPrototype`'s unmerged
`mobile-redesign` branch (`1ce3145`, 44 commits on top of `main`'s
`744026a`). Re-check against the prototype's `main` once that branch
merges.

**How to read this document:** the prototype is a Lovable-built,
localStorage-backed mock. It's read here as evidence of UX, behavior,
and copy only, the same way the other v2 proposals read it
(`daily-planning-and-completion-v2-proposal.md`). This spec is a
presentation and navigation increment. It changes no domain rules.

## Summary

The prototype's `mobile-redesign` branch reworks the student app around
familiar phone patterns: a safe-area-aware shell, a quick-add button in
the tab bar, secondary destinations behind a "More" menu, sticky action
bars that keep the main action in thumb reach, bottom sheets in place of
inline panels and centered modals, and a consistent minimum of 44–48 px
for touch targets. This spec covers that **shared chrome** once, so the
feature specs that use it (Plan, Today coaching, Assignments, Courses)
can refer to it instead of each re-specifying it. It also delivers
**PWA phase 1** (§7): the app becomes installable and runs standalone
from the home screen, with no service worker
(`docs/decisions/20260924-pwa-in-two-phases.md`).

Two related concerns have their own documents:
- Drag-to-reorder and swipe-to-remove: `mobile-gestures-reorder-and-swipe-v0.1.md`.
- Plan and Today behavior changes: `daily-planning-and-completion-v2-proposal.md`
  and `execution-coaching-v0.1.md`.

## Source

Prototype (`mobile-redesign`): `src/components/efc/AppShell.tsx`,
`src/components/efc/MobileSurface.tsx` (`MobileActionBar`,
`ResponsiveSheet`), `src/components/ui/{button,input,textarea,sheet}.tsx`,
`src/styles.css`, `src/routes/__root.tsx`, and the route files for Home,
Plan, Today, Assignments, Assignment capture, Settings, Study hours,
Activities, and Courses. Stated intent:
`.lovable/plan/mobile-first-student-app-redesign-2026-09-24.md` and
`roadmap.md`.

## Current production behavior (for contrast)

- `src/components/AppShell.tsx`: a bottom tab bar (Home / Plan /
  Assignments) with `aria-current`. Content is a fixed 420 px column
  with a drop shadow at every width. No safe-area padding. Uses
  `min-h-screen`, not dynamic viewport height. Tab labels are 11 px.
- `index.html` already has `viewport-fit=cover`.
- Home header: "New assignment" (+) and "Settings" icon buttons.
  Assignment capture, Settings, Courses, Activities, Study hours, and
  Support are all **sub-views of `HomePage`** (`view` state), not
  reachable from any other tab.
- `Button`: `default`/`icon` already raised to 44 px. `sm` is 32 px and
  `lg` is 40 px. `Input` is 36 px with `md:text-sm`, which drops below
  16 px and triggers iOS zoom-on-focus. Focus rings are 1 px.
- Confirmations are inline in-card panels. The app has no bottom sheets
  or dropdown menus, and no Radix Dialog or DropdownMenu installed.
- Assignment rows show two stacked icon buttons, Edit and Delete.

## 1. Student shell

- **Viewport and safe areas.** The shell uses dynamic viewport height
  (`min-h-dvh`). The content column pads for `env(safe-area-inset-top)`,
  and the tab bar pads for `env(safe-area-inset-bottom)`, so nothing sits
  under a notch or the home indicator. `body` gets `min-width: 320px`
  and `overscroll-behavior-y: none`.
- **Phone layout (below `sm:`):** full-width content with 20 px side
  gutters. The fixed 420 px "phone floating in the middle" column with
  its shadow goes away.
- **Tablet/desktop (`sm:`/`lg:`):** content stays a readable single
  column, max `2xl` (672 px), with 32–40 px gutters. At `lg:` it sits in
  a bordered frame, max `5xl`, over a muted page background. Controls
  aren't stretched to fill the width. The prototype's plan note mentions
  an "optional contextual side panel" on desktop, but the branch doesn't
  build one. Out of scope.
- **Tab bar:** the same three destinations. Each tab is at least 64 px
  tall, with a 12 px label (up from 11 px) and an inset 3 px focus ring.
  Keep this app's `aria-current="page"` (the prototype omits it) and its
  existing re-tap-resets-tab behavior (`App.tsx` `handleTabChange`).
- **A fourth, trailing tab-bar slot that changes by breakpoint:**
  - **Phones:** a raised, circular, 48 px **"Add assignment"** quick-add
    button (primary color, `Plus` icon, a ring in the background color,
    lifted 12 px above the bar). It opens Assignment capture from any
    tab.
  - **`sm:` and up:** a 44 px **"Settings"** icon button in place of
    quick-add. Home's header shows its own + button at this width
    instead (§2).

**Architectural consequence: needs a decision record before
implementing.** Today, capture and Settings can only be reached from
inside `HomePage`'s own `view` state. A tab-bar button that opens them
from Plan or Assignments needs them lifted to `App.tsx` as global
overlays. That's the same pattern already used for Assignment Detail
and Today Execution (`docs/decisions/20260817-assignment-detail-global-overlay.md`,
`20260816-today-execution-interim-entry-point.md`). Recommend that
pattern over introducing React Router. CLAUDE.md says to add the router
only when a feature needs it, and this one doesn't. Capture's `onSaved`
already opens Detail, so it fits the overlay model.

## 2. Home header

- Date eyebrow and greeting, unchanged. The header becomes a
  `minmax(0,1fr) auto` grid, so a long name truncates instead of pushing
  the buttons off-screen.
- **Phones:** the + button is hidden, because the tab bar's quick-add
  replaces it. **`sm:` and up:** it's shown at 44 px.
- The standalone Settings icon is replaced by a 44 px **"More options"**
  (`MoreHorizontal`) overflow menu at every width, with two items, each
  at least 44 px tall: **People who support you** (opens Support) and
  **Settings**. Today Support can only be reached through Settings, so
  this adds a second, shorter route to it.
- Home's hero cards (Next / Working on, Needs attention) use the same
  16 px card radius as the rest of the app (`rounded-2xl`, down from
  `rounded-3xl`) and slightly tighter padding on phones.

## 3. Shared mobile primitives

Add these as reusable components under `src/components/`. They're the
only new UI primitives this spec introduces.

**`ResponsiveSheet`**: the one surface for secondary decisions and
confirmations.
- Below `sm:`: a **bottom sheet**. Rounded top corners, a decorative
  grab handle, max height 88% of the dynamic viewport with internal
  scrolling, and bottom padding that includes the safe-area inset.
- At `sm:` and up: a **centered dialog**, max width `md` (448 px), all
  corners rounded.
- Required `title` (rendered as the dialog's accessible name, in the
  display font) and optional `description` (the accessible description).
- A 44 px circular close button. The backdrop uses the foreground color
  at 45% with a small blur, replacing black at 80%.
- Focus trapped while open, Escape closes it, and focus returns to the
  element that opened it. Built on the shadcn `Sheet` (Radix Dialog)
  primitive.
- **Closing the sheet by any route** (backdrop, Escape, close button,
  swipe down) is a *cancel*. Each caller defines what cancel means;
  `execution-coaching-v0.1.md` has one case where cancel records a
  dismissal.

**`MobileActionBar`**: sticky primary actions.
- Sticks to the bottom of the scrolling content, positioned *above* the
  tab bar (offset = tab bar height + safe-area inset), with a translucent
  background, a top border, and a backdrop blur.
- Full-bleed on phones. At `sm:` and up, a bordered, rounded card within
  the content column.
- Holds one to three buttons in a row. The primary action is the widest
  (`flex-1`), and Back / Adjust / Done are ghost buttons beside it.
- Content must keep enough bottom padding that the last row of the list
  is never permanently hidden behind the bar (WCAG 2.4.11, Focus Not
  Obscured).

**Overflow menu**: the shadcn `DropdownMenu` (Radix), with 44 px items,
aligned to the trigger's end edge. The trigger is a 44 px ghost icon
button whose accessible name includes the row: "Actions for {title}",
"More actions for {label}", "More options".

**Dependencies:** this adds the shadcn `Sheet` and `DropdownMenu`
primitives (Radix Dialog and DropdownMenu). `design-system-adoption.md`
deferred every primitive beyond Button/Input/Label until a feature
needed it, and this feature does. Nothing else is added.

## 4. Where the primitives apply

| Screen | Change |
|---|---|
| Plan wizard | Each step's buttons move into a `MobileActionBar`: Select "Next: estimate time"; Estimate Back / "Next: when"; Schedule Back / "Next: review"; Confirm "Adjust" / "Looks good". The "Step N of 4" label moves from a line above the step into a pill beside the page title. |
| Plan existing-day view | "Add more work" / "Done" in a `MobileActionBar`. Per-session edit sheet (`daily-planning-and-completion-v2-proposal.md` items 2 and 10). |
| Plan Schedule step | The suggested-time chips become one horizontally scrollable row (no wrapping), each chip at least 44 px tall. The manual time input is 44 px tall with 16 px text. |
| Plan Estimate step | −/+ steppers at 44 px (were 32 px). |
| Today Execution | Friction picker, intervention, own first action, and repair become `ResponsiveSheet`s (`execution-coaching-v0.1.md`, "Presentation"). Completion decisions stay full-screen. |
| Assignment capture | "Save assignment" in a `MobileActionBar`. Course and effort chips at least 44 px tall. |
| Assignments list | Each row's two stacked icon buttons become one **"Actions for {title}"** overflow menu (Edit, Delete). The rest of the card stays the tap target that opens Detail. The bottom "Add assignment" button is shown only when the list isn't empty; the empty state has its own action. |
| Settings | Each destination (Activities, Courses, Study hours, People who support you) is a full-width row at least 64 px tall: icon, title, one-line description, trailing chevron, with the title and description truncating safely. This app already has all four destinations plus Sign out, so only the presentation changes. |
| Any future centered modal | Use `ResponsiveSheet`. This app has no centered modals today; its confirmations are inline, and they stay inline unless a feature spec says otherwise. |

## 5. Touch targets, inputs, and focus

CLAUDE.md already requires 44×44 px targets. This section says how the
shared primitives meet that rule, so individual screens don't each
decide.

- **Buttons:** `default` at least 44 px (already), `icon` at least
  44×44 (already), `lg` at least 48 px. `sm` rises from 32 px to at
  least 44 px. The prototype's `sm:` breakpoint shrinks `default` to
  40 px and `sm` to 36 px. **Don't copy that shrink.** Larger screens
  can still be touch devices (tablets), and CLAUDE.md doesn't exempt
  them.
- **Chips and toggles:** effort presets, course pickers, time chips,
  activity day toggles, and color swatches are all at least 44×44 px.
  The prototype's saved-activity day toggles are 40 px; use 44.
- **Inputs:** at least 48 px tall on phones and 44 px from `sm:`, with
  **16 px text at every width**. That means removing `md:text-sm`, which
  stops iOS from zooming on focus. Textarea at least 96 px tall. Use
  native `type="date"` / `type="time"` and the right `inputMode` for
  numbers.
- **Focus ring:** 3 px, replacing today's 1 px. The prototype uses the
  ring token at 40% opacity. **Check it against WCAG 1.4.11 (3:1
  non-text contrast) on both the background and card surfaces before
  adopting that opacity.** If it fails, use the ring token at full
  opacity, keeping the 3 px width.
- **Dense rows:** any row that has fixed trailing actions uses a
  `minmax(0,1fr) auto` grid (or `min-w-0` plus `truncate` on the text),
  so long titles truncate and the actions stay put.
- **Page titles** scale with the viewport: `clamp(1.65rem, 7vw, 2.1rem)`.

## 6. Motion

- A global `prefers-reduced-motion: reduce` rule brings animation and
  transition durations close to zero and turns off smooth scrolling.
- Sheet entry, swipe-row settling, and tab changes use short, restrained
  transitions. None of them carry information that's only conveyed by
  the motion.

## 7. Installable app (PWA phase 1)

Phase 1 of `docs/decisions/20260924-pwa-in-two-phases.md`. The app
becomes installable to the home screen and runs standalone, with **no
service worker and no offline behavior**.

- **Manifest** (`public/manifest.webmanifest`, linked from
  `index.html`): `name` "One Step Beyond", `short_name` "OneStep",
  one-line `description`, `start_url` "/", `scope` "/", `display`
  "standalone", `background_color` from the `--background` token, and
  `theme_color` from the `--primary` token. Use the tokens' actual
  resolved values. Don't reuse the prototype's hex values unless they
  match this app's tokens.
- **Icons:** PNG at 192×192 and 512×512 (`purpose: "any"`), a separate
  512×512 `purpose: "maskable"` icon with its artwork inside the central
  80% safe zone, and a 180×180 `apple-touch-icon` linked from
  `index.html`. **Draft icons exist in `public/icons/`, pending product
  approval of the mark** (two rising steps, then an arrow set one step
  beyond them, in cream `#fdfcf7` on primary teal `#337670`):
  `icon-192.png` and `icon-512.png` (rounded, transparent corners;
  `purpose: "any"`), `icon-maskable-512.png` (full-bleed, mark inside
  the safe zone), and `apple-touch-icon.png` (180 px, opaque). The
  editable SVG masters sit next to them. If the mark changes, edit the
  SVGs and re-render the PNGs. `public/favicon.svg` is still Vite's
  default logo. Replace it with `icons/icon.svg` in this same increment.
- **Meta tags** in `index.html`: `theme-color` (light and dark variants
  via `media`, matching the `prefers-color-scheme` tokens),
  `apple-mobile-web-app-capable` "yes",
  `apple-mobile-web-app-status-bar-style` "default", and
  `apple-mobile-web-app-title` "OneStep". `viewport-fit=cover` is
  already present.
- **Standalone behavior:** §1's safe-area padding is what keeps content
  clear of the status bar and home indicator when there is no browser
  chrome. Test standalone mode as the primary case, not an afterthought.
- **Explicitly not in this phase:** a service worker (not even a no-op
  one), caching, an offline page, a custom install prompt or
  `beforeinstallprompt` handling, push notifications, and any
  build plugin (e.g. `vite-plugin-pwa`). A hand-written static manifest
  and icons in `public/` are all this needs.

## Acceptance Criteria

- On a 375×812 viewport with safe-area insets (iOS simulator or
  emulated), no content or control sits under the notch or home
  indicator, and the tab bar clears the home indicator.
- On phones, the tab bar shows Home, Plan, Assignments, and a 48 px
  "Add assignment" button that opens capture from any of the three
  tabs. From `sm:` it shows a Settings button in that slot instead, and
  Home's header shows its own + button.
- Home's "More options" menu opens Support and Settings. Every item is
  at least 44 px tall and reachable by keyboard.
- Every Plan wizard step and the existing-day view keep their primary
  action visible above the tab bar without scrolling, at 320 px width,
  and no list row is permanently covered by the bar.
- `ResponsiveSheet` shows as a bottom sheet below 640 px and a centered
  dialog at 640 px and up. It traps focus, closes on Escape and
  backdrop tap, returns focus to its trigger, and exposes its title and
  description as the dialog's accessible name and description.
- Every interactive element in the student app measures at least 44×44
  px at 320, 768, and 1280 px widths. This is checked by an automated
  Playwright pass, not by eye.
- Focusing any text input on iOS Safari doesn't zoom the page (16 px
  computed font size on every input).
- The focus ring meets 3:1 contrast against both background and card
  surfaces.
- With reduced motion turned on, sheets and swipe rows appear without
  animation.
- The student app has no horizontal page scroll at 320 px.
- The coach/parent dashboard (`/dashboard`) is visually unchanged apart
  from the shared `Button`/`Input` size changes, and it stays usable at
  desktop width.
- (§7) Chrome DevTools' Application → Manifest panel reports no
  installability errors, and the app can be installed on Android Chrome
  and desktop Chrome.
- (§7) After "Add to Home Screen" on iOS Safari, the app launches
  standalone with the correct icon and title, and no content or control
  sits under the status bar or home indicator on any student screen.
- (§7) The maskable icon renders uncropped in a maskable-icon preview
  (circle and squircle masks).
- (§7) `navigator.serviceWorker.getRegistrations()` returns an empty
  list, and the Network panel shows no request served from a service
  worker.
- `npm run lint`, `npm run test:run`, and `npm run build` pass.
  Existing tests change only where an accessible name deliberately
  changed (e.g. the Settings icon becoming "More options").

## Testing Notes

- Unit/component: `ResponsiveSheet` (open, close routes, focus return,
  title/description wiring), `MobileActionBar` rendering, Home's "More
  options" menu, and the tab bar's breakpoint-specific trailing slot
  (via matchMedia mocks or class assertions).
- Playwright smoke (`synthetic/`): a target-size audit script at 320,
  768, and 1280 px across Home, Plan (each step), Today, Assignments,
  capture, Settings, Courses, Activities, Study hours, and Support. Run
  it before and after, so the size change shows as a measurable
  difference.
- Manual: iOS Safari for safe areas and focus zoom. Android Chrome for
  the gesture bar.

## Domain Model Touchpoints

None. This is a presentation and navigation change only.

## Explicitly Out of Scope

- **PWA phase 2:** service worker, offline behavior, background sync,
  push notifications, and a custom install prompt. These come after
  prototype parity, in their own spec
  (`docs/decisions/20260924-pwa-in-two-phases.md`). Installable-app
  metadata is now *in* scope; see §7.
- A desktop contextual side panel (mentioned in the prototype's plan
  note, not built).
- Drag-to-reorder and swipe-to-remove: see
  `mobile-gestures-reorder-and-swipe-v0.1.md`.
- Any change to the coach/parent dashboard beyond shared primitive sizes.
- A light/dark theme toggle (unchanged from `design-system-adoption.md`).
- The prototype's dev-only Settings reset tools ("Reset with example
  data", "Clear all data", "Start completely fresh").

## Implementation Notes

- This touches every student screen and adds two dependencies. Per
  CLAUDE.md's Repository Tagging section, propose
  `v-pre-mobile-shell` and wait for confirmation before starting.
- Suggested order: (1) primitives and size changes to
  `Button`/`Input`/`Textarea`, with the target-size audit run before and
  after; (2) the shell, safe areas, and tab bar, together with §7's
  manifest, icons, and meta tags, so safe areas are built and checked in
  standalone mode from the start; (3) the decision record
  and lift of capture and Settings to `App.tsx` overlays, then
  quick-add; (4) Home header; (5) per-screen `MobileActionBar` and sheet
  adoption, in the table's order.
