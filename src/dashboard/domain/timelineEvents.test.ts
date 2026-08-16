import { describe, expect, it } from "vitest";
import { buildTimelineEvents } from "./timelineEvents";
import type { DashboardData } from "../hooks/useDashboardData";

const emptyData: DashboardData = {
  courses: [],
  assignments: [],
  workItems: [],
  decompositionAttempts: [],
  reflections: [],
};

describe("buildTimelineEvents", () => {
  it("returns an empty list when there is no data", () => {
    expect(buildTimelineEvents(emptyData)).toEqual([]);
  });

  it("builds an event per decomposition attempt, reflection, and completed assignment", () => {
    const data: DashboardData = {
      ...emptyData,
      assignments: [
        {
          id: "a1",
          courseId: "c1",
          title: "Book report",
          dueDate: "2026-03-15",
          effortMinutes: 60,
          notes: null,
          completedAt: "2026-03-10T12:00:00Z",
        },
      ],
      decompositionAttempts: [
        {
          id: "da1",
          assignmentId: "a1",
          initialWorkItems: [],
          resultingWorkItems: ["Finish book", "Write report"],
          revisionCount: 2,
          assistanceRequested: false,
          initialScaffoldIntensity: "None",
          highestScaffoldIntensity: "None",
          scaffoldsProvided: [],
          outcome: "confirmed",
          occurredAt: "2026-03-08T09:00:00Z",
        },
      ],
      reflections: [
        {
          id: "rf1",
          assignmentId: "a1",
          trigger: "assignment_completed",
          structuredResponse: "I missed a step",
          freeText: null,
          proposedAdjustment: "Add a step I missed",
          scaffoldIntensity: "Structured",
          occurredAt: "2026-03-10T12:05:00Z",
        },
      ],
    };

    const events = buildTimelineEvents(data);

    expect(events).toHaveLength(3);
    expect(events.map((e) => e.type)).toEqual([
      "Reflection Recorded",
      "Assignment Completed",
      "Work Breakdown Confirmed",
    ]);
    expect(events.every((e) => e.assignmentTitle === "Book report")).toBe(true);
  });

  it("sorts newest first", () => {
    const data: DashboardData = {
      ...emptyData,
      reflections: [
        {
          id: "rf-early",
          assignmentId: "a1",
          trigger: "assignment_completed",
          structuredResponse: "Not sure",
          freeText: null,
          proposedAdjustment: null,
          scaffoldIntensity: "Structured",
          occurredAt: "2026-03-01T00:00:00Z",
        },
        {
          id: "rf-late",
          assignmentId: "a1",
          trigger: "assignment_completed",
          structuredResponse: "Not sure",
          freeText: null,
          proposedAdjustment: null,
          scaffoldIntensity: "Structured",
          occurredAt: "2026-03-05T00:00:00Z",
        },
      ],
    };

    const events = buildTimelineEvents(data);

    expect(events.map((e) => e.id)).toEqual(["reflection-rf-late", "reflection-rf-early"]);
  });
});
