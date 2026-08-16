// docs/features/coach-parent-dashboard-feature-spec-v0.1.md §5 — a
// client-side display toggle only, not a backend access level. See the
// spec's Implementation Note and
// docs/decisions/20260816-dashboard-reuses-student-auth.md.
export type DashboardMode = "coach" | "parent" | "diagnostic";

// docs/features/coach-parent-dashboard-feature-spec-v0.1.md §30 —
// Phase 1's screen set.
export type DashboardScreen =
  | "overview"
  | "assignments"
  | "reflections"
  | "timeline"
  | "diagnostics";
