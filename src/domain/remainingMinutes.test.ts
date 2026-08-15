import { describe, expect, it } from "vitest";
import { remainingMinutes } from "./remainingMinutes";
import type { Assignment } from "../services/assignmentService";
import type { WorkItem } from "../services/workItemService";

const assignment: Assignment = {
  id: "a1",
  courseId: "c1",
  title: "Essay",
  dueDate: "2026-03-15",
  effortMinutes: 60,
  notes: null,
  completedAt: null,
};

function item(overrides: Partial<WorkItem>): WorkItem {
  return {
    id: "w1",
    assignmentId: "a1",
    title: "Step",
    effortMinutes: 20,
    completedAt: null,
    ...overrides,
  };
}

describe("remainingMinutes", () => {
  it("uses the assignment's own estimate when there are no work items", () => {
    expect(remainingMinutes(assignment, [])).toBe(60);
  });

  it("sums only open work items' estimates when work items exist", () => {
    const items = [
      item({ id: "1", effortMinutes: 20, completedAt: null }),
      item({ id: "2", effortMinutes: 15, completedAt: "2026-03-10T00:00:00Z" }),
      item({ id: "3", effortMinutes: 10, completedAt: null }),
    ];

    expect(remainingMinutes(assignment, items)).toBe(30);
  });

  it("returns 0 when every work item is complete", () => {
    const items = [
      item({ id: "1", effortMinutes: 20, completedAt: "2026-03-10T00:00:00Z" }),
    ];

    expect(remainingMinutes(assignment, items)).toBe(0);
  });
});
