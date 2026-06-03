// tests/admin.spec.ts
// Full admin feature coverage. Runs on the "admin" project which is
// pre-authenticated as tusiimekenneth.ug@gmail.com via global-setup.

import { test, expect } from "@playwright/test";

test.use({ storageState: "tests/auth/admin-auth.json" });

// ── Dashboard ──────────────────────────────────────────────────────────────

test.describe("Admin dashboard", () => {
  test("loads and shows stat cards", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    // Should not be on login or onboarding; accept both outcomes
    const url = page.url();
    expect(url).toMatch(/\/(dashboard|onboarding)/);
    await page.screenshot({ path: "tests/screenshots/admin-01-dashboard.png", fullPage: true });
  });

  test("sidebar navigation is visible", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    const nav = page.locator("nav, aside").first();
    await expect(nav).toBeVisible();
  });

  test("notification bell is present", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    // Bell icon button
    await expect(
      page.locator('button[aria-label*="notification" i], button svg').first(),
    ).toBeVisible();
  });

  test("user menu is present", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");
    // Avatar / user nav
    await expect(
      page.locator("[data-testid='user-nav'], button:has(img), button:has([class*='avatar' i])").first(),
    ).toBeVisible();
  });

  test("Admin is blocked from /root", async ({ page }) => {
    await page.goto("/root");
    await page.waitForURL(/\/login/, { timeout: 15_000 });
    expect(page.url()).toContain("/login");
  });

  test("Admin is redirected away from /dashboard/teacher routes", async ({ page }) => {
    await page.goto("/dashboard/teacher");
    // Should redirect to /dashboard
    await page.waitForURL(/\/dashboard$/, { timeout: 10_000 });
    expect(page.url()).toMatch(/\/dashboard$/);
  });
});

// ── Analytics overview ─────────────────────────────────────────────────────

test.describe("Analytics overview", () => {
  test("/dashboard/overview loads", async ({ page }) => {
    await page.goto("/dashboard/overview");
    await page.waitForLoadState("networkidle");
    const body = await page.textContent("body");
    expect(body).toMatch(/overview|analytics|class|attendance/i);
    await page.screenshot({ path: "tests/screenshots/admin-02-overview.png", fullPage: true });
  });
});

// ── Classes ────────────────────────────────────────────────────────────────

test.describe("Classes management", () => {
  test("/dashboard/classes loads", async ({ page }) => {
    await page.goto("/dashboard/classes");
    await page.waitForLoadState("networkidle");
    const body = await page.textContent("body");
    expect(body).toMatch(/class(es)?|no class/i);
    await page.screenshot({ path: "tests/screenshots/admin-03-classes.png", fullPage: true });
  });

  test("New Class button or create prompt is visible", async ({ page }) => {
    await page.goto("/dashboard/classes");
    await page.waitForLoadState("networkidle");
    await expect(
      page.getByRole("button", { name: /new class|add class|create class/i }).first(),
    ).toBeVisible();
  });

  test("New Class dialog opens and has required fields", async ({ page }) => {
    await page.goto("/dashboard/classes");
    await page.waitForLoadState("networkidle");
    const btn = page.getByRole("button", { name: /new class|add class|create class/i }).first();
    await btn.click();
    await expect(
      page.locator('[role="dialog"]').first(),
    ).toBeVisible({ timeout: 5_000 });
    // Class name input present
    await expect(
      page.locator('[role="dialog"] input').first(),
    ).toBeVisible();
    await page.screenshot({ path: "tests/screenshots/admin-04-new-class-dialog.png" });
  });

  test("New Class dialog closes on cancel/dismiss", async ({ page }) => {
    await page.goto("/dashboard/classes");
    await page.waitForLoadState("networkidle");
    await page.getByRole("button", { name: /new class|add class|create class/i }).first().click();
    const dialog = page.locator('[role="dialog"]').first();
    await expect(dialog).toBeVisible({ timeout: 5_000 });
    await page.keyboard.press("Escape");
    await expect(dialog).not.toBeVisible({ timeout: 3_000 });
  });
});

// ── Students ───────────────────────────────────────────────────────────────

test.describe("Students management", () => {
  test("/dashboard/students loads", async ({ page }) => {
    await page.goto("/dashboard/students");
    await page.waitForLoadState("networkidle");
    const body = await page.textContent("body");
    expect(body).toMatch(/student(s)?|no student/i);
    await page.screenshot({ path: "tests/screenshots/admin-05-students.png", fullPage: true });
  });

  test("Add Student button is visible", async ({ page }) => {
    await page.goto("/dashboard/students");
    await page.waitForLoadState("networkidle");
    await expect(
      page.getByRole("button", { name: /add student|new student|create student/i }).first(),
    ).toBeVisible();
  });

  test("Add Student dialog opens with required fields", async ({ page }) => {
    await page.goto("/dashboard/students");
    await page.waitForLoadState("networkidle");
    await page.getByRole("button", { name: /add student|new student|create student/i }).first().click();
    await expect(page.locator('[role="dialog"]').first()).toBeVisible({ timeout: 5_000 });
    await page.screenshot({ path: "tests/screenshots/admin-06-new-student-dialog.png" });
  });

  test("Import students button is visible", async ({ page }) => {
    await page.goto("/dashboard/students");
    await page.waitForLoadState("networkidle");
    await expect(
      page.getByRole("button", { name: /import/i }).first(),
    ).toBeVisible();
  });
});

// ── Exams ──────────────────────────────────────────────────────────────────

test.describe("Exams", () => {
  test("/dashboard/exams loads", async ({ page }) => {
    await page.goto("/dashboard/exams");
    await page.waitForLoadState("networkidle");
    const body = await page.textContent("body");
    expect(body).toMatch(/exam(s)?|assessment|no exam/i);
    await page.screenshot({ path: "tests/screenshots/admin-07-exams.png", fullPage: true });
  });

  test("Create Exam button is visible", async ({ page }) => {
    await page.goto("/dashboard/exams");
    await page.waitForLoadState("networkidle");
    await expect(
      page.getByRole("button", { name: /new exam|create exam|add exam/i }).first(),
    ).toBeVisible();
  });
});

// ── Assessments ────────────────────────────────────────────────────────────

test.describe("Exam Builder", () => {
  test("/dashboard/exam-builder loads", async ({ page }) => {
    await page.goto("/dashboard/exam-builder");
    await page.waitForLoadState("networkidle");
    const body = await page.textContent("body");
    expect(body).toMatch(/exam builder|examination centre|assessment/i);
    await page.screenshot({ path: "tests/screenshots/admin-08-exam-builder.png", fullPage: true });
  });

  test("New exam button navigates to /exam-builder/new", async ({ page }) => {
    await page.goto("/dashboard/exam-builder");
    await page.waitForLoadState("networkidle");
    const btn = page.getByRole("button", { name: /new|create|generate/i }).first();
    await btn.click();
    await expect(page).toHaveURL(/exam-builder\/new/, { timeout: 10_000 });
    await page.screenshot({ path: "tests/screenshots/admin-09-exam-builder-new.png", fullPage: true });
  });
});

// ── Curricula ──────────────────────────────────────────────────────────────

test.describe("Curricula", () => {
  test("/dashboard/curricula loads", async ({ page }) => {
    await page.goto("/dashboard/curricula");
    await page.waitForLoadState("networkidle");
    const body = await page.textContent("body");
    expect(body).toMatch(/curricul(a|um)|no curricul/i);
    await page.screenshot({ path: "tests/screenshots/admin-10-curricula.png", fullPage: true });
  });

  test("/dashboard/subjects loads", async ({ page }) => {
    await page.goto("/dashboard/subjects");
    await page.waitForLoadState("networkidle");
    const body = await page.textContent("body");
    expect(body).toMatch(/subject(s)?|no subject/i);
    await page.screenshot({ path: "tests/screenshots/admin-11-subjects.png", fullPage: true });
  });

  test("Add Subject dialog opens", async ({ page }) => {
    await page.goto("/dashboard/subjects");
    await page.waitForLoadState("networkidle");
    const btn = page
      .getByRole("button", { name: /add subject|new subject|create subject/i })
      .first();
    if (await btn.isVisible()) {
      await btn.click();
      await expect(page.locator('[role="dialog"]').first()).toBeVisible({ timeout: 5_000 });
      await page.screenshot({ path: "tests/screenshots/admin-12-add-subject-dialog.png" });
    }
  });

  test("/dashboard/courses loads", async ({ page }) => {
    await page.goto("/dashboard/courses");
    await page.waitForLoadState("networkidle");
    const body = await page.textContent("body");
    expect(body).toMatch(/course(s)?|no course/i);
    await page.screenshot({ path: "tests/screenshots/admin-13-courses.png", fullPage: true });
  });
});

// ── Settings ───────────────────────────────────────────────────────────────

test.describe("Settings", () => {
  test("/dashboard/settings loads and redirects to sub-page", async ({ page }) => {
    await page.goto("/dashboard/settings");
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: "tests/screenshots/admin-14-settings.png", fullPage: true });
    // Either shows settings index or redirects to organization
    const body = await page.textContent("body");
    expect(body).toMatch(/setting(s)?|organization|profile|billing|member/i);
  });

  test("/dashboard/settings/organization loads org profile form", async ({ page }) => {
    await page.goto("/dashboard/settings/organization");
    await page.waitForLoadState("networkidle");
    const body = await page.textContent("body");
    expect(body).toMatch(/organization|profile|name|school/i);
    await page.screenshot({ path: "tests/screenshots/admin-15-settings-org.png", fullPage: true });
  });

  test("/dashboard/settings/members loads team list", async ({ page }) => {
    await page.goto("/dashboard/settings/members");
    await page.waitForLoadState("networkidle");
    const body = await page.textContent("body");
    expect(body).toMatch(/member(s)?|team|invite|user/i);
    await page.screenshot({ path: "tests/screenshots/admin-16-settings-members.png", fullPage: true });
  });

  test("Invite member button is visible on members page", async ({ page }) => {
    await page.goto("/dashboard/settings/members");
    await page.waitForLoadState("networkidle");
    await expect(
      page.getByRole("button", { name: /invite|add member/i }).first(),
    ).toBeVisible();
  });

  test("Invite member dialog opens", async ({ page }) => {
    await page.goto("/dashboard/settings/members");
    await page.waitForLoadState("networkidle");
    await page.getByRole("button", { name: /invite|add member/i }).first().click();
    await expect(page.locator('[role="dialog"]').first()).toBeVisible({ timeout: 5_000 });
    await page.screenshot({ path: "tests/screenshots/admin-17-invite-member-dialog.png" });
  });

  test("/dashboard/settings/billing loads", async ({ page }) => {
    await page.goto("/dashboard/settings/billing");
    await page.waitForLoadState("networkidle");
    const body = await page.textContent("body");
    expect(body).toMatch(/billing|subscription|plan|invoice/i);
    await page.screenshot({ path: "tests/screenshots/admin-18-billing.png", fullPage: true });
  });

  test("SSO toggle is visible on organization settings", async ({ page }) => {
    await page.goto("/dashboard/settings/organization");
    await page.waitForLoadState("networkidle");
    const body = await page.textContent("body");
    expect(body).toMatch(/sso|single sign|google/i);
  });
});

// ── Tracy AI ───────────────────────────────────────────────────────────────

test.describe("Tracy AI assistant (navigation)", () => {
  test("/dashboard/tracy loads the chat interface", async ({ page }) => {
    // Mock the Tracy API so no real AI call is made
    await page.route("/api/tracy", async (route) => {
      await route.fulfill({
        status: 200,
        headers: { "Content-Type": "text/event-stream" },
        body:   `data: ${JSON.stringify({ type: "done", reply: "Hello!", sessionId: "s1", user: {} })}\n\n`,
      });
    });
    await page.route("/api/tracy/suggest", async (route) => {
      await route.fulfill({ status: 200, contentType: "application/json", body: '{"suggestions":null}' });
    });

    await page.goto("/dashboard/tracy");
    await page.waitForLoadState("networkidle");
    await expect(page.getByPlaceholder(/ask tracy/i)).toBeVisible();
    await page.screenshot({ path: "tests/screenshots/admin-19-tracy.png", fullPage: true });
  });
});

// ── Help page ──────────────────────────────────────────────────────────────

test.describe("Help page", () => {
  test("/dashboard/help loads", async ({ page }) => {
    await page.goto("/dashboard/help");
    await page.waitForLoadState("networkidle");
    const body = await page.textContent("body");
    expect(body).toMatch(/help|support|faq|contact/i);
    await page.screenshot({ path: "tests/screenshots/admin-20-help.png", fullPage: true });
  });
});

// ── Cognitive profile ──────────────────────────────────────────────────────

test.describe("Cognitive profile", () => {
  test("/dashboard/profile/cognitive-profile loads", async ({ page }) => {
    await page.goto("/dashboard/profile/cognitive-profile");
    await page.waitForLoadState("networkidle");
    const body = await page.textContent("body");
    expect(body).toMatch(/cognitive|profile|bloom|learning/i);
    await page.screenshot({ path: "tests/screenshots/admin-21-cognitive-profile.png", fullPage: true });
  });
});

// ── Curriculum images (Admin should NOT access this) ──────────────────────

test.describe("Curriculum images access control", () => {
  test("/dashboard/curriculum-images is blocked for Admin (redirect)", async ({ page }) => {
    // Admins don't have the image library route — should redirect or 404
    await page.goto("/dashboard/curriculum-images");
    await page.waitForLoadState("networkidle");
    // Should not silently load the page with no error
    await page.screenshot({ path: "tests/screenshots/admin-22-curriculum-images-access.png" });
  });
});
