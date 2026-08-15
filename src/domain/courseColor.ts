// Fixed, rotating accent palette for auto-assigned course colors
// (docs/features/course-setup.md: "Color is auto-assigned at creation
// time... cycling once the palette is exhausted."). Sourced from
// ../OneStepBeyondPrototype's --course-1..5 design tokens (src/index.css)
// rather than an invented palette — see
// docs/decisions/20260814-adopt-prototype-visual-design-toolchain.md.
export const COURSE_COLOR_PALETTE = [
  "var(--course-1)",
  "var(--course-2)",
  "var(--course-3)",
  "var(--course-4)",
  "var(--course-5)",
];

export function assignCourseColor(existingCourseCount: number): number {
  return existingCourseCount % COURSE_COLOR_PALETTE.length;
}

export function courseColorValue(colorIndex: number): string {
  return COURSE_COLOR_PALETTE[colorIndex % COURSE_COLOR_PALETTE.length];
}
