import type { Activity } from "../services/activityService";
import type { Preferences } from "../services/preferencesService";

// Capacity/scheduling math for Daily Planning
// (docs/features/daily-planning.md), ported from
// ../OneStepBeyondPrototype/src/lib/domain/derive.ts (availableMinutes,
// studySlots) — same algorithm, adapted to this app's own Activity/
// WorkSession shapes.

// Weekday start is fixed, not student-configurable — students aren't
// expected to use pre-school time for work
// (docs/features/student-preferences.md's Design Decisions). Weekday
// finish and weekend's hours budget both come from the student's own
// Preferences instead; there is deliberately no equivalent fixed
// "weekend start" — see studySlots below for why weekend has no window
// at all, only a budget.
export const WEEKDAY_START = "15:15";
// Minutes deliberately left for dinner, family and rest — never
// presented to the student as free time, and never fully consumable by
// planning.
export const PROTECTED_MINUTES = 90;

// A day's already-planned time, for availableMinutes' "already planned"
// subtraction — decoupled from the workSessionService's WorkSession type
// so this module has no dependency on the services layer.
export type PlannedSession = {
  date: string;
  status: "planned" | "in_progress" | "done";
  plannedMinutes: number;
};

function parseISODate(dateISO: string): Date {
  const [year, month, day] = dateISO.split("-").map(Number);
  return new Date(year ?? 1970, (month ?? 1) - 1, day ?? 1);
}

function isWeekendDate(dateISO: string): boolean {
  const dow = parseISODate(dateISO).getDay();
  return dow === 0 || dow === 6;
}

export function minutesBetween(start: string, finish: string): number {
  const [sh, sm] = start.split(":").map(Number);
  const [fh, fm] = finish.split(":").map(Number);
  return (fh ?? 0) * 60 + (fm ?? 0) - ((sh ?? 0) * 60 + (sm ?? 0));
}

export function activitiesOn(activities: Activity[], dateISO: string): Activity[] {
  const dow = parseISODate(dateISO).getDay();
  return activities.filter((activity) => activity.days.includes(dow));
}

// The day's realistic study capacity: the student's configured total
// (weekday window span, or weekend's raw hours budget) minus Activities
// (+ their travel time) minus the protected block minus minutes already
// planned (and not yet done) for that date — the last term is this app's
// own addition on top of the prototype's availableMinutes, mirroring the
// "capacity" calc in the prototype's plan.tsx (availableMinutes minus
// alreadyPlanned).
export function availableMinutes(
  activities: Activity[],
  workSessions: PlannedSession[],
  dateISO: string,
  preferences: Preferences,
): number {
  const total = isWeekendDate(dateISO)
    ? preferences.weekendHours * 60
    : minutesBetween(WEEKDAY_START, preferences.weekdayFinishTime);
  const busy = activitiesOn(activities, dateISO).reduce(
    (sum, activity) =>
      sum +
      minutesBetween(activity.startTime, activity.finishTime) +
      activity.travelToMinutes +
      activity.travelFromMinutes,
    0,
  );
  const alreadyPlanned = workSessions
    .filter((session) => session.date === dateISO && session.status !== "done")
    .reduce((sum, session) => sum + session.plannedMinutes, 0);

  return Math.max(0, total - busy - PROTECTED_MINUTES - alreadyPlanned);
}

// Honest, qualitative phrasing for a day's capacity — never a raw "X hr
// free" figure (Design-Principles.md Eighth Principle: personal time
// isn't automatically homework capacity). Used by Week Look-Ahead
// (week-lookahead.md); Daily Planning's own Day step still states a raw
// effort figure ("about 1h 30m of study time") rather than this — see
// week-lookahead.md's own note on that divergence. Thresholds ported
// directly from the prototype's own `capacityPhrase`.
export function capacityPhrase(minutes: number): string {
  if (minutes <= 0) return "No study time today";
  if (minutes < 45) return "Tight day";
  if (minutes < 120) return `About ${Math.round(minutes / 30) * 30} min study time available`;
  if (minutes < 210) return "About 2 hr study time available";
  if (minutes < 300) return "Mostly open";
  return "Plenty of room";
}

export type StudySlot = {
  start: string; // HH:MM
  finish: string; // HH:MM
  minutes: number;
  label: string;
};

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

function fromMinutes(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

// Open stretches of the day, around Activities and their travel time —
// suggestions for the Schedule step, not rules. Stretches shorter than
// 20 minutes aren't offered as a slot.
//
// Weekend returns no slots at all: a plain hours budget has no
// clock-time anchor to carve stretches from, and inventing one (e.g.
// "always start at 9am") would just re-introduce the fixed slot
// student-preferences.md's Design Decisions explicitly rejected —
// students won't realistically hold to one on a weekend. This isn't a
// gap: the Schedule step already always renders a manual time input
// alongside any suggested chips regardless of whether chips exist, so a
// weekend item falls back to "type whatever time makes sense" with no
// UI change required.
export function studySlots(
  activities: Activity[],
  dateISO: string,
  preferences: Preferences,
): StudySlot[] {
  if (isWeekendDate(dateISO)) return [];

  const busy = activitiesOn(activities, dateISO)
    .map((activity) => ({
      name: activity.name,
      start: toMinutes(activity.startTime) - activity.travelToMinutes,
      finish: toMinutes(activity.finishTime) + activity.travelFromMinutes,
    }))
    .sort((a, b) => a.start - b.start);

  const slots: StudySlot[] = [];
  let cursor = toMinutes(WEEKDAY_START);
  const end = toMinutes(preferences.weekdayFinishTime);

  const push = (from: number, to: number, before?: string, after?: string) => {
    if (to - from < 20) return;
    const label = after
      ? `After ${after.toLowerCase()}`
      : before
        ? `Before ${before.toLowerCase()}`
        : slots.length === 0
          ? "After school"
          : "Later on";
    slots.push({ start: fromMinutes(from), finish: fromMinutes(to), minutes: to - from, label });
  };

  busy.forEach((activity, i) => {
    const previous = i > 0 ? busy[i - 1]?.name : undefined;
    push(cursor, Math.min(activity.start, end), activity.name, i > 0 ? previous : undefined);
    cursor = Math.max(cursor, activity.finish);
  });
  const last = busy[busy.length - 1];
  push(cursor, end, undefined, busy.length > 0 ? last?.name : undefined);

  return slots;
}
