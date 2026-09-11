import { ArrowRightLeft, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { effortLabel } from "../../domain/effortPresets";
import { addDaysISODate, dayLabel, shortDayLabel, timeLabel } from "../../domain/planningDate";
import type { Assignment } from "../../services/assignmentService";
import type { WorkItem } from "../../services/workItemService";
import type { WorkSession } from "../../services/workSessionService";

// Today + next 4 days — same day-picker-strip window PlanPage's own day
// chips use (docs/features/daily-planning.md).
const DAY_STRIP_LENGTH = 5;

type AlreadyPlannedListProps = {
  workSessions: WorkSession[];
  workItems: WorkItem[];
  assignments: Assignment[];
  date: string;
  today: string;
  courseName: (courseId: string) => string;
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
};

// docs/decisions/20260911-architecture-refactor-proposal.md increment 5
// — Select step's "Already planned" list and its "Move to another day"
// sub-panel (docs/features/iterations/daily-planning/daily-planning.i04.md
// FR-3), split out of PlanPage.tsx. A self-contained sub-feature with its
// own move-in-progress state, owned by the caller (PlanPage) rather than
// here, since a move outcome (moveError in particular) also needs to
// stay visible if this list re-renders around it.
export default function AlreadyPlannedList({
  workSessions,
  workItems,
  assignments,
  date,
  today,
  courseName,
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
}: AlreadyPlannedListProps) {
  if (workSessions.length === 0) return null;

  return (
    <>
      <h3 className="mt-5 mb-2 text-sm font-semibold text-foreground">Already planned</h3>
      <ul className="flex flex-col gap-1">
        {workSessions.map((session) => {
          const item = workItems.find((w) => w.id === session.workItemId);
          const assignment = item ? assignments.find((a) => a.id === item.assignmentId) : undefined;
          const done = session.status === "done";
          const itemLabel = item?.title ?? "this session";
          const moving = movingSessionId === session.id;
          return (
            <li key={session.id} className="flex flex-col gap-2">
              <div className="flex items-center gap-2 text-sm text-foreground">
                {done ? (
                  <Check className="size-3.5 shrink-0 text-primary" aria-hidden="true" />
                ) : (
                  <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-primary" />
                )}
                <span className={`min-w-0 flex-1 ${done ? "line-through opacity-60" : ""}`}>
                  <span className="block truncate">{item?.title ?? "Study session"}</span>
                  {item && assignment && (
                    <span className="block truncate text-xs text-muted-foreground">
                      {assignment.title} · {courseName(assignment.courseId)}
                    </span>
                  )}
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {session.startTime ? `${timeLabel(session.startTime)} · ` : ""}
                  {effortLabel(session.plannedMinutes)}
                </span>
                {!done && (
                  <>
                    <Button
                      aria-label={`Move ${itemLabel} to another day`}
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      onClick={() => (moving ? onCancelMove() : onStartMove(session.id))}
                    >
                      <ArrowRightLeft className="size-3.5 text-muted-foreground" />
                    </Button>
                    <Button
                      aria-label={`Remove ${itemLabel} from ${dayLabel(date, today)}'s plan`}
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      onClick={() => onRemoveSession(session.id)}
                    >
                      <X className="size-3.5 text-muted-foreground" />
                    </Button>
                  </>
                )}
              </div>

              {moving && (
                <div className="rounded-2xl border border-border bg-card p-3">
                  <p className="mb-2 text-xs font-medium text-foreground">
                    Move &ldquo;{itemLabel}&rdquo; to:
                  </p>
                  <div
                    role="radiogroup"
                    aria-label={`Choose a day to move ${itemLabel} to`}
                    className="mb-2 flex flex-wrap gap-2"
                  >
                    {Array.from({ length: DAY_STRIP_LENGTH }, (_, i) => addDaysISODate(today, i))
                      .filter((d) => d !== date)
                      .map((d) => {
                        const active = d === moveTargetDate;
                        return (
                          <button
                            key={d}
                            type="button"
                            role="radio"
                            aria-checked={active}
                            onClick={() => onSetMoveTargetDate(d)}
                            className={`min-h-11 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                              active
                                ? "border-primary bg-accent/60 text-foreground"
                                : "border-border bg-card text-muted-foreground"
                            }`}
                          >
                            {shortDayLabel(d, today)}
                          </button>
                        );
                      })}
                  </div>

                  {moveOverCapacity && moveTargetDate && (
                    <p className="mb-2 rounded-2xl bg-attention px-3 py-2 text-xs text-attention-foreground">
                      This is {effortLabel(session.plannedMinutes - (moveTargetCapacity ?? 0))} more
                      than {dayLabel(moveTargetDate, today)} has. That is worth knowing now rather
                      than at 10pm.
                    </p>
                  )}

                  {moveError && (
                    <p role="alert" className="mb-2 text-xs text-destructive">
                      {moveError}
                    </p>
                  )}

                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-2xl"
                      disabled={moveSubmitting}
                      onClick={onCancelMove}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 rounded-2xl"
                      disabled={!moveTargetDate || moveSubmitting}
                      onClick={() => onConfirmMove(session)}
                    >
                      Move here
                    </Button>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </>
  );
}
