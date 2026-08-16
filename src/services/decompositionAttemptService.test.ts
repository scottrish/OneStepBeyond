import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../lib/supabase", () => ({
  supabase: {
    from: vi.fn(),
  },
}));

import { supabase } from "../lib/supabase";
import { recordDecompositionAttempt } from "./decompositionAttemptService";

const mockedFrom = supabase.from as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
});

describe("recordDecompositionAttempt", () => {
  it("inserts a decomposition attempt", async () => {
    const insert = vi.fn(() => Promise.resolve({ error: null }));
    mockedFrom.mockReturnValue({ insert });

    await recordDecompositionAttempt("student-1", {
      assignmentId: "a1",
      initialWorkItems: [],
      resultingWorkItems: ["Questions 1-10", "Questions 11-20"],
      revisionCount: 3,
      outcome: "confirmed",
    });

    expect(mockedFrom).toHaveBeenCalledWith("decomposition_attempts");
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        student_id: "student-1",
        assignment_id: "a1",
        resulting_work_items: ["Questions 1-10", "Questions 11-20"],
        revision_count: 3,
        outcome: "confirmed",
      }),
    );
  });

  it("throws when the insert errors", async () => {
    const insert = vi.fn(() => Promise.resolve({ error: new Error("boom") }));
    mockedFrom.mockReturnValue({ insert });

    await expect(
      recordDecompositionAttempt("student-1", {
        assignmentId: "a1",
        initialWorkItems: [],
        resultingWorkItems: [],
        revisionCount: 0,
        outcome: "confirmed",
      }),
    ).rejects.toThrow("boom");
  });
});
