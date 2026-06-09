// tests/teacher.spec.ts
// Teacher portal tests. Uses cookie injection (fake JWT) so the middleware
// routes correctly. API calls that fail return empty / error states — the tests
// assert on navigation and UI structure, not data content.

import { test, expect } from "./fixtures";
import { injectTeacherCookies } from "./helpers/login";

test.beforeEach(async ({ context }) => {
  await injectTeacherCookies(context);
});

// ── Role-guard redirects ───────────────────────────────────────────────────

test.describe("Teacher role-guard", () => {
  test("/dashboard redirects teacher to /dashboard/teacher", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForURL(/\/dashboard\/teacher/, { timeout: 10_000 });
    expect(page.url()).toContain("/dashboard/teacher");
  });

  test("Teacher cannot access /dashboard/settings → redirected", async ({ page }) => {
    await page.goto("/dashboard/settings");
    await page.waitForURL(/\/dashboard\/teacher/, { timeout: 10_000 });
    expect(page.url()).toContain("/dashboard/teacher");
  });

  test("Teacher cannot access /dashboard/classes (admin-only) → redirected", async ({ page }) => {
    await page.goto("/dashboard/classes");
    await page.waitForURL(/\/dashboard\/teacher/, { timeout: 10_000 });
    expect(page.url()).toContain("/dashboard/teacher");
  });

  test("Teacher cannot access /root → redirected away", async ({ page }) => {
    await page.goto("/root");
    // Middleware: /root → /login → /dashboard/teacher (two hops for authenticated teacher)
    await page.waitForURL(/\/(login|dashboard)/, { timeout: 10_000 });
    expect(page.url()).not.toContain("/root");
  });
});

// ── Teacher dashboard ──────────────────────────────────────────────────────

test.describe("Teacher dashboard", () => {
  test("/dashboard/teacher renders the teacher shell", async ({ page }) => {
    await page.goto("/dashboard/teacher");
    await page.waitForLoadState("networkidle");
    const body = await page.textContent("body");
    expect(body).toMatch(/teacher|class|assessment|dashboard/i);
    await page.screenshot({ path: "tests/screenshots/teacher-01-dashboard.png", fullPage: true });
  });

  test("Sidebar nav is visible", async ({ page }) => {
    await page.goto("/dashboard/teacher");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("nav, aside").first()).toBeVisible();
  });
});

// ── Teacher classes ────────────────────────────────────────────────────────

test.describe("Teacher classes", () => {
  test("/dashboard/teacher/classes loads", async ({ page }) => {
    await page.goto("/dashboard/teacher/classes");
    await page.waitForLoadState("networkidle");
    const body = await page.textContent("body");
    expect(body).toMatch(/class(es)?|no class/i);
    await page.screenshot({ path: "tests/screenshots/teacher-02-classes.png", fullPage: true });
  });

  test("Class detail URL pattern loads without crash", async ({ page }) => {
    await page.goto("/dashboard/teacher/classes/test-class-id");
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: "tests/screenshots/teacher-03-class-detail.png", fullPage: true });
  });
});

// ── Attendance ─────────────────────────────────────────────────────────────

test.describe("Attendance", () => {
  test("Attendance page under a class loads", async ({ page }) => {
    await page.goto("/dashboard/teacher/classes/test-class-id/attendance");
    await page.waitForLoadState("networkidle");
    const body = await page.textContent("body");
    expect(body).toMatch(/attendance|session|present|absent/i);
    await page.screenshot({ path: "tests/screenshots/teacher-04-attendance.png", fullPage: true });
  });
});

// ── Timetable ──────────────────────────────────────────────────────────────

test.describe("Timetable", () => {
  test("Timetable page loads", async ({ page }) => {
    await page.goto("/dashboard/teacher/classes/test-class-id/timetable");
    await page.waitForLoadState("networkidle");
    const body = await page.textContent("body");
    expect(body).toMatch(/timetable|schedule|period|lesson/i);
    await page.screenshot({ path: "tests/screenshots/teacher-05-timetable.png", fullPage: true });
  });
});

// ── Scheme of work ─────────────────────────────────────────────────────────

test.describe("Scheme of work", () => {
  test("Scheme of work page loads", async ({ page }) => {
    await page.goto("/dashboard/teacher/classes/test-class-id/scheme-of-work");
    await page.waitForLoadState("networkidle");
    const body = await page.textContent("body");
    expect(body).toMatch(/scheme|work|week|topic|lesson/i);
    await page.screenshot({ path: "tests/screenshots/teacher-06-scheme-of-work.png", fullPage: true });
  });
});

// ── Gap report ─────────────────────────────────────────────────────────────

test.describe("Gap report", () => {
  test("Gap report page loads", async ({ page }) => {
    await page.goto("/dashboard/teacher/classes/test-class-id/gap-report");
    await page.waitForLoadState("networkidle");
    const body = await page.textContent("body");
    expect(body).toMatch(/gap|report|exposure|coverage|topic/i);
    await page.screenshot({ path: "tests/screenshots/teacher-07-gap-report.png", fullPage: true });
  });
});

// ── Teacher settings ───────────────────────────────────────────────────────

test.describe("Teacher settings", () => {
  test("/dashboard/teacher/settings loads", async ({ page }) => {
    await page.goto("/dashboard/teacher/settings");
    await page.waitForLoadState("networkidle");
    const body = await page.textContent("body");
    expect(body).toMatch(/setting(s)?|profile|password|notification/i);
    await page.screenshot({ path: "tests/screenshots/teacher-08-settings.png", fullPage: true });
  });
});

// ── Tracy AI (teacher can access) ─────────────────────────────────────────

test.describe("Tracy — teacher access", () => {
  test("/dashboard/tracy loads for a teacher", async ({ page }) => {
    await page.route("/api/tracy/suggest", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: '{"suggestions":null}' });
    });
    await page.goto("/dashboard/tracy");
    await page.waitForLoadState("networkidle");
    await expect(page.getByPlaceholder(/ask tracy/i)).toBeVisible();
    await page.screenshot({ path: "tests/screenshots/teacher-09-tracy.png" });
  });
});
