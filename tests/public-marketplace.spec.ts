// tests/public-marketplace.spec.ts
// Smoke tests for new public-facing pages (no auth required).
// Uses the default "chromium" project with API route mocking.

import { test, expect } from "./fixtures";

const MOCK_ORG = {
  organization_id: "test-org-1",
  name: "Greenfield Academy",
  school_code: "TEST-SCHOOL",
  country_code: "UG",
  education_system: "Uganda O-Level",
  is_public: true,
  is_verified: true,
  student_count: 120,
  cert_count: 34,
};

test.describe("Public marketplace pages — no auth", () => {
  test("/schools lists available schools", async ({ page }) => {
    await page.route("**/api/v1/organizations/public/list**", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: [MOCK_ORG] }),
      }),
    );

    await page.goto("/schools");
    await page.waitForLoadState("networkidle");
    // Should not redirect to login
    expect(page.url()).not.toContain("/login");
    const body = await page.textContent("body");
    expect(body).toMatch(/school|find|explore|discover/i);
    await page.screenshot({ path: "tests/screenshots/public-01-schools.png", fullPage: true });
  });

  test("/schools/register loads registration form", async ({ page }) => {
    await page.route("**/api/v1/curricula/public**", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: [{ id: "ug_o_level", name: "Uganda O-Level" }] }),
      }),
    );

    await page.goto("/schools/register");
    await page.waitForLoadState("networkidle");
    expect(page.url()).not.toContain("/login");
    const body = await page.textContent("body");
    expect(body).toMatch(/register|school name|director|sign up/i);
    await page.screenshot({ path: "tests/screenshots/public-02-school-register.png", fullPage: true });
  });

  test("/schools/[schoolCode] loads school profile", async ({ page }) => {
    await page.route("**/api/v1/organizations/public/TEST-SCHOOL**", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: MOCK_ORG }),
      }),
    );

    await page.goto("/schools/TEST-SCHOOL");
    await page.waitForLoadState("networkidle", { timeout: 30_000 }).catch(() => {});
    expect(page.url()).not.toContain("/login");
    const body = await page.textContent("body");
    // School name or generic school content
    expect(body).toMatch(/school|academy|apply|enroll/i);
    await page.screenshot({ path: "tests/screenshots/public-03-school-profile.png", fullPage: true });
  });

  test("/enroll/[schoolCode] loads self-enrollment form", async ({ page }) => {
    await page.route("**/api/v1/organizations/public/TEST-SCHOOL**", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: MOCK_ORG }),
      }),
    );

    await page.goto("/enroll/TEST-SCHOOL");
    await page.waitForLoadState("networkidle");
    expect(page.url()).not.toContain("/login");
    const body = await page.textContent("body");
    expect(body).toMatch(/enroll|student|name|pin/i);
    await page.screenshot({ path: "tests/screenshots/public-04-enroll.png", fullPage: true });
  });
});
