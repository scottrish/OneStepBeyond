import type { StudySlot } from "./studyCapacity";

// Default start times for work being added to a day in the Schedule step,
// and re-chained start times after a reorder — one scheduler for both.
// docs/decisions/20260925-confirm-plan-appends.md point 4: confirming now
// *adds* to a day, so new work must default *after* what's already there
// (the day's existing sessions and its activities) rather than on top of
// it. docs/decisions/20260925-session-reorder-and-drag.md: a reorder
// re-times the day's planned sessions in their new order with the same
// chain (rechainTimes below).

export type DefaultTimeItem = {
  id: string;
  minutes: number;
};

/**
 * A block of the day that's already taken, in minutes since midnight.
 * `label` names it for the student ("That time overlaps with '{label}'").
 */
export type BusyBlock = {
  start: number;
  end: number;
  label?: string;
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

function windowsFor(slots: StudySlot[]): { start: number; end: number }[] {
  return slots.length > 0
    ? slots.map((slot) => ({ start: toMinutes(slot.start), end: toMinutes(slot.finish) }))
    : [{ start: NO_WINDOW_START, end: MINUTES_PER_DAY }];
}

// The shared chain: places each item, in order, from `cursorStart`,
// skipping busy blocks and moving on to the next window once the current
// one has run out. Items that would start at or after midnight come back
// in `overflow` rather than being wrapped onto the next day.
function chainFrom(
  items: DefaultTimeItem[],
  slots: StudySlot[],
  busy: BusyBlock[],
  cursorStart: number,
): { times: Record<string, string>; overflow: string[] } {
  const windows = windowsFor(slots);
  const times: Record<string, string> = {};
  const overflow: string[] = [];
  let windowIndex = 0;
  let cursor = cursorStart;

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

    if (cursor >= MINUTES_PER_DAY) {
      overflow.push(item.id);
      continue;
    }
    times[item.id] = toTimeOfDay(cursor);
    cursor += item.minutes;
  }

  return { times, overflow };
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
  const first = windowsFor(slots)[0]!.start;
  return chainFrom(items, slots, busy, Math.max(first, startAfter)).times;
}

export type ChainItem = DefaultTimeItem & {
  startTime: string | null;
};

/**
 * Re-times items in their (new) order after a reorder. The chain starts
 * at the earliest start time the items already had — even one set by
 * hand before the first study window — or at the day's first window (or
 * 16:00) if none had a time, then continues as `defaultStartTimes` does.
 *
 * Returns null, and changes nothing, if any item would start at or after
 * midnight: the reorder is refused rather than wrapped onto the next day
 * or left without a time (docs/decisions/
 * 20260925-session-reorder-and-drag.md, N1).
 */
export function rechainTimes(
  items: ChainItem[],
  slots: StudySlot[],
  busy: BusyBlock[],
): Record<string, string> | null {
  const existing = items.flatMap((item) => (item.startTime ? [toMinutes(item.startTime)] : []));
  const anchor = existing.length > 0 ? Math.min(...existing) : windowsFor(slots)[0]!.start;
  const { times, overflow } = chainFrom(items, slots, busy, anchor);
  return overflow.length > 0 ? null : times;
}

/**
 * The earliest-starting block that [start, start + minutes) would
 * overlap, if any — so a refusal names what the time actually runs into
 * first, whatever order the blocks came in.
 */
export function firstOverlap(
  start: number,
  minutes: number,
  blocks: BusyBlock[],
): BusyBlock | undefined {
  return [...blocks]
    .sort((x, y) => x.start - y.start)
    .find((block) => start < block.end && start + minutes > block.start);
}

type BlockActivity = {
  name: string;
  startTime: string;
  finishTime: string;
  travelToMinutes: number;
  travelFromMinutes: number;
};

/** A day's activities as busy blocks, including travel there and back. */
export function activityBlocks(activities: BlockActivity[]): BusyBlock[] {
  return activities.map((activity) => ({
    start: toMinutes(activity.startTime) - activity.travelToMinutes,
    end: toMinutes(activity.finishTime) + activity.travelFromMinutes,
    label: activity.name,
  }));
}

type BlockSession = {
  id: string;
  startTime: string | null;
  plannedMinutes: number;
};

/** Timed sessions as busy blocks; untimed ones take up no clock time. */
export function sessionBlocks<S extends BlockSession>(
  sessions: S[],
  label: (session: S) => string = () => "",
): BusyBlock[] {
  return sessions.flatMap((session) => {
    if (!session.startTime) return [];
    const start = toMinutes(session.startTime);
    return [{ start, end: start + session.plannedMinutes, label: label(session) }];
  });
}

type DaySession = BlockSession & {
  status: "planned" | "in_progress" | "done";
};

/**
 * Re-chains one saved day's planned sessions in `orderedPlannedIds`
 * order (daily-planning-and-completion-v2-proposal.md item 2). Started
 * and done sessions stay put and are obstacles, as are the day's
 * activities with travel — on every day, including weekends with no
 * study windows (docs/decisions/20260925-session-reorder-and-drag.md, W).
 * Shared by Plan's day view and Week Look-Ahead. Returns null if the
 * chain would run past midnight.
 */
export function rechainDay(
  daySessions: DaySession[],
  orderedPlannedIds: string[],
  slots: StudySlot[],
  activities: BusyBlock[],
): Record<string, string> | null {
  const byId = new Map(daySessions.map((session) => [session.id, session]));
  const items = orderedPlannedIds.flatMap((id) => {
    const session = byId.get(id);
    return session && session.status === "planned"
      ? [{ id, minutes: session.plannedMinutes, startTime: session.startTime }]
      : [];
  });
  const fixed = sessionBlocks(daySessions.filter((session) => session.status !== "planned"));
  return rechainTimes(items, slots, [...fixed, ...activities]);
}
