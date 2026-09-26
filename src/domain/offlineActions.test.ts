import { describe, expect, it } from "vitest";
import { applyPending, classifySendError, type OfflineAction } from "./offlineActions";
import type { WorkSession } from "../services/workSessionService";
import type { WorkItem } from "../services/workItemService";
import type { Assignment } from "../services/assignmentService";

const session = (id: string, patch: Partial<WorkSession> = {}): WorkSession => ({
  id,
  workItemId: "w1",
  date: "2026-09-26",
  plannedMinutes: 30,
  startTime: "16:00",
  status: "planned",
  startedAt: null,
  completedAt: null,
  originalPlannedMinutes: null,
  ...patch,
});

const item = (id: string, completedAt: string | null = null): WorkItem => ({
  id,
  assignmentId: "a1",
  title: "Step",
  effortMinutes: 30,
  completedAt,
  position: 0,
});

const assignment: Assignment = {
  id: "a1",
  courseId: "c1",
  title: "Essay",
  dueDate: "2026-10-01",
  effortMinutes: 60,
  notes: null,
  completedAt: null,
};

describe("applyPending (PWA phase 2, 2c): reads show what's waiting to be saved", () => {
  it("Start, Need more time and Done show on a day's sessions, in order", () => {
    const actions: OfflineAction[] = [
      { kind: "startSession", sessionId: "s1", at: "2026-09-26T16:02:00.000Z" },
      { kind: "reviseEstimate", sessionId: "s1", plannedMinutes: 40, originalPlannedMinutes: 30 },
      { kind: "completeSession", sessionId: "s1", at: "2026-09-26T16:45:00.000Z" },
    ];
    const [shown] = applyPending("workSessions:2026-09-26", [session("s1")], actions) as WorkSession[];
    expect(shown).toMatchObject({
      status: "done",
      startedAt: "2026-09-26T16:02:00.000Z",
      completedAt: "2026-09-26T16:45:00.000Z",
      plannedMinutes: 40,
      originalPlannedMinutes: 30,
    });
  });

  it("the same actions show on the all-days list", () => {
    const shown = applyPending("workSessions:all", [session("s1"), session("s2")], [
      { kind: "startSession", sessionId: "s2", at: "t" },
    ]) as WorkSession[];
    expect(shown.map((s) => s.status)).toEqual(["planned", "in_progress"]);
  });

  it("clearing the other time removes open sessions, never a done one", () => {
    const shown = applyPending("workSessions:all", [session("s1"), session("s2", { status: "done" })], [
      { kind: "clearSession", sessionId: "s1" },
      { kind: "clearSession", sessionId: "s2" },
    ]) as WorkSession[];
    expect(shown.map((s) => s.id)).toEqual(["s2"]);
  });

  it("doesn't change a session the server already moved on (Start on a done session)", () => {
    const done = session("s1", { status: "done", startedAt: "earlier" });
    const [shown] = applyPending("workSessions:all", [done], [
      { kind: "startSession", sessionId: "s1", at: "later" },
    ]) as WorkSession[];
    expect(shown).toBe(done);
  });

  it("a completed step shows on the student's steps and on one assignment's steps", () => {
    const actions: OfflineAction[] = [{ kind: "completeStep", workItemId: "w1", at: "t" }];
    expect((applyPending("workItems", [item("w1"), item("w2")], actions) as WorkItem[]).map((i) => i.completedAt)).toEqual([
      "t",
      null,
    ]);
    expect((applyPending("workItemsFor:a1", [item("w1", "earlier")], actions) as WorkItem[])[0]!.completedAt).toBe(
      "earlier",
    );
  });

  it("a completed assignment shows on the list and on Assignment Detail", () => {
    const actions: OfflineAction[] = [{ kind: "completeAssignment", assignmentId: "a1", at: "t" }];
    expect((applyPending("assignments", [assignment], actions) as Assignment[])[0]!.completedAt).toBe("t");
    expect((applyPending("assignment:a1", assignment, actions) as Assignment).completedAt).toBe("t");
    expect(applyPending("assignment:a1", null, actions)).toBeNull();
  });

  it("reads nothing affects come back as they were", () => {
    const courses = [{ id: "c1" }];
    expect(applyPending("courses", courses, [{ kind: "completeStep", workItemId: "w1", at: "t" }])).toBe(courses);
    const sessions = [session("s1")];
    expect(applyPending("workSessions:all", sessions, [])).toBe(sessions);
  });
});

describe("classifySendError", () => {
  it("no connection: keep it for later", () => {
    expect(classifySendError({ message: "TypeError: Failed to fetch" })).toBe("offline");
    expect(classifySendError({ message: "AbortError: You're offline." })).toBe("offline");
  });

  it("what it belonged to was removed on another device: a conflict", () => {
    expect(classifySendError({ message: "insert violates foreign key", code: "23503" })).toBe("conflict");
  });

  it("anything else is a real failure", () => {
    expect(classifySendError({ message: "JWT expired", code: "PGRST301" })).toBe("failed");
    expect(classifySendError(undefined)).toBe("failed");
  });
});
