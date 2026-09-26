import { describe, expect, it } from "vitest";
import {
  chooseIntervention,
  frictionOptions,
  isDueBeforeTomorrow,
  isDueTodayOrEarlier,
  laterTodayStart,
} from "./executionCoaching";

describe("frictionOptions", () => {
  it("offers five options before starting and six once in progress", () => {
    expect(frictionOptions("before_start").map((o) => o.label)).toEqual([
      "I can't get started",
      "I don't understand what to do",
      "It feels too big",
      "I'm distracted",
      "Something else",
    ]);
    expect(frictionOptions("in_progress").map((o) => o.label)).toEqual([
      "I don't know what to do next",
      "I don't understand this",
      "This is bigger than I thought",
      "I'm distracted",
      "It's taking longer than I expected",
      "Something else",
    ]);
  });
});

describe("chooseIntervention", () => {
  it("maps each friction kind to exactly one intervention, always with a way to change the plan", () => {
    const kinds = ["cant_start", "unclear_task", "too_big", "distracted", "dont_know_next", "taking_longer", "other"] as const;
    const ids = kinds.map((kind) => chooseIntervention(kind, []).id);
    expect(new Set(ids).size).toBe(7);
    for (const kind of kinds) {
      expect(chooseIntervention(kind, []).actions.some((a) => a.effect === "open_repair")).toBe(true);
    }
  });

  it("uses the prototype's copy", () => {
    const taking = chooseIntervention("taking_longer", []);
    expect(taking.headline).toBe("Your first estimate may need updating.");
    expect(taking.actions.map((a) => a.label)).toEqual([
      "Add 10 min to my estimate",
      "Keep going without changing it",
      "Stop and replan",
    ]);
  });

  it("never offers 'Look at the assignment brief' (this app has no brief)", () => {
    expect(chooseIntervention("unclear_task", []).actions.map((a) => a.label)).not.toContain(
      "Look at the assignment brief",
    );
  });

  it("offers 'Something else' instead of a strategy dismissed twice recently", () => {
    expect(chooseIntervention("distracted", ["refocus"]).id).toBe("refocus");
    expect(chooseIntervention("distracted", ["refocus", "small-start", "refocus"]).id).toBe("open-choice");
  });
});

describe("repair helpers", () => {
  it("flags due today or overdue, and due before tomorrow", () => {
    expect(isDueTodayOrEarlier("2026-03-16", "2026-03-16")).toBe(true);
    expect(isDueTodayOrEarlier("2026-03-15", "2026-03-16")).toBe(true);
    expect(isDueTodayOrEarlier("2026-03-17", "2026-03-16")).toBe(false);
    expect(isDueBeforeTomorrow("2026-03-16", "2026-03-16")).toBe(true);
    expect(isDueBeforeTomorrow("2026-03-17", "2026-03-16")).toBe(false);
  });

  const slot = (start: string, finish: string) => ({ start, finish, minutes: 0, label: "" });
  const at = (hhmm: string) => {
    const [h, m] = hhmm.split(":").map(Number);
    return h! * 60 + m!;
  };

  it("'Later today' is the first free start after now and after the day's other sessions", () => {
    expect(
      laterTodayStart(30, [{ start: at("16:00"), end: at("16:30") }], [], [slot("15:15", "21:00")], at("15:00")),
    ).toBe("16:30");
    expect(laterTodayStart(30, [], [], [slot("15:15", "21:00")], at("17:10"))).toBe("17:10");
  });

  it("skips an activity (with travel)", () => {
    expect(
      laterTodayStart(30, [], [{ start: at("17:00"), end: at("18:30") }], [slot("15:15", "21:00")], at("16:45")),
    ).toBe("18:30");
  });

  it("is null when nothing fits before midnight", () => {
    expect(laterTodayStart(30, [], [], [slot("15:15", "21:00")], at("23:59") + 1)).toBeNull();
  });
});
