// tests/error-monitor.spec.ts
// Active cross-role error scanner. Visits every key page as each role and
// asserts no console errors or JS exceptions. Run standalone:
//   pnpm test:e2e -- tests/error-monitor.spec.ts
//
// Results (with screenshots on failure) go to tests/screenshots/error-*.png
// and tests/error-log.json.

import { test, expect } from "./fixtures";
import { injectTeacherCookies, injectStudentCookies } from "./helpers/login";

// Pages to scan per role — add new routes here as the app grows
const TEACHER_PAGES = [
  "/dashboard/teacher",
  "/dashboard/teacher/classes",
  "/dashboard/teacher/assessments",
  "/dashboard/teacher/attendance",
  "/dashboard/teacher/reports",
];

const STUDENT_PAGES = [
  "/student/dashboard",
  "/student/study-plans",
  "/student/pathway",
  "/student/exams",
];

const ADMIN_PAGES = [
  "/dashboard",
  "/dashboard/classes",
  "/dashboard/settings",
  "/dashboard/students",
  "/dashboard/teachers",
];

// ── Teacher ────────────────────────────────────────────────────────────────

test.describe("Teacher pages — no browser errors", () => {
  test.beforeEach(async ({ context }) => {
    await injectTeacherCookies(context);
  });

  for (const route of TEACHER_PAGES) {
    test(`${route}`, async ({ page, devToolsErrors }) => {
      await page.goto(route, { waitUntil: "domcontentloaded" });
      await page.waitForLoadState("networkidle").catch(() => {});

      const hardErrors = [
        ...devToolsErrors.console.filter((c) => c.level === "error"),
        ...devToolsErrors.pageErrors,
      ];

      if (hardErrors.length > 0) {
        await page.screenshot({
          path: `tests/screenshots/monitor-teacher-error.png`,
          fullPage: true,
        });
      }

      expect(hardErrors, `Console/JS errors on ${route}:\n${JSON.stringify(hardErrors, null, 2)}`).toHaveLength(0);
    });
  }
});

// ── Student ────────────────────────────────────────────────────────────────

test.describe("Student pages — no browser errors", () => {
  test.beforeEach(async ({ context }) => {
    await injectStudentCookies(context);
  });

  for (const route of STUDENT_PAGES) {
    test(`${route}`, async ({ page, devToolsErrors }) => {
      await page.goto(route, { waitUntil: "domcontentloaded" });
      await page.waitForLoadState("networkidle").catch(() => {});

      const hardErrors = [
        ...devToolsErrors.console.filter((c) => c.level === "error"),
        ...devToolsErrors.pageErrors,
      ];

      if (hardErrors.length > 0) {
        await page.screenshot({
          path: `tests/screenshots/monitor-student-error.png`,
          fullPage: true,
        });
      }

      expect(hardErrors, `Console/JS errors on ${route}:\n${JSON.stringify(hardErrors, null, 2)}`).toHaveLength(0);
    });
  }
});

// ── Admin (pre-authenticated) ──────────────────────────────────────────────

test.describe("Admin pages — no browser errors", () => {
  test.use({ storageState: "tests/auth/admin-auth.json" });

  for (const route of ADMIN_PAGES) {
    test(`${route}`, async ({ page, devToolsErrors }) => {
      await page.goto(route, { waitUntil: "domcontentloaded" });
      await page.waitForLoadState("networkidle").catch(() => {});

      const hardErrors = [
        ...devToolsErrors.console.filter((c) => c.level === "error"),
        ...devToolsErrors.pageErrors,
      ];

      if (hardErrors.length > 0) {
        await page.screenshot({
          path: `tests/screenshots/monitor-admin-error.png`,
          fullPage: true,
        });
      }

      expect(hardErrors, `Console/JS errors on ${route}:\n${JSON.stringify(hardErrors, null, 2)}`).toHaveLength(0);
    });
  }
});

// ── Network failures summary ───────────────────────────────────────────────
// Soft check — logs 4xx/5xx but doesn't fail the test (API calls may 401
// legitimately in the test environment with fake tokens).

test("Network failure summary across key pages", async ({ page, devToolsErrors }) => {
  await injectTeacherCookies(page.context());

  const pagesToCheck = [...TEACHER_PAGES.slice(0, 3), ...STUDENT_PAGES.slice(0, 2)];
  for (const route of pagesToCheck) {
    await page.goto(route, { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle").catch(() => {});
  }

  const serverErrors = devToolsErrors.network.filter((n) => n.status >= 500);
  if (serverErrors.length > 0) {
    console.warn("5xx server errors detected:", JSON.stringify(serverErrors, null, 2));
  }

  // Only fail on 5xx — 4xx are expected with fake tokens
  expect(serverErrors, `5xx errors:\n${JSON.stringify(serverErrors, null, 2)}`).toHaveLength(0);
});
