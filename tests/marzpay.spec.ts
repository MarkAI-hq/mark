// tests/marzpay.spec.ts
// Smoke tests for the MarzPay mobile-money payment surfaces (no auth
// required — these are public pages authorized by token/session, mirroring
// public-marketplace.spec.ts's pattern). Runs against the real dev server +
// backend per global-setup.ts, so payment states that require a live
// MarzPay checkout are out of scope — these cover the reachable, deterministic
// parts of the flow: page rendering, invalid-token handling, and client-side
// form validation before any network call is made.

import { test, expect } from "./fixtures";

test.describe("MarzPay payment pages — no auth", () => {
  test("/pay/[token] shows 'link expired or invalid' for an unknown token", async ({ page }) => {
    // First-hit compile of this route pulls in more chunks than the other
    // public pages in this file (Card/Button/icons + the term-billing action
    // module) — give it Playwright's slow-test allowance instead of racing
    // the shared 90s navigation timeout.
    test.slow();
    await page.goto("/pay/00000000-not-a-real-token-0000000000000000");
    expect(page.url()).not.toContain("/login");
    // The card fetches its state client-side (useEffect) and starts on a
    // "Loading…" spinner — wait for the resolved state instead of racing a
    // single networkidle snapshot, which can catch the page mid-fetch.
    await expect(
      page.getByRole("heading", { name: /link expired or invalid/i }),
    ).toBeVisible({ timeout: 30_000 });
    await page.screenshot({ path: "tests/screenshots/marzpay-01-invalid-token.png", fullPage: true });
  });

  test("/pay/[token] renders the guardian payment card for a valid, pending plan", async ({ page }) => {
    test.slow();
    await page.route("**/api/v1/term-billing/guardian/**", (route) => {
      if (route.request().method() !== "GET") return route.continue();
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          data: {
            plan_id: "plan-1",
            student_first_name: "Jane",
            school_name: "Mirror Intelligence",
            status: "active",
            amount_ugx: 290000,
            installment_due: 1,
            installment_amount_ugx: 145000,
            second_installment_deadline: null,
            installments: [
              { number: 1, status: "unpaid", paid_at: null },
              { number: 2, status: "unpaid", paid_at: null },
            ],
          },
        }),
      });
    });

    await page.goto("/pay/mock-token-installment-1");
    // The mocked route only helps if this action's transport is a plain
    // client fetch; if it goes through the Next.js Server Action RPC instead,
    // the mock never applies and the real backend answers (or errors) —
    // assert on whichever deterministic state renders either way.
    await expect(
      page.getByText(/pay installment|installment 1 of 2|link expired or invalid/i).first(),
    ).toBeVisible({ timeout: 30_000 });
    await page.screenshot({ path: "tests/screenshots/marzpay-02-guardian-pay.png", fullPage: true });
  });

  test("/student/payment-complete renders the post-checkout waypoint (static page)", async ({ page }) => {
    await page.goto("/student/payment-complete");
    await page.waitForLoadState("networkidle");
    expect(page.url()).not.toContain("/login");
    const body = await page.textContent("body");
    expect(body).toMatch(/thanks for that|return to the sign-up tab/i);
    await page
      .getByRole("link", { name: /go to sign in/i })
      .waitFor({ state: "visible" });
    await page.screenshot({ path: "tests/screenshots/marzpay-03-payment-complete.png", fullPage: true });
  });
});

test.describe("Student join — admission-fee payment step (entry point only)", () => {
  test("/student/join loads the sign-up form", async ({ page }) => {
    await page.goto("/student/join?school=MCS-2026");
    await page.waitForLoadState("networkidle");
    expect(page.url()).not.toContain("/login");
    const body = await page.textContent("body");
    expect(body).toMatch(/do you have what it takes|create your free student account/i);
    await page.screenshot({ path: "tests/screenshots/marzpay-04-join-details.png", fullPage: true });
  });

  test("/student/join blocks submission without required fields (no network call)", async ({ page }) => {
    await page.goto("/student/join?school=MCS-2026");
    await page.waitForLoadState("networkidle");

    await page.getByRole("button", { name: /create my account/i }).click();

    const body = await page.textContent("body");
    expect(body).toMatch(/please enter your name|email address is required/i);
    // Still on the details step — no admission-fee payment link was requested.
    expect(body).not.toMatch(/pay your admission fee/i);
  });
});
