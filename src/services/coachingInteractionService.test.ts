import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../lib/supabase", () => ({ supabase: { from: vi.fn() } }));

vi.mock("./offlineQueue", () => ({
  sendOrQueue: vi.fn().mockResolvedValue(undefined),
  newId: () => "device-made-id",
}));

import { supabase } from "../lib/supabase";
import { sendOrQueue } from "./offlineQueue";
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

describe("recording (works offline, PWA phase 2 2c)", () => {
  it("recordFriction hands over the row with an id made on the device, and returns that id", async () => {
    const id = await recordFriction("student-1", {
      assignmentId: "a1",
      workItemId: "w1",
      workSessionId: "s1",
      stage: "in_progress",
      frictionKind: "too_big",
      interventionId: "smallest-step",
    });
    expect(id).toBe("device-made-id");
    expect(vi.mocked(sendOrQueue)).toHaveBeenCalledWith({
      kind: "recordFriction",
      row: expect.objectContaining({
        id: "device-made-id",
        student_id: "student-1",
        work_session_id: "s1",
        friction_kind: "too_big",
        created_at: expect.stringMatching(/^\d{4}-/),
      }),
    });
  });

  it("resolveInteraction hands over the answer, with when it was given", async () => {
    await resolveInteraction("i1", { response: "selected", actionId: "open-task" });
    expect(vi.mocked(sendOrQueue)).toHaveBeenCalledWith({
      kind: "resolveInteraction",
      interactionId: "i1",
      patch: { response: "selected", resolved_at: expect.stringMatching(/^\d{4}-/), action_id: "open-task" },
    });
  });
});
