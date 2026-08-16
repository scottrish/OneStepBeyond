import { describe, expect, it } from "vitest";
import { rankCandidates } from "./planningCandidates";
import type { Assignment } from "../services/assignmentService";
import type { WorkItem } from "../services/workItemService";

function assignment(overrides: Partial<Assignment> = {}): Assignment {
  return {
    id: "a1",
    courseId: "c1",
    title: "Essay",
    dueDate: "2026-03-20",
    effortMinutes: 60,
    notes: null,
    completedAt: null,
    ...overrides,
  };
}

function workItem(overrides: Partial<WorkItem> = {}): WorkItem {
  return {
    id: "w1",
    assignmentId: "a1",
    title: "Draft outline",
    effortMinutes: 20,
    completedAt: null,
    position: 0,
    ...overrides,
  };
}

describe("rankCandidates", () => {
  it("excludes work items whose assignment is completed", () => {
    const done = assignment({ id: "a1", completedAt: "2026-03-01T00:00:00Z" });
    const item = workItem({ assignmentId: "a1" });

    expect(rankCandidates([done], [item])).toEqual([]);
  });

  it("excludes completed work items", () => {
    const a = assignment();
    const item = workItem({ completedAt: "2026-03-01T00:00:00Z" });

    expect(rankCandidates([a], [item])).toEqual([]);
  });

  it("excludes assignments with no work items at all", () => {
    const a = assignment();
    expect(rankCandidates([a], [])).toEqual([]);
  });

  it("sorts by parent assignment due date, soonest first", () => {
    const soon = assignment({ id: "a1", dueDate: "2026-03-16" });
    const later = assignment({ id: "a2", dueDate: "2026-03-20" });
    const soonItem = workItem({ id: "w1", assignmentId: "a1" });
    const laterItem = workItem({ id: "w2", assignmentId: "a2" });

    const result = rankCandidates([later, soon], [laterItem, soonItem]);

    expect(result.map((c) => c.workItem.id)).toEqual(["w1", "w2"]);
  });

  it("includes every open work item for an assignment, in list order", () => {
    const a = assignment();
    const item1 = workItem({ id: "w1", position: 0 });
    const item2 = workItem({ id: "w2", position: 1 });

    const result = rankCandidates([a], [item1, item2]);

    expect(result).toEqual([
      { assignment: a, workItem: item1 },
      { assignment: a, workItem: item2 },
    ]);
  });
});
