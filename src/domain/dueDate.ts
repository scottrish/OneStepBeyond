// "Due — date picker, defaults to tomorrow" (docs/features/assignment-capture.md).
// Returns a YYYY-MM-DD string, the format <input type="date"> expects.
export function tomorrowDateString(referenceDate: Date = new Date()): string {
  const tomorrow = new Date(referenceDate);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const year = tomorrow.getFullYear();
  const month = String(tomorrow.getMonth() + 1).padStart(2, "0");
  const day = String(tomorrow.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Formats a "YYYY-MM-DD" date string for display (e.g. "March 15, 2026").
// Parses the parts manually rather than `new Date(dateString)`, which
// treats a bare date string as UTC midnight — formatting that in a
// negative-UTC-offset timezone can display the wrong (previous) day.
export function formatDueDate(dateString: string): string {
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
