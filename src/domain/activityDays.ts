// 0=Sun..6=Sat, matching ../OneStepBeyondPrototype/src/routes/activities.tsx.
export const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// docs/features/activities.md: "valid to save when it has a non-empty
// name, at least one selected day, and a finish time after its start
// time." Time strings are "HH:MM" (native <input type="time"> format),
// zero-padded and same length, so lexicographic comparison is a correct
// and simple way to check finish > start.
export function isValidActivity(input: {
  name: string;
  days: number[];
  startTime: string;
  finishTime: string;
}): boolean {
  return (
    input.name.trim() !== "" &&
    input.days.length > 0 &&
    input.finishTime > input.startTime
  );
}
