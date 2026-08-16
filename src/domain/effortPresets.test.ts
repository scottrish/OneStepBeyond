import { describe, expect, it } from "vitest";
import { effortLabel } from "./effortPresets";

describe("effortLabel", () => {
  it("uses the preset label for an exact preset match", () => {
    expect(effortLabel(45)).toBe("45m");
    expect(effortLabel(60)).toBe("1h");
    expect(effortLabel(90)).toBe("1.5h");
  });

  it("formats a non-preset total under an hour as plain minutes", () => {
    expect(effortLabel(20)).toBe("20m");
  });

  it("formats a non-preset whole-hour total with no minutes remainder", () => {
    expect(effortLabel(240)).toBe("4h");
  });

  it("formats a non-preset total with both hours and minutes", () => {
    // docs/playwright/manual-work-breakdown-reflection/iteration-01/findings.yaml
    // FINDING-WB-002 — 45m + 1h + 45m, a real Work Breakdown total that
    // doesn't land on any fixed preset.
    expect(effortLabel(150)).toBe("2h 30m");
    expect(effortLabel(165)).toBe("2h 45m");
    expect(effortLabel(105)).toBe("1h 45m");
  });
});
