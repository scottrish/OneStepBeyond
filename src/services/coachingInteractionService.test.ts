import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../lib/supabase", () => ({ supabase: { from: vi.fn() } }));

import { supabase } from "../lib/supabase";
import { listRecentDismissals, recordFriction, resolveInteraction } from "./coachingInteractionService";

type QueryResult = { data: unknown; error: unknown };

function mockQuery(result: QueryResult) {
  const builder: Record<string, unknown> = {};
  const returnsBuilder = vi.fn(() => builder);
  for (const method of ["select", "eq", "insert", "update", "single", "order", "limit"]) {
    builder[method] = returnsBuilder;
  }
  builder.then = (resolve: (value: QueryResult) => unknown) => Promise.resolve(result).then(resolve);
  return builder;
}

const mockedFrom = supabase.from as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
});

describe("recordFriction", () => {
  it("inserts the report and returns its id", async () => {
    const builder = mockQuery({ data: { id: "c1" }, error: null });
    mockedFrom.mockReturnValue(builder);

    const id = await recordFriction("student-1", {
      assignmentId: "a1",
      workItemId: "w1",
      workSessionId: "s1",
      stage: "in_progress",
      frictionKind: "distracted",
      interventionId: "refocus",
    });

    expect(id).toBe("c1");
    expect(mockedFrom).toHaveBeenCalledWith("coaching_interactions");
    expect(builder.insert).toHaveBeenCalledWith({
      student_id: "student-1",
      assignment_id: "a1",
      work_item_id: "w1",
      work_session_id: "s1",
      stage: "in_progress",
      friction_kind: "distracted",
      intervention_id: "refocus",
    });
  });

  it("throws when the insert errors", async () => {
    mockedFrom.mockReturnValue(mockQuery({ data: null, error: new Error("boom") }));
    await expect(
      recordFriction("student-1", {
        assignmentId: "a1",
        workItemId: null,
        workSessionId: null,
        stage: "before_start",
        frictionKind: "other",
        interventionId: "open-choice",
      }),
    ).rejects.toThrow("boom");
  });
});

describe("resolveInteraction", () => {
  it("records the response with when, and the action", async () => {
    const builder = mockQuery({ data: null, error: null });
    mockedFrom.mockReturnValue(builder);

    await resolveInteraction("c1", { response: "selected", actionId: "five_minutes" });

    expect(builder.update).toHaveBeenCalledWith(
      expect.objectContaining({ response: "selected", action_id: "five_minutes", resolved_at: expect.any(String) }),
    );
    expect(builder.eq).toHaveBeenCalledWith("id", "c1");
  });

  it("can save just a note", async () => {
    const builder = mockQuery({ data: null, error: null });
    mockedFrom.mockReturnValue(builder);

    await resolveInteraction("c1", { note: "Start with the graph" });

    expect(builder.update).toHaveBeenCalledWith({ note: "Start with the graph" });
  });
});

describe("listRecentDismissals", () => {
  it("returns the newest dismissed intervention ids", async () => {
    const builder = mockQuery({
      data: [{ intervention_id: "refocus" }, { intervention_id: "small-start" }],
      error: null,
    });
    mockedFrom.mockReturnValue(builder);

    expect(await listRecentDismissals("student-1", 8)).toEqual(["refocus", "small-start"]);
    expect(builder.eq).toHaveBeenCalledWith("response", "dismissed");
    expect(builder.order).toHaveBeenCalledWith("created_at", { ascending: false });
    expect(builder.limit).toHaveBeenCalledWith(8);
  });
});
