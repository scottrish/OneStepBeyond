import { CalendarDays, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import MobileActionBar from "@/components/MobileActionBar";
import EmptyState from "@/components/EmptyState";
import { effortLabel } from "../../domain/effortPresets";
import { dayLabel, dueRelativeLabel } from "../../domain/planningDate";
import type { PlanningCandidate } from "../../domain/planningCandidates";
import type { Activity } from "../../services/activityService";
import type { Assignment } from "../../services/assignmentService";
import DayContext from "./DayContext";
import BreakdownNotice, { BreakdownList } from "./BreakdownNotice";

type SelectStepProps = {
  date: string;
  today: string;
  dueThatDay: Assignment[];
  onOpenAssignment: (assignmentId: string) => void;
  courseName: (courseId: string) => string;
  commitments: Activity[];
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
  // workItemId -> minutes already planned (not done) on the chosen day.
  plannedOnDay: Map<string, number>;
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
  plannedOnDay,
  showAll,
  onShowAll,
  onNext,
}: SelectStepProps) {
  return (
    <section>
      <h2 className="mb-3 text-base font-medium text-foreground">
        Let&rsquo;s plan {dayLabel(date, today)}.
      </h2>

      <DayContext
        dueThatDay={dueThatDay}
        commitments={commitments}
        courseName={courseName}
        onOpenAssignment={onOpenAssignment}
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
              // Already has a not-done session on this day: can't be added a
              // second time (docs/decisions/20260925-confirm-plan-appends.md
              // point 3; daily-planning-and-completion-v2-proposal.md 6b/6c).
              // Shown with a dashed border and a note saying why, at full
              // text contrast — not dimmed, since the row still carries
              // information the student needs.
              const minutesOnThisDay = plannedOnDay.get(workItem.id);
              const onThisDay = minutesOnThisDay !== undefined;
              const noteId = `planned-on-day-${workItem.id}`;
              return (
                <li key={workItem.id}>
                  <button
                    type="button"
                    aria-pressed={selected}
                    disabled={onThisDay}
                    aria-describedby={onThisDay ? noteId : undefined}
                    onClick={() => onToggleCandidate(workItem.id, workItem.effortMinutes)}
                    className={`flex min-h-11 w-full items-center gap-3 rounded-2xl border px-4 py-3 text-left transition-colors disabled:cursor-not-allowed ${
                      onThisDay
                        ? "border-dashed border-border bg-muted/40"
                        : selected
                          ? "border-primary bg-accent/60"
                          : "border-border bg-card"
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
                      {onThisDay && (
                        <span
                          id={noteId}
                          className="mt-1 flex items-center gap-1 text-xs font-medium text-primary"
                        >
                          <CalendarDays aria-hidden="true" className="size-3" />
                          Planned {date === today ? "today" : "this day"} ·{" "}
                          {effortLabel(minutesOnThisDay)}
                        </span>
                      )}
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
              className="mt-3 inline-flex min-h-11 items-center text-sm text-primary underline underline-offset-4"
            >
              Show more assignments
            </button>
          )}
          <MobileActionBar>
            <Button
              size="lg"
              className="w-full rounded-2xl"
              disabled={chosenIds.length === 0}
              onClick={onNext}
            >
              Next: estimate time
            </Button>
          </MobileActionBar>
        </div>
      )}
    </section>
  );
}
