// Pure rules behind SwipeActionRow's swipe-to-reveal gesture —
// docs/features/mobile-gestures-reorder-and-swipe-v0.1.md §2. Kept free of
// React and pointer-event plumbing so the thresholds can be unit-tested
// directly.

/** Width of the revealed destructive action, and so the fully-open offset. */
export const SWIPE_ACTION_WIDTH = 104;

/** Movement (px) before a gesture is classified as a swipe or a scroll. */
export const SWIPE_INTENT_THRESHOLD = 7;

export type SwipeIntent = "undecided" | "horizontal" | "vertical";

/**
 * Classifies a gesture from its displacement since pointerdown. Mostly-
 * vertical movement is a scroll and is left to the browser; ties go to
 * vertical, so scrolling always wins an ambiguous gesture.
 */
export function detectIntent(
  dx: number,
  dy: number,
  threshold: number = SWIPE_INTENT_THRESHOLD,
): SwipeIntent {
  if (Math.abs(dx) < threshold && Math.abs(dy) < threshold) return "undecided";
  return Math.abs(dx) > Math.abs(dy) ? "horizontal" : "vertical";
}

/**
 * The row's offset while dragging: follows the finger from where the row
 * started (0 closed, -width open), clamped to [-width, 0] — rows only
 * ever reveal leftwards, and never past the action's own width.
 */
export function dragOffset(
  startOffset: number,
  dx: number,
  width: number = SWIPE_ACTION_WIDTH,
): number {
  return Math.max(-width, Math.min(0, startOffset + dx));
}

/** Where a released row settles: open if dragged past halfway, else closed. */
export function settleOffset(offset: number, width: number = SWIPE_ACTION_WIDTH): number {
  return offset < -width / 2 ? -width : 0;
}

// Places a swipe must never start from: text fields (horizontal movement
// there is caret placement/selection), drag handles (their own gesture),
// and popup triggers (Radix opens menus on pointerdown, so a swipe
// starting there would also open the menu).
const NO_SWIPE_SELECTOR = [
  // Text-like inputs only: a checkbox or radio has no caret to fight over.
  "input:not([type='checkbox']):not([type='radio']):not([type='button']):not([type='submit']):not([type='reset'])",
  "textarea",
  "select",
  "[contenteditable]:not([contenteditable='false'])",
  "[data-drag-handle]",
  "[aria-haspopup]",
].join(",");

/** Whether a pointerdown on `target` may begin a swipe. */
export function canStartSwipe(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return true;
  return target.closest(NO_SWIPE_SELECTOR) === null;
}
