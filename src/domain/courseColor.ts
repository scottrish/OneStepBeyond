// Course colours: a fixed palette of named accents, sourced from
// ../OneStepBeyondPrototype's --course-1..8 design tokens (src/index.css)
// rather than invented colours — see
// docs/decisions/20260814-adopt-prototype-visual-design-toolchain.md.
// Students choose one when adding or editing a course, pre-set to one no
// other course is using (docs/decisions/20260925-course-colour-and-delete.md).
// A course stores its colour as an index into this list; the first five
// are the original palette in the original order, so courses created
// before the choice existed keep their colour.
export const COURSE_COLORS: { value: string; label: string }[] = [
  { value: "var(--course-1)", label: "Clay" },
  { value: "var(--course-2)", label: "Fern" },
  { value: "var(--course-3)", label: "Amber" },
  { value: "var(--course-4)", label: "Violet" },
  { value: "var(--course-5)", label: "Slate blue" },
  { value: "var(--course-6)", label: "Teal" },
  { value: "var(--course-7)", label: "Rose" },
  { value: "var(--course-8)", label: "Moss" },
];

/**
 * The default colour for a new course: the first one no existing course
 * uses, so back-to-back additions look different. Once all are taken, it
 * cycles by course count.
 */
export function nextCourseColor(usedIndexes: number[]): number {
  const used = new Set(usedIndexes.map((index) => index % COURSE_COLORS.length));
  const free = COURSE_COLORS.findIndex((_, index) => !used.has(index));
  return free >= 0 ? free : usedIndexes.length % COURSE_COLORS.length;
}

export function courseColorValue(colorIndex: number): string {
  return COURSE_COLORS[colorIndex % COURSE_COLORS.length]!.value;
}

export function courseColorLabel(colorIndex: number): string {
  return COURSE_COLORS[colorIndex % COURSE_COLORS.length]!.label;
}

/**
 * The inline confirmation for deleting a course. With assignments it
 * warns plainly that all of them go, whatever their state
 * (course-management-v2-proposal.md §2, decided 2026-09-25).
 */
export function courseDeleteWarning(
  name: string,
  assignmentCount: number,
): { title: string; detail: string | null } {
  if (assignmentCount === 0) return { title: `Delete ${name}?`, detail: null };
  const assignments = assignmentCount === 1 ? "its 1 assignment" : `its ${assignmentCount} assignments`;
  return {
    title: `Delete ${name} and all its assignments?`,
    detail:
      `This also deletes ${assignments}: ones you haven’t planned yet, ones you’ve planned, ` +
      "and ones you’ve completed. Their steps, planned time and reflections go too. " +
      "This can’t be undone.",
  };
}
