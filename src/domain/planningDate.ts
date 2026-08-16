// Small date helpers for the Daily Planning day picker and step headers
// (docs/features/daily-planning.md). Kept separate from dueDate.ts, which
// formats an *assignment's* due date (and always includes the year) —
// these operate on "the day being planned" and need a weekday name
// dueDate.ts has no reason to produce.

// Parses a "YYYY-MM-DD" string as a local calendar date, not
// `new Date(dateString)`, which treats a bare date string as UTC
// midnight — that can shift the displayed day in negative-UTC-offset
// timezones. Same reasoning as dueDate.ts's formatDueDate.
function parseISODate(dateISO: string): Date {
  const [year, month, day] = dateISO.split("-").map(Number);
  return new Date(year ?? 1970, (month ?? 1) - 1, day ?? 1);
}

function toISODateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function todayISODate(referenceDate: Date = new Date()): string {
  return toISODateString(referenceDate);
}

export function addDaysISODate(dateISO: string, days: number): string {
  const date = parseISODate(dateISO);
  date.setDate(date.getDate() + days);
  return toISODateString(date);
}

export function dayOfWeek(dateISO: string): number {
  return parseISODate(dateISO).getDay();
}

// "today" | "Tuesday" — for "Let's plan {dayLabel}." Lowercase "today"
// reads naturally mid-sentence; other days use the full weekday name.
export function dayLabel(dateISO: string, todayISO: string = todayISODate()): string {
  if (dateISO === todayISO) return "today";
  return parseISODate(dateISO).toLocaleDateString(undefined, { weekday: "long" });
}

// "Today" | "Mon" | "Tue" — short label for the day-picker strip chips.
export function shortDayLabel(dateISO: string, todayISO: string = todayISODate()): string {
  if (dateISO === todayISO) return "Today";
  return parseISODate(dateISO).toLocaleDateString(undefined, { weekday: "short" });
}

// "Monday, March 15" — for the Confirm step's header on a future day.
export function longPlanDate(dateISO: string): string {
  return parseISODate(dateISO).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function daysBetween(fromISO: string, toISO: string): number {
  const a = parseISODate(fromISO).getTime();
  const b = parseISODate(toISO).getTime();
  return Math.round((b - a) / 86400000);
}

// "Due today" | "Due tomorrow" | "Due Monday" | "Due Mar 5" — the
// Select step's candidate context line needs a relative due date, not
// dueDate.ts's always-full "March 15, 2026" (which suits Assignment
// Capture/Detail, where the exact date matters more than how soon it is).
export function dueRelativeLabel(dateISO: string, todayISO: string = todayISODate()): string {
  const n = daysBetween(todayISO, dateISO);
  if (n < 0) return n === -1 ? "Due yesterday" : `Due ${Math.abs(n)} days ago`;
  if (n === 0) return "Due today";
  if (n === 1) return "Due tomorrow";
  if (n < 7) return `Due ${parseISODate(dateISO).toLocaleDateString(undefined, { weekday: "long" })}`;
  return `Due ${parseISODate(dateISO).toLocaleDateString(undefined, { month: "short", day: "numeric" })}`;
}
