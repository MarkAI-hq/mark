// tests/admin-marketplace.spec.ts
// Smoke tests for new admin pages added in the autonomous marketplace plan.
// Uses the "admin" project (pre-authenticated via global-setup storage state).

import { test, expect } from "./fixtures";

test.use({ storageState: "tests/auth/admin-auth.json" });

test.describe("Admin marketplace pages", () => {
  test.beforeEach(async ({ page }) => {
    // Intercept new API endpoints so tests don't depend on real backend data
    await page.route("**/api/v1/organizations/my/stats**", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: {
            student_count: 42,
            certificates_issued: 7,
            total_gross_usd: 1200,
            total_school_revenue_usd: 480,
          },
        }),
      }),
    );
    await page.route("**/api/v1/organizations/my/earnings**", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data: [] }) }),
    );
    await page.route("**/api/v1/exam-registrations/org**", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data: [] }) }),
    );
    await page.route("**/api/v1/school-extras/**", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data: [] }) }),
    );
    await page.route("**/api/v1/school-verification/my**", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data: null }) }),
    );
  });

  test("/dashboard/partner loads School Hub", async ({ page }) => {
    await page.goto("/dashboard/partner");
    await page.waitForLoadState("networkidle");
    const url = page.url();
    // Accept both the page and an onboarding redirect
    expect(url).toMatch(/\/(dashboard|onboarding)/);
    if (url.includes("/dashboard/partner")) {
      const body = await page.textContent("body");
      expect(body).toMatch(/school hub|revenue|earnings|student/i);
    }
    await page.screenshot({ path: "tests/screenshots/admin-marketplace-01-partner.png", fullPage: true });
  });

  test("/dashboard/extras loads extras management", async ({ page }) => {
    await page.goto("/dashboard/extras");
    await page.waitForLoadState("networkidle");
    const url = page.url();
    expect(url).toMatch(/\/(dashboard|onboarding)/);
    if (url.includes("/dashboard/extras")) {
      const body = await page.textContent("body");
      expect(body).toMatch(/extra|activity|create|add/i);
    }
    await page.screenshot({ path: "tests/screenshots/admin-marketplace-02-extras.png", fullPage: true });
  });

  test("/dashboard/verification loads accreditation page", async ({ page }) => {
    await page.goto("/dashboard/verification");
    await page.waitForLoadState("networkidle");
    const url = page.url();
    expect(url).toMatch(/\/(dashboard|onboarding)/);
    if (url.includes("/dashboard/verification")) {
      const body = await page.textContent("body");
      expect(body).toMatch(/verification|accreditation|document|submit/i);
    }
    await page.screenshot({ path: "tests/screenshots/admin-marketplace-03-verification.png", fullPage: true });
  });
});
