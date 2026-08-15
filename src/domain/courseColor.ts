// Fixed, rotating accent palette for auto-assigned course colors
// (docs/features/course-setup.md: "Color is auto-assigned at creation
// time... cycling once the palette is exhausted.")
export const COURSE_COLOR_PALETTE = [
  "#ef4444", // red
  "#f97316", // orange
  "#eab308", // amber
  "#22c55e", // green
  "#14b8a6", // teal
  "#3b82f6", // blue
  "#8b5cf6", // violet
  "#ec4899", // pink
];

export function assignCourseColor(existingCourseCount: number): number {
  return existingCourseCount % COURSE_COLOR_PALETTE.length;
}

export function courseColorHex(colorIndex: number): string {
  return COURSE_COLOR_PALETTE[colorIndex % COURSE_COLOR_PALETTE.length];
}
