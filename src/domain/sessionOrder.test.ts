import { describe, expect, it } from "vitest";
import { changedStartTimes, sortByStartTime, withStartTimes } from "./sessionOrder";
import type { WorkSession } from "../services/workSessionService";

const session = (id: string, startTime: string | null): WorkSession => ({
  id,
  workItemId: `w-${id}`,
  date: "2026-09-28",
  plannedMinutes: 30,
  startTime,
  status: "planned",
});

describe("sortByStartTime", () => {
  it("puts untimed sessions after every timed one", () => {
    expect(
      sortByStartTime([session("a", null), session("b", "17:00"), session("c", "15:30")]).map(
        (s) => s.id,
      ),
    ).toEqual(["c", "b", "a"]);
  });
});

describe("withStartTimes", () => {
  it("applies new start times and leaves other sessions alone", () => {
    expect(
      withStartTimes([session("a", "15:00"), session("b", "16:00")], [
        { id: "b", startTime: "15:30" },
      ]),
    ).toEqual([session("a", "15:00"), session("b", "15:30")]);
  });
});

describe("changedStartTimes", () => {
  it("returns only times that differ, treating HH:MM:SS and HH:MM as equal", () => {
    expect(
      changedStartTimes([session("a", "15:00:00"), session("b", "16:00:00"), session("c", null)], {
        a: "15:00",
        b: "15:30",
        c: "16:00",
      }),
    ).toEqual([
      { id: "b", startTime: "15:30" },
      { id: "c", startTime: "16:00" },
    ]);
  });
});
