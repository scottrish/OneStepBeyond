import { describe, expect, it } from "vitest";
import {
  activityBlocks,
  defaultStartTimes,
  firstOverlap,
  rechainDay,
  rechainTimes,
  sessionBlocks,
  toMinutes,
} from "./defaultStartTimes";
import type { StudySlot } from "./studyCapacity";

const slot = (start: string, finish: string): StudySlot => ({
  start,
  finish,
  minutes: toMinutes(finish) - toMinutes(start),
  label: "",
});

const busy = (start: string, end: string) => ({ start: toMinutes(start), end: toMinutes(end) });

describe("defaultStartTimes", () => {
  it("chains items back to back from the first window's start when the day is empty", () => {
    expect(
      defaultStartTimes(
        [
          { id: "a", minutes: 30 },
          { id: "b", minutes: 20 },
        ],
        [slot("15:15", "21:00")],
        [],
      ),
    ).toEqual({ a: "15:15", b: "15:45" });
  });

  it("starts added work after the day's existing sessions (append-on-confirm)", () => {
    expect(
      defaultStartTimes(
        [{ id: "new", minutes: 30 }],
        [slot("15:15", "21:00")],
        [busy("15:15", "16:00"), busy("16:00", "16:45")],
      ),
    ).toEqual({ new: "16:45" });
  });

  it("goes after the day's last session when told to, not into an earlier gap", () => {
    expect(
      defaultStartTimes(
        [{ id: "new", minutes: 20 }],
        [slot("15:15", "21:00")],
        [busy("16:00", "16:30")],
        16 * 60 + 30,
      ),
    ).toEqual({ new: "16:30" });
  });

  it("without startAfter, can use a gap before a busy block (it only avoids overlaps)", () => {
    expect(
      defaultStartTimes([{ id: "a", minutes: 20 }], [slot("15:15", "21:00")], [busy("16:00", "16:30")]),
    ).toEqual({ a: "15:15" });
  });

  it("moves to the next window when startAfter is past the current one", () => {
    expect(
      defaultStartTimes(
        [{ id: "a", minutes: 30 }],
        [slot("15:15", "16:00"), slot("18:00", "21:00")],
        [],
        16 * 60 + 15,
      ),
    ).toEqual({ a: "18:00" });
  });

  it("skips past a busy block in the middle of the chain", () => {
    expect(
      defaultStartTimes(
        [
          { id: "a", minutes: 30 },
          { id: "b", minutes: 30 },
        ],
        [slot("15:00", "21:00")],
        [busy("15:40", "16:10")],
      ),
    ).toEqual({ a: "15:00", b: "16:10" });
  });

  it("moves to the next window once the current one has run out", () => {
    expect(
      defaultStartTimes(
        [
          { id: "a", minutes: 45 },
          { id: "b", minutes: 30 },
        ],
        [slot("15:15", "16:00"), slot("18:00", "21:00")],
        [],
      ),
    ).toEqual({ a: "15:15", b: "18:00" });
  });

  it("uses 16:00 as the first default on a day with no study windows (weekends)", () => {
    expect(
      defaultStartTimes(
        [
          { id: "a", minutes: 60 },
          { id: "b", minutes: 30 },
        ],
        [],
        [],
      ),
    ).toEqual({ a: "16:00", b: "17:00" });
  });

  it("avoids an activity on a day with no study windows (e.g. a Saturday practice)", () => {
    expect(
      defaultStartTimes([{ id: "a", minutes: 60 }], [], [busy("15:30", "18:00")]),
    ).toEqual({ a: "18:00" });
  });

  it("leaves out an item that would start at or after midnight instead of wrapping", () => {
    expect(
      defaultStartTimes(
        [
          { id: "a", minutes: 60 },
          { id: "b", minutes: 30 },
        ],
        [],
        [busy("16:00", "23:30")],
      ),
    ).toEqual({ a: "23:30" });
  });

  it("returns nothing for no items", () => {
    expect(defaultStartTimes([], [slot("15:15", "21:00")], [])).toEqual({});
  });
});

describe("rechainTimes", () => {
  it("with no existing times, starts at the first window and chains back to back", () => {
    expect(
      rechainTimes(
        [
          { id: "b", minutes: 20, startTime: null },
          { id: "a", minutes: 30, startTime: null },
        ],
        [slot("15:15", "21:00")],
        [],
      ),
    ).toEqual({ b: "15:15", a: "15:35" });
  });

  it("starts at the earliest time the group already had, in the new order", () => {
    expect(
      rechainTimes(
        [
          { id: "b", minutes: 20, startTime: "16:30" },
          { id: "a", minutes: 30, startTime: "16:00" },
        ],
        [slot("15:15", "21:00")],
        [],
      ),
    ).toEqual({ b: "16:00", a: "16:20" });
  });

  it("keeps a hand-set start before the first study window", () => {
    expect(
      rechainTimes(
        [
          { id: "a", minutes: 30, startTime: "14:00" },
          { id: "b", minutes: 30, startTime: "15:30" },
        ],
        [slot("15:15", "21:00")],
        [],
      ),
    ).toEqual({ a: "14:00", b: "14:30" });
  });

  it("chains around a busy block in the middle", () => {
    expect(
      rechainTimes(
        [
          { id: "a", minutes: 30, startTime: "15:00" },
          { id: "b", minutes: 30, startTime: "15:30" },
        ],
        [slot("15:00", "21:00")],
        [busy("15:30", "16:15")],
      ),
    ).toEqual({ a: "15:00", b: "16:15" });
  });

  it("refuses the whole reorder (null) when a start would run past midnight", () => {
    expect(
      rechainTimes(
        [
          { id: "a", minutes: 60, startTime: "23:00" },
          { id: "b", minutes: 30, startTime: "23:30" },
        ],
        [],
        [],
      ),
    ).toBeNull();
  });

  it("allows the last session to start before midnight and run past it", () => {
    expect(
      rechainTimes([{ id: "a", minutes: 60, startTime: "23:30" }], [], []),
    ).toEqual({ a: "23:30" });
  });
});

describe("rechainDay", () => {
  const session = (
    id: string,
    startTime: string | null,
    plannedMinutes: number,
    status: "planned" | "in_progress" | "done" = "planned",
  ) => ({ id, startTime, plannedMinutes, status });

  it("never re-times started or done sessions, and chains planned ones around them", () => {
    const day = [
      session("p1", "15:15", 30),
      session("done", "15:45", 30, "done"),
      session("p2", "16:15", 30),
    ];
    expect(rechainDay(day, ["p2", "p1"], [slot("15:15", "21:00")], [])).toEqual({
      p2: "15:15",
      p1: "16:15",
    });
  });

  it("ignores ids that aren't planned sessions of that day", () => {
    const day = [session("p1", "15:15", 30), session("ip", "16:00", 30, "in_progress")];
    expect(rechainDay(day, ["ip", "p1", "missing"], [slot("15:15", "21:00")], [])).toEqual({
      p1: "15:15",
    });
  });

  it("treats activities (with travel) as obstacles on a day with no study windows", () => {
    const day = [session("a", "16:00", 60), session("b", "17:00", 60)];
    const saturdayPractice = activityBlocks([
      {
        name: "Soccer",
        startTime: "17:30",
        finishTime: "19:00",
        travelToMinutes: 15,
        travelFromMinutes: 15,
      },
    ]);
    expect(rechainDay(day, ["b", "a"], [], saturdayPractice)).toEqual({
      b: "16:00",
      a: "19:15",
    });
  });
});

describe("firstOverlap", () => {
  const blocks = [busy("16:00", "16:30"), { ...busy("18:00", "19:00"), label: "Soccer" }];

  it("returns the block a time would overlap", () => {
    expect(firstOverlap(toMinutes("17:45"), 30, blocks)?.label).toBe("Soccer");
  });

  it("names the earliest block it runs into, whatever order the blocks are in", () => {
    const unordered = [busy("15:45", "16:05"), { ...busy("15:15", "15:45"), label: "Read sources" }];
    expect(firstOverlap(toMinutes("15:20"), 30, unordered)?.label).toBe("Read sources");
  });

  it("treats back-to-back as not overlapping", () => {
    expect(firstOverlap(toMinutes("16:30"), 90, blocks)).toBeUndefined();
  });
});

describe("sessionBlocks", () => {
  it("skips untimed sessions and labels the rest", () => {
    expect(
      sessionBlocks(
        [
          { id: "a", startTime: "16:00", plannedMinutes: 30 },
          { id: "b", startTime: null, plannedMinutes: 30 },
        ],
        (s) => `Session ${s.id}`,
      ),
    ).toEqual([{ start: 960, end: 990, label: "Session a" }]);
  });
});
