// EXAMPLE persona smoke test — copy this file, rename it, and replace the
// assertion with a cheap regression guard for whatever discoverability or
// friction point a real synthetic persona assessment surfaced for this
// application. See synthetic/README.md for how this fits into the wider
// persona testing workflow.
import { expect, test } from "@playwright/test";

test.describe("First-time User", () => {
  test("can find the application's primary call-to-action", async ({ page }) => {
    await page.goto("http://localhost:5173/");

    const primaryAction = page.getByRole("button", {
      name: /create|new|get started/i,
    }).or(
      page.getByRole("link", {
        name: /create|new|get started/i,
      }),
    );

    await expect(primaryAction).toBeVisible();
  });
});
