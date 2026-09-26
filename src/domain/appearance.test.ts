import { describe, expect, it } from "vitest";
import { APPEARANCE_CHOICES, THEME_COLORS, appearanceLabel, isAppearanceChoice, resolveScheme } from "./appearance";
import { APPEARANCE_STORAGE_KEY } from "../services/appearanceService";
import html from "../../index.html?raw";

describe("resolveScheme", () => {
  it("follows the device for 'Match my device', and the choice otherwise", () => {
    expect(resolveScheme("system", true)).toBe("dark");
    expect(resolveScheme("system", false)).toBe("light");
    expect(resolveScheme("dark", false)).toBe("dark");
    expect(resolveScheme("light", true)).toBe("light");
  });
});

describe("choices", () => {
  it("are Match my device (first, the default), Light and Dark", () => {
    expect(APPEARANCE_CHOICES.map((c) => c.label)).toEqual(["Match my device", "Light", "Dark"]);
    expect(appearanceLabel("system")).toBe("Match my device");
  });

  it("recognises only the three saved values", () => {
    expect(isAppearanceChoice("dark")).toBe(true);
    expect(isAppearanceChoice("blue")).toBe(false);
    expect(isAppearanceChoice(null)).toBe(false);
  });
});

describe("index.html's inline script", () => {
  // It runs before the app loads, so it can't import these; this keeps the
  // copies in step.

  it("reads the same storage key and uses the same status-bar colours", () => {
    expect(html).toContain(`localStorage.getItem("${APPEARANCE_STORAGE_KEY}")`);
    expect(html).toContain(THEME_COLORS.dark);
    expect(html).toContain(THEME_COLORS.light);
    expect(html).toContain('setAttribute("data-theme"');
  });

  it("has a single theme-color tag (not one per device scheme)", () => {
    expect(html.match(/<meta name="theme-color"/g)).toHaveLength(1);
  });
});
