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
  outputDir: "./tests/screenshots",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    navigationTimeout: 90_000,
  },
  projects: [
    // Unauthenticated — public pages, auth flows, student/teacher (cookie-injected)
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      testMatch: [
        "**/auth.spec.ts",
        "**/student.spec.ts",
        "**/student-marketplace.spec.ts",
        "**/teacher.spec.ts",
        "**/public-marketplace.spec.ts",
        "**/tracy-widget-visual.spec.ts",
        "**/tracy-form-wizard.spec.ts",
        "**/tracy-chat.spec.ts",
      ],
    },
    // Admin — pre-authenticated as tusiimekenneth.ug@gmail.com
    {
      name: "admin",
      use: {
        ...devices["Desktop Chrome"],
        storageState: "tests/auth/admin-auth.json",
      },
      testMatch: [
        "**/admin.spec.ts",
        "**/admin-marketplace.spec.ts",
        "**/exam-builder.spec.ts",
      ],
    },
    // Root — pre-authenticated as tusii.ug@gmail.com
    {
      name: "root",
      use: {
        ...devices["Desktop Chrome"],
        storageState: "tests/auth/root-auth.json",
      },
      testMatch: [
        "**/root.spec.ts",
        "**/verify-root.spec.ts",
      ],
    },
    // Error monitor — active cross-role page scanner (no pre-auth needed)
    {
      name: "monitor",
      use: { ...devices["Desktop Chrome"] },
      testMatch: ["**/error-monitor.spec.ts"],
    },
  ],
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
