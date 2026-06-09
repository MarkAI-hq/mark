// tests/student.spec.ts
// Student portal tests. Uses cookie injection so the middleware routes to
// /student/* correctly without needing a real student account.

import { test, expect } from "./fixtures";
import { injectStudentCookies } from "./helpers/login";

// ── Student portal (authenticated via cookie injection) ────────────────────

test.describe("Student portal — authenticated", () => {
  test.beforeEach(async ({ context }) => {
    await injectStudentCookies(context);
  });

  test("/student/dashboard loads student portal", async ({ page }) => {
    await page.goto("/student/dashboard");
    await page.waitForLoadState("networkidle");
    const body = await page.textContent("body");
    expect(body).toMatch(/dashboard|assignment|study|welcome|student/i);
    await page.screenshot({ path: "tests/screenshots/student-01-dashboard.png", fullPage: true });
  });

  test("/student/study-plans loads", async ({ page }) => {
    await page.goto("/student/study-plans");
    await page.waitForLoadState("networkidle");
    const body = await page.textContent("body");
    expect(body).toMatch(/study plan|no plan|schedule|learning/i);
    await page.screenshot({ path: "tests/screenshots/student-02-study-plans.png", fullPage: true });
  });

  test("/student/my-pathway loads", async ({ page }) => {
    await page.goto("/student/my-pathway");
    await page.waitForLoadState("networkidle");
    const body = await page.textContent("body");
    expect(body).toMatch(/pathway|learning|topic|skill|progress/i);
    await page.screenshot({ path: "tests/screenshots/student-03-pathway.png", fullPage: true });
  });

  test("Student is blocked from /dashboard → redirected to /student/dashboard", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForURL(/\/student\/dashboard/, { timeout: 10_000 });
    expect(page.url()).toContain("/student/dashboard");
  });

  test("Student is blocked from /root → redirected away", async ({ page }) => {
    await page.goto("/root");
    // Middleware: /root → /login → /student/dashboard (two hops for authenticated student)
    await page.waitForURL(/\/(login|student)/, { timeout: 10_000 });
    expect(page.url()).not.toContain("/root");
  });

  test("/student/community loads", async ({ page }) => {
    await page.route("**/api/v1/school-extras/**", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data: [] }) }),
    );
    await page.goto("/student/community");
    await page.waitForLoadState("networkidle");
    const body = await page.textContent("body");
    expect(body).toMatch(/community|extra|club|activity/i);
    await page.screenshot({ path: "tests/screenshots/student-06-community.png", fullPage: true });
  });

  test("/student/exams loads", async ({ page }) => {
    await page.route("**/api/v1/exam-registrations/my**", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data: [] }) }),
    );
    await page.goto("/student/exams");
    await page.waitForLoadState("networkidle");
    const body = await page.textContent("body");
    expect(body).toMatch(/exam|registration|board|session/i);
    await page.screenshot({ path: "tests/screenshots/student-07-exams.png", fullPage: true });
  });

  test("/student/transfer loads", async ({ page }) => {
    await page.route("**/api/v1/transfers/my**", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data: [] }) }),
    );
    await page.goto("/student/transfer");
    await page.waitForLoadState("networkidle");
    const body = await page.textContent("body");
    expect(body).toMatch(/transfer|school|request/i);
    await page.screenshot({ path: "tests/screenshots/student-08-transfer.png", fullPage: true });
  });
});

// ── Student login page (unauthenticated) ──────────────────────────────────

test.describe("Student login page", () => {
  test("loads with all required fields", async ({ page }) => {
    await page.goto("/student/login");
    await expect(page.getByLabel(/school code/i)).toBeVisible();
    await expect(page.getByLabel(/student id/i)).toBeVisible();
    await expect(page.getByLabel(/pin/i)).toBeVisible();
    await page.screenshot({ path: "tests/screenshots/student-04-login-page.png" });
  });

  test("Submit with empty fields shows validation errors", async ({ page }) => {
    await page.goto("/student/login");
    await page.locator('button[type="submit"]').click();
    await expect(page.getByText(/required/i).first()).toBeVisible();
  });

  test("PIN field is masked (type=password)", async ({ page }) => {
    await page.goto("/student/login");
    const pinInput = page.getByLabel(/pin/i);
    await expect(pinInput).toHaveAttribute("type", "password");
  });

  test("School code input auto-uppercases", async ({ page }) => {
    await page.goto("/student/login");
    const codeInput = page.getByLabel(/school code/i);
    await codeInput.fill("mir-2024");
    await expect(codeInput).toHaveValue("MIR-2024");
  });
});

// ── Public student record ──────────────────────────────────────────────────

test.describe("Public student record", () => {
  test("/record/[studentId] is publicly accessible (no auth required)", async ({ page }) => {
    // No cookies injected — public route. Use domcontentloaded: client component
    // fetches student data async which keeps the load event pending indefinitely.
    await page.goto("/record/test-student-public-id", { waitUntil: "domcontentloaded" });
    await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => {});
    // Should not redirect to login
    expect(page.url()).not.toContain("/login");
    await page.screenshot({ path: "tests/screenshots/student-05-public-record.png", fullPage: true });
  });
});
