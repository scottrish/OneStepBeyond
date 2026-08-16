import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../lib/supabase", () => ({
  supabase: {
    from: vi.fn(),
  },
}));

import { supabase } from "../lib/supabase";
import { recordPlanningSession } from "./planningSessionService";

type QueryResult = { data: unknown; error: unknown };

function mockQuery(result: QueryResult) {
  const builder: Record<string, unknown> = {};
  const returnsBuilder = vi.fn(() => builder);
  builder.insert = returnsBuilder;
  builder.then = (resolve: (value: QueryResult) => unknown) =>
    Promise.resolve(result).then(resolve);
  return builder;
}

const mockedFrom = supabase.from as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
});

describe("recordPlanningSession", () => {
  it("inserts a planning session row", async () => {
    mockedFrom.mockReturnValue(mockQuery({ data: null, error: null }));

    await expect(
      recordPlanningSession("student-1", {
        date: "2026-03-16",
        itemsPlanned: 2,
        minutesPlanned: 50,
      }),
    ).resolves.toBeUndefined();

    expect(mockedFrom).toHaveBeenCalledWith("planning_sessions");
  });

  it("throws when the insert errors", async () => {
    mockedFrom.mockReturnValue(mockQuery({ data: null, error: new Error("boom") }));

    await expect(
      recordPlanningSession("student-1", {
        date: "2026-03-16",
        itemsPlanned: 1,
        minutesPlanned: 20,
      }),
    ).rejects.toThrow("boom");
  });
});
