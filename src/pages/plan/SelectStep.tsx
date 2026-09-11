import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import EmptyState from "@/components/EmptyState";
import { effortLabel } from "../../domain/effortPresets";
import { dayLabel, dueRelativeLabel, timeLabel } from "../../domain/planningDate";
import type { PlanningCandidate } from "../../domain/planningCandidates";
import type { Activity } from "../../services/activityService";
import type { Assignment } from "../../services/assignmentService";
import type { WorkItem } from "../../services/workItemService";
import type { WorkSession } from "../../services/workSessionService";
import AlreadyPlannedList from "./AlreadyPlannedList";
import BreakdownNotice, { BreakdownList } from "./BreakdownNotice";

type SelectStepProps = {
  date: string;
  today: string;
  dueThatDay: Assignment[];
  onOpenAssignment: (assignmentId: string) => void;
  courseName: (courseId: string) => string;
  commitments: Activity[];
  workSessions: WorkSession[];
  workItems: WorkItem[];
  assignments: Assignment[];
  movingSessionId: string | null;
  moveTargetDate: string | null;
  moveSubmitting: boolean;
  moveError: string | null;
  moveOverCapacity: boolean;
  moveTargetCapacity: number | null;
  onStartMove: (sessionId: string) => void;
  onCancelMove: () => void;
  onSetMoveTargetDate: (date: string) => void;
  onConfirmMove: (session: WorkSession) => void;
  onRemoveSession: (sessionId: string) => void;
  capacity: number;
  candidates: PlanningCandidate[];
  visibleCandidates: PlanningCandidate[];
  assignmentsNeedingBreakdown: Assignment[];
  onBreakdown: (assignmentId: string) => void;
  onPlanDirectly: (assignment: Assignment) => void;
  planningAssignmentId: string | null;
  onGoToAssignments: () => void;
  chosen: Record<string, number>;
  chosenIds: string[];
  onToggleCandidate: (itemId: string, estimateMinutes: number) => void;
  scheduledElsewhere: Map<string, string>;
  showAll: boolean;
  onShowAll: () => void;
  onNext: () => void;
};

// docs/decisions/20260911-architecture-refactor-proposal.md increment 5
// — Plan's Select step (Step 1 of 4), split out of PlanPage.tsx. Owns no
// state of its own — everything here is either already-lifted App.tsx
// state (date/step) or PlanPage's own local wizard state, passed down —
// this component is purely the composition of the day-context header,
// AlreadyPlannedList, and the candidate list, matching the same "thin
// component" split as EstimateStep/ScheduleStep/ConfirmStep.
export default function SelectStep({
  date,
  today,
  dueThatDay,
  onOpenAssignment,
  courseName,
  commitments,
  workSessions,
  workItems,
  assignments,
  movingSessionId,
  moveTargetDate,
  moveSubmitting,
  moveError,
  moveOverCapacity,
  moveTargetCapacity,
  onStartMove,
  onCancelMove,
  onSetMoveTargetDate,
  onConfirmMove,
  onRemoveSession,
  capacity,
  candidates,
  visibleCandidates,
  assignmentsNeedingBreakdown,
  onBreakdown,
  onPlanDirectly,
  planningAssignmentId,
  onGoToAssignments,
  chosen,
  chosenIds,
  onToggleCandidate,
  scheduledElsewhere,
  showAll,
  onShowAll,
  onNext,
}: SelectStepProps) {
  return (
    <section>
      <h2 className="mb-3 text-base font-medium text-foreground">
        Let&rsquo;s plan {dayLabel(date, today)}.
      </h2>

      {dueThatDay.length > 0 && (
        <ul className="mb-3 flex flex-col gap-1">
          {dueThatDay.map((assignment) => (
            <li key={assignment.id}>
              <button
                type="button"
                onClick={() => onOpenAssignment(assignment.id)}
                className="text-left text-sm text-foreground underline-offset-4 hover:underline"
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

      <AlreadyPlannedList
        workSessions={workSessions}
        workItems={workItems}
        assignments={assignments}
        date={date}
        today={today}
        courseName={courseName}
        movingSessionId={movingSessionId}
        moveTargetDate={moveTargetDate}
        moveSubmitting={moveSubmitting}
        moveError={moveError}
        moveOverCapacity={moveOverCapacity}
        moveTargetCapacity={moveTargetCapacity}
        onStartMove={onStartMove}
        onCancelMove={onCancelMove}
        onSetMoveTargetDate={onSetMoveTargetDate}
        onConfirmMove={onConfirmMove}
        onRemoveSession={onRemoveSession}
      />

      <p className="mt-4 text-sm text-muted-foreground">
        That leaves about{" "}
        <span className="font-medium text-foreground">{effortLabel(Math.max(0, capacity))}</span>{" "}
        of study time.
      </p>

      {candidates.length === 0 ? (
        assignmentsNeedingBreakdown.length > 0 ? (
          <div className="mt-6">
            <h2 className="mb-3 text-base font-medium text-foreground">Nothing to plan yet.</h2>
            <p className="mb-4 text-sm text-muted-foreground">
              {assignmentsNeedingBreakdown.length === 1 ? (
                <>
                  Break &ldquo;{assignmentsNeedingBreakdown[0].title}&rdquo; into steps first, then
                  come back.
                </>
              ) : (
                <>Break these assignments into steps first, then come back.</>
              )}
            </p>
            <BreakdownList
              assignments={assignmentsNeedingBreakdown}
              onBreakdown={onBreakdown}
              onPlanDirectly={onPlanDirectly}
              planningAssignmentId={planningAssignmentId}
            />
          </div>
        ) : (
          <div className="mt-6">
            <EmptyState
              title="Nothing to plan yet."
              hint="Add an assignment, then come back."
              action={<Button onClick={onGoToAssignments}>Add assignment</Button>}
            />
          </div>
        )
      ) : (
        <div className="mt-6">
          <h2 className="mb-3 text-base font-medium text-foreground">What should you work on?</h2>
          <BreakdownNotice
            assignments={assignmentsNeedingBreakdown}
            onBreakdown={onBreakdown}
            onPlanDirectly={onPlanDirectly}
            planningAssignmentId={planningAssignmentId}
          />
          <ul className="flex flex-col gap-2">
            {visibleCandidates.map(({ assignment, workItem }) => {
              const selected = workItem.id in chosen;
              const elsewhereDate = scheduledElsewhere.get(workItem.id);
              return (
                <li key={workItem.id}>
                  <button
                    type="button"
                    aria-pressed={selected}
                    onClick={() => onToggleCandidate(workItem.id, workItem.effortMinutes)}
                    className={`flex min-h-11 w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-colors ${
                      selected ? "border-primary bg-accent/60" : "border-border bg-card"
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`flex size-5 shrink-0 items-center justify-center rounded-full border ${
                        selected ? "border-primary bg-primary text-primary-foreground" : "border-border"
                      }`}
                    >
                      {selected ? <Check className="size-3" /> : null}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-foreground">
                        {workItem.title}
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {assignment.title} · {courseName(assignment.courseId)} ·{" "}
                        {dueRelativeLabel(assignment.dueDate, today)}
                      </span>
                      {elsewhereDate && (
                        <span className="mt-1 inline-block truncate rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                          Also planned for {dayLabel(elsewhereDate, today)}
                        </span>
                      )}
                    </span>
                    <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                      {effortLabel(workItem.effortMinutes)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          {!showAll && candidates.length > 3 && (
            <button
              type="button"
              onClick={onShowAll}
              className="mt-3 text-sm text-primary underline underline-offset-4"
            >
              Show more assignments
            </button>
          )}
          <Button
            size="lg"
            className="mt-6 w-full rounded-2xl"
            disabled={chosenIds.length === 0}
            onClick={onNext}
          >
            Next: estimate time
          </Button>
        </div>
      )}
    </section>
  );
}
