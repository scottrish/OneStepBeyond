import { describe, expect, it } from "vitest";
import { defaultStartTimes, toMinutes } from "./defaultStartTimes";
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
