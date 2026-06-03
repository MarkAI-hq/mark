// tests/auth.spec.ts
// End-to-end auth flow tests. Runs on the unauthenticated "chromium" project
// so every test starts with a clean session.

import { test, expect } from "@playwright/test";
import {
  loginWith,
  ADMIN_EMAIL,
  ADMIN_PASSWORD,
  ROOT_EMAIL,
  ROOT_PASSWORD,
} from "./helpers/login";

// ── Page structure ─────────────────────────────────────────────────────────

test.describe("Login page", () => {
  test("renders the sign-in form", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("h1")).toContainText("Welcome back");
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toContainText("Sign in");
  });

  test("shows Google SSO button", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByText("Continue with Google")).toBeVisible();
  });

  test("has links to forgot-password and register pages", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("link", { name: /forgot password/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /get started/i })).toBeVisible();
  });
});

// ── Form validation ────────────────────────────────────────────────────────

test.describe("Login form validation", () => {
  test("shows email validation error for empty submit", async ({ page }) => {
    await page.goto("/login");
    await page.locator('button[type="submit"]').click();
    await expect(
      page.getByText(/valid email|required/i).first(),
    ).toBeVisible();
  });

  test("shows password validation for short password", async ({ page }) => {
    await page.goto("/login");
    await page.locator('input[type="email"]').fill("test@example.com");
    await page.locator('input[type="password"]').fill("abc");
    await page.locator('button[type="submit"]').click();
    await expect(page.getByText(/at least 6 characters/i)).toBeVisible();
  });

  test("shows inline error for wrong credentials", async ({ page }) => {
    await page.goto("/login");
    await page.locator('input[type="email"]').fill("wrong@example.com");
    await page.locator('input[type="password"]').fill("wrongpassword");
    await page.locator('button[type="submit"]').click();
    // Either an inline error div or a toast appears
    await expect(
      page.locator(".text-red-700, [data-sonner-toast]").first(),
    ).toBeVisible({ timeout: 15_000 });
  });

  test("password visibility toggle works", async ({ page }) => {
    await page.goto("/login");
    const pwInput = page.locator('input[type="password"]');
    await pwInput.fill("secret123");
    // Click eye icon
    await page.locator('button[tabindex="-1"]').click();
    await expect(page.locator('input[type="text"]')).toBeVisible();
    // Toggle back
    await page.locator('button[tabindex="-1"]').click();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });
});

// ── Role-based login redirects ─────────────────────────────────────────────

test.describe("Admin login redirect", () => {
  test("Admin lands at /dashboard or /onboarding", async ({ page }) => {
    await loginWith(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    expect(page.url()).toMatch(/\/(dashboard|onboarding)/);
  });
});

test.describe("Root login redirect", () => {
  test("Root lands at /root", async ({ page }) => {
    await loginWith(page, ROOT_EMAIL, ROOT_PASSWORD);
    expect(page.url()).toContain("/root");
    expect(page.url()).not.toContain("/dashboard");
  });
});

// ── Unauthenticated access blocks ─────────────────────────────────────────

test.describe("Unauthenticated redirects", () => {
  test("/dashboard redirects to /login", async ({ page }) => {
    await page.goto("/dashboard");
    await page.waitForURL(/\/login/, { timeout: 15_000 });
    expect(page.url()).toContain("/login");
  });

  test("/root redirects to /login", async ({ page }) => {
    await page.goto("/root");
    await page.waitForURL(/\/login/, { timeout: 15_000 });
    expect(page.url()).toContain("/login");
  });

  test("/student/dashboard redirects to /student/login", async ({ page }) => {
    await page.goto("/student/dashboard");
    await page.waitForURL(/\/student\/login/, { timeout: 15_000 });
    expect(page.url()).toContain("/student/login");
  });

  test("return_url param is preserved on redirect", async ({ page }) => {
    await page.goto("/dashboard/classes");
    await page.waitForURL(/\/login/, { timeout: 15_000 });
    expect(page.url()).toContain("return_url");
  });
});

// ── Forgot password page ───────────────────────────────────────────────────

test.describe("Forgot password", () => {
  test("page loads with email input", async ({ page }) => {
    await page.goto("/forgot-password");
    await expect(
      page.locator('input[type="email"], input[placeholder*="email" i]').first(),
    ).toBeVisible();
  });

  test("back to login link present", async ({ page }) => {
    await page.goto("/forgot-password");
    await expect(
      page.getByRole("link", { name: /back|sign in|login/i }).first(),
    ).toBeVisible();
  });
});

// ── Register page ──────────────────────────────────────────────────────────

test.describe("Register page", () => {
  test("shows sign-up form with required fields", async ({ page }) => {
    await page.goto("/register");
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]').first()).toBeVisible();
  });

  test("already have account link points to /login", async ({ page }) => {
    await page.goto("/register");
    await expect(page.getByRole("link", { name: /sign in/i })).toBeVisible();
  });
});

// ── Student login page ─────────────────────────────────────────────────────

test.describe("Student login page", () => {
  test("shows school code, student ID, and PIN fields", async ({ page }) => {
    await page.goto("/student/login");
    await expect(page.getByLabel(/school code/i)).toBeVisible();
    await expect(page.getByLabel(/student id/i)).toBeVisible();
    await expect(page.getByLabel(/pin/i)).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toContainText("Sign in");
  });

  test("shows error for empty submit", async ({ page }) => {
    await page.goto("/student/login");
    await page.locator('button[type="submit"]').click();
    await expect(
      page.getByText(/required/i).first(),
    ).toBeVisible();
  });

  test("shows error for wrong student credentials", async ({ page }) => {
    await page.goto("/student/login");
    await page.getByLabel(/school code/i).fill("INVALID");
    await page.getByLabel(/student id/i).fill("S999");
    await page.getByLabel(/pin/i).fill("0000");
    await page.locator('button[type="submit"]').click();
    await expect(
      page.locator(".text-red-700, [data-sonner-toast]").first(),
    ).toBeVisible({ timeout: 15_000 });
  });
});

// ── Public info pages ──────────────────────────────────────────────────────

test.describe("Public pages", () => {
  test("/privacy loads", async ({ page }) => {
    await page.goto("/privacy");
    await expect(page.locator("h1, h2").first()).toBeVisible();
  });

  test("/terms loads", async ({ page }) => {
    await page.goto("/terms");
    await expect(page.locator("h1, h2").first()).toBeVisible();
  });
});
