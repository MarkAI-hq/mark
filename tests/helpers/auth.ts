import { BrowserContext } from "@playwright/test";

function makeJwt(payload: object): string {
  const encoded = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `eyJhbGciOiJIUzI1NiJ9.${encoded}.signature`;
}

export const TEST_USER = {
  id: "test-user-1",
  name: "Test Teacher",
  email: "teacher@mirror.test",
  role: "teacher" as const,
  isVerified: true,
  organizationId: "test-org-1",
};

export const TEST_JWT = makeJwt({
  sub: TEST_USER.id,
  role: TEST_USER.role,
  org: TEST_USER.organizationId,
  name: TEST_USER.name,
  tier: "paid",
});

export async function setAuthCookies(context: BrowserContext) {
  await context.addCookies([
    {
      name: "token",
      value: TEST_JWT,
      domain: "localhost",
      path: "/",
    },
    {
      name: "user",
      value: encodeURIComponent(JSON.stringify(TEST_USER)),
      domain: "localhost",
      path: "/",
    },
  ]);
}

// Minimal SSE stream builder
export function makeSseStream(events: object[]): string {
  return events.map((e) => `data: ${JSON.stringify(e)}\n\n`).join("");
}

export const DONE_EVENT = {
  type: "done",
  reply: "Here is your answer.",
  sessionId: "test-session",
  user: TEST_USER,
};
