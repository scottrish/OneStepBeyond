import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../lib/supabase", () => ({
  supabase: {
    from: vi.fn(),
  },
}));

import { supabase } from "../lib/supabase";
import { recordReflection } from "./reflectionService";

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
