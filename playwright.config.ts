import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",

  use: {
    baseURL: "http://localhost:5173",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },

  projects: [
    {
      name: "authentication",
      testMatch: /auth\.setup\.ts/,
    },

    {
      name: "persona-assessment",
      use: {
        ...devices["Desktop Chrome"],
        storageState: "tests/.auth/admin.json",
      },
      dependencies: ["authentication"],
      testIgnore: /auth\.setup\.ts/,
    },
  ],
});
