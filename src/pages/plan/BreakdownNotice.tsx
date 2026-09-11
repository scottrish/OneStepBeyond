import { Button } from "@/components/ui/button";
import type { Assignment } from "../../services/assignmentService";

// docs/decisions/20260911-architecture-refactor-proposal.md increment 5
// — split out of PlanPage.tsx alongside the Select step, since both are
// Select-only helpers. The pair of actions shown by FR-1's signal for
// each assignment that hasn't been broken down yet, shared between
// Select's all-candidates-need-it dead end and its mixed-case notice
// (BreakdownNotice below) so the markup isn't duplicated. Not every
// assignment benefits from decomposition — a short, atomic task ("Read
// chapter 1 by Tuesday") gains nothing from a forced multi-step
// breakdown, so "Plan ... as one task" is offered as an equally direct
// alternative to "Break down ...", not buried behind it. It creates a
// single Work Item matching the assignment's own title/estimate via the
// same workBreakdownService.confirmWorkBreakdown the full breakdown flow
// uses (see PlanPage's own planWithoutBreakdown) — reusing the existing
// abstraction rather than a parallel "unbroken-down schedulable
// assignment" concept.
export function BreakdownList({
  assignments,
  onBreakdown,
  onPlanDirectly,
  planningAssignmentId,
}: {
  assignments: Assignment[];
  onBreakdown: (assignmentId: string) => void;
  onPlanDirectly: (assignment: Assignment) => void;
  planningAssignmentId: string | null;
}) {
  return (
    <ul className="flex flex-col gap-2">
      {assignments.map((assignment) => (
        <li key={assignment.id} className="flex flex-col gap-2">
          <Button
            type="button"
            variant="outline"
            className="min-h-11 w-full justify-start rounded-2xl text-left"
            onClick={() => onBreakdown(assignment.id)}
          >
            Break down &ldquo;{assignment.title}&rdquo;
          </Button>
          <Button
            type="button"
            variant="ghost"
            disabled={planningAssignmentId === assignment.id}
            className="min-h-11 w-full justify-start rounded-2xl text-left text-muted-foreground"
            onClick={() => onPlanDirectly(assignment)}
          >
            {planningAssignmentId === assignment.id
              ? "Planning…"
              : `Plan “${assignment.title}” as one task instead`}
          </Button>
        </li>
      ))}
    </ul>
  );
}

// The inline "these assignments still need breaking down" notice, shown
// within Select whenever some (not necessarily all) of the day's
// assignments need it — i.e. real, already-selectable candidates exist
// too, so Select's own dead-end state doesn't apply. Iteration 2's
// assessment (FINDING-DP-001, docs/features/iterations/daily-planning/
// daily-planning.i03.md) found the previous version of this signal only
// fired when Select's candidate list was entirely empty, so a day with a
// mix of already-broken-down and not-yet-broken-down assignments silently
// omitted the latter with no explanation at all. This component is now
// rendered whenever assignmentsNeedingBreakdown is non-empty, regardless
// of whether other, already-selectable candidates also exist.
export default function BreakdownNotice({
  assignments,
  onBreakdown,
  onPlanDirectly,
  planningAssignmentId,
}: {
  assignments: Assignment[];
  onBreakdown: (assignmentId: string) => void;
  onPlanDirectly: (assignment: Assignment) => void;
  planningAssignmentId: string | null;
}) {
  if (assignments.length === 0) return null;
  return (
    <div className="mb-4 rounded-2xl border border-border bg-card p-4">
      <p className="mb-3 text-sm text-foreground">
        {assignments.length === 1 ? (
          <>
            &ldquo;{assignments[0].title}&rdquo; needs to be broken into steps before it can be
            scheduled &mdash; or, if it&rsquo;s not worth breaking down, plan it as one task.
          </>
        ) : (
          <>
            {assignments.length} assignments need to be broken into steps before they can be
            scheduled &mdash; or plan any of them as one task instead.
          </>
        )}
      </p>
      <BreakdownList
        assignments={assignments}
        onBreakdown={onBreakdown}
        onPlanDirectly={onPlanDirectly}
        planningAssignmentId={planningAssignmentId}
      />
    </div>
  );
}
