import { describe, expect, it } from "vitest";
import { ACCOUNT_TURNED_OFF, formatAdminDate, roleLabels, signInErrorMessage } from "./adminAccounts";

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
