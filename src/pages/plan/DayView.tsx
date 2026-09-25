import { Check, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import MobileActionBar from "@/components/MobileActionBar";
import SwipeActionRow from "@/components/SwipeActionRow";
import { effortLabel } from "../../domain/effortPresets";
import { dayLabel, longPlanDate, timeLabel } from "../../domain/planningDate";
import { sortByStartTime } from "../../domain/sessionOrder";
import type { Activity } from "../../services/activityService";
import type { Assignment } from "../../services/assignmentService";
import type { WorkItem } from "../../services/workItemService";
import type { WorkSession } from "../../services/workSessionService";
import DayContext from "./DayContext";

type DayViewProps = {
  date: string;
  today: string;
  capacity: number;
  dueThatDay: Assignment[];
  commitments: Activity[];
  workSessions: WorkSession[];
  workItems: WorkItem[];
  assignments: Assignment[];
  courseName: (courseId: string) => string;
  // Shown right after the wizard's "Looks good" lands here.
  justConfirmed: boolean;
  onOpenAssignment: (assignmentId: string) => void;
  onEditSession: (sessionId: string) => void;
  onRemoveSession: (session: WorkSession) => void;
  onStartExecution: () => void;
  onAddMore: () => void;
  onDone: () => void;
};

// Plan's existing-day view — docs/decisions/20260925-existing-day-view.md.
// Shown instead of Select when the chosen day already has a plan: what's
// due, the day's activities, and each session in time order, with its
// time over its length. Planned sessions open the edit sheet (Move to
// another day, Remove) or swipe left to Remove; started and done
// sessions are read-only. Adding work goes through the wizard, which
// only ever adds (docs/decisions/20260925-confirm-plan-appends.md).
export default function DayView({
  date,
  today,
  capacity,
  dueThatDay,
  commitments,
  workSessions,
  workItems,
  assignments,
  courseName,
  justConfirmed,
  onOpenAssignment,
  onEditSession,
  onRemoveSession,
  onStartExecution,
  onAddMore,
  onDone,
}: DayViewProps) {
  const sessions = sortByStartTime(workSessions.filter((session) => session.date === date));
  const isToday = date === today;
  const hasOpenWork = sessions.some((session) => session.status !== "done");

  return (
    <section>
      <h2 className="mb-3 text-base font-medium text-foreground">
        {isToday ? "Today’s plan" : `Your plan for ${longPlanDate(date)}`}
      </h2>

      {justConfirmed && (
        <p role="status" className="mb-3 rounded-2xl bg-accent/70 px-4 py-3 text-sm text-accent-foreground">
          Plan confirmed.
        </p>
      )}

      {isToday && hasOpenWork && (
        <Button size="lg" className="mb-4 w-full" onClick={onStartExecution}>
          Start today’s plan
        </Button>
      )}

      <DayContext
        dueThatDay={dueThatDay}
        commitments={commitments}
        courseName={courseName}
        onOpenAssignment={onOpenAssignment}
      />

      <h3 className="mt-5 mb-2 text-sm font-semibold text-foreground">
        Planned for {dayLabel(date, today)}
      </h3>
      {sessions.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nothing planned for this day yet.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {sessions.map((session) => {
            const item = workItems.find((w) => w.id === session.workItemId);
            const assignment = item ? assignments.find((a) => a.id === item.assignmentId) : undefined;
            const title = item?.title ?? "Study session";
            const planned = session.status === "planned";
            const done = session.status === "done";
            const row = (
              <div className="flex items-center gap-3 rounded-2xl border border-border bg-card py-2 pr-2 pl-4">
                {done ? (
                  <Check aria-hidden="true" className="size-4 shrink-0 text-primary" />
                ) : null}
                <span className={`min-w-0 flex-1 ${done ? "text-muted-foreground line-through" : ""}`}>
                  <span className="block truncate text-sm font-medium text-foreground">{title}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {assignment ? `${assignment.title} · ${courseName(assignment.courseId)}` : ""}
                    {session.status === "in_progress" ? (assignment ? " · Started" : "Started") : ""}
                  </span>
                </span>
                <span className="shrink-0 text-right text-xs text-muted-foreground">
                  {session.startTime ? (
                    <span className="block font-medium text-foreground">
                      {timeLabel(session.startTime)}
                    </span>
                  ) : null}
                  {effortLabel(session.plannedMinutes)}
                </span>
                {planned ? (
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Edit ${title}`}
                    className="shrink-0 rounded-full"
                    onClick={() => onEditSession(session.id)}
                  >
                    <Pencil className="size-4 text-muted-foreground" />
                  </Button>
                ) : (
                  // Keeps the time column aligned with editable rows.
                  <span aria-hidden="true" className="size-11 shrink-0" />
                )}
              </div>
            );
            return (
              <li key={session.id}>
                {planned ? (
                  <SwipeActionRow
                    id={`day-${session.id}`}
                    label={`${title} from ${dayLabel(date, today)}'s plan`}
                    actionLabel="Remove"
                    onAction={() => onRemoveSession(session)}
                    className="rounded-2xl"
                  >
                    {row}
                  </SwipeActionRow>
                ) : (
                  row
                )}
              </li>
            );
          })}
        </ul>
      )}

      <p className="mt-4 text-sm text-muted-foreground">
        That leaves about{" "}
        <span className="font-medium text-foreground">{effortLabel(Math.max(0, capacity))}</span>{" "}
        of study time.
      </p>

      <MobileActionBar>
        <Button size="lg" className="flex-1" onClick={onAddMore}>
          Add more work
        </Button>
        <Button size="lg" variant="ghost" onClick={onDone}>
          Done
        </Button>
      </MobileActionBar>
    </section>
  );
}
