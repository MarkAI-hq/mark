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
      .waitForURL(/\/(root|dashboard|onboarding|student)/, { timeout: 90_000 })
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

  // Only warm up the login page — this ensures Next.js has compiled it before
  // the first real navigation. Warming up dashboard pages here would saturate
  // the dev server and cause the login form submission to fail.
  try { await fetch("http://localhost:3000/login"); } catch {}

  const browser = await chromium.launch();

  // ── Admin ─────────────────────────────────────────────────────────────────
  const adminCtx  = await browser.newContext({ baseURL: "http://localhost:3000", navigationTimeout: 120_000 });
  const adminPage = await adminCtx.newPage();
  await loginAndSave(adminPage, ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_AUTH, "Admin");

  // Warm up lazily-compiled pages using the authenticated admin session so
  // the tests don't hit the 90 s Next.js compile timeout on first navigation.
  if (ADMIN_EMAIL && adminPage.url().includes("/dashboard")) {
    for (const path of ["/dashboard/classes", "/dashboard/overview"]) {
      try {
        await adminPage.goto(path, { waitUntil: "domcontentloaded", timeout: 120_000 });
        console.log(`[global-setup] Warmed up ${path}`);
      } catch { /* non-fatal */ }
    }
  }

  await adminCtx.close();

  // ── Root ──────────────────────────────────────────────────────────────────
  const rootCtx  = await browser.newContext({ baseURL: "http://localhost:3000", navigationTimeout: 120_000 });
  const rootPage = await rootCtx.newPage();
  await loginAndSave(rootPage, ROOT_EMAIL, ROOT_PASSWORD, ROOT_AUTH, "Root");
  await rootCtx.close();

  await browser.close();
  console.log("[global-setup] Done.");
}
