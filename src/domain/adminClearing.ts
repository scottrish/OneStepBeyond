// What an admin can clear under an account, and how the confirmation
// describes it (docs/features/admin-account-management-v0.1.md,
// requirement 3). The deleting itself happens in the database
// (admin_clear_account); these ids must match its categories.

export type ClearCategory =
  | "courses"
  | "assignments"
  | "plans"
  | "history"
  | "activities"
  | "study_hours"
  | "support";

export type ClearCategoryInfo = {
  id: ClearCategory;
  label: string;
  /** What else goes with it (dependent data), or null. */
  alsoRemoves: string | null;
};

export const CLEAR_CATEGORIES: ClearCategoryInfo[] = [
  {
    id: "courses",
    label: "Courses and all school work",
    alsoRemoves: "their assignments, steps, planned sessions, plan history, breakdowns, reflections and coaching records",
  },
  {
    id: "assignments",
    label: "Assignments (keeps courses)",
    alsoRemoves: "their steps, planned sessions, breakdowns, reflections and coaching records",
  },
  { id: "plans", label: "Plans (keeps assignments and steps)", alsoRemoves: null },
  { id: "history", label: "Reflections and coaching history", alsoRemoves: null },
  { id: "activities", label: "Activities", alsoRemoves: null },
  { id: "study_hours", label: "Study hours (back to the defaults)", alsoRemoves: null },
  {
    id: "support",
    label: "Support relationships",
    alsoRemoves: "pending invitations — and the other person loses access at once",
  },
];

export const ALL_CATEGORIES: ClearCategory[] = CLEAR_CATEGORIES.map((category) => category.id);

export function isAllCategories(chosen: ClearCategory[]): boolean {
  return ALL_CATEGORIES.every((id) => chosen.includes(id));
}

// The database's per-table counts, in words: [singular, plural].
const TABLE_WORDS: Record<string, [string, string]> = {
  courses: ["course", "courses"],
  assignments: ["assignment", "assignments"],
  work_items: ["step", "steps"],
  work_sessions: ["planned session", "planned sessions"],
  planning_sessions: ["plan history entry", "plan history entries"],
  decomposition_attempts: ["breakdown record", "breakdown records"],
  reflections: ["reflection", "reflections"],
  coaching_interactions: ["coaching record", "coaching records"],
  activities: ["activity", "activities"],
  student_preferences: ["study hours setting", "study hours settings"],
  support_relationships: ["support relationship", "support relationships"],
};

const TABLE_ORDER = Object.keys(TABLE_WORDS);

/** "3 assignments", "1 step" … in a fixed order; empty when nothing would go. */
export function removalLines(counts: Record<string, number>): string[] {
  return TABLE_ORDER.filter((table) => (counts[table] ?? 0) > 0).map((table) => {
    const n = counts[table]!;
    const [one, many] = TABLE_WORDS[table]!;
    return `${n} ${n === 1 ? one : many}`;
  });
}

/** Typing the account's email to confirm "All data" (A7): spaces and case don't matter. */
export function emailConfirmed(typed: string, email: string): boolean {
  return typed.trim().toLowerCase() === email.trim().toLowerCase() && email.trim() !== "";
}
