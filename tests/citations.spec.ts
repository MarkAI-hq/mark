import { test, expect } from "@playwright/test";

// Verifies the SourcesConsulted component renders real syllabus provenance on the
// exam viewer. Backed by a seeded exam (id …0001) whose variant content carries a
// sources_consulted array. Runs under the "admin" project (pre-authenticated).
const SEEDED_EXAM_ID = "00000000-0000-4000-a000-000000000001";

test.describe("Syllabus citations (sources_consulted)", () => {
  test("exam preview renders the grounded-citation block", async ({ page }) => {
    await page.goto(`/dashboard/exam-builder/preview/${SEEDED_EXAM_ID}`, {
      waitUntil: "domcontentloaded",
      timeout: 120_000,
    });
    await page.waitForLoadState("networkidle", { timeout: 60_000 }).catch(() => {});

    // The seeded exam body renders (proves data loaded, not a 404/redirect).
    await expect(page.getByText("CITATION TEST EXAM").first()).toBeVisible({
      timeout: 30_000,
    });

    // The provenance block + the actual citation (source + page).
    await expect(
      page.getByText(/Generated from the official syllabus/i),
    ).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/NCDC Biology Syllabus 2020/i)).toBeVisible();
    await expect(page.getByText(/p\.25/i)).toBeVisible();
    await expect(page.getByText(/Nutrition in Green Plants/i)).toBeVisible();
  });
});
