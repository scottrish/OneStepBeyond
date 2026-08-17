import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../lib/supabase", () => ({
  supabase: {
    from: vi.fn(),
  },
}));

import { supabase } from "../lib/supabase";
import {
  createActivity,
  deleteActivity,
  listActivities,
  updateActivityDays,
} from "./activityService";

type QueryResult = { data: unknown; error: unknown };

// Supabase's query builder is chainable *and* awaitable from any step, so a
// mock only needs to return itself from every chain method and resolve
// when awaited.
function mockQuery(result: QueryResult) {
  const builder: Record<string, unknown> = {};
  const returnsBuilder = vi.fn(() => builder);
  builder.select = returnsBuilder;
  builder.eq = returnsBuilder;
  builder.order = returnsBuilder;
  builder.insert = returnsBuilder;
  builder.update = returnsBuilder;
  builder.delete = returnsBuilder;
  builder.single = returnsBuilder;
  builder.then = (resolve: (value: QueryResult) => unknown) =>
    Promise.resolve(result).then(resolve);
  return builder;
}

const mockedFrom = supabase.from as unknown as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
});

const row = {
  id: "1",
  name: "Football practice",
  days: [1, 2, 3, 4, 5],
  start_time: "15:30:00",
  finish_time: "17:00:00",
  travel_to_minutes: 15,
  travel_from_minutes: 10,
};

describe("listActivities", () => {
  it("maps rows into Activity objects", async () => {
    mockedFrom.mockReturnValue(mockQuery({ data: [row], error: null }));

    const activities = await listActivities("student-1");

    expect(mockedFrom).toHaveBeenCalledWith("activities");
    expect(activities).toEqual([
      {
        id: "1",
        name: "Football practice",
        days: [1, 2, 3, 4, 5],
        startTime: "15:30:00",
        finishTime: "17:00:00",
        travelToMinutes: 15,
        travelFromMinutes: 10,
      },
    ]);
  });

  it("returns an empty list when there is no data", async () => {
    mockedFrom.mockReturnValue(mockQuery({ data: null, error: null }));

    expect(await listActivities("student-1")).toEqual([]);
  });

  it("throws when the query errors", async () => {
    mockedFrom.mockReturnValue(
      mockQuery({ data: null, error: new Error("boom") }),
    );

    await expect(listActivities("student-1")).rejects.toThrow("boom");
  });
});

describe("createActivity", () => {
  it("inserts and returns the created activity", async () => {
    mockedFrom.mockReturnValue(mockQuery({ data: row, error: null }));

    const activity = await createActivity("student-1", {
      name: "Football practice",
      days: [1, 2, 3, 4, 5],
      startTime: "15:30",
      finishTime: "17:00",
      travelToMinutes: 15,
      travelFromMinutes: 10,
    });

    expect(activity.name).toBe("Football practice");
  });

  it("throws when the insert errors", async () => {
    mockedFrom.mockReturnValue(
      mockQuery({ data: null, error: new Error("boom") }),
    );

    await expect(
      createActivity("student-1", {
        name: "Football practice",
        days: [1],
        startTime: "15:30",
        finishTime: "17:00",
        travelToMinutes: 0,
        travelFromMinutes: 0,
      }),
    ).rejects.toThrow("boom");
  });
});

describe("updateActivityDays", () => {
  it("updates the days array", async () => {
    mockedFrom.mockReturnValue(mockQuery({ data: null, error: null }));

    await expect(
      updateActivityDays("activity-1", [1, 2, 3]),
    ).resolves.toBeUndefined();
  });

  it("throws when the update errors", async () => {
    mockedFrom.mockReturnValue(
      mockQuery({ data: null, error: new Error("boom") }),
    );

    await expect(updateActivityDays("activity-1", [1])).rejects.toThrow(
      "boom",
    );
  });
});

describe("deleteActivity", () => {
  it("deletes the activity", async () => {
    mockedFrom.mockReturnValue(mockQuery({ data: null, error: null }));

    await expect(deleteActivity("activity-1")).resolves.toBeUndefined();
  });

  it("throws when the delete errors", async () => {
    mockedFrom.mockReturnValue(
      mockQuery({ data: null, error: new Error("boom") }),
    );

    await expect(deleteActivity("activity-1")).rejects.toThrow("boom");
  });
});
