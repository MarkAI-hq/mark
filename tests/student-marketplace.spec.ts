// tests/student-marketplace.spec.ts
// Smoke tests for new student portal pages added in the autonomous marketplace plan.
// Uses cookie injection so the middleware routes to /student/* without a real account.

import { test, expect } from "./fixtures";
import { injectStudentCookies } from "./helpers/login";

test.describe("Student marketplace pages — authenticated", () => {
  test.beforeEach(async ({ context, page }) => {
    await injectStudentCookies(context);

    // Intercept backend calls that would fail without a real API — return empty states
    await page.route("**/api/v1/students/*/streak**", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data: { study_streak: 0 } }) }),
    );
    await page.route("**/api/v1/analytics/student/**", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data: null }) }),
    );
    await page.route("**/api/v1/cognitive/students/**", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data: [] }) }),
    );
    await page.route("**/api/v1/submissions/student/**", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data: [] }) }),
    );
    await page.route("**/api/v1/study-plans/student/**", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data: [] }) }),
    );
    await page.route("**/api/v1/certificates/student/**", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data: [] }) }),
    );
    await page.route("**/api/v1/school-extras/**", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data: [] }) }),
    );
    await page.route("**/api/v1/student-extra-enrollments/**", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data: [] }) }),
    );
    await page.route("**/api/v1/exam-registrations/my**", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data: [] }) }),
    );
    await page.route("**/api/v1/transfers/my**", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data: [] }) }),
    );
    await page.route("**/api/v1/welcome-pack/my**", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data: [] }) }),
    );
  });

  test("/student/community loads school extras", async ({ page }) => {
    await page.goto("/student/community");
    await page.waitForLoadState("networkidle");
    const body = await page.textContent("body");
    expect(body).toMatch(/community|extra|club|activity|enroll/i);
    await page.screenshot({ path: "tests/screenshots/student-marketplace-01-community.png", fullPage: true });
  });

  test("/student/exams loads exam registration page", async ({ page }) => {
    await page.goto("/student/exams");
    await page.waitForLoadState("networkidle");
    const body = await page.textContent("body");
    expect(body).toMatch(/exam|registration|board|session/i);
    await page.screenshot({ path: "tests/screenshots/student-marketplace-02-exams.png", fullPage: true });
  });

  test("/student/transfer loads transfer page", async ({ page }) => {
    await page.goto("/student/transfer");
    await page.waitForLoadState("networkidle");
    const body = await page.textContent("body");
    expect(body).toMatch(/transfer|school|request/i);
    await page.screenshot({ path: "tests/screenshots/student-marketplace-03-transfer.png", fullPage: true });
  });

  test("/student/welcome-pack loads welcome pack page", async ({ page }) => {
    await page.goto("/student/welcome-pack");
    await page.waitForLoadState("networkidle");
    const body = await page.textContent("body");
    expect(body).toMatch(/welcome|pack|shipping|order/i);
    await page.screenshot({ path: "tests/screenshots/student-marketplace-04-welcome-pack.png", fullPage: true });
  });

  test("/student/certificates loads certificates page", async ({ page }) => {
    await page.goto("/student/certificates");
    await page.waitForLoadState("networkidle");
    const body = await page.textContent("body");
    expect(body).toMatch(/certificate|achievement|award|unlock/i);
    await page.screenshot({ path: "tests/screenshots/student-marketplace-05-certificates.png", fullPage: true });
  });
});
