import { Button } from "@/components/ui/button";
import EmptyState from "@/components/EmptyState";
import { courseColorValue } from "../../domain/courseColor";
import { dueRelativeLabel } from "../../domain/planningDate";
import type { Assignment } from "../../services/assignmentService";
import type { Course } from "../../services/courseService";

type ComingUpListProps = {
  comingUp: Assignment[];
  today: string;
  courses: Course[];
  courseName: (courseId: string) => string;
  onOpenAssignment: (assignmentId: string) => void;
  onGoToAssignments: () => void;
  onAddAssignment: () => void;
};

// docs/decisions/20260912-page-complexity-reduction-proposal.md increment
// 1 — Home's "Coming up" list, split out of HomePage.tsx.
export default function ComingUpList({
  comingUp,
  today,
  courses,
  courseName,
  onOpenAssignment,
  onGoToAssignments,
  onAddAssignment,
}: ComingUpListProps) {
  return (
    <div className="mt-4">
      <h2 className="mb-2 text-sm font-semibold text-foreground">Coming up</h2>
      {comingUp.length > 0 ? (
        <ul className="flex flex-col gap-1">
          {comingUp.map((assignment) => (
            <li key={assignment.id}>
              <button
                type="button"
                onClick={() => onOpenAssignment(assignment.id)}
                className="flex min-h-11 w-full items-center gap-2 rounded-2xl border border-border bg-card px-4 py-2 text-left text-sm"
              >
                <span
                  aria-hidden="true"
                  className="h-3 w-3 shrink-0 rounded-full"
                  style={{
                    background: courseColorValue(
                      courses.find((c) => c.id === assignment.courseId)?.colorIndex ?? 0,
                    ),
                  }}
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-foreground">{assignment.title}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {courseName(assignment.courseId)}
                  </span>
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {dueRelativeLabel(assignment.dueDate, today)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState
          title="Nothing coming up."
          hint="Capture an assignment to see it here."
          action={<Button onClick={onAddAssignment}>Add an assignment</Button>}
        />
      )}
      {comingUp.length > 0 && (
        <button
          type="button"
          onClick={onGoToAssignments}
          className="mt-2 text-sm text-primary underline underline-offset-4"
        >
          See all assignments
        </button>
      )}
    </div>
  );
}
