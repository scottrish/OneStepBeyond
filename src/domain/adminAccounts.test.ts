import { describe, expect, it } from "vitest";
import {
  ACCOUNT_TURNED_OFF,
  dateRangeBounds,
  describeAdminAction,
  formatAdminDate,
  roleLabels,
  signInErrorMessage,
} from "./adminAccounts";
import { ALL_CATEGORIES } from "./adminClearing";

describe("adminAccounts", () => {
  it("roles in words, or 'No data yet'", () => {
    expect(roleLabels({ isStudent: true, isSupporter: true, isAdmin: false })).toEqual(["Student", "Supporter"]);
    expect(roleLabels({ isStudent: false, isSupporter: false, isAdmin: true })).toEqual(["Admin"]);
    expect(roleLabels({ isStudent: false, isSupporter: false, isAdmin: false })).toEqual(["No data yet"]);
  });

  it("a turned-off account is told plainly (A3); other sign-in errors pass through", () => {
    expect(signInErrorMessage({ code: "user_banned", message: "User is banned" })).toBe(ACCOUNT_TURNED_OFF);
    expect(ACCOUNT_TURNED_OFF).toBe("This account has been turned off. Ask your teacher or the app’s administrator.");
    expect(signInErrorMessage({ code: "invalid_credentials", message: "Invalid login credentials" })).toBe(
      "Invalid login credentials",
    );
  });

  it("dates, or a dash for never", () => {
    expect(formatAdminDate("2026-09-26T12:00:00Z")).toMatch(/Sep 2[56], 2026/);
    expect(formatAdminDate(null)).toBe("—");
  });
});

describe("the admin record's wording (admin-action-log-v0.1.md, G1)", () => {
  it("turned off, turned back on", () => {
    expect(describeAdminAction({ action: "disable", categories: [], alsoDisabled: false })).toBe("Turned off");
    expect(describeAdminAction({ action: "enable", categories: [], alsoDisabled: false })).toBe("Turned back on");
  });

  it("cleared categories, all data, and all data plus turned off", () => {
    expect(describeAdminAction({ action: "clear", categories: ["plans", "activities"], alsoDisabled: false })).toBe(
      "Cleared plans (keeps assignments and steps), activities",
    );
    expect(describeAdminAction({ action: "clear", categories: [...ALL_CATEGORIES], alsoDisabled: false })).toBe(
      "Cleared all data",
    );
    expect(describeAdminAction({ action: "clear", categories: [...ALL_CATEGORIES], alsoDisabled: true })).toBe(
      "Cleared all data and turned off",
    );
  });
});

describe("dateRangeBounds (G2): the viewer's own days, both inclusive", () => {
  it("from the start of 'from' to the start of the day after 'to'", () => {
    const { from, to } = dateRangeBounds("2026-09-01", "2026-09-26");
    expect(from).toBe(new Date(2026, 8, 1).toISOString());
    expect(to).toBe(new Date(2026, 8, 27).toISOString());
  });

  it("either end can be open, and the month rolls over", () => {
    expect(dateRangeBounds("", "")).toEqual({ from: null, to: null });
    expect(dateRangeBounds("", "2026-09-30").to).toBe(new Date(2026, 9, 1).toISOString());
  });

  it("'to' before 'from' just matches nothing (no error)", () => {
    const { from, to } = dateRangeBounds("2026-09-26", "2026-09-01");
    expect(Date.parse(to!)).toBeLessThan(Date.parse(from!));
  });
});
