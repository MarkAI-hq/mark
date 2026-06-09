import { test, expect } from "./fixtures";
import { setAuthCookies, makeSseStream, DONE_EVENT } from "./helpers/auth";

const FORM_ARTIFACT = JSON.stringify({
  type: "form",
  title: "Create Assessment",
  summary: "Fill in the details to create your assessment",
  data: {
    fields: [
      { id: "class_id",   label: "Class",   type: "select", required: true,  options: [{ label: "Form 4A", value: "uuid-4a" }, { label: "Form 4B", value: "uuid-4b" }] },
      { id: "subject_id", label: "Subject", type: "select", required: true,  options: [{ label: "Mathematics", value: "uuid-math" }, { label: "Physics", value: "uuid-phys" }] },
      { id: "title",      label: "Title",   type: "text",   required: true,  placeholder: "e.g. Mid-term Exam" },
      { id: "marks",      label: "Marks",   type: "text",   required: false, placeholder: "e.g. 100" },
      { id: "source",     label: "Source",  type: "hidden", value: "auto" },
    ],
    submitLabel: "Create Assessment",
    action: "create_assessment",
  },
});
const ARTIFACT_REPLY = `__ARTIFACT__:${FORM_ARTIFACT}`;

// Suggest endpoint always returns null (no pre-suggestions needed)
const noSuggestRoute = async (route: import("@playwright/test").Route) => {
  await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ suggestions: null }) });
};

async function openWizard(page: import("@playwright/test").Page) {
  await page.route("/api/tracy/suggest", noSuggestRoute);
  await page.route("/api/tracy", async (route) => {
    const body = makeSseStream([{ ...DONE_EVENT, reply: ARTIFACT_REPLY }]);
    await route.fulfill({ status: 200, headers: { "Content-Type": "text/event-stream" }, body });
  });
  await page.goto("/dashboard/tracy");
  await page.getByPlaceholder("Ask Tracy anything…").fill("create an assessment");
  await page.getByPlaceholder("Ask Tracy anything…").press("Enter");
  // Wait for the artifact panel to open and step 1 to appear
  await expect(page.getByText("Step 1 of 3")).toBeVisible({ timeout: 15000 });
  // Dismiss the cookie consent banner so it doesn't cover the wizard footer
  const cookieBtn = page.getByRole("button", { name: "Essential only" });
  if (await cookieBtn.isVisible()) await cookieBtn.click();
}

test.beforeEach(async ({ context }) => {
  await setAuthCookies(context);
});

// ── Test 1: wizard renders step 1 as option cards (no <select> dropdown) ──────

test("wizard renders step 1: select field as cards with Other option", async ({ page }) => {
  await openWizard(page);

  // Option cards visible
  await expect(page.getByRole("button", { name: "Form 4A" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Form 4B" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Other" })).toBeVisible();

  // No native <select> element in the artifact panel
  const selectCount = await page.locator("[data-step-label] ~ * select").count();
  expect(selectCount).toBe(0);
});

// ── Test 2: clicking a card auto-advances to the next step ────────────────────

test("clicking a card auto-advances to step 2", async ({ page }) => {
  await openWizard(page);

  await page.getByRole("button", { name: "Form 4A" }).click();

  // Auto-advance fires after 160ms — wait for step 2
  await expect(page.getByText("Step 2 of 3")).toBeVisible({ timeout: 3000 });
  await expect(page.getByRole("button", { name: "Mathematics" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Physics" })).toBeVisible();
});

// ── Test 3: Other card reveals text input; Continue disabled until typed ──────

test("Other card reveals text input and gates Continue", async ({ page }) => {
  await openWizard(page);

  // Click "Other"
  await page.getByRole("button", { name: "Other" }).click();

  // Text input appears with relevant placeholder
  const otherInput = page.getByPlaceholder(/enter class/i);
  await expect(otherInput).toBeVisible({ timeout: 2000 });

  // Continue disabled while input is empty
  const continueBtn = page.getByTestId("wizard-advance");
  await expect(continueBtn).toBeDisabled();

  // Typing enables Continue
  await otherInput.fill("Senior 6 Arts");
  await expect(continueBtn).toBeEnabled();
});

// ── Test 4: Back navigation returns to previous step with selection preserved ─

test("Back navigation preserves selected value", async ({ page }) => {
  await openWizard(page);

  // Select Form 4A → advances to step 2
  await page.getByRole("button", { name: "Form 4A" }).click();
  await expect(page.getByText("Step 2 of 3")).toBeVisible({ timeout: 3000 });

  // Scroll the Back button into view, then click
  await page.getByTestId("wizard-back").scrollIntoViewIfNeeded();
  await page.getByTestId("wizard-back").click();
  await expect(page.getByText("Step 1 of 3")).toBeVisible({ timeout: 5000 });

  // Form 4A card should be in selected/pressed state
  const form4ABtn = page.getByRole("button", { name: "Form 4A" });
  await expect(form4ABtn).toHaveAttribute("aria-pressed", "true");
});

// ── Test 5: full wizard submission sends correct __FORM_SUBMIT__ payload ──────

test("full wizard submission sends correct __FORM_SUBMIT__ payload", async ({ page }) => {
  await page.route("/api/tracy/suggest", noSuggestRoute);

  // First request: Tracy returns the artifact form
  let requestCount = 0;
  let capturedBody = "";

  await page.route("/api/tracy", async (route) => {
    requestCount++;
    if (requestCount === 1) {
      const body = makeSseStream([{ ...DONE_EVENT, reply: ARTIFACT_REPLY }]);
      await route.fulfill({ status: 200, headers: { "Content-Type": "text/event-stream" }, body });
    } else {
      // Capture the body of the __FORM_SUBMIT__ request
      capturedBody = route.request().postData() ?? "";
      const body = makeSseStream([{ ...DONE_EVENT, reply: "✅ Assessment created." }]);
      await route.fulfill({ status: 200, headers: { "Content-Type": "text/event-stream" }, body });
    }
  });

  await page.goto("/dashboard/tracy");
  await page.getByPlaceholder("Ask Tracy anything…").fill("create an assessment");
  await page.getByPlaceholder("Ask Tracy anything…").press("Enter");
  await expect(page.getByText("Step 1 of 3")).toBeVisible({ timeout: 15000 });
  const cookieBtnT5 = page.getByRole("button", { name: "Essential only" });
  if (await cookieBtnT5.isVisible()) await cookieBtnT5.click();

  // Step 1: select class
  await page.getByRole("button", { name: "Form 4A" }).click();
  await expect(page.getByText("Step 2 of 3")).toBeVisible({ timeout: 3000 });

  // Step 2: select subject
  await page.getByRole("button", { name: "Mathematics" }).click();
  await expect(page.getByText("Step 3 of 3")).toBeVisible({ timeout: 3000 });

  // Step 3: fill title
  await page.getByPlaceholder("e.g. Mid-term Exam").fill("Mid-term Exam");

  // Wait for the submit button to be enabled, then scroll and click
  const submitBtn = page.getByTestId("wizard-advance");
  await expect(submitBtn).toBeEnabled({ timeout: 3000 });
  await submitBtn.scrollIntoViewIfNeeded();
  await submitBtn.click();
  await expect(page.getByText("Submitted!")).toBeVisible({ timeout: 5000 });

  // Verify payload — body is { message, sessionId }; extract the message field
  const parsed = JSON.parse(capturedBody);
  const msg: string = parsed.message ?? "";
  expect(msg).toContain("__FORM_SUBMIT__:");
  // Parse the JSON object inside __FORM_SUBMIT__:
  const submitJson = msg.slice(msg.indexOf("{"), msg.indexOf("\n\n") > -1 ? msg.indexOf("\n\n") : undefined);
  const submit = JSON.parse(submitJson);
  expect(submit.action).toBe("create_assessment");
  expect(submit.values.class_id).toBe("uuid-4a");
  expect(submit.values.subject_id).toBe("uuid-math");
  expect(submit.values.title).toBe("Mid-term Exam");
  expect(submit.values.source).toBe("auto");
});

// ── Test 6: no-select form renders as single step (no progress bar, no Back) ──

test("form with only text fields renders as single step", async ({ page }) => {
  const textOnlyArtifact = JSON.stringify({
    type: "form",
    title: "Quick Note",
    data: {
      fields: [
        { id: "note", label: "Note", type: "text", required: true, placeholder: "Enter note…" },
        { id: "extra", label: "Extra", type: "toggle" },
      ],
      submitLabel: "Save Note",
      action: "save_note",
    },
  });

  await page.route("/api/tracy/suggest", noSuggestRoute);
  await page.route("/api/tracy", async (route) => {
    const body = makeSseStream([{ ...DONE_EVENT, reply: `__ARTIFACT__:${textOnlyArtifact}` }]);
    await route.fulfill({ status: 200, headers: { "Content-Type": "text/event-stream" }, body });
  });

  await page.goto("/dashboard/tracy");
  await page.getByPlaceholder("Ask Tracy anything…").fill("add a note");
  await page.getByPlaceholder("Ask Tracy anything…").press("Enter");

  // Submit button with correct label visible
  await expect(page.getByRole("button", { name: "Save Note" })).toBeVisible({ timeout: 15000 });

  // No step counter (single step)
  await expect(page.getByText(/Step \d+ of \d+/)).not.toBeVisible();

  // No Back button
  await expect(page.getByTestId("wizard-back")).not.toBeVisible();
});
