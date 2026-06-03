// tests/student.spec.ts
// Student portal tests. Uses cookie injection so the middleware routes to
// /student/* correctly without needing a real student account.

import { test, expect } from "@playwright/test";
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

  test("Student is blocked from /root → redirected to /login", async ({ page }) => {
    await page.goto("/root");
    await page.waitForURL(/\/login/, { timeout: 10_000 });
    expect(page.url()).toContain("/login");
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
    // No cookies injected — public route
    await page.goto("/record/test-student-public-id");
    await page.waitForLoadState("networkidle");
    // Should not redirect to login
    expect(page.url()).not.toContain("/login");
    await page.screenshot({ path: "tests/screenshots/student-05-public-record.png", fullPage: true });
  });
});
