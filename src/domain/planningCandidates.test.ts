import { describe, expect, it } from "vitest";
import { preselectFor, rankCandidates, targetAssignmentId, targetFirst } from "./planningCandidates";
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

describe("plan targets (daily-planning-and-completion-v2-proposal.md item 1)", () => {
  const essay = assignment({ id: "a1", dueDate: "2026-03-20" });
  const lab = assignment({ id: "a2", title: "Lab", dueDate: "2026-03-18" });
  const candidates = rankCandidates(
    [essay, lab],
    [
      workItem({ id: "e1", assignmentId: "a1" }),
      workItem({ id: "e2", assignmentId: "a1", position: 1 }),
      workItem({ id: "e3", assignmentId: "a1", position: 2 }),
      workItem({ id: "l1", assignmentId: "a2" }),
    ],
  );
  const DAY = "2026-03-16";
  const session = (workItemId: string, date: string, status: "planned" | "in_progress" | "done" = "planned") => ({
    workItemId,
    date,
    status,
  });

  describe("targetFirst", () => {
    it("puts the target assignment's rows first and keeps the rest in due-date order", () => {
      expect(targetFirst(candidates, "a1").map((c) => c.workItem.id)).toEqual(["e1", "e2", "e3", "l1"]);
      expect(targetFirst(candidates, null).map((c) => c.workItem.id)).toEqual(["l1", "e1", "e2", "e3"]);
    });
  });

  describe("targetAssignmentId", () => {
    it("is the assignment itself, or the picked step's assignment", () => {
      expect(targetAssignmentId({ kind: "assignment", assignmentId: "a2" }, candidates)).toBe("a2");
      expect(targetAssignmentId({ kind: "pick", workItemId: "e2" }, candidates)).toBe("a1");
      expect(targetAssignmentId(null, candidates)).toBeNull();
    });
  });

  describe("preselectFor", () => {
    const target = { kind: "assignment" as const, assignmentId: "a1" };

    it("picks the assignment's open steps that aren't already planned before the due date", () => {
      // Three open steps, one already planned for tomorrow (before the 20th).
      expect(preselectFor(target, candidates, [session("e2", "2026-03-17")], DAY, new Set())).toEqual([
        "e1",
        "e3",
      ]);
    });

    it("still counts a step planned after the due date as needing time", () => {
      expect(preselectFor(target, candidates, [session("e2", "2026-03-25")], DAY, new Set())).toEqual([
        "e1",
        "e2",
        "e3",
      ]);
    });

    it("ignores done sessions", () => {
      expect(preselectFor(target, candidates, [session("e2", "2026-03-17", "done")], DAY, new Set())).toEqual([
        "e1",
        "e2",
        "e3",
      ]);
    });

    it("falls back to every choosable step when all are already planned elsewhere", () => {
      const all = ["e1", "e2", "e3"].map((id) => session(id, "2026-03-17"));
      expect(preselectFor(target, candidates, all, DAY, new Set())).toEqual(["e1", "e2", "e3"]);
    });

    it("never picks a step that can't be chosen for this day, even in the fallback", () => {
      const all = ["e1", "e2", "e3"].map((id) => session(id, "2026-03-17"));
      expect(preselectFor(target, candidates, all, DAY, new Set(["e1"]))).toEqual(["e2", "e3"]);
      expect(preselectFor(target, candidates, [], DAY, new Set(["e1", "e2", "e3"]))).toEqual([]);
    });

    it("a step target picks exactly that step, if it can be chosen", () => {
      expect(preselectFor({ kind: "pick", workItemId: "e2" }, candidates, [], DAY, new Set())).toEqual(["e2"]);
      expect(preselectFor({ kind: "pick", workItemId: "e2" }, candidates, [], DAY, new Set(["e2"]))).toEqual([]);
      expect(preselectFor({ kind: "pick", workItemId: "gone" }, candidates, [], DAY, new Set())).toEqual([]);
    });
  });
});
