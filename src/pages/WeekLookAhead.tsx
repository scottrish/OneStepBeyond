import { Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { effortLabel } from "../domain/effortPresets";
import { addDaysISODate, daysBetween, longPlanDate } from "../domain/planningDate";
import { activitiesOn, availableMinutes, capacityPhrase } from "../domain/studyCapacity";
import type { Activity } from "../services/activityService";
import type { Assignment } from "../services/assignmentService";
import type { Preferences } from "../services/preferencesService";
import type { WorkItem } from "../services/workItemService";
import { useWeekSessions } from "../hooks/useWeekSessions";

// docs/features/week-lookahead.md — a read-only, seven-day orientation
// view reached from Plan's own "Look ahead" tab (not a separate bottom-
// nav destination, and not a calendar grid — see that spec's Explicitly
// Out of Scope). Ported from
// ../OneStepBeyondPrototype/src/components/efc/LookAhead.tsx, adapted to
// this app's own data shapes/hooks.
const WEEK_LENGTH = 7;
// Only call out a missing plan when it's actually consequential — see
// week-lookahead.md's Signal-to-noise rule.
const DUE_SOON_DAYS = 2;

const errorBoxStyle =
  "mb-4 rounded-lg border border-destructive bg-card p-3 text-sm text-card-foreground";

// Same local 12-hour formatter PlanPage.tsx/ActivitiesPage.tsx/
// HomePage.tsx already each keep their own copy of — presentation-only,
// not worth sharing as a domain module for the same reason those files
// don't.
function timeLabel(value: string): string {
  const [hours, minutes] = value.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const twelveHour = hours % 12 === 0 ? 12 : hours % 12;
  return `${twelveHour}:${String(minutes).padStart(2, "0")} ${period}`;
}

type WeekLookAheadProps = {
  studentId: string;
  activities: Activity[];
  assignments: Assignment[];
  workItems: WorkItem[];
  preferences: Preferences;
  today: string;
  courseName: (courseId: string) => string;
  onPickDay: (date: string) => void;
  onOpenAssignment: (assignmentId: string) => void;
};

export default function WeekLookAhead({
  studentId,
  activities,
  assignments,
  workItems,
  preferences,
  today,
  courseName,
  onPickDay,
  onOpenAssignment,
}: WeekLookAheadProps) {
  const {
    sessions,
    loading,
    loadError,
    actionError,
    retry,
    removeSession,
  } = useWeekSessions(studentId);

  const days = Array.from({ length: WEEK_LENGTH }, (_, i) => addDaysISODate(today, i));

  return (
    <section>
      {loadError && (
        <div role="alert" className={errorBoxStyle}>
          <p className="mb-2">Couldn&rsquo;t load the week ahead.</p>
          <Button onClick={retry}>Try again</Button>
        </div>
      )}

      {actionError && (
        <p role="alert" className={errorBoxStyle}>
          {actionError}
        </p>
      )}

      {!loading && !loadError && (
        <ul className="flex flex-col gap-4">
          {days.map((date) => {
            const dayActivities = activitiesOn(activities, date);
            const daySessions = sessions.filter((session) => session.date === date);
            const dueThatDay = assignments.filter(
              (assignment) => !assignment.completedAt && assignment.dueDate === date,
            );
            const free = availableMinutes(activities, sessions, date, preferences);
            // "Nothing is scheduled for it" means the *assignment*, not
            // literally "this day" — a session planned for today against
            // something due Tuesday is still real, already-addressed
            // preparation. Checking only daySessions here would flag a
            // due-soon assignment as unaddressed just because its already-
            // scheduled work happens to sit on an earlier day.
            const dueSoonUnaddressed =
              daysBetween(today, date) <= DUE_SOON_DAYS &&
              dueThatDay.some(
                (assignment) =>
                  !sessions.some((session) => {
                    const item = workItems.find((w) => w.id === session.workItemId);
                    return item?.assignmentId === assignment.id;
                  }),
              );

            return (
              <li key={date} className="rounded-3xl border border-border bg-card px-5 py-4">
                <div className="flex items-baseline justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => onPickDay(date)}
                    className="text-left text-sm font-semibold text-foreground underline-offset-4 hover:underline"
                  >
                    {date === today ? "Today" : longPlanDate(date)}
                  </button>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {capacityPhrase(free)}
                  </span>
                </div>

                {dueThatDay.length > 0 && (
                  <ul className="mt-3 flex flex-col gap-1">
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

                {dayActivities.length > 0 && (
                  <ul className="mt-3 flex flex-col gap-1">
                    {dayActivities.map((activity) => (
                      <li key={activity.id} className="text-sm text-muted-foreground">
                        {timeLabel(activity.startTime)}–{timeLabel(activity.finishTime)} ·{" "}
                        {activity.name}
                      </li>
                    ))}
                  </ul>
                )}

                {daySessions.length > 0 ? (
                  <ul className="mt-3 flex flex-col gap-1">
                    {daySessions.map((session) => {
                      const item = workItems.find((w) => w.id === session.workItemId);
                      const assignment = item
                        ? assignments.find((a) => a.id === item.assignmentId)
                        : undefined;
                      const done = session.status === "done";
                      return (
                        <li key={session.id} className="flex items-center gap-2 text-sm">
                          {done ? (
                            <Check className="size-3.5 shrink-0 text-primary" aria-hidden="true" />
                          ) : (
                            <span
                              aria-hidden="true"
                              className="size-1.5 shrink-0 rounded-full bg-primary"
                            />
                          )}
                          <span className={`min-w-0 flex-1 ${done ? "line-through opacity-60" : ""}`}>
                            <span className="block truncate text-foreground">
                              {item?.title ?? "Study session"}
                            </span>
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
                            <Button
                              aria-label={`Remove ${item?.title ?? "this session"} from ${date === today ? "today" : longPlanDate(date)}'s plan`}
                              variant="ghost"
                              size="icon"
                              onClick={() => removeSession(session.id)}
                            >
                              <X className="size-3.5 text-muted-foreground" />
                            </Button>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                ) : dueSoonUnaddressed ? (
                  <p className="mt-3 text-sm text-attention-foreground">
                    Preparation still needs a plan.
                  </p>
                ) : dayActivities.length === 0 ? (
                  <p className="mt-3 text-sm text-muted-foreground">Nothing scheduled.</p>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
