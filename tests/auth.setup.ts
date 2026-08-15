import { expect, test as setup } from "@playwright/test";

const authFile = "tests/.auth/admin.json";

setup("authenticate administrator", async ({ page }) => {
  await page.goto("http://localhost:5173/login");

  await page.getByLabel(/email/i).fill(
    process.env.PLAYWRIGHT_ADMIN_EMAIL ?? "",
  );

  await page.getByLabel(/password/i).fill(
    process.env.PLAYWRIGHT_ADMIN_PASSWORD ?? "",
  );

  await page.getByRole("button", {
    name: /sign in|log in/i,
  }).click();

  // No router in the app yet (added when a feature needs one, per
  // CLAUDE.md) — App.tsx swaps rendered content on auth state without
  // changing the URL, so success is signaled by content, not navigation.
  // Sign out lives behind Settings now (see docs/features/home-dashboard.md's
  // Navigation section), so the Home heading — always visible right after
  // login — is the stable signal instead.
  await expect(
    page.getByRole("heading", { name: /home/i }),
  ).toBeVisible();

  await page.context().storageState({
    path: authFile,
  });
});
