import type { StudySlot } from "./studyCapacity";

// Default start times for work being added to a day in the Schedule step.
// docs/decisions/20260925-confirm-plan-appends.md point 4: confirming now
// *adds* to a day, so new work must default *after* what's already there
// (the day's existing sessions and its activities) rather than on top of
// it. Roadmap Phase 7 step 10's re-chaining (reordering) is meant to
// extend this same function rather than add a second scheduler.

export type DefaultTimeItem = {
  id: string;
  minutes: number;
};

/** A block of the day that's already taken, in minutes since midnight. */
export type BusyBlock = {
  start: number;
  end: number;
};

// Days with no study windows (weekends — docs/features/
// student-preferences.md) have no clock-time anchor; this preserves the
// Schedule step's long-standing first default for them.
const NO_WINDOW_START = 16 * 60;
const MINUTES_PER_DAY = 24 * 60;

export function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

export function toTimeOfDay(minutes: number): string {
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

/**
 * Places each item, in order, right after the one before it:
 * - starting at the first study window (or 16:00 when there are none),
 *   or at `startAfter` if that's later — Plan passes the end of the
 *   day's last existing session, so added work goes after the plan, as
 *   "Add more work" promises, rather than into an earlier gap;
 * - skipping past any busy block it would overlap;
 * - moving to the next window's start once the current window has run
 *   out (an item may run past its window's end, as before; the *next*
 *   one moves on);
 * - leaving out any item that would start at or after midnight, rather
 *   than wrapping onto the next day (the student sets it by hand).
 */
export function defaultStartTimes(
  items: DefaultTimeItem[],
  slots: StudySlot[],
  busy: BusyBlock[],
  startAfter = 0,
): Record<string, string> {
  const windows =
    slots.length > 0
      ? slots.map((slot) => ({ start: toMinutes(slot.start), end: toMinutes(slot.finish) }))
      : [{ start: NO_WINDOW_START, end: MINUTES_PER_DAY }];

  const result: Record<string, string> = {};
  let windowIndex = 0;
  let cursor = Math.max(windows[0]!.start, startAfter);

  for (const item of items) {
    // Repeat until the cursor is inside a window and clear of every busy
    // block: skipping a busy block can push the cursor past a window's
    // end, and moving to a new window can land it inside another block.
    let moved = true;
    while (moved) {
      moved = false;
      while (windowIndex < windows.length - 1 && cursor >= windows[windowIndex]!.end) {
        windowIndex += 1;
        cursor = Math.max(cursor, windows[windowIndex]!.start);
        moved = true;
      }
      for (const block of busy) {
        if (cursor < block.end && cursor + item.minutes > block.start) {
          cursor = block.end;
          moved = true;
        }
      }
    }

    if (cursor >= MINUTES_PER_DAY) continue;
    result[item.id] = toTimeOfDay(cursor);
    cursor += item.minutes;
  }

  return result;
}
