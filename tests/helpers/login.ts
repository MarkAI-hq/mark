// tests/helpers/login.ts
// Shared helpers for all spec files.

import { Page, BrowserContext } from "@playwright/test";

// ── Real-login helper (used in auth.spec.ts for role-redirect assertions) ──
export async function loginWith(
  page: Page,
  email: string,
  password: string,
): Promise<void> {
  await page.goto("/login", { waitUntil: "domcontentloaded" });
  await page.waitForLoadState("networkidle", { timeout: 60_000 }).catch(() => {});
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await Promise.all([
    page
      .waitForURL(/\/(root|dashboard|onboarding|student)/, { timeout: 30_000 })
      .catch(() => {}),
    page.locator('button[type="submit"]').click(),
  ]);
}

// ── Cookie injection: Teacher role ─────────────────────────────────────────
// The middleware reads the `user` cookie for role-based routing; `token` just
// needs to be non-empty so the "no token → login redirect" branch is bypassed.
export const TEACHER_USER = {
  id:             "test-teacher-1",
  name:           "Test Teacher",
  email:          "teacher@mirror.test",
  role:           "Teacher",
  isVerified:     true,
  organizationId: "test-org-1",
  onboarding_complete: true,
};

export async function injectTeacherCookies(context: BrowserContext): Promise<void> {
  await context.addCookies([
    {
      name:   "token",
      value:  "fake-teacher-token",
      domain: "localhost",
      path:   "/",
    },
    {
      name:   "refreshToken",
      value:  "fake-teacher-refresh",
      domain: "localhost",
      path:   "/",
    },
    {
      name:   "user",
      value:  encodeURIComponent(JSON.stringify(TEACHER_USER)),
      domain: "localhost",
      path:   "/",
    },
  ]);
}

// ── Cookie injection: Student role ─────────────────────────────────────────
export const STUDENT_USER = {
  id:             "test-student-1",
  name:           "Test Student",
  email:          "student@mirror.test",
  role:           "Student",
  roles:          ["Student"],
  isVerified:     true,
  organizationId: "test-org-1",
  school_code:    "TEST-SCHOOL",
};

export async function injectStudentCookies(context: BrowserContext): Promise<void> {
  await context.addCookies([
    {
      name:   "token",
      value:  "fake-student-token",
      domain: "localhost",
      path:   "/",
    },
    {
      name:   "refreshToken",
      value:  "fake-student-refresh",
      domain: "localhost",
      path:   "/",
    },
    {
      name:   "user",
      value:  encodeURIComponent(JSON.stringify(STUDENT_USER)),
      domain: "localhost",
      path:   "/",
    },
  ]);
}

// ── Cookie injection: Admin role ───────────────────────────────────────────
export const ADMIN_USER = {
  id:             "test-admin-1",
  name:           "Test Admin",
  email:          "admin@mirror.test",
  role:           "Admin",
  roles:          ["Admin"],
  isVerified:     true,
  organizationId: "test-org-1",
  onboarding_complete: true,
};

export async function injectAdminCookies(context: BrowserContext): Promise<void> {
  await context.addCookies([
    {
      name:   "token",
      value:  "fake-admin-token",
      domain: "localhost",
      path:   "/",
    },
    {
      name:   "refreshToken",
      value:  "fake-admin-refresh",
      domain: "localhost",
      path:   "/",
    },
    {
      name:   "user",
      value:  encodeURIComponent(JSON.stringify(ADMIN_USER)),
      domain: "localhost",
      path:   "/",
    },
  ]);
}

// ── Credentials ───────────────────────────────────────────────────────────
export const ADMIN_EMAIL    = process.env.ADMIN_TEST_EMAIL    ?? "";
export const ADMIN_PASSWORD = process.env.ADMIN_TEST_PASSWORD ?? "";
export const ROOT_EMAIL     = process.env.ROOT_TEST_EMAIL     ?? "";
export const ROOT_PASSWORD  = process.env.ROOT_TEST_PASSWORD  ?? "";
