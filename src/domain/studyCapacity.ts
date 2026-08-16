import type { Activity } from "../services/activityService";

// Capacity/scheduling math for Daily Planning
// (docs/features/daily-planning.md), ported from
// ../OneStepBeyondPrototype/src/lib/domain/derive.ts (availableMinutes,
// studySlots) — same algorithm, adapted to this app's own Activity/
// WorkSession shapes.

export type StudyWindow = { start: string; finish: string };

// A calm, realistic study window — planning is not about filling every
// minute. Shorter on weekends' later finish balanced by an earlier
// start; weekdays start later (after school) and run later. Validated
// product-design constants (Design-Principles.md's Eighth Principle,
// "Protect What Matters"), not something to redesign here.
export const WEEKDAY_WINDOW: StudyWindow = { start: "15:15", finish: "21:00" };
export const WEEKEND_WINDOW: StudyWindow = { start: "10:00", finish: "20:00" };
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

function isWeekend(dayOfWeek: number): boolean {
  return dayOfWeek === 0 || dayOfWeek === 6;
}

function windowFor(dateISO: string): StudyWindow {
  const dow = parseISODate(dateISO).getDay();
  return isWeekend(dow) ? WEEKEND_WINDOW : WEEKDAY_WINDOW;
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

// The day's realistic study capacity: window minus Activities (+ their
// travel time) minus the protected block minus minutes already planned
// (and not yet done) for that date — the last term is this app's own
// addition on top of the prototype's availableMinutes, mirroring the
// "capacity" calc in the prototype's plan.tsx (availableMinutes minus
// alreadyPlanned).
export function availableMinutes(
  activities: Activity[],
  workSessions: PlannedSession[],
  dateISO: string,
): number {
  const window = windowFor(dateISO);
  const total = minutesBetween(window.start, window.finish);
  const busy = activitiesOn(activities, dateISO).reduce(
    (sum, activity) =>
      sum + minutesBetween(activity.startTime, activity.finishTime) + activity.travelMinutes,
    0,
  );
  const alreadyPlanned = workSessions
    .filter((session) => session.date === dateISO && session.status !== "done")
    .reduce((sum, session) => sum + session.plannedMinutes, 0);

  return Math.max(0, total - busy - PROTECTED_MINUTES - alreadyPlanned);
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
export function studySlots(activities: Activity[], dateISO: string): StudySlot[] {
  const dow = parseISODate(dateISO).getDay();
  const weekend = isWeekend(dow);
  const window = weekend ? WEEKEND_WINDOW : WEEKDAY_WINDOW;
  const busy = activitiesOn(activities, dateISO)
    .map((activity) => ({
      name: activity.name,
      start: toMinutes(activity.startTime) - activity.travelMinutes,
      finish: toMinutes(activity.finishTime) + activity.travelMinutes,
    }))
    .sort((a, b) => a.start - b.start);

  const slots: StudySlot[] = [];
  let cursor = toMinutes(window.start);
  const end = toMinutes(window.finish);

  const push = (from: number, to: number, before?: string, after?: string) => {
    if (to - from < 20) return;
    const label = after
      ? `After ${after.toLowerCase()}`
      : before
        ? `Before ${before.toLowerCase()}`
        : slots.length === 0
          ? weekend
            ? "Morning"
            : "After school"
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
