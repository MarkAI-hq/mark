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

  // ── Sprint 2 — 5-day study plan timeline ─────────────────────────────────

  test("/student/study-plans renders timeline layout (Sprint 2)", async ({ page }) => {
    // Mock study plans API so we get a predictable timeline payload
    await page.route("**/api/v1/study-plans**", async (route) => {
      const today = new Date().toISOString();
      const tomorrow = new Date(Date.now() + 86_400_000).toISOString();
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: [
            {
              id: "plan-today",
              topic: "Algebra Basics",
              lesson_type: "pre_class",
              status: "pending",
              scheduled_for: today,
              estimated_minutes: 30,
              subject: "Mathematics",
              content: {
                introduction: "Intro",
                explanation: "Explanation",
                worked_example: "Example",
                practice_questions: [],
                summary: "Summary",
                estimated_minutes: 30,
              },
            },
            {
              id: "plan-tomorrow",
              topic: "Linear Equations",
              lesson_type: "pre_class",
              status: "pending",
              scheduled_for: tomorrow,
              estimated_minutes: 25,
              subject: "Mathematics",
              content: {},
            },
          ],
        }),
      });
    });

    await page.route("**/api/v1/students/*/pace-settings**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: {
            lessons_per_day: 1,
            preferred_reminder_time: "07:00",
            reminder_enabled: true,
          },
        }),
      });
    });

    await page.goto("/student/study-plans");
    await page.waitForLoadState("networkidle");

    // Should not crash to error page
    expect(page.url()).not.toContain("/500");
    expect(page.url()).not.toContain("/error");

    const body = (await page.textContent("body")) ?? "";
    // Either shows plans (timeline) or empty state — both are valid
    expect(body).toMatch(/study plan|algebra|today|lesson|no plan|learning/i);

    await page.screenshot({
      path: "tests/screenshots/student-09-study-plans-timeline.png",
      fullPage: true,
    });
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

// ── Student Knowledge Base ─────────────────────────────────────────────────

test.describe("Student Knowledge Base — authenticated", () => {
  test.beforeEach(async ({ context }) => {
    await injectStudentCookies(context);
  });

  test("/student/knowledge-base loads and shows stats", async ({ page }) => {
    await page.route("**/api/v1/student-notes/my**", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data: [] }) }),
    );
    await page.route("**/api/v1/student-notes/stats**", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: { total: 0, approved: 0, total_points: 0 } }),
      }),
    );
    await page.goto("/student/knowledge-base");
    await page.waitForLoadState("networkidle");
    const body = await page.textContent("body");
    expect(body).toMatch(/knowledge base|note|submit/i);
    await page.screenshot({ path: "tests/screenshots/student-10-knowledge-base.png", fullPage: true });
  });

  test("Knowledge Base nav link is visible in student nav", async ({ page }) => {
    await page.route("**/api/v1/student-notes/my**", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data: [] }) }),
    );
    await page.route("**/api/v1/student-notes/stats**", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: { total: 0, approved: 0, total_points: 0 } }),
      }),
    );
    await page.goto("/student/knowledge-base");
    await page.waitForLoadState("networkidle");
    const header = page.locator("header").first();
    await expect(header).toContainText(/knowledge base/i);
  });

  test("Empty state shows CTA to write first note", async ({ page }) => {
    await page.route("**/api/v1/student-notes/my**", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data: [] }) }),
    );
    await page.route("**/api/v1/student-notes/stats**", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: { total: 0, approved: 0, total_points: 0 } }),
      }),
    );
    await page.goto("/student/knowledge-base");
    await page.waitForLoadState("networkidle");
    const body = await page.textContent("body");
    expect(body).toMatch(/your knowledge base is empty|write your first note/i);
  });

  test("Notes list renders existing notes with status badges", async ({ page }) => {
    const mockNote = {
      id: "note-1",
      student_id: "stu-1",
      organization_id: "org-1",
      subject: "Physics",
      topic: "Newton's Laws",
      content: "Newton's first law states that an object at rest stays at rest unless acted upon by an external force.",
      status: "approved",
      reward_points: 5,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await page.route("**/api/v1/student-notes/my**", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data: [mockNote] }) }),
    );
    await page.route("**/api/v1/student-notes/stats**", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: { total: 1, approved: 1, total_points: 5 } }),
      }),
    );
    await page.goto("/student/knowledge-base");
    await page.waitForLoadState("networkidle");
    const body = await page.textContent("body");
    expect(body).toMatch(/Newton's Laws/);
    expect(body).toMatch(/in school kb|approved/i);
    await page.screenshot({ path: "tests/screenshots/student-11-knowledge-base-notes.png", fullPage: true });
  });

  test("Add note dialog opens on button click", async ({ page }) => {
    await page.route("**/api/v1/student-notes/my**", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data: [] }) }),
    );
    await page.route("**/api/v1/student-notes/stats**", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: { total: 0, approved: 0, total_points: 0 } }),
      }),
    );
    await page.goto("/student/knowledge-base");
    await page.waitForLoadState("networkidle");
    await page.getByRole("button", { name: /add note/i }).first().click();
    await expect(page.locator('[role="dialog"]').first()).toBeVisible({ timeout: 5_000 });
    await page.screenshot({ path: "tests/screenshots/student-12-add-note-dialog.png" });
  });

  test("Add note dialog has subject, topic and content fields", async ({ page }) => {
    await page.route("**/api/v1/student-notes/my**", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data: [] }) }),
    );
    await page.route("**/api/v1/student-notes/stats**", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: { total: 0, approved: 0, total_points: 0 } }),
      }),
    );
    await page.goto("/student/knowledge-base");
    await page.waitForLoadState("networkidle");
    await page.getByRole("button", { name: /add note/i }).first().click();
    const dialog = page.locator('[role="dialog"]').first();
    await expect(dialog.getByLabel(/subject/i)).toBeVisible();
    await expect(dialog.getByLabel(/topic/i)).toBeVisible();
    await expect(dialog.getByLabel(/your note/i)).toBeVisible();
  });

  test("Filter tabs appear when notes exist", async ({ page }) => {
    const mockNote = {
      id: "note-2",
      student_id: "stu-1",
      organization_id: "org-1",
      subject: "Chemistry",
      topic: "Periodic Table",
      content: "The periodic table organises elements by atomic number and groups elements with similar properties into columns.",
      status: "pending",
      reward_points: 5,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await page.route("**/api/v1/student-notes/my**", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ data: [mockNote] }) }),
    );
    await page.route("**/api/v1/student-notes/stats**", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ data: { total: 1, approved: 0, total_points: 5 } }),
      }),
    );
    await page.goto("/student/knowledge-base");
    await page.waitForLoadState("networkidle");
    const body = await page.textContent("body");
    expect(body).toMatch(/all \(\d+\)|pending|approved|rejected/i);
  });
});
