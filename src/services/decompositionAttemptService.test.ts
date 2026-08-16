import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../lib/supabase", () => ({
  supabase: {
    from: vi.fn(),
  },
}));

import { supabase } from "../lib/supabase";
import { listForStudent, recordDecompositionAttempt } from "./decompositionAttemptService";

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

describe("listForStudent", () => {
  const row = {
    id: "da1",
    assignment_id: "a1",
    initial_work_items: [],
    resulting_work_items: ["Finish book", "Write report"],
    revision_count: 4,
    assistance_requested: false,
    initial_scaffold_intensity: "None",
    highest_scaffold_intensity: "None",
    scaffolds_provided: [],
    outcome: "confirmed",
    occurred_at: "2026-03-10T00:00:00Z",
  };

  it("maps rows into DecompositionAttempt objects", async () => {
    const builder: Record<string, unknown> = {};
    const returnsBuilder = vi.fn(() => builder);
    builder.select = returnsBuilder;
    builder.eq = returnsBuilder;
    builder.order = returnsBuilder;
    builder.then = (resolve: (v: unknown) => unknown) =>
      Promise.resolve({ data: [row], error: null }).then(resolve);
    mockedFrom.mockReturnValue(builder);

    const attempts = await listForStudent("student-1");

    expect(mockedFrom).toHaveBeenCalledWith("decomposition_attempts");
    expect(attempts).toEqual([
      {
        id: "da1",
        assignmentId: "a1",
        initialWorkItems: [],
        resultingWorkItems: ["Finish book", "Write report"],
        revisionCount: 4,
        assistanceRequested: false,
        initialScaffoldIntensity: "None",
        highestScaffoldIntensity: "None",
        scaffoldsProvided: [],
        outcome: "confirmed",
        occurredAt: "2026-03-10T00:00:00Z",
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
