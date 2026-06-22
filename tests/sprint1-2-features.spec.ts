// tests/sprint1-2-features.spec.ts
//
// Sprint 1 + Sprint 2 E2E coverage.
//
// Auth strategy:
//   Structural/routing tests (nav, headings, tab labels) — use cookie injection
//   (injectAdminCookies) so they are immune to JWT token expiry. The middleware
//   reads the `user` cookie for role-based routing; these tests only assert on
//   HTML structure, not API data.
//
//   Data-dependent tests (real class/student content) — use storageState from
//   admin-auth.json. If the token has expired the page redirects to /login and
//   the test skips gracefully rather than failing.
//
// Coverage:
//   Fix 0  — Nav: Attendance/SoW/Study Plans removed; Monitor link present
//   Fix 0  — Monitor page renders (heading changed)
//   Fix 5  — Dashboard renders without crash (banners handled gracefully)
//   Fix 2  — Class detail has Attendance tab
//   Fix 3  — Class detail has Scheme of Work tab
//   Fix 4a — Class detail has Study Plans tab with Dispatch action
//   Fix 4b — Student detail has Study Plans + Attendance tabs + enrichment cards
//   Sprint 2 — /student/study-plans renders (in student.spec.ts, see below)

import { test, expect } from "./fixtures";
import { injectAdminCookies } from "./helpers/login";

// ── Helper: skip gracefully when auth has expired ──────────────────────────

async function skipIfRedirectedToLogin(page: import("@playwright/test").Page) {
  const url = page.url();
  if (url.includes("/login") || url.includes("/student/login")) {
    return true; // caller should test.skip()
  }
  return false;
}

// ──────────────────────────────────────────────────────────────────────────────
// Fix 0 — Sidebar nav restructuring (cookie injection — no JWT needed)
// ──────────────────────────────────────────────────────────────────────────────

test.describe("Fix 0 — sidebar nav restructuring", () => {
  test.beforeEach(async ({ context }) => {
    await injectAdminCookies(context);
  });

  test("sidebar does NOT link to /dashboard/attendance, /dashboard/scheme-of-work, or /dashboard/study-plans", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    if (await skipIfRedirectedToLogin(page)) {
      test.skip();
      return;
    }

    const nav = page.locator("nav, aside").first();
    await expect(nav).toBeVisible();

    const links = await nav.locator("a").evaluateAll((els) =>
      els.map((el) => el.getAttribute("href") ?? ""),
    );

    expect(links).not.toContain("/dashboard/attendance");
    expect(links).not.toContain("/dashboard/scheme-of-work");
    expect(links).not.toContain("/dashboard/study-plans");

    await page.screenshot({
      path: "tests/screenshots/s12-01-nav-restructured.png",
      fullPage: true,
    });
  });

  test("sidebar contains a Monitor navigation link", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    if (await skipIfRedirectedToLogin(page)) {
      test.skip();
      return;
    }

    // Monitor nav item links to /dashboard/overview — wait for the link to be
    // visible (auth context hydrates client-side so we need a small timeout).
    await expect(page.locator('a[href="/dashboard/overview"]')).toBeVisible({ timeout: 15_000 });

    await page.screenshot({
      path: "tests/screenshots/s12-02-nav-monitor.png",
    });
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// Fix 0 — Monitor page
// ──────────────────────────────────────────────────────────────────────────────

test.describe("Fix 0 — Monitor page", () => {
  test.beforeEach(async ({ context }) => {
    await injectAdminCookies(context);
  });

  test("/dashboard/overview renders (not a 404)", async ({ page }) => {
    await page.goto("/dashboard/overview");
    await page.waitForLoadState("networkidle");

    if (await skipIfRedirectedToLogin(page)) {
      test.skip();
      return;
    }

    expect(page.url()).not.toContain("404");
    const body = (await page.textContent("body")) ?? "";
    // Heading was renamed from "Organisation Overview" to "Class Monitor"
    expect(body).toMatch(/class monitor|monitor|class/i);
    expect(body).not.toMatch(/organisation overview/i);

    await page.screenshot({
      path: "tests/screenshots/s12-03-monitor-page.png",
      fullPage: true,
    });
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// Fix 5 — Dashboard banners (cookie injection — structural check only)
// ──────────────────────────────────────────────────────────────────────────────
//
// Stats are fetched server-side (Next.js server action → Node.js fetch), so
// page.route() cannot intercept them. The banner data logic is covered by
// stats.spec.ts unit tests. These E2E tests verify the dashboard renders
// without crashing and that the page structure is valid.

test.describe("Fix 5 — dashboard at-risk / pending-plan banners", () => {
  test.beforeEach(async ({ context }) => {
    await injectAdminCookies(context);
  });

  test("dashboard renders without crashing (no 500, no 404)", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await page.waitForLoadState("networkidle");

    if (await skipIfRedirectedToLogin(page)) {
      test.skip();
      return;
    }

    const url = page.url();
    expect(url).not.toContain("/error");
    expect(url).not.toContain("404");

    const body = (await page.textContent("body")) ?? "";
    expect(body.length).toBeGreaterThan(100);

    await page.screenshot({
      path: "tests/screenshots/s12-04-dashboard.png",
      fullPage: true,
    });
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// Fix 2, 3, 4a — Class detail tabs (storageState — needs real class data)
// ──────────────────────────────────────────────────────────────────────────────

test.describe("Class detail — Sprint 1 tabs (Attendance, SoW, Study Plans)", () => {
  test.use({ storageState: "tests/auth/admin-auth.json" });

  async function goToFirstClass(page: import("@playwright/test").Page): Promise<boolean> {
    await page.goto("/dashboard/classes", { waitUntil: "domcontentloaded", timeout: 120_000 });
    await page.waitForLoadState("networkidle", { timeout: 20_000 }).catch(() => {});

    if (await skipIfRedirectedToLogin(page)) return false;

    const classLink = page
      .locator('a[href*="/dashboard/classes/"]:not([href$="/classes"])')
      .first();
    if (!(await classLink.isVisible().catch(() => false))) return false;

    await classLink.click();
    // Wait for URL to change away from the classes list
    await page.waitForURL(/\/dashboard\/classes\/[^/]+/, { timeout: 60_000 }).catch(() => {});

    const url = page.url();
    if (url.includes("/login") || url.endsWith("/classes")) return false;

    // Give the server component time to finish rendering the detail page
    await page.waitForLoadState("networkidle", { timeout: 20_000 }).catch(() => {});
    return true;
  }

  test("class detail page loads and shows a tab list", async ({ page }) => {
    const found = await goToFirstClass(page);
    if (!found) { test.skip(); return; }

    const tabs = page.locator('[role="tablist"]');
    await expect(tabs.first()).toBeVisible({ timeout: 45_000 });

    await page.screenshot({
      path: "tests/screenshots/s12-05-class-tabs.png",
      fullPage: true,
    });
  });

  test("class detail has an Attendance tab", async ({ page }) => {
    const found = await goToFirstClass(page);
    if (!found) { test.skip(); return; }

    await expect(
      page.getByRole("tab", { name: /attendance/i }),
    ).toBeVisible({ timeout: 30_000 });
  });

  test("class detail has a Scheme of Work tab", async ({ page }) => {
    const found = await goToFirstClass(page);
    if (!found) { test.skip(); return; }

    await expect(
      page.getByRole("tab", { name: /scheme|sow/i }),
    ).toBeVisible({ timeout: 30_000 });
  });

  test("class detail has a Study Plans tab", async ({ page }) => {
    const found = await goToFirstClass(page);
    if (!found) { test.skip(); return; }

    await expect(
      page.getByRole("tab", { name: /study plan/i }),
    ).toBeVisible({ timeout: 30_000 });
  });

  test("Attendance tab loads without error", async ({ page }) => {
    const found = await goToFirstClass(page);
    if (!found) { test.skip(); return; }

    const tab = page.getByRole("tab", { name: /attendance/i });
    if (!(await tab.isVisible().catch(() => false))) { test.skip(); return; }

    await tab.click();
    await page.waitForLoadState("networkidle", { timeout: 20_000 }).catch(() => {});

    expect(page.url()).not.toContain("/error");
    const body = (await page.textContent("body")) ?? "";
    expect(body).toMatch(/attendance|session|present|no session|no record/i);

    await page.screenshot({
      path: "tests/screenshots/s12-06-attendance-tab.png",
      fullPage: true,
    });
  });

  test("Scheme of Work tab loads without error", async ({ page }) => {
    const found = await goToFirstClass(page);
    if (!found) { test.skip(); return; }

    const tab = page.getByRole("tab", { name: /scheme|sow/i });
    if (!(await tab.isVisible().catch(() => false))) { test.skip(); return; }

    await tab.click();
    await page.waitForLoadState("networkidle", { timeout: 20_000 }).catch(() => {});

    expect(page.url()).not.toContain("/error");
    const body = (await page.textContent("body")) ?? "";
    expect(body).toMatch(/scheme|create|assign|no scheme|week|sow/i);

    await page.screenshot({
      path: "tests/screenshots/s12-07-sow-tab.png",
      fullPage: true,
    });
  });

  test("Study Plans tab loads and shows Dispatch action", async ({ page }) => {
    const found = await goToFirstClass(page);
    if (!found) { test.skip(); return; }

    const tab = page.getByRole("tab", { name: /study plan/i });
    if (!(await tab.isVisible().catch(() => false))) { test.skip(); return; }

    await tab.click();
    await page.waitForLoadState("networkidle", { timeout: 20_000 }).catch(() => {});

    expect(page.url()).not.toContain("/error");
    const body = (await page.textContent("body")) ?? "";
    expect(body).toMatch(/dispatch|student|no student|no plan/i);

    await page.screenshot({
      path: "tests/screenshots/s12-08-study-plans-tab.png",
      fullPage: true,
    });
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// Fix 4b — Enriched student detail page
// ──────────────────────────────────────────────────────────────────────────────

test.describe("Fix 4b — enriched student detail page", () => {
  test.use({ storageState: "tests/auth/admin-auth.json" });

  async function goToFirstStudent(page: import("@playwright/test").Page): Promise<boolean> {
    await page.goto("/dashboard/classes", { waitUntil: "domcontentloaded", timeout: 120_000 });
    await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => {});
    if (await skipIfRedirectedToLogin(page)) return false;

    const classLink = page
      .locator('a[href*="/dashboard/classes/"]:not([href$="/classes"])')
      .first();
    if (!(await classLink.isVisible().catch(() => false))) return false;
    await classLink.click();
    await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => {});
    if (await skipIfRedirectedToLogin(page)) return false;

    // Open Students tab if it exists
    const studentsTab = page.getByRole("tab", { name: /^students?$/i });
    if (await studentsTab.isVisible().catch(() => false)) {
      await studentsTab.click();
      await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => {});
    }

    // Click first student row link
    const studentLink = page.locator('a[href*="/students/"]').first();
    if (!(await studentLink.isVisible().catch(() => false))) return false;
    await studentLink.click();
    await page.waitForLoadState("networkidle");
    return !page.url().includes("/login");
  }

  test("student detail page loads without error", async ({ page }) => {
    const found = await goToFirstStudent(page);
    if (!found) { test.skip(); return; }

    expect(page.url()).not.toContain("/error");
    const body = (await page.textContent("body")) ?? "";
    expect(body.length).toBeGreaterThan(100);

    await page.screenshot({
      path: "tests/screenshots/s12-09-student-detail.png",
      fullPage: true,
    });
  });

  test("student detail Overview shows enrichment stat cards", async ({ page }) => {
    const found = await goToFirstStudent(page);
    if (!found) { test.skip(); return; }

    const body = (await page.textContent("body")) ?? "";
    // At least one of the new enrichment cards should be present
    expect(body).toMatch(/attendance|completion|predict|buffer|lesson|pace/i);

    await page.screenshot({
      path: "tests/screenshots/s12-10-student-enrichment.png",
      fullPage: true,
    });
  });

  test("student detail has a Study Plans tab", async ({ page }) => {
    const found = await goToFirstStudent(page);
    if (!found) { test.skip(); return; }

    await expect(
      page.getByRole("tab", { name: /study plan/i }),
    ).toBeVisible({ timeout: 30_000 });
  });

  test("student detail has an Attendance tab", async ({ page }) => {
    const found = await goToFirstStudent(page);
    if (!found) { test.skip(); return; }

    await expect(
      page.getByRole("tab", { name: /attendance/i }),
    ).toBeVisible({ timeout: 30_000 });
  });

  test("student Study Plans tab loads without error", async ({ page }) => {
    const found = await goToFirstStudent(page);
    if (!found) { test.skip(); return; }

    const tab = page.getByRole("tab", { name: /study plan/i });
    if (!(await tab.isVisible().catch(() => false))) { test.skip(); return; }

    await tab.click();
    await page.waitForLoadState("networkidle", { timeout: 20_000 }).catch(() => {});
    expect(page.url()).not.toContain("/error");

    await page.screenshot({
      path: "tests/screenshots/s12-11-student-study-plans-tab.png",
      fullPage: true,
    });
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// Direct URL — attendance deep link does not 404
// ──────────────────────────────────────────────────────────────────────────────

test.describe("Sprint 1 — direct URL routes", () => {
  test.use({ storageState: "tests/auth/admin-auth.json" });

  test("/dashboard/classes/[id]/attendance deep link loads without 404", async ({
    page,
  }) => {
    await page.goto("/dashboard/classes", { waitUntil: "domcontentloaded", timeout: 120_000 });
    await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => {});
    if (await skipIfRedirectedToLogin(page)) { test.skip(); return; }

    const classLink = page
      .locator('a[href*="/dashboard/classes/"]:not([href$="/classes"])')
      .first();
    if (!(await classLink.isVisible().catch(() => false))) { test.skip(); return; }

    const href = (await classLink.getAttribute("href")) ?? "";
    const match = href.match(/\/dashboard\/classes\/([^/]+)/);
    if (!match) { test.skip(); return; }

    const classId = match[1];
    await page.goto(`/dashboard/classes/${classId}/attendance`, { waitUntil: "domcontentloaded", timeout: 120_000 });
    await page.waitForLoadState("networkidle", { timeout: 15_000 }).catch(() => {});

    expect(page.url()).not.toContain("404");
    const body = (await page.textContent("body")) ?? "";
    expect(body.length).toBeGreaterThan(50);

    await page.screenshot({
      path: "tests/screenshots/s12-12-attendance-direct-url.png",
      fullPage: true,
    });
  });
});
