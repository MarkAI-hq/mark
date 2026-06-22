import { test } from "./fixtures";
import { expect } from "@playwright/test";

// Real student-session browser test for study-plan citation rendering.
// Authenticates with the REAL student credentials (school MCS-2026 / id
// STU-2026-001 / PIN 252924) via the live API, injects the real session cookies
// (exactly what the login action sets), then asserts the SourcesConsulted block
// renders on the seeded study plan (real login → real SSR fetch → real render).
const API = "http://localhost:4000/api/v1";

test.describe("Student study-plan citations (real session)", () => {
  test("lesson 'Learn' step shows grounded syllabus citations", async ({
    page,
    context,
  }) => {
    // ── Real login via the live API ─────────────────────────────────────────
    const resp = await page.request.post(`${API}/auth/student-login`, {
      data: {
        school_code: "MCS-2026",
        student_school_id: "STU-2026-001",
        pin: "252924",
      },
    });
    expect(resp.ok()).toBeTruthy();
    const json = await resp.json();
    expect(json.accessToken).toBeTruthy();

    await context.addCookies([
      { name: "token", value: json.accessToken, domain: "localhost", path: "/" },
      { name: "refreshToken", value: json.refreshToken, domain: "localhost", path: "/" },
      { name: "user", value: encodeURIComponent(JSON.stringify(json.user)), domain: "localhost", path: "/" },
    ]);

    // ── Study plans → open the seeded lesson ────────────────────────────────
    await page.goto("/student/study-plans", { waitUntil: "domcontentloaded", timeout: 120_000 });
    await page.waitForLoadState("networkidle", { timeout: 60_000 }).catch(() => {});

    await expect(page.getByText("Photosynthesis").first()).toBeVisible({ timeout: 30_000 });
    await page.getByText("Photosynthesis").first().click();

    // Move to the "Learn" step where the lesson body + citations render.
    await page.getByText(/^Learn$/).first().click().catch(() => {});

    await expect(page.getByText(/Grounded in the official syllabus/i)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/NCDC Biology Syllabus 2020/i)).toBeVisible();
    await expect(page.getByText(/p\.25/i)).toBeVisible();
  });
});
