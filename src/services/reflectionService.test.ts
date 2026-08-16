import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../lib/supabase", () => ({
  supabase: {
    from: vi.fn(),
  },
}));

import { supabase } from "../lib/supabase";
import { listForStudent, recordReflection } from "./reflectionService";

const mockedFrom = supabase.from as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
});

describe("recordReflection", () => {
  it("inserts a reflection", async () => {
    const insert = vi.fn(() => Promise.resolve({ error: null }));
    mockedFrom.mockReturnValue({ insert });

    await recordReflection("student-1", {
      assignmentId: "a1",
      trigger: "assignment_completed",
      structuredResponse: "I missed a step",
      freeText: null,
      proposedAdjustment: "Add a step I missed",
    });

    expect(mockedFrom).toHaveBeenCalledWith("reflections");
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        student_id: "student-1",
        assignment_id: "a1",
        trigger: "assignment_completed",
        structured_response: "I missed a step",
        free_text: null,
        proposed_adjustment: "Add a step I missed",
      }),
    );
  });

  it("throws when the insert errors", async () => {
    const insert = vi.fn(() => Promise.resolve({ error: new Error("boom") }));
    mockedFrom.mockReturnValue({ insert });

    await expect(
      recordReflection("student-1", {
        assignmentId: "a1",
        trigger: "assignment_completed",
        structuredResponse: "Not sure",
        freeText: null,
        proposedAdjustment: null,
      }),
    ).rejects.toThrow("boom");
  });
});

describe("listForStudent", () => {
  const row = {
    id: "rf1",
    assignment_id: "a1",
    trigger: "assignment_completed",
    structured_response: "I missed a step",
    free_text: "Forgot the rehearsal step.",
    proposed_adjustment: "Add a step I missed",
    scaffold_intensity: "Structured",
    occurred_at: "2026-03-11T00:00:00Z",
  };

  it("maps rows into Reflection objects", async () => {
    const builder: Record<string, unknown> = {};
    const returnsBuilder = vi.fn(() => builder);
    builder.select = returnsBuilder;
    builder.eq = returnsBuilder;
    builder.order = returnsBuilder;
    builder.then = (resolve: (v: unknown) => unknown) =>
      Promise.resolve({ data: [row], error: null }).then(resolve);
    mockedFrom.mockReturnValue(builder);

    const reflections = await listForStudent("student-1");

    expect(mockedFrom).toHaveBeenCalledWith("reflections");
    expect(reflections).toEqual([
      {
        id: "rf1",
        assignmentId: "a1",
        trigger: "assignment_completed",
        structuredResponse: "I missed a step",
        freeText: "Forgot the rehearsal step.",
        proposedAdjustment: "Add a step I missed",
        scaffoldIntensity: "Structured",
        occurredAt: "2026-03-11T00:00:00Z",
      },
    ]);
  });

  it("throws when the query errors", async () => {
    const builder: Record<string, unknown> = {};
    const returnsBuilder = vi.fn(() => builder);
    builder.select = returnsBuilder;
    builder.eq = returnsBuilder;
    builder.order = returnsBuilder;
    builder.then = (resolve: (v: unknown) => unknown) =>
      Promise.resolve({ data: null, error: new Error("boom") }).then(resolve);
    mockedFrom.mockReturnValue(builder);

    await expect(listForStudent("student-1")).rejects.toThrow("boom");
  });
});
