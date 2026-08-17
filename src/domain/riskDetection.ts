import { addDaysISODate, daysBetween } from "./planningDate";
import { availableMinutes } from "./studyCapacity";
import { remainingMinutes } from "./remainingMinutes";
import type { Assignment } from "../services/assignmentService";
import type { Activity } from "../services/activityService";
import type { Preferences } from "../services/preferencesService";
import type { WorkItem } from "../services/workItemService";
import type { WorkSession } from "../services/workSessionService";

// docs/features/risk-detection.md — a derived, read-time-only signal,
// never persisted as a standing "risk score" (Domain Invariant 11: the
// student only ever sees the short message and action label below, never
// the numbers behind it).

export type AttentionAction = "break-it-down" | "find-time" | "make-a-plan";

export type AttentionItem = {
  assignment: Assignment;
  message: string;
  action: AttentionAction;
};

const NOT_ENOUGH_TIME_MESSAGE =
  "There is more work left here than time before it is due. Worth replanning together.";
const DUE_SOON_UNSCHEDULED_MESSAGE = "Due soon and nothing planned for it yet.";

// "Due soon" — rule 2's own threshold, independent of Daily Planning's
// 5-day picker window.
const DUE_SOON_DAYS = 2;

function sumAvailableMinutesThroughDueDate(
  activities: Activity[],
  workSessions: WorkSession[],
  todayISO: string,
  dueDateISO: string,
  preferences: Preferences,
): number {
  let total = 0;
  let cursor = todayISO;
  // Lexicographic comparison is valid directly on YYYY-MM-DD strings.
  while (cursor <= dueDateISO) {
    total += availableMinutes(activities, workSessions, cursor, preferences);
    cursor = addDaysISODate(cursor, 1);
  }
  return total;
}

function hasFutureSession(
  items: WorkItem[],
  workSessions: WorkSession[],
  todayISO: string,
): boolean {
  const openItemIds = new Set(
    items.filter((item) => item.completedAt === null).map((item) => item.id),
  );
  return workSessions.some(
    (session) =>
      openItemIds.has(session.workItemId) && session.date >= todayISO && session.status !== "done",
  );
}

// Two rules, evaluated per open assignment, sorted soonest-due-first so
// "the one item" a caller shows is always the most urgent, not just the
// first one found.
export function assignmentsNeedingAttention(
  assignments: Assignment[],
  workItems: WorkItem[],
  workSessions: WorkSession[],
  activities: Activity[],
  todayISO: string,
  preferences: Preferences,
): AttentionItem[] {
  const results: AttentionItem[] = [];

  for (const assignment of assignments) {
    if (assignment.completedAt !== null) continue;
    if (assignment.dueDate < todayISO) continue;

    const items = workItems.filter((item) => item.assignmentId === assignment.id);
    const remaining = remainingMinutes(assignment, items);
    const capacityThroughDueDate = sumAvailableMinutesThroughDueDate(
      activities,
      workSessions,
      todayISO,
      assignment.dueDate,
      preferences,
    );
    const notEnoughTime = remaining > capacityThroughDueDate;

    const dueSoon = daysBetween(todayISO, assignment.dueDate) <= DUE_SOON_DAYS;
    const dueSoonUnscheduled = dueSoon && !hasFutureSession(items, workSessions, todayISO);

    if (!notEnoughTime && !dueSoonUnscheduled) continue;

    // Action selection is its own priority order, not a 1:1 mapping from
    // whichever rule fired — an assignment with no Work Items always
    // needs a breakdown first, regardless of which rule flagged it.
    if (items.length === 0) {
      results.push({
        assignment,
        message: dueSoonUnscheduled ? DUE_SOON_UNSCHEDULED_MESSAGE : NOT_ENOUGH_TIME_MESSAGE,
        action: "break-it-down",
      });
    } else if (dueSoonUnscheduled) {
      results.push({ assignment, message: DUE_SOON_UNSCHEDULED_MESSAGE, action: "find-time" });
    } else {
      results.push({ assignment, message: NOT_ENOUGH_TIME_MESSAGE, action: "make-a-plan" });
    }
  }

  return results.sort((a, b) => a.assignment.dueDate.localeCompare(b.assignment.dueDate));
}
