import { timeLabel } from "../../domain/planningDate";
import type { Activity } from "../../services/activityService";
import type { Assignment } from "../../services/assignmentService";

type DayContextProps = {
  dueThatDay: Assignment[];
  commitments: Activity[];
  courseName: (courseId: string) => string;
  onOpenAssignment: (assignmentId: string) => void;
};

// What's already fixed on a day: assignments due and activities. Shared by
// Select's header and the existing-day view (docs/decisions/
// 20260925-existing-day-view.md), so both describe a day the same way.
export default function DayContext({
  dueThatDay,
  commitments,
  courseName,
  onOpenAssignment,
}: DayContextProps) {
  return (
    <>
      {dueThatDay.length > 0 && (
        <ul className="mb-3 flex flex-col gap-1">
          {dueThatDay.map((assignment) => (
            <li key={assignment.id}>
              <button
                type="button"
                onClick={() => onOpenAssignment(assignment.id)}
                className="inline-flex min-h-11 items-center gap-1.5 text-left text-sm text-foreground underline-offset-4 hover:underline"
              >
                Due: {assignment.title}{" "}
                <span className="text-xs text-muted-foreground">
                  {courseName(assignment.courseId)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {commitments.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {commitments.map((activity) => (
            <li
              key={activity.id}
              className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 text-sm"
            >
              <span className="text-foreground">{activity.name}</span>
              <span className="ml-auto text-muted-foreground">
                {timeLabel(activity.startTime)}–{timeLabel(activity.finishTime)}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">Nothing else on that day.</p>
      )}
    </>
  );
}
