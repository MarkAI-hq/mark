// tests/fixtures.ts
// Extends Playwright's base test with automatic error monitoring.
// Every test that imports { test } from here gets console errors, page errors,
// and failed network requests captured automatically — no opt-in needed.

import { test as base, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import path from "path";
import fs from "fs";

export type { Page } from "@playwright/test";

const SCREENSHOTS_DIR = path.join(__dirname, "screenshots");
const ERROR_LOG = path.join(__dirname, "error-log.json");

export interface ConsoleLine {
  level: "error" | "warning";
  text: string;
  timestamp: string;
}

export interface NetworkFail {
  url: string;
  status: number;
  timestamp: string;
}

export interface PageErr {
  message: string;
  stack?: string;
  timestamp: string;
}

export interface CapturedErrors {
  console: ConsoleLine[];
  network: NetworkFail[];
  pageErrors: PageErr[];
}

export const test = base.extend<{ devToolsErrors: CapturedErrors }>({
  // auto: true — runs for every test without needing to declare it in test args
  devToolsErrors: [
    async ({ page }, use, testInfo) => {
      const captured: CapturedErrors = {
        console: [],
        network: [],
        pageErrors: [],
      };

      // Console errors and warnings
      page.on("console", (msg) => {
        const t = msg.type();
        if (t === "error" || t === "warning") {
          captured.console.push({
            level: t as "error" | "warning",
            text: msg.text(),
            timestamp: new Date().toISOString(),
          });
        }
      });

      // Uncaught JS exceptions
      page.on("pageerror", (err) => {
        captured.pageErrors.push({
          message: err.message,
          stack: err.stack,
          timestamp: new Date().toISOString(),
        });
      });

      // Failed network requests (4xx / 5xx), excluding known noisy endpoints
      const IGNORE_URLS = [
        "/_next/static",
        "/__nextjs",
        "favicon.ico",
        "hot-update",
      ];
      page.on("response", (res) => {
        const status = res.status();
        const url = res.url();
        if (
          status >= 400 &&
          !IGNORE_URLS.some((pattern) => url.includes(pattern))
        ) {
          captured.network.push({
            url,
            status,
            timestamp: new Date().toISOString(),
          });
        }
      });

      await use(captured);

      // ── Post-test: log and screenshot if errors found ──────────────────────
      const hardErrors =
        captured.console.some((c) => c.level === "error") ||
        captured.pageErrors.length > 0;

      if (hardErrors) {
        if (!fs.existsSync(SCREENSHOTS_DIR)) {
          fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
        }

        const ts = new Date().toISOString().replace(/[:.]/g, "-");
        const screenshotFile = path.join(
          SCREENSHOTS_DIR,
          `error-${ts}.png`,
        );
        await page.screenshot({ path: screenshotFile, fullPage: true });

        const entry = {
          test: testInfo.title,
          suite: testInfo.titlePath.slice(0, -1).join(" > "),
          status: testInfo.status,
          screenshot: screenshotFile,
          captured,
          timestamp: new Date().toISOString(),
        };

        const existing: unknown[] = fs.existsSync(ERROR_LOG)
          ? JSON.parse(fs.readFileSync(ERROR_LOG, "utf-8"))
          : [];
        existing.push(entry);
        fs.writeFileSync(ERROR_LOG, JSON.stringify(existing, null, 2));
      }
    },
    { auto: true },
  ],
});

export { expect };
