import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../lib/supabase", () => ({
  supabase: {
    from: vi.fn(),
  },
}));

import { supabase } from "../lib/supabase";
import {
  completeAllForAssignment,
  createWorkItem,
  listWorkItems,
  listWorkItemsForStudent,
} from "./workItemService";

type QueryResult = { data: unknown; error: unknown };

function mockQuery(result: QueryResult) {
  const builder: Record<string, unknown> = {};
  const returnsBuilder = vi.fn(() => builder);
  builder.select = returnsBuilder;
  builder.eq = returnsBuilder;
  builder.order = returnsBuilder;
  builder.insert = returnsBuilder;
  builder.update = returnsBuilder;
  builder.is = returnsBuilder;
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
  assignment_id: "a1",
  title: "Find three sources",
  effort_minutes: 20,
  completed_at: null,
};

describe("listWorkItemsForStudent", () => {
  it("maps rows into WorkItem objects", async () => {
    mockedFrom.mockReturnValue(mockQuery({ data: [row], error: null }));

    const items = await listWorkItemsForStudent("student-1");

    expect(mockedFrom).toHaveBeenCalledWith("work_items");
    expect(items).toEqual([
      {
        id: "1",
        assignmentId: "a1",
        title: "Find three sources",
        effortMinutes: 20,
        completedAt: null,
      },
    ]);
  });

  it("throws when the query errors", async () => {
    mockedFrom.mockReturnValue(
      mockQuery({ data: null, error: new Error("boom") }),
    );

    await expect(listWorkItemsForStudent("student-1")).rejects.toThrow("boom");
  });
});

describe("listWorkItems", () => {
  it("maps rows for a single assignment", async () => {
    mockedFrom.mockReturnValue(mockQuery({ data: [row], error: null }));

    expect(await listWorkItems("a1")).toEqual([
      {
        id: "1",
        assignmentId: "a1",
        title: "Find three sources",
        effortMinutes: 20,
        completedAt: null,
      },
    ]);
  });
});

describe("createWorkItem", () => {
  it("inserts and returns the created work item", async () => {
    mockedFrom.mockReturnValue(mockQuery({ data: row, error: null }));

    const item = await createWorkItem("student-1", {
      assignmentId: "a1",
      title: "Find three sources",
      effortMinutes: 20,
    });

    expect(item.title).toBe("Find three sources");
  });

  it("throws when the insert errors", async () => {
    mockedFrom.mockReturnValue(
      mockQuery({ data: null, error: new Error("boom") }),
    );

    await expect(
      createWorkItem("student-1", {
        assignmentId: "a1",
        title: "Find three sources",
        effortMinutes: 20,
      }),
    ).rejects.toThrow("boom");
  });
});

describe("completeAllForAssignment", () => {
  it("completes open work items for the assignment", async () => {
    mockedFrom.mockReturnValue(mockQuery({ data: null, error: null }));

    await expect(completeAllForAssignment("a1")).resolves.toBeUndefined();
  });

  it("throws when the update errors", async () => {
    mockedFrom.mockReturnValue(
      mockQuery({ data: null, error: new Error("boom") }),
    );

    await expect(completeAllForAssignment("a1")).rejects.toThrow("boom");
  });
});
