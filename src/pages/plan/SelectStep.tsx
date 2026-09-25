import { Button } from "@/components/ui/button";
import MobileActionBar from "@/components/MobileActionBar";
import EmptyState from "@/components/EmptyState";
import { effortLabel } from "../../domain/effortPresets";
import { dayLabel } from "../../domain/planningDate";
import type { SelectRow } from "../../domain/planningCandidates";
import type { Activity } from "../../services/activityService";
import type { Assignment } from "../../services/assignmentService";
import CandidateRow from "./CandidateRow";
import DayContext from "./DayContext";

type SelectStepProps = {
  date: string;
  today: string;
  dueThatDay: Assignment[];
  onOpenAssignment: (assignmentId: string) => void;
  courseName: (courseId: string) => string;
  commitments: Activity[];
  capacity: number;
  // Every row, in order: open steps, "no steps yet" and "all steps done"
  // assignments (daily-planning-and-completion-v2-proposal.md items 4 and
  // 6a — no three-row cap).
  rows: SelectRow[];
  onFinishAssignment: (assignment: Assignment) => void;
  onGoToAssignments: () => void;
  chosen: Record<string, number>;
  chosenIds: string[];
  onToggleCandidate: (itemId: string, estimateMinutes: number) => void;
  scheduledElsewhere: Map<string, string>;
  // workItemId -> minutes already planned (not done) on the chosen day.
  plannedOnDay: Map<string, number>;
  // The assignment Plan was opened for (item 1): its rows come first and are marked.
  highlightedAssignmentId: string | null;
  onNext: () => void;
};

// docs/decisions/20260911-architecture-refactor-proposal.md increment 5
// — Plan's Select step (Step 1 of 4), split out of PlanPage.tsx. Owns no
// state of its own; each row is a CandidateRow. Breakdown choices aren't
// offered here any more: a "no steps yet" row opens Assignment Detail,
// the one place for them (docs/decisions/20260925-plan-rows-and-one-piece.md).
export default function SelectStep({
  date,
  today,
  dueThatDay,
  onOpenAssignment,
  courseName,
  commitments,
  capacity,
  rows,
  onFinishAssignment,
  onGoToAssignments,
  chosen,
  chosenIds,
  onToggleCandidate,
  scheduledElsewhere,
  plannedOnDay,
  highlightedAssignmentId,
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

      {rows.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            title="Nothing to plan yet."
            hint="Add an assignment, then come back."
            action={<Button onClick={onGoToAssignments}>Add assignment</Button>}
          />
        </div>
      ) : (
        <div className="mt-6">
          <h2 className="mb-3 text-base font-medium text-foreground">What should you work on?</h2>
          <ul className="flex flex-col gap-2">
            {rows.map((row) => {
              const workItemId = row.kind === "task" ? row.workItem.id : undefined;
              return (
                <li key={workItemId ?? `${row.kind}-${row.assignment.id}`}>
                  <CandidateRow
                    row={row}
                    date={date}
                    today={today}
                    courseName={courseName}
                    highlighted={row.assignment.id === highlightedAssignmentId}
                    selected={workItemId !== undefined && workItemId in chosen}
                    minutesOnThisDay={workItemId ? plannedOnDay.get(workItemId) : undefined}
                    elsewhereDate={workItemId ? scheduledElsewhere.get(workItemId) : undefined}
                    onToggle={() => {
                      if (row.kind === "task") onToggleCandidate(row.workItem.id, row.workItem.effortMinutes);
                    }}
                    onOpenAssignment={() => onOpenAssignment(row.assignment.id)}
                    onFinish={() => onFinishAssignment(row.assignment)}
                  />
                </li>
              );
            })}
          </ul>
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
