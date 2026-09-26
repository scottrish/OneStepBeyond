import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../lib/supabase", () => ({ supabase: { from: vi.fn() } }));

import { supabase } from "../lib/supabase";
import { sendAction } from "./offlineSenders";

type QueryResult = { data: unknown; error: unknown };

// A query builder that records its calls and resolves to `result`.
function mockQuery(result: QueryResult) {
  const builder: Record<string, unknown> = {};
  const returnsBuilder = vi.fn(() => builder);
  for (const method of ["select", "eq", "neq", "is", "update", "delete", "upsert"]) builder[method] = returnsBuilder;
  builder.maybeSingle = vi.fn(() => Promise.resolve(result));
  builder.then = (resolve: (value: QueryResult) => unknown) => Promise.resolve(result).then(resolve);
  return builder;
}

const mockedFrom = supabase.from as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
});

describe("sendAction (PWA phase 2, 2c): every write is safe to send twice", () => {
  it("Start: only a planned session, with the device's time", async () => {
    const update = mockQuery({ data: [{ id: "s1" }], error: null });
    mockedFrom.mockReturnValue(update);

    await expect(sendAction({ kind: "startSession", sessionId: "s1", at: "2026-09-26T16:02:00.000Z" })).resolves.toBe(
      "applied",
    );
    expect(update.update).toHaveBeenCalledWith({ status: "in_progress", started_at: "2026-09-26T16:02:00.000Z" });
    expect(update.eq).toHaveBeenCalledWith("id", "s1");
    expect(update.eq).toHaveBeenCalledWith("status", "planned");
  });

  it("sent again after it was saved: nothing changes, and it isn't a conflict", async () => {
    mockedFrom
      .mockReturnValueOnce(mockQuery({ data: [], error: null }))
      .mockReturnValueOnce(mockQuery({ data: { id: "s1" }, error: null }));

    await expect(sendAction({ kind: "completeSession", sessionId: "s1", at: "t" })).resolves.toBe("applied");
  });

  it("the session was removed on another device: a conflict", async () => {
    mockedFrom
      .mockReturnValueOnce(mockQuery({ data: [], error: null }))
      .mockReturnValueOnce(mockQuery({ data: null, error: null }));

    await expect(sendAction({ kind: "completeSession", sessionId: "s1", at: "t" })).resolves.toBe("conflict");
  });

  it("Done and Need more time never change a session that's already done", async () => {
    const done = mockQuery({ data: [{ id: "s1" }], error: null });
    mockedFrom.mockReturnValue(done);
    await sendAction({ kind: "completeSession", sessionId: "s1", at: "t" });
    expect(done.update).toHaveBeenCalledWith({ status: "done", completed_at: "t" });
    expect(done.neq).toHaveBeenCalledWith("status", "done");

    const revise = mockQuery({ data: [{ id: "s1" }], error: null });
    mockedFrom.mockReturnValue(revise);
    await sendAction({ kind: "reviseEstimate", sessionId: "s1", plannedMinutes: 40, originalPlannedMinutes: 30 });
    expect(revise.update).toHaveBeenCalledWith({ planned_minutes: 40, original_planned_minutes: 30 });
    expect(revise.neq).toHaveBeenCalledWith("status", "done");
  });

  it("a step and an assignment are completed only once, keeping the first time", async () => {
    const step = mockQuery({ data: [{ id: "w1" }], error: null });
    mockedFrom.mockReturnValue(step);
    await sendAction({ kind: "completeStep", workItemId: "w1", at: "t" });
    expect(mockedFrom).toHaveBeenCalledWith("work_items");
    expect(step.is).toHaveBeenCalledWith("completed_at", null);

    const assignment = mockQuery({ data: [{ id: "a1" }], error: null });
    mockedFrom.mockReturnValue(assignment);
    await sendAction({ kind: "completeAssignment", assignmentId: "a1", at: "t" });
    expect(mockedFrom).toHaveBeenCalledWith("assignments");
    expect(assignment.update).toHaveBeenCalledWith({ completed_at: "t" });
    expect(assignment.is).toHaveBeenCalledWith("completed_at", null);
  });

  it("clearing the other time removes only open sessions", async () => {
    const del = mockQuery({ data: null, error: null });
    mockedFrom.mockReturnValue(del);
    await expect(sendAction({ kind: "clearSession", sessionId: "s2" })).resolves.toBe("applied");
    expect(del.delete).toHaveBeenCalled();
    expect(del.neq).toHaveBeenCalledWith("status", "done");
  });

  it("records are inserted with their own id, and a duplicate is ignored", async () => {
    const insert = mockQuery({ data: null, error: null });
    mockedFrom.mockReturnValue(insert);
    const row = { id: "r1", occurred_at: "t" };
    await sendAction({ kind: "recordReflection", row });
    expect(mockedFrom).toHaveBeenCalledWith("reflections");
    expect(insert.upsert).toHaveBeenCalledWith(row, { onConflict: "id", ignoreDuplicates: true });

    await sendAction({ kind: "recordFriction", row });
    expect(mockedFrom).toHaveBeenCalledWith("coaching_interactions");
  });

  it("a coaching answer updates its record", async () => {
    const update = mockQuery({ data: null, error: null });
    mockedFrom.mockReturnValue(update);
    await sendAction({ kind: "resolveInteraction", interactionId: "i1", patch: { response: "dismissed" } });
    expect(update.update).toHaveBeenCalledWith({ response: "dismissed" });
    expect(update.eq).toHaveBeenCalledWith("id", "i1");
  });

  it("an error is passed on, for the queue to classify", async () => {
    mockedFrom.mockReturnValue(mockQuery({ data: null, error: { message: "TypeError: Failed to fetch" } }));
    await expect(sendAction({ kind: "startSession", sessionId: "s1", at: "t" })).rejects.toMatchObject({
      message: "TypeError: Failed to fetch",
    });
  });
});
