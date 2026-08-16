import type { DashboardData } from "../hooks/useDashboardData";

// docs/features/coach-parent-dashboard-feature-spec-v0.1.md §11 lists a
// richer event set (Assignment Captured, Work Item Created, Scaffold
// Provided, ...) than this app currently timestamps. There is no
// dedicated domain-event log table — only these three real, timestamped
// signals exist today: a confirmed Decomposition Attempt, a recorded
// Reflection, and an assignment's own completedAt. Deliberately not
// inventing the rest (§23 "Do not invent").
export type TimelineEvent = {
  id: string;
  occurredAt: string;
  type: string;
  assignmentTitle: string | undefined;
  description: string;
  payload: Record<string, string | number | boolean>;
};

export function buildTimelineEvents(data: DashboardData): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  for (const attempt of data.decompositionAttempts) {
    const assignment = data.assignments.find((a) => a.id === attempt.assignmentId);
    events.push({
      id: `attempt-${attempt.id}`,
      occurredAt: attempt.occurredAt,
      type: "Work Breakdown Confirmed",
      assignmentTitle: assignment?.title,
      description: `${attempt.resultingWorkItems.length} work items, ${attempt.revisionCount} revisions, scaffold ${attempt.highestScaffoldIntensity}`,
      payload: {
        attemptId: attempt.id,
        scaffold: attempt.highestScaffoldIntensity,
        revisions: attempt.revisionCount,
      },
    });
  }

  for (const reflection of data.reflections) {
    const assignment = data.assignments.find((a) => a.id === reflection.assignmentId);
    events.push({
      id: `reflection-${reflection.id}`,
      occurredAt: reflection.occurredAt,
      type: "Reflection Recorded",
      assignmentTitle: assignment?.title,
      description: `Structured response: ${reflection.structuredResponse}`,
      payload: { reflectionId: reflection.id, assignmentId: reflection.assignmentId },
    });
  }

  for (const assignment of data.assignments) {
    if (assignment.completedAt) {
      events.push({
        id: `completed-${assignment.id}`,
        occurredAt: assignment.completedAt,
        type: "Assignment Completed",
        assignmentTitle: assignment.title,
        description: "Marked complete",
        payload: { assignmentId: assignment.id },
      });
    }
  }

  return events.sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));
}
