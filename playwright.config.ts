import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  timeout: 90_000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? "github" : "list",
  globalSetup: "./tests/global-setup.ts",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    navigationTimeout: 90_000,
  },
  projects: [
    // Unauthenticated — used for auth flow tests
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    // Admin — pre-authenticated as tusiimekenneth.ug@gmail.com
    {
      name: "admin",
      use: {
        ...devices["Desktop Chrome"],
        storageState: "tests/auth/admin-auth.json",
      },
    },
    // Root — pre-authenticated as tusii.ug@gmail.com
    {
      name: "root",
      use: {
        ...devices["Desktop Chrome"],
        storageState: "tests/auth/root-auth.json",
      },
    },
  ],
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
