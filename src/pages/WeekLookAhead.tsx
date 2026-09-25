import { useState } from "react";
import { ArrowDown, ArrowUp, Check, X } from "lucide-react";
import DismissableAlert from "@/components/DismissableAlert";
import RowActionsMenu from "@/components/RowActionsMenu";
import SortableList from "@/components/SortableList";
import SwipeActionRow from "@/components/SwipeActionRow";
import ErrorBanner from "../components/ErrorBanner";
import { activityBlocks, rechainDay } from "../domain/defaultStartTimes";
import { effortLabel } from "../domain/effortPresets";
import { addDaysISODate, daysBetween, longPlanDate, timeLabel } from "../domain/planningDate";
import { moveItem } from "../domain/reorder";
import { changedStartTimes, sortByStartTime } from "../domain/sessionOrder";
import {
  activitiesOn,
  availableMinutes,
  capacityPhrase,
  studySlots,
} from "../domain/studyCapacity";
import type { Activity } from "../services/activityService";
import type { Assignment } from "../services/assignmentService";
import type { Preferences } from "../services/preferencesService";
import type { WorkItem } from "../services/workItemService";
import type { WorkSession } from "../services/workSessionService";
import { useWeekSessions } from "../hooks/useWeekSessions";
import { MIDNIGHT_MESSAGE } from "./plan/useSessionEditing";

// docs/features/week-lookahead.md — a seven-day orientation view (its
// planned sessions can be reordered and removed, docs/decisions/
// 20260925-session-reorder-and-drag.md) reached from Plan's own "Look ahead" tab (not a separate bottom-
// nav destination, and not a calendar grid — see that spec's Explicitly
// Out of Scope). Ported from
// ../OneStepBeyondPrototype/src/components/efc/LookAhead.tsx, adapted to
// this app's own data shapes/hooks.
const WEEK_LENGTH = 7;
// Only call out a missing plan when it's actually consequential — see
// week-lookahead.md's Signal-to-noise rule.
const DUE_SOON_DAYS = 2;

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
    retimeSessions,
  } = useWeekSessions(studentId);
  // A refused reorder's explanation, shown under the day it happened on.
  const [reorderError, setReorderError] = useState<{ date: string; message: string } | null>(
    null,
  );

  // The same re-chain as Plan's day view (daily-planning-and-completion-
  // v2-proposal.md item 2): the day's planned sessions in the new order,
  // around its started/done sessions and activities; saved immediately.
  function reorderDay(date: string, orderedIds: string[]) {
    setReorderError(null);
    const daySessions = sessions.filter((session) => session.date === date);
    const planned = orderedIds.filter((id) =>
      daySessions.some((session) => session.id === id && session.status === "planned"),
    );
    const times = rechainDay(
      daySessions,
      planned,
      studySlots(activities, date, preferences),
      activityBlocks(activitiesOn(activities, date)),
    );
    if (!times) {
      setReorderError({ date, message: MIDNIGHT_MESSAGE });
      return;
    }
    void retimeSessions(changedStartTimes(daySessions, times));
  }

  function titleOf(session: WorkSession): string {
    return workItems.find((w) => w.id === session.workItemId)?.title ?? "Study session";
  }

  const days = Array.from({ length: WEEK_LENGTH }, (_, i) => addDaysISODate(today, i));

  return (
    <section>
      {loadError && <ErrorBanner message="Couldn’t load the week ahead." onRetry={retry} />}

      {actionError && <ErrorBanner message={actionError} />}

      {!loading && !loadError && (
        <ul className="flex flex-col gap-4">
          {days.map((date) => {
            const dayActivities = activitiesOn(activities, date);
            const daySessions = sortByStartTime(
              sessions.filter((session) => session.date === date),
            );
            const plannedOrder = daySessions
              .filter((session) => session.status === "planned")
              .map((session) => session.id);
            const dueThatDay = assignments.filter(
              (assignment) => !assignment.completedAt && assignment.dueDate === date,
            );
            const free = availableMinutes(activities, sessions, date, preferences);
            // Each due-soon assignment with no time set aside for it
            // anywhere from today up to its due date, named individually
            // (daily-planning-and-completion-v2-proposal.md item 8). "No
            // time" means the *assignment*, not literally "this day" — a
            // session planned for today against something due Tuesday is
            // real, already-addressed preparation.
            const needsTime =
              daysBetween(today, date) <= DUE_SOON_DAYS
                ? dueThatDay.filter(
                    (assignment) =>
                      !sessions.some((session) => {
                        const item = workItems.find((w) => w.id === session.workItemId);
                        return (
                          item?.assignmentId === assignment.id &&
                          session.date >= today &&
                          session.date <= assignment.dueDate
                        );
                      }),
                  )
                : [];

            return (
              <li key={date} className="rounded-3xl border border-border bg-card px-5 py-4">
                <div className="flex items-baseline justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => onPickDay(date)}
                    className="inline-flex min-h-11 min-w-11 items-center text-left text-sm font-semibold text-foreground underline-offset-4 hover:underline"
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

                {reorderError?.date === date && (
                  <DismissableAlert
                    className="mt-3 mb-0"
                    message={reorderError.message}
                    onDismiss={() => setReorderError(null)}
                  />
                )}

                {daySessions.length > 0 ? (
                  <SortableList
                    className="mt-3 gap-1"
                    items={daySessions}
                    getId={(session) => session.id}
                    getTitle={titleOf}
                    isSortable={(session) => session.status === "planned"}
                    onReorder={(ids) => reorderDay(date, ids)}
                    renderItem={(session, lead) => {
                      const item = workItems.find((w) => w.id === session.workItemId);
                      const assignment = item
                        ? assignments.find((a) => a.id === item.assignmentId)
                        : undefined;
                      const done = session.status === "done";
                      // Only planned sessions can be moved or removed here: an
                      // in-progress one is ended from Today Execution, not
                      // deleted from a calendar (docs/features/
                      // mobile-gestures-reorder-and-swipe-v0.1.md §2).
                      const planned = session.status === "planned";
                      const title = item?.title ?? "this session";
                      const dayName = date === today ? "today" : longPlanDate(date);
                      const index = plannedOrder.indexOf(session.id);
                      const row = (
                        <div className="flex items-center gap-1 bg-card text-sm">
                          {lead(
                            done ? (
                              <Check className="size-3.5 text-primary" />
                            ) : (
                              <span className="size-1.5 rounded-full bg-primary" />
                            ),
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
                          {/* Time over length, as in Plan's day view, so the
                              title keeps its width beside the handle and menu. */}
                          <span className="shrink-0 text-right text-xs text-muted-foreground">
                            {session.startTime ? (
                              <span className="block">{timeLabel(session.startTime)}</span>
                            ) : null}
                            {effortLabel(session.plannedMinutes)}
                          </span>
                          {planned && (
                            <RowActionsMenu
                              label={`More actions for ${title}`}
                              actions={[
                                {
                                  label: "Earlier",
                                  icon: ArrowUp,
                                  disabled: index <= 0,
                                  onSelect: () =>
                                    reorderDay(date, moveItem(plannedOrder, index, "up")),
                                },
                                {
                                  label: "Later",
                                  icon: ArrowDown,
                                  disabled: index >= plannedOrder.length - 1,
                                  onSelect: () =>
                                    reorderDay(date, moveItem(plannedOrder, index, "down")),
                                },
                                {
                                  label: "Remove",
                                  icon: X,
                                  onSelect: () => removeSession(session.id),
                                  destructive: true,
                                },
                              ]}
                            />
                          )}
                        </div>
                      );
                      return planned ? (
                        <SwipeActionRow
                          id={`lookahead-${session.id}`}
                          label={`${title} from ${dayName}'s plan`}
                          actionLabel="Remove"
                          onAction={() => removeSession(session.id)}
                          className="rounded-lg"
                        >
                          {row}
                        </SwipeActionRow>
                      ) : (
                        row
                      );
                    }}
                  />
                ) : needsTime.length > 0 ? (
                  <ul className="mt-3 flex flex-col gap-1">
                    {needsTime.map((assignment) => (
                      <li key={assignment.id} className="text-sm text-attention-foreground">
                        {assignment.title} still needs time in your plan.
                      </li>
                    ))}
                  </ul>
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
