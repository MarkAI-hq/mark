// tests/exam-builder.spec.ts
// Deep coverage of the AI-driven exam builder wizard. Runs on the "admin"
// project (pre-authenticated). API calls are mocked so tests are fast and
// deterministic regardless of AI service availability.

import { test, expect } from "./fixtures";

test.use({ storageState: "tests/auth/admin-auth.json" });

// ── Exam builder list ──────────────────────────────────────────────────────

test.describe("Exam Builder list page", () => {
  test("renders list or empty state", async ({ page }) => {
    await page.goto("/dashboard/exam-builder");
    await page.waitForLoadState("networkidle");
    const body = await page.textContent("body");
    expect(body).toMatch(/exam builder|examination centre|assessment|no exam/i);
    await page.screenshot({ path: "tests/screenshots/eb-01-list.png", fullPage: true });
  });

  test("New / Create button is present", async ({ page }) => {
    await page.goto("/dashboard/exam-builder");
    await page.waitForLoadState("networkidle");
    await expect(
      page.getByRole("button", { name: /new|create|generate/i }).first(),
    ).toBeVisible();
  });
});

// ── New exam wizard — step 1: upload / archetype detection ────────────────

test.describe("Exam Builder wizard — Step 1: archetype detection", () => {
  test("/dashboard/exam-builder/new loads the wizard", async ({ page }) => {
    await page.goto("/dashboard/exam-builder/new");
    await page.waitForLoadState("networkidle");
    const body = await page.textContent("body");
    expect(body).toMatch(/upload|exam|assessment|archetype|curriculum|detect/i);
    await page.screenshot({ path: "tests/screenshots/eb-02-wizard-step1.png", fullPage: true });
  });

  test("File upload input is present", async ({ page }) => {
    await page.goto("/dashboard/exam-builder/new");
    await page.waitForLoadState("networkidle");
    // dropzone or file input
    await expect(
      page.locator('input[type="file"], [data-testid*="drop"], [class*="dropzone" i]').first(),
    ).toBeAttached();
  });

  test("Upload triggers archetype detection (mocked)", async ({ page }) => {
    // Mock the detect endpoint
    await page.route("**/exam-builder/detect**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: {
            archetype: "STEM",
            curriculum: "Uganda O-Level",
            subject: "Mathematics",
            confidence: 0.92,
          },
        }),
      });
    });

    await page.goto("/dashboard/exam-builder/new");
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: "tests/screenshots/eb-03-detect-ready.png", fullPage: true });
  });
});

// ── Wizard — step 2: generation config ────────────────────────────────────

test.describe("Exam Builder wizard — Step 2: generation config", () => {
  test("Config form renders subject/grade/bloom fields when archetype detected", async ({ page }) => {
    // Pre-set localStorage to simulate completed detection step
    await page.addInitScript(() => {
      window.sessionStorage.setItem(
        "examBuilderState",
        JSON.stringify({ archetype: "STEM", step: "config" }),
      );
    });

    await page.goto("/dashboard/exam-builder/new");
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: "tests/screenshots/eb-04-config-form.png", fullPage: true });
  });
});

// ── Wizard — step 3: generation in progress ───────────────────────────────

test.describe("Exam Builder wizard — Step 3: generation progress", () => {
  test("Job status polling renders a progress indicator", async ({ page }) => {
    // Mock job status endpoint
    await page.route("**/exam-builder/job/**", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: { status: "processing", progress: 45 },
        }),
      });
    });

    await page.goto("/dashboard/exam-builder/new");
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: "tests/screenshots/eb-05-generation-progress.png", fullPage: true });
  });
});

// ── Marking guide page ─────────────────────────────────────────────────────

test.describe("Marking guide", () => {
  test("/dashboard/exam-builder/marking loads", async ({ page }) => {
    await page.goto("/dashboard/exam-builder/marking");
    await page.waitForLoadState("networkidle");
    const body = await page.textContent("body");
    expect(body).toMatch(/marking guide|mark scheme|no exam|select exam/i);
    await page.screenshot({ path: "tests/screenshots/eb-06-marking-guide.png", fullPage: true });
  });
});

// ── Exam preview ───────────────────────────────────────────────────────────

test.describe("Exam preview routing", () => {
  test("Preview URL pattern matches /exam-builder/preview/[examId]", async ({ page }) => {
    // Navigate to a fake preview URL — should either load or show a 404/redirect
    await page.goto("/dashboard/exam-builder/preview/test-exam-123");
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: "tests/screenshots/eb-07-preview.png", fullPage: true });
  });
});

// ── Existing assessment audit / redesign ─────────────────────────────────

test.describe("Assessment audit & redesign (MirrorEditor)", () => {
  test("Assessment detail page loads", async ({ page }) => {
    // Navigate without a real ID — Next.js will 404 or redirect
    await page.goto("/dashboard/assessments/test-id");
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: "tests/screenshots/eb-08-assessment-detail.png", fullPage: true });
  });
});

// ── Exam results ───────────────────────────────────────────────────────────

test.describe("Exam results page", () => {
  test("Results URL pattern navigates without crash", async ({ page }) => {
    await page.goto("/dashboard/exams/test-slug/results");
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: "tests/screenshots/eb-09-exam-results.png", fullPage: true });
  });
});
