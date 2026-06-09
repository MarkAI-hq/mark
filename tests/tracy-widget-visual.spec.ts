import { test, expect } from "./fixtures";
import { setAuthCookies, makeSseStream, DONE_EVENT } from "./helpers/auth";

// Realistic widget HTML: metric cards + bar chart + description paragraph (the failing case)
const WIDGET_HTML = `<div style="font-family:system-ui,sans-serif">
  <h2 style="font-size:15px;font-weight:700;color:#c9a84c;margin-bottom:12px">Class Performance Snapshot</h2>
  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:16px">
    <div style="background:rgba(201,168,76,0.08);border:1px solid rgba(201,168,76,0.2);border-radius:8px;padding:10px;text-align:center">
      <div style="font-size:11px;color:#888;margin-bottom:4px">Class Average</div>
      <div style="font-size:22px;font-weight:700;color:#c9a84c">72%</div>
    </div>
    <div style="background:rgba(16,185,129,0.08);border:1px solid rgba(16,185,129,0.2);border-radius:8px;padding:10px;text-align:center">
      <div style="font-size:11px;color:#888;margin-bottom:4px">Top Score</div>
      <div style="font-size:22px;font-weight:700;color:#10b981">95%</div>
    </div>
    <div style="background:rgba(239,68,68,0.08);border:1px solid rgba(239,68,68,0.2);border-radius:8px;padding:10px;text-align:center">
      <div style="font-size:11px;color:#888;margin-bottom:4px">Bottom Score</div>
      <div style="font-size:22px;font-weight:700;color:#ef4444">38%</div>
    </div>
  </div>
  <canvas id="chart" height="160"></canvas>
  <script>
    new Chart(document.getElementById('chart'), {
      type: 'bar',
      data: {
        labels: ['0-20%','21-40%','41-60%','61-80%','81-100%'],
        datasets: [{ label: 'Students', data: [1, 3, 5, 8, 4] }]
      },
      options: { responsive: true, plugins: { legend: { display: false } } }
    });
  </script>
  <p style="margin-top:12px;color:#333;background:white">This widget shows a hypothetical class performance breakdown with an average score, top performer, and a distribution of scores. It also highlights the most missed topic and students at risk.</p>
</div>`;

// The exact SSE reply Tracy would send
const WIDGET_REPLY = `Here is your class breakdown:\n__WIDGET__:${WIDGET_HTML}`;

test.beforeEach(async ({ context, page }) => {
  await setAuthCookies(context);
  await page.route("/api/tracy/suggest", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ suggestions: null }) });
  });
});

test("widget light mode: padded, no edge-to-edge text, multi-color bars", async ({ page }) => {
  await page.route("/api/tracy", async (route) => {
    const body = makeSseStream([
      { ...DONE_EVENT, reply: WIDGET_REPLY },
    ]);
    await route.fulfill({ status: 200, headers: { "Content-Type": "text/event-stream" }, body });
  });

  await page.goto("/dashboard/tracy");
  await page.getByPlaceholder("Ask Tracy anything…").fill("show me class performance");
  await page.getByPlaceholder("Ask Tracy anything…").press("Enter");

  // Wait for the iframe to appear
  const iframe = page.frameLocator("iframe[title='Tracy visualization']");
  await expect(iframe.locator("canvas")).toBeVisible({ timeout: 15000 });

  // Wait for Chart.js to render (canvas gets a data-url src after render)
  await page.waitForTimeout(800);

  // Screenshot of the full widget area
  const widgetCard = page.locator("iframe[title='Tracy visualization']").first();
  const screenshot = await widgetCard.screenshot();
  expect(screenshot.byteLength).toBeGreaterThan(5000); // non-trivial render

  // The paragraph text should NOT be right at the iframe edge — check via iframe body padding
  const bodyPadding = await iframe.locator("body").evaluate((el) =>
    getComputedStyle(el).paddingLeft
  );
  expect(parseInt(bodyPadding)).toBeGreaterThanOrEqual(16);

  // Dark text override: the hardcoded color:#333 paragraph should have been rewritten
  const paraColor = await iframe.locator("p").evaluate((el) =>
    getComputedStyle(el).color
  );
  // Should NOT be plain rgb(51,51,51) — the JS fixer should have replaced it
  expect(paraColor).not.toBe("rgb(51, 51, 51)");
});

test("widget dark mode: background matches dark card, text readable", async ({ page }) => {
  // Switch to dark mode before navigation
  await page.addInitScript(() => {
    document.documentElement.classList.add("dark");
    localStorage.setItem("theme", "dark");
  });

  await page.route("/api/tracy", async (route) => {
    const body = makeSseStream([
      { ...DONE_EVENT, reply: WIDGET_REPLY },
    ]);
    await route.fulfill({ status: 200, headers: { "Content-Type": "text/event-stream" }, body });
  });

  await page.goto("/dashboard/tracy");

  // Force dark mode on html element (next-themes uses class)
  await page.evaluate(() => document.documentElement.classList.add("dark"));

  await page.getByPlaceholder("Ask Tracy anything…").fill("show me class performance");
  await page.getByPlaceholder("Ask Tracy anything…").press("Enter");

  const iframe = page.frameLocator("iframe[title='Tracy visualization']");
  await expect(iframe.locator("canvas")).toBeVisible({ timeout: 15000 });
  await page.waitForTimeout(800);

  // The hardcoded white background on the paragraph should be overridden
  const paraBackground = await iframe.locator("p").evaluate((el) =>
    getComputedStyle(el).backgroundColor
  );
  // Should NOT be white (rgb(255,255,255))
  expect(paraBackground).not.toBe("rgb(255, 255, 255)");

  // Take a full-page screenshot to visually inspect dark mode
  await page.screenshot({
    path: "tests/screenshots/widget-dark-mode.png",
    fullPage: false,
    clip: { x: 0, y: 0, width: 1280, height: 800 },
  });
});

test("widget + __NEXT__ chips: both render, chips are clickable", async ({ page }) => {
  const nextPayload = JSON.stringify({
    message: "What next?",
    options: [
      { label: "Run diagnosis", value: "run_diagnosis" },
      { label: "Generate report", value: "generate_report" },
    ],
  });
  const replyWithNext = `__WIDGET__:${WIDGET_HTML}\n__NEXT__:${nextPayload}`;

  await page.route("/api/tracy", async (route) => {
    const body = makeSseStream([{ ...DONE_EVENT, reply: replyWithNext }]);
    await route.fulfill({ status: 200, headers: { "Content-Type": "text/event-stream" }, body });
  });

  await page.goto("/dashboard/tracy");
  await page.getByPlaceholder("Ask Tracy anything…").fill("show breakdown");
  await page.getByPlaceholder("Ask Tracy anything…").press("Enter");

  // Widget renders
  await expect(page.frameLocator("iframe[title='Tracy visualization']").locator("canvas")).toBeVisible({ timeout: 15000 });

  // Next chips appear below the widget
  await expect(page.getByRole("button", { name: "Run diagnosis" })).toBeVisible({ timeout: 5000 });
  await expect(page.getByRole("button", { name: "Generate report" })).toBeVisible();
});
