// tests/global-setup.ts
// Runs once before all tests. Logs in as Admin and Root, saves auth storage
// states so spec files can skip the login step entirely.

import { chromium, FullConfig } from "@playwright/test";
import path from "path";
import fs from "fs";

const ADMIN_EMAIL    = process.env.ADMIN_TEST_EMAIL    ?? "";
const ADMIN_PASSWORD = process.env.ADMIN_TEST_PASSWORD ?? "";
const ROOT_EMAIL     = process.env.ROOT_TEST_EMAIL     ?? "";
const ROOT_PASSWORD  = process.env.ROOT_TEST_PASSWORD  ?? "";

const AUTH_DIR       = path.join(__dirname, "auth");
const ADMIN_AUTH     = path.join(AUTH_DIR, "admin-auth.json");
const ROOT_AUTH      = path.join(AUTH_DIR, "root-auth.json");

async function loginAndSave(
  page: Awaited<ReturnType<Awaited<ReturnType<typeof chromium.launch>>["newPage"]>>,
  email: string,
  password: string,
  authFile: string,
  label: string,
) {
  console.log(`[global-setup] Logging in as ${label} (${email})…`);

  await page.goto("/login", { waitUntil: "domcontentloaded", timeout: 120_000 });

  // Wait for Next.js compilation to settle
  await page.waitForLoadState("networkidle", { timeout: 60_000 }).catch(() => {});

  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);

  await Promise.all([
    page
      .waitForURL(/\/(root|dashboard|onboarding|student)/, { timeout: 30_000 })
      .catch(() => {}),
    page.locator('button[type="submit"]').click(),
  ]);

  const finalUrl = page.url();
  console.log(`[global-setup] ${label} landed at: ${finalUrl}`);

  await page.context().storageState({ path: authFile });
  console.log(`[global-setup] Saved ${label} auth → ${authFile}`);
}

export default async function globalSetup(config: FullConfig) {
  if (!fs.existsSync(AUTH_DIR)) fs.mkdirSync(AUTH_DIR, { recursive: true });

  // Warm up the dev server — Next.js compiles pages lazily; hitting /login once
  // before creating test contexts lets the first real navigation succeed quickly.
  try {
    await fetch("http://localhost:3000/login");
  } catch {
    // Server not yet reachable; Playwright's webServer will have ensured it's up
  }

  const browser = await chromium.launch();

  // ── Admin ─────────────────────────────────────────────────────────────────
  const adminCtx  = await browser.newContext({ baseURL: "http://localhost:3000", navigationTimeout: 120_000 });
  const adminPage = await adminCtx.newPage();
  await loginAndSave(adminPage, ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_AUTH, "Admin");
  await adminCtx.close();

  // ── Root ──────────────────────────────────────────────────────────────────
  const rootCtx  = await browser.newContext({ baseURL: "http://localhost:3000", navigationTimeout: 120_000 });
  const rootPage = await rootCtx.newPage();
  await loginAndSave(rootPage, ROOT_EMAIL, ROOT_PASSWORD, ROOT_AUTH, "Root");
  await rootCtx.close();

  await browser.close();
  console.log("[global-setup] Done.");
}
