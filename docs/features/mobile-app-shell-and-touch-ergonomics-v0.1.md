# Feature: Mobile App Shell & Touch Ergonomics

**Status:** Implemented 2026-09-24 (tag `v-pre-mobile-shell` marks the state before). See "Implementation Notes (as built)" below. Produced 2026-09-24 from a
prototype-sync audit of `../OneStepBeyondPrototype`'s unmerged
`mobile-redesign` branch (`1ce3145`, 44 commits on top of `main`'s
`744026a`). Re-check against the prototype's `main` once that branch
merges. **Amended 2026-09-24** after an `analyze-feature` pass against
the current code, which found nine gaps: per-page width/padding and
nested `<main>` (§1), the 640 px `#root` cap (§1), no Add assignment
button on Assignments (§4), the full set of screens that must move to
App-level overlays (§1), the focus-ring result (§5), a shared tab-bar
height (§3), screens outside the shell (§1), dark-mode theme color
(§7), and a tighter dashboard criterion. Each is now written into the
relevant section below.

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
- **Every page sets its own width and padding.** 16 page files render
  their own `<main className="mx-auto w-full max-w-[420px] p-8">` (25
  occurrences; Plan and part of Today use `p-6`), *inside* the shell's
  own `<main>`. That duplicates the `main` landmark (an existing
  accessibility bug), and it means the shell can't control gutters or
  width today.
- `src/index.css` caps the student app at 640 px:
  `#root:not(.dashboard-root) { max-width: 640px; min-height: 100svh }`.
  The dashboard is excluded through `.dashboard-root`, which is set in
  `src/Root.tsx`.
- `LoginPage` and `InviteAcceptPage` render **outside** `AppShell`
  (`Root.tsx` / `App.tsx`), but they use the same `Button`/`Input`.
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
- **The Assignments list has no "Add assignment" button.** Its empty
  state's only action is "Go to Home". Capture can only be reached from
  Home's header +.
- `src/dashboard/` imports nothing from `src/components/ui/`, so the
  shared primitive changes below can't reach the dashboard.

## 1. Student shell

- **Viewport and safe areas.** The shell uses dynamic viewport height
  (`min-h-dvh`). The content column pads for `env(safe-area-inset-top)`,
  and the tab bar pads for `env(safe-area-inset-bottom)`, so nothing sits
  under a notch or the home indicator. `body` gets `min-width: 320px`
  and `overscroll-behavior-y: none`. Use `dvh` only for the outer
  frame's *minimum* height, never to size content, so the browser's
  address bar showing and hiding doesn't make content jump.
- **The shell owns width, gutters, and the one `<main>` landmark.**
  Remove every page's own `max-w-[420px]` and `p-8`/`p-6`. Pages render
  a `<div>` (or `<section>`) as their root, not `<main>`. The student app
  then has exactly one `main` landmark, and changing gutters or width
  happens in one place. This is a behavior-neutral refactor and should
  land first, on its own.
- **Remove the 640 px `#root` cap** in `src/index.css` for the student
  app. Keep the `.dashboard-root` exclusion and the dashboard's own
  rule unchanged. Change `min-height: 100svh` to `100dvh`, following
  the rule above.
- **Screens outside the shell** (`LoginPage`, `InviteAcceptPage`) get
  the same safe-area padding and 20 px phone gutters, so they also work
  when launched standalone from the home screen (§7). They don't get a
  tab bar.
- The page scrolls on the **viewport**, not inside an inner container
  with `overflow` set. `position: sticky` (§3's `MobileActionBar`)
  depends on this.
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
  Keep this app's `aria-current="page"` (the prototype omits it), its
  `aria-label="Primary"` landmark name, and its existing
  re-tap-resets-tab behavior (`App.tsx` `handleTabChange`). The tab
  bar's height comes from **one shared CSS variable**
  (e.g. `--tab-bar-height`), which §3's `MobileActionBar` offset and the
  shell's bottom padding also use. The prototype hardcodes `4.5rem` in
  one file and `4rem` in the other; don't copy that mismatch.
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

**Everything reachable from those two screens moves with them.** Capture
links to Courses (`onGoToCourses`, for a student with no courses).
Settings links to Activities, Courses, Study hours (`PreferencesPage`),
and Support. So in practice **all of `HomePage`'s secondary views move to
a single App-level overlay state** alongside `openAssignmentId` and
`executingToday`: capture, Settings, Courses, Activities, Study hours,
and Support. `HomePage` keeps only its own content and calls App-level
callbacks. Navigation rules:
- **Closing an overlay returns to the tab that was showing when it
  opened.** For example, quick-add from Plan, then Cancel, returns to
  Plan on its preserved day and step.
- **Back routes:** Support, Activities, and Study hours Back →
  Settings. Courses Back → whichever screen opened it (Settings, or
  capture via "Add a course"). *(Product-owner direction, 2026-09-25.
  Before this increment, Courses, Activities, and Study hours returned
  to Home.)*
- **Tapping any tab closes every overlay** (extending `handleTabChange`,
  which already clears Detail and Today Execution). Plan's lifted
  day/step/tab state isn't affected by opening or closing an overlay.
- If the overlay state grows past roughly six screens, reconsider a
  router in its own decision record. This spec stays below that.

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
  this adds a second, shorter route to it. **Sign out stays in Settings
  only.** It isn't added to this menu, so a stray tap on Home can't sign
  a student out.
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
  tab bar, with a translucent background, a top border, and a backdrop
  blur. Its bottom offset is `calc(var(--tab-bar-height) +
  env(safe-area-inset-bottom))`, the same variable the tab bar uses
  (§1). It's never a separately hardcoded value.
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
| Plan existing-day view | *Doesn't exist yet. Applied when `daily-planning-and-completion-v2-proposal.md` items 2 and 10 are built, not in this increment.* "Add more work" / "Done" in a `MobileActionBar`, plus the per-session edit sheet. |
| Plan Schedule step | The suggested-time chips become one horizontally scrollable row (no wrapping), each chip at least 44 px tall. The manual time input is 44 px tall with 16 px text. |
| Plan Estimate step | −/+ steppers at 44 px (were 32 px). |
| Today Execution | *Applied when `execution-coaching-v0.1.md` is built, not in this increment.* Friction picker, intervention, own first action, and repair become `ResponsiveSheet`s (see that spec's "Presentation"). Completion decisions stay full-screen. In this increment, Today only gets the §1 shell and §5 sizing changes. |
| Assignment capture | "Save assignment" in a `MobileActionBar`. Course and effort chips at least 44 px tall. |
| Assignments list | Each row's two stacked icon buttons become one **"Actions for {title}"** overflow menu (Edit, Delete), with each item at least 44 px tall. Delete keeps its existing inline confirmation. The rest of the card stays the tap target that opens Detail. **New:** an **"Add assignment"** button (`lg`, full width) below the list, opening the capture overlay (§1). It's shown only when the list isn't empty. The empty state's action changes from "Go to Home" to **"Add assignment"**, which opens the same overlay. Without these, from `sm:` up (where there's no quick-add) capture would only be reachable from Home. |
| Settings | Each destination (Activities, Courses, Study hours, People who support you) is a full-width row at least 64 px tall: icon, title, one-line description, trailing chevron, with the title and description truncating safely. This app already has all four destinations plus Sign out, so only the presentation changes. |
| Any future centered modal | Use `ResponsiveSheet`. This app has no centered modals today; its confirmations are inline, and they stay inline unless a feature spec says otherwise. |

**`ResponsiveSheet` has no user-facing use in this increment.** Its
first real callers are the specs marked above, and the gestures and
course-management specs. Build and test it here, fully, so those specs
start with a finished primitive rather than each building their own.
Don't convert any existing inline confirmation to a sheet just to give
it a use.

## 5. Touch targets, inputs, and focus

CLAUDE.md already requires 44×44 px targets. This section says how the
shared primitives meet that rule, so individual screens don't each
decide.

- **Buttons:** `default` at least 44 px (already), `icon` at least
  44×44 (already), `lg` at least 48 px. `sm` rises from 32 px to at
  least 44 px. The prototype's `sm:` breakpoint shrinks `default` to
  40 px and `sm` to 36 px. **Don't copy that shrink.** Larger screens
  can still be touch devices (tablets), and CLAUDE.md doesn't exempt
  them. Raising `sm` affects 14 existing call sites (e.g.
  `AlreadyPlannedList`, `NeedsAttentionCard`, `AssignmentDetailSteps`, and
  the Plan step components). Check each at 320 px for wrapping or
  crowding using the before/after audit screenshots.
- **Chips and toggles:** effort presets, course pickers, time chips,
  activity day toggles, and color swatches are all at least 44×44 px.
  The prototype's saved-activity day toggles are 40 px; use 44.
- **Inputs:** at least 48 px tall on phones and 44 px from `sm:`, with
  **16 px text at every width**. That means removing `md:text-sm`, which
  stops iOS from zooming on focus. Textarea at least 96 px tall. Use
  native `type="date"` / `type="time"` and the right `inputMode` for
  numbers.
- **Focus ring:** 3 px, replacing today's 1 px, **at the ring token's
  full opacity.** Don't use the prototype's 40% opacity: it fails WCAG
  1.4.11 (3:1 non-text contrast). Computed 2026-09-24 from the tokens in
  `src/index.css`:

  | Surface | 100% opacity | 40% opacity |
  |---|---|---|
  | Light background | 5.05:1 ✓ | 1.75:1 ✗ |
  | Light card | 5.28:1 ✓ | 1.77:1 ✗ |
  | Dark background | 4.17:1 ✓ | 1.56:1 ✗ |
  | Dark card | 3.69:1 ✓ | 1.60:1 ✗ |

  If the ring or surface tokens change, recompute this table.
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
- **Dark mode:** the app has a dark palette (`prefers-color-scheme:
  dark` in `src/index.css`). The manifest can only hold one
  `theme_color` and one `background_color`, so they use the **light**
  values. The per-scheme values go in the `theme-color` meta tags below.
  The icons are the same in both schemes: the teal mark reads well on
  both light and dark home screens.
- **Meta tags** in `index.html`: `theme-color` (light and dark variants
  via `media`, using each scheme's resolved `--background` token),
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
- Every Plan wizard step and Assignment capture keep their primary
  action visible above the tab bar without scrolling, at 320×568, and
  no list row is permanently covered by the bar.
- The action bar's offset and the tab bar's height come from the same
  CSS variable. Changing that variable moves both together.
- The student app has exactly one `main` landmark on every screen, and
  no page sets its own max width or outer padding.
- At 1280 px the student app shows the framed layout (§1): the content
  column is wider than 420 px, up to `2xl`, inside a `5xl` frame. It
  isn't capped at 640 px.
- Quick-add opened from Plan or Assignments, then cancelled, returns to
  that same tab. On Plan, the day, step, and Plan/Look Ahead tab are
  unchanged.
- Tapping any tab while capture, Settings, or any Settings sub-screen
  is open closes it and shows that tab's landing view. Support's Back
  still returns to Settings.
- The Assignments list shows an "Add assignment" button below a
  non-empty list, and the empty state's action is "Add assignment"
  rather than "Go to Home". Both open capture.
- Each Assignments row's "Actions for {title}" menu offers Edit and
  Delete, each at least 44 px tall and keyboard-operable. Delete keeps
  its existing inline confirmation.
- `LoginPage` and `InviteAcceptPage` respect safe areas and use 20 px
  phone gutters.
- `ResponsiveSheet` shows as a bottom sheet below 640 px and a centered
  dialog at 640 px and up. It traps focus, closes on Escape and
  backdrop tap, returns focus to its trigger, and exposes its title and
  description as the dialog's accessible name and description.
- Every interactive element in the student app measures at least 44×44
  px at 320, 768, and 1280 px widths. This is checked by an automated
  Playwright pass, not by eye.
- Focusing any text input on iOS Safari doesn't zoom the page (16 px
  computed font size on every input).
- The focus ring is 3 px at the ring token's full opacity, and meets 3:1
  contrast against background and card surfaces in both color schemes
  (§5's table).
- With reduced motion turned on, `ResponsiveSheet` opens and closes
  without animation.
- The student app has no horizontal page scroll at 320 px.
- The coach/parent dashboard's screens (`/dashboard`) are unchanged. A
  before/after screenshot comparison at 1280 px shows no difference, and
  the `.dashboard-root` CSS rule is left as it is. **The one shared
  surface is its sign-in screen:** the dashboard signs in through the
  same `LoginPage`, so it gets the same safe-area padding and
  44–48 px controls as the student sign-in. This is intended.
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
  Existing tests change only where an accessible name or navigation path
  deliberately changed. Known cases: `HomePage.test.tsx`'s five
  Settings-navigation tests (they now start from "More options" →
  Settings, or from App-level overlays), and `App.test.tsx`'s re-tap
  test, which clicks `{ name: "Settings" }`.

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
- Component: App-level overlay navigation. Quick-add from each tab and
  return; Settings from the tab bar; Support → Settings back route; tab
  tap closes overlays; Plan state preserved. Assignments' Add button,
  empty-state action, and row menu.
- Test setup: Radix `DropdownMenu`/`Dialog` under `userEvent` in jsdom
  need `hasPointerCapture`, `releasePointerCapture`, `scrollIntoView`,
  and `ResizeObserver` stubs in `src/test/setup.ts`.
- Playwright: a sticky-bar check at 320×568; computed input font size of
  at least 16 px; no service worker registered; the manifest fetches and
  parses; a `/dashboard` screenshot comparison before and after; a
  reduced-motion emulation check for `ResponsiveSheet`.
- Manual: iOS Safari for safe areas and focus zoom, in both the browser
  and after Add to Home Screen, with a soft-keyboard check on
  `ResponsiveSheet` (Radix scroll-lock on iOS is a known trouble spot).
  Android Chrome for the gesture bar and install.

## Implementation Notes (2026-09-24, as built)

Decisions made during implementation that refine the sections above:

- **Accessible names kept stable where they already existed.** Settings'
  Support row stays labelled "Support" (matching the Support screen's
  own heading), while Home's menu item reads "People who support you".
  Capture's button stays "Save", not the prototype's "Save assignment".
  Both the header + and the tab bar's quick-add are named "Add
  assignment" (the header's was previously "New assignment").
- **Inline links are exempt from the 44 px rule** under WCAG 2.5.5's
  own inline exception, e.g. the assignment title inside Needs
  Attention's "{title}: {message}" sentence. Forcing a 44 px box there
  broke the sentence's line spacing. Every standalone text-link button
  (Coming Up's "See all assignments", "Due: …" links, Look Ahead day
  headings, "Show more assignments") was raised to 44 px.
- **`ResponsiveSheet` restores focus itself.** Radix only returns focus
  to its own `Dialog.Trigger`. Callers open sheets from their own
  buttons, so the component remembers what had focus when it opened
  and restores it on close.
- **No sheet slide animation yet.** The shadcn-generated `animate-in` /
  `slide-in-*` classes need the `tw-animate-css` plugin. §3 limits new
  dependencies to the two Radix packages, so sheets currently appear
  without a transition, the same as with reduced motion on. Adding the
  plugin is a small, separate decision.
- **Page titles** use `clamp(1.65rem, 7vw, 2.1rem)` for top-level
  screens only. Sub-step headings (e.g. the Support invite flow) keep
  `text-2xl`.

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
- Any change to the coach/parent dashboard. It shares none of the
  changed primitives and keeps its own `.dashboard-root` layout.
- A light/dark theme toggle (unchanged from `design-system-adoption.md`).
  *Since 2026-09-25: built as `appearance-light-dark-v0.1.md`.*
- The prototype's dev-only Settings reset tools ("Reset with example
  data", "Clear all data", "Start completely fresh").

## Implementation Notes

- This touches every student screen and adds two dependencies. Per
  CLAUDE.md's Repository Tagging section, propose
  `v-pre-mobile-shell` and wait for confirmation before starting.
- **Ship in three parts.** Each one passes lint, test, and build on its
  own:
  - **Part A, foundation (no navigation change):**
    1. The behavior-neutral refactor comes first: remove per-page width,
       padding, and nested `<main>`, and remove the 640 px `#root` cap.
       Run the test suite continuously.
    2. Primitive sizes and the focus ring. Run the target-size audit
       before and after.
    3. Global CSS: `dvh`, `min-width`, overscroll, reduced motion, and
       `--tab-bar-height`.
    4. Shell layout and safe areas, including Login and Invite. The
       trailing tab slot stays empty for now.
    5. §7's manifest, icons, meta tags, and favicon. Do this before
       step 4 is verified, so safe areas are checked in standalone mode.
  - **Part B, navigation (needs Part A, plus the decision record
    first):**
    6. Write the decision record for App-level overlays.
    7. Lift all of `HomePage`'s secondary views into App-level overlays.
    8. `DropdownMenu`, then Home's header and "More options" menu.
    9. The tab bar's trailing slot (quick-add / Settings).
    10. Assignments: Add button, empty-state action, and row menu.
  - **Part C, primitives in use (needs Part A; uses step 8's menu
    primitive):**
    11. `Sheet`, then `ResponsiveSheet` and `MobileActionBar`, with
        tests.
    12. Action bars on the Plan steps and capture, and the step pill.
    13. The Schedule chip row, Estimate steppers, and chip sizes.
    14. The Settings row restyle.
