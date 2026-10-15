import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { refreshAccessToken } from "@/lib/actions/auth";

// One-shot AI grading for free-response scenes (currently: peer_teach). Calls
// Tracy's dedicated /grade endpoint — NOT /chat — since the agentic loop (tool
// access + the Socratic-withholding system prompt) isn't appropriate for "score
// this against a rubric", and routing through /chat was observed taking the
// grading prompt as a normal turn (calling list_submissions_for_student instead
// of returning JSON) while also burning one of the student's free-tier chat
// requests just for finishing a lesson scene.

const TRACY_URL = process.env.TRACY_URL ?? "http://localhost:4001";

async function resolveJwt(): Promise<string | null> {
  const cookieStore = await cookies();
  let jwt = cookieStore.get("token")?.value;
  if (!jwt) {
    const { data } = await refreshAccessToken();
    if (!data) return null;
    jwt = cookieStore.get("token")?.value;
  }
  return jwt ?? null;
}

export async function POST(req: NextRequest) {
  try {
    const jwt = await resolveJwt();
    if (!jwt) return NextResponse.json({ result: null });

    const body = await req.json() as {
      prompt: string
      explanation: string
      rubricPoints?: string[]
    };

    if (!body.explanation?.trim()) {
      return NextResponse.json({ error: "explanation is required" }, { status: 400 });
    }

    const tracyRes = await fetch(`${TRACY_URL}/grade`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${jwt}`,
      },
      body: JSON.stringify({
        prompt: body.prompt,
        explanation: body.explanation,
        rubricPoints: body.rubricPoints,
      }),
    });

    if (!tracyRes.ok) {
      console.error("[tracy/grade] tracy responded", tracyRes.status, await tracyRes.text());
      return NextResponse.json({ result: null });
    }

    const data = await tracyRes.json();
    return NextResponse.json({ result: data?.result ?? null });
  } catch (err) {
    console.error("[tracy/grade] failed", err);
    return NextResponse.json({ result: null });
  }
}
