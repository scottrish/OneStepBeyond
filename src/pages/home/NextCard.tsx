import { Button } from "@/components/ui/button";
import EmptyState from "@/components/EmptyState";
import { effortLabel } from "../../domain/effortPresets";
import type { Activity } from "../../services/activityService";
import type { Assignment } from "../../services/assignmentService";
import type { WorkItem } from "../../services/workItemService";
import type { WorkSession } from "../../services/workSessionService";

type NextCardProps = {
  next: WorkSession | undefined;
  todaySessions: WorkSession[];
  activeTodaySessions: WorkSession[];
  totalPlannedMinutes: number;
  planSummaryActivity: Activity | undefined;
  workItems: WorkItem[];
  assignments: Assignment[];
  courseName: (courseId: string) => string;
  onStart: () => void;
  onOpenAssignment: (assignmentId: string) => void;
  onGoToPlan: () => void;
};

// docs/decisions/20260912-page-complexity-reduction-proposal.md increment
// 1 — Home's own hero card (its 3-way state: an active/continuable
// session, "everything for today is done," or "no plan yet"), its "After
// that" list, and the plan-summary line beneath it — split out of
// HomePage.tsx as one unit, since all three are gated by the same `next`
// value and read together as one piece of the screen.
export default function NextCard({
  next,
  todaySessions,
  activeTodaySessions,
  totalPlannedMinutes,
  planSummaryActivity,
  workItems,
  assignments,
  courseName,
  onStart,
  onOpenAssignment,
  onGoToPlan,
}: NextCardProps) {
  return (
    <>
      {next ? (
        <div className="mt-6 rounded-3xl bg-primary p-6 text-primary-foreground">
          <p className="text-sm opacity-80">Next</p>
          <p className="mt-1 text-xl font-medium">
            {workItems.find((w) => w.id === next.workItemId)?.title ?? "Study session"}
          </p>
          {(() => {
            const item = workItems.find((w) => w.id === next.workItemId);
            const assignment = item ? assignments.find((a) => a.id === item.assignmentId) : undefined;
            return (
              assignment && (
                <button
                  type="button"
                  onClick={() => onOpenAssignment(assignment.id)}
                  className="mt-1 block text-left text-sm opacity-80 underline-offset-4 hover:underline"
                >
                  {assignment.title} · {courseName(assignment.courseId)}
                </button>
              )
            );
          })()}
          <p className="mt-1 text-sm opacity-80">{effortLabel(next.plannedMinutes)}</p>
          <Button size="lg" variant="secondary" className="mt-4 w-full rounded-2xl" onClick={onStart}>
            {next.status === "planned" ? "Start" : "Continue"}
          </Button>
        </div>
      ) : todaySessions.length > 0 ? (
        // Every session for today is done — today-execution.md's own calm
        // confirmation, reused here rather than falling through to the
        // "no plan yet" empty state, which would wrongly imply nothing
        // was ever planned.
        <div className="mt-6 rounded-3xl bg-primary p-6 text-primary-foreground">
          <p className="text-xl font-medium">That&rsquo;s everything for today.</p>
          <p className="mt-1 text-sm opacity-80">
            You did what you said you would. The evening is yours.
          </p>
        </div>
      ) : (
        <div className="mt-6">
          <EmptyState
            title="No plan for today yet."
            hint="Planning takes about five minutes and makes the rest of the day easier."
            action={<Button onClick={onGoToPlan}>Plan today</Button>}
          />
        </div>
      )}

      {next && activeTodaySessions.length > 1 && (
        <div className="mt-3">
          <h3 className="mb-2 text-sm font-semibold text-foreground">After that</h3>
          <ul className="flex flex-col gap-1">
            {activeTodaySessions.slice(1).map((session) => {
              const item = workItems.find((w) => w.id === session.workItemId);
              return (
                <li key={session.id} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="min-w-0 flex-1 truncate">{item?.title ?? "Study session"}</span>
                  <span className="shrink-0 text-xs">{effortLabel(session.plannedMinutes)}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {next && (
        <p className="mt-3 text-sm text-muted-foreground">
          Today&rsquo;s plan: about {effortLabel(totalPlannedMinutes)} · {todaySessions.length}{" "}
          {todaySessions.length === 1 ? "task" : "tasks"}
          {planSummaryActivity && <> · before {planSummaryActivity.name}</>} ·{" "}
          <button type="button" onClick={onGoToPlan} className="text-primary underline underline-offset-4">
            View plan
          </button>
        </p>
      )}
    </>
  );
}
