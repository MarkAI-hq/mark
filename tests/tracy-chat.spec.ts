import { test, expect } from "@playwright/test";
import { setAuthCookies, makeSseStream, DONE_EVENT, TEST_USER } from "./helpers/auth";

const TRACY_URL = "/dashboard/tracy";

test.beforeEach(async ({ context, page }) => {
  await setAuthCookies(context);

  // Mock suggestions endpoint — always return static null so tests are predictable
  await page.route("/api/tracy/suggest", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ suggestions: null }) });
  });
});

// ── Empty state ───────────────────────────────────────────────────────────────

test("empty state shows greeting and suggestion cards", async ({ page }) => {
  await page.goto(TRACY_URL);

  await expect(page.getByText(/good (morning|afternoon|evening)/i)).toBeVisible();
  await expect(page.getByText("I'm Tracy. What are we doing today?")).toBeVisible();

  // At least 4 suggestion buttons visible
  const suggestionButtons = page.locator("button").filter({ hasText: /perform|intervention|audit|report|mistakes|predict/i });
  await expect(suggestionButtons.first()).toBeVisible();
});

// ── Sending a message ─────────────────────────────────────────────────────────

test("sends message and receives response through tool calls", async ({ page }) => {
  await page.route("/api/tracy", async (route) => {
    const body = makeSseStream([
      { type: "tool_call", name: "list_classes", label: "Looking up your classes…" },
      { type: "tool_result", name: "list_classes", success: true },
      { type: "text_delta", delta: "Here are your 3 classes." },
      { ...DONE_EVENT, reply: "Here are your 3 classes." },
    ]);
    await route.fulfill({ status: 200, headers: { "Content-Type": "text/event-stream" }, body });
  });

  await page.goto(TRACY_URL);

  const input = page.getByPlaceholder("Ask Tracy anything…");
  await input.fill("Show me my classes");
  await input.press("Enter");

  // Final message renders correctly despite tool calls in the stream
  await expect(page.getByText("Here are your 3 classes.")).toBeVisible();
});

test("input clears after sending and re-enables after response", async ({ page }) => {
  await page.route("/api/tracy", async (route) => {
    const body = makeSseStream([
      { type: "text_delta", delta: "Done." },
      { ...DONE_EVENT, reply: "Done." },
    ]);
    await route.fulfill({ status: 200, headers: { "Content-Type": "text/event-stream" }, body });
  });

  await page.goto(TRACY_URL);
  const input = page.getByPlaceholder("Ask Tracy anything…");
  await input.fill("hello");
  await input.press("Enter");

  await expect(input).toHaveValue("");
  await expect(page.getByText("Done.")).toBeVisible();
  await expect(input).toBeEnabled();
});

// ── __NEXT__: chips ───────────────────────────────────────────────────────────

test("__NEXT__: renders inline chips, not a blocking tray", async ({ page }) => {
  const nextPayload = JSON.stringify({
    message: "What would you like to do next?",
    options: [
      { label: "Create a class", value: "create_class" },
      { label: "Enroll students", value: "enroll_students" },
    ],
  });
  const reply = `✅ Done.\n__NEXT__:${nextPayload}`;

  await page.route("/api/tracy", async (route) => {
    // No text_delta — fullReply stays empty so the done event's reply is used for parsing
    const body = makeSseStream([{ ...DONE_EVENT, reply }]);
    await route.fulfill({ status: 200, headers: { "Content-Type": "text/event-stream" }, body });
  });

  await page.goto(TRACY_URL);
  await page.getByPlaceholder("Ask Tracy anything…").fill("set up my class");
  await page.getByPlaceholder("Ask Tracy anything…").press("Enter");

  // Chips appear
  await expect(page.getByRole("button", { name: "Create a class" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Enroll students" })).toBeVisible();

  // Input stays enabled (non-blocking)
  await expect(page.getByPlaceholder("Ask Tracy anything…")).toBeEnabled();

  // Raw JSON is NOT shown in the message bubble
  await expect(page.getByText(/"options":/)).not.toBeVisible();
});

// ── __CONFIRM__: blocking tray ────────────────────────────────────────────────

test("__CONFIRM__: disables input and shows confirmation tray", async ({ page }) => {
  const confirmPayload = JSON.stringify({
    message: "Are you sure you want to delete this class?",
    options: [
      { label: "Yes, delete it", value: "yes_delete" },
      { label: "Cancel", value: "cancel" },
    ],
  });
  const reply = `__CONFIRM__:${confirmPayload}`;

  await page.route("/api/tracy", async (route) => {
    const body = makeSseStream([{ ...DONE_EVENT, reply }]);
    await route.fulfill({ status: 200, headers: { "Content-Type": "text/event-stream" }, body });
  });

  await page.goto(TRACY_URL);
  await page.getByPlaceholder("Ask Tracy anything…").fill("delete my class");
  await page.getByPlaceholder("Ask Tracy anything…").press("Enter");

  await expect(page.getByText("Are you sure you want to delete this class?")).toBeVisible();
  await expect(page.getByRole("button", { name: "Yes, delete it" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Cancel" })).toBeVisible();

  // Input is disabled while confirm tray is open
  await expect(page.getByPlaceholder("Ask Tracy anything…")).toBeDisabled();
});

// ── Artifact panel ────────────────────────────────────────────────────────────

test("artifact in response opens the side panel", async ({ page }) => {
  const artifact = JSON.stringify({
    id: "art_test_1",
    type: "assessment",
    title: "Biology Term 2 Exam",
    summary: "10 questions, 40 marks",
    data: { questions: [] },
  });
  const reply = `Here is your assessment.\n__ARTIFACT__:${artifact}`;

  await page.route("/api/tracy", async (route) => {
    // No text_delta — fullReply stays empty so the done event's reply is used for artifact parsing
    const body = makeSseStream([{ ...DONE_EVENT, reply }]);
    await route.fulfill({ status: 200, headers: { "Content-Type": "text/event-stream" }, body });
  });

  await page.goto(TRACY_URL);
  await page.getByPlaceholder("Ask Tracy anything…").fill("create an assessment");
  await page.getByPlaceholder("Ask Tracy anything…").press("Enter");

  // Artifact chip appears in message bubble (button role)
  await expect(page.getByRole("button", { name: /Biology Term 2 Exam/ })).toBeVisible();

  // Panel opens alongside (title visible in panel header)
  await expect(page.getByText("Biology Term 2 Exam").nth(1)).toBeVisible();
});

// ── Stop button ───────────────────────────────────────────────────────────────

test("stop button cancels in-flight request and re-enables input", async ({ page }) => {
  // Never-resolving stream to keep loading state
  await page.route("/api/tracy", async (route) => {
    // Return headers but stall body (simulate slow response)
    await new Promise((resolve) => setTimeout(resolve, 10_000));
    await route.fulfill({ status: 200, headers: { "Content-Type": "text/event-stream" }, body: "" });
  });

  await page.goto(TRACY_URL);
  await page.getByPlaceholder("Ask Tracy anything…").fill("hello");
  await page.getByPlaceholder("Ask Tracy anything…").press("Enter");

  // Stop button (Square icon) should appear
  const stopBtn = page.getByTitle("Stop generation");
  await expect(stopBtn).toBeVisible({ timeout: 5000 });
  await stopBtn.click();

  // Input re-enables
  await expect(page.getByPlaceholder("Ask Tracy anything…")).toBeEnabled({ timeout: 3000 });
});

// ── History sidebar ───────────────────────────────────────────────────────────

test("history button hidden when no conversations saved", async ({ page }) => {
  // Clear localStorage before test
  await page.addInitScript(() => localStorage.clear());
  await page.goto(TRACY_URL);

  await expect(page.getByRole("button", { name: /history/i })).not.toBeVisible();
});

test("conversation saves to history and appears in sidebar", async ({ page }) => {
  await page.route("/api/tracy", async (route) => {
    const body = makeSseStream([
      { type: "text_delta", delta: "Your classes are listed here." },
      { ...DONE_EVENT, reply: "Your classes are listed here." },
    ]);
    await route.fulfill({ status: 200, headers: { "Content-Type": "text/event-stream" }, body });
  });

  await page.addInitScript(() => localStorage.clear());
  await page.goto(TRACY_URL);

  await page.getByPlaceholder("Ask Tracy anything…").fill("Show me my classes");
  await page.getByPlaceholder("Ask Tracy anything…").press("Enter");
  await expect(page.getByText("Your classes are listed here.")).toBeVisible();

  // History button should now appear
  await expect(page.getByRole("button", { name: /history/i })).toBeVisible({ timeout: 3000 });

  // Open sidebar
  await page.getByRole("button", { name: /history/i }).click();
  await expect(page.getByText("Show me my classes").first()).toBeVisible();
});
