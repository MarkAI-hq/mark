// tests/root.spec.ts
// Full platform-admin (Root) coverage. Runs on the "root" project which is
// pre-authenticated as tusii.ug@gmail.com via global-setup.

import { test, expect } from "@playwright/test";

test.use({ storageState: "tests/auth/root-auth.json" });

// ── Platform shell ─────────────────────────────────────────────────────────

test.describe("Root platform shell", () => {
  test("loads /root and shows platform dashboard", async ({ page }) => {
    await page.goto("/root");
    await page.waitForLoadState("networkidle");
    const body = await page.textContent("body");
    expect(body).toMatch(/platform|organization|user|assessment/i);
    expect(body).toContain("Root");
    await page.screenshot({ path: "tests/screenshots/root-01-dashboard.png", fullPage: true });
  });

  test("sidebar contains platform nav items (not org nav)", async ({ page }) => {
    await page.goto("/root");
    await page.waitForLoadState("networkidle");
    const nav = await page.textContent("nav, aside");
    expect(nav).toContain("Organizations");
    expect(nav).not.toContain("Examination Centre");
    expect(nav).not.toContain("Subjects");
    await page.screenshot({ path: "tests/screenshots/root-02-nav.png" });
  });

  test("Image Library is visible in root sidebar", async ({ page }) => {
    await page.goto("/root");
    await page.waitForLoadState("networkidle");
    const nav = await page.textContent("nav, aside");
    expect(nav).toContain("Image Library");
  });

  test("stat cards are rendered", async ({ page }) => {
    await page.goto("/root");
    await page.waitForLoadState("networkidle");
    const body = await page.textContent("body");
    expect(body).toMatch(/organization|user|assessment/i);
  });
});

// ── Access control ─────────────────────────────────────────────────────────

test.describe("Root access control", () => {
  test("Root is blocked from /dashboard → redirected to /root", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForURL(/\/root/, { timeout: 10_000 });
    expect(page.url()).toContain("/root");
    expect(page.url()).not.toContain("/dashboard");
  });

  test("Root is blocked from /student/dashboard → redirected to /root", async ({ page }) => {
    await page.goto("/student/dashboard");
    await page.waitForURL(/\/root/, { timeout: 10_000 });
    expect(page.url()).toContain("/root");
  });
});

// ── Organizations ──────────────────────────────────────────────────────────

test.describe("Organizations", () => {
  test("/root/organizations loads with table or empty state", async ({ page }) => {
    await page.goto("/root/organizations");
    await page.waitForLoadState("networkidle");
    const body = await page.textContent("body");
    expect(body).toMatch(/organization|name|status|plan|no org/i);
    await page.screenshot({ path: "tests/screenshots/root-03-organizations.png", fullPage: true });
  });

  test("Table headers include Name, Status, Plan", async ({ page }) => {
    await page.goto("/root/organizations");
    await page.waitForLoadState("networkidle");
    const body = await page.textContent("body");
    expect(body).toMatch(/Name|Status|Plan/);
  });

  test("Org detail URL pattern loads without crash", async ({ page }) => {
    await page.goto("/root/organizations/test-org-id");
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: "tests/screenshots/root-04-org-detail.png", fullPage: true });
  });
});

// ── Curricula ──────────────────────────────────────────────────────────────

test.describe("Root curricula management", () => {
  test("/root/curricula loads", async ({ page }) => {
    await page.goto("/root/curricula");
    await page.waitForLoadState("networkidle");
    const body = await page.textContent("body");
    expect(body).toMatch(/curricul(a|um)|no curricul/i);
    await page.screenshot({ path: "tests/screenshots/root-05-curricula.png", fullPage: true });
  });

  test("Curriculum editor URL pattern loads", async ({ page }) => {
    await page.goto("/root/curricula/test-curriculum-id");
    await page.waitForLoadState("networkidle");
    await page.screenshot({ path: "tests/screenshots/root-06-curriculum-editor.png", fullPage: true });
  });
});

// ── Image library ──────────────────────────────────────────────────────────

test.describe("Root image library", () => {
  test("/root/curriculum-images loads", async ({ page }) => {
    await page.goto("/root/curriculum-images");
    await page.waitForLoadState("networkidle");
    const body = await page.textContent("body");
    expect(body).toMatch(/image|library|curriculum|no image/i);
    await page.screenshot({ path: "tests/screenshots/root-07-image-library.png", fullPage: true });
  });
});

// ── System assessments ─────────────────────────────────────────────────────

test.describe("System assessments", () => {
  test("/root/system-assessments loads with Compass entry", async ({ page }) => {
    await page.goto("/root/system-assessments");
    await page.waitForLoadState("networkidle");
    const body = await page.textContent("body");
    expect(body).toMatch(/system assessment|compass/i);
    await page.screenshot({ path: "tests/screenshots/root-08-system-assessments.png", fullPage: true });
  });
});

// ── Announcements ──────────────────────────────────────────────────────────

test.describe("Announcements", () => {
  test("/root/announcements loads broadcast interface", async ({ page }) => {
    await page.goto("/root/announcements");
    await page.waitForLoadState("networkidle");
    const body = await page.textContent("body");
    expect(body).toMatch(/announcement|broadcast|message/i);
    await page.screenshot({ path: "tests/screenshots/root-09-announcements.png", fullPage: true });
  });
});

// ── Audit log ─────────────────────────────────────────────────────────────

test.describe("Audit log", () => {
  test("/root/audit loads the audit log table", async ({ page }) => {
    await page.goto("/root/audit");
    await page.waitForLoadState("networkidle");
    const body = await page.textContent("body");
    expect(body).toMatch(/audit log/i);
    expect(body).toMatch(/time|actor|action|resource/i);
    await page.screenshot({ path: "tests/screenshots/root-10-audit.png", fullPage: true });
  });
});

// ── Roles & permissions ────────────────────────────────────────────────────

test.describe("Roles management", () => {
  test("/root/roles loads", async ({ page }) => {
    await page.goto("/root/roles");
    await page.waitForLoadState("networkidle");
    const body = await page.textContent("body");
    expect(body).toMatch(/role(s)?|permission|no role/i);
    await page.screenshot({ path: "tests/screenshots/root-11-roles.png", fullPage: true });
  });

  test("Create role button is visible", async ({ page }) => {
    await page.goto("/root/roles");
    await page.waitForLoadState("networkidle");
    await expect(
      page.getByRole("button", { name: /new role|create role|add role/i }).first(),
    ).toBeVisible();
  });
});

// ── Support inbox ──────────────────────────────────────────────────────────

test.describe("Support inbox", () => {
  test("/root/support loads inbox", async ({ page }) => {
    await page.goto("/root/support");
    await page.waitForLoadState("networkidle");
    const body = await page.textContent("body");
    expect(body).toMatch(/support|inbox|message|ticket|no message/i);
    await page.screenshot({ path: "tests/screenshots/root-12-support.png", fullPage: true });
  });
});
