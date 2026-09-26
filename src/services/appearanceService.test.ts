import { afterEach, describe, expect, it, vi } from "vitest";
import { APPEARANCE_STORAGE_KEY, readAppearance, saveAppearance } from "./appearanceService";

afterEach(() => {
  window.localStorage.clear();
  vi.restoreAllMocks();
});

describe("appearanceService", () => {
  it("defaults to 'Match my device' when nothing is saved", () => {
    expect(readAppearance()).toBe("system");
  });

  it("saves and reads the choice on this device", () => {
    saveAppearance("dark");
    expect(window.localStorage.getItem(APPEARANCE_STORAGE_KEY)).toBe("dark");
    expect(readAppearance()).toBe("dark");
  });

  it("ignores an unrecognised saved value", () => {
    window.localStorage.setItem(APPEARANCE_STORAGE_KEY, "purple");
    expect(readAppearance()).toBe("system");
  });

  it("never throws when storage is blocked", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(readAppearance()).toBe("system");
    expect(() => saveAppearance("light")).not.toThrow();
  });
});
