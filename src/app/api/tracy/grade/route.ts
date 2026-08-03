import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomUUID } from "crypto";
import { refreshAccessToken } from "@/lib/actions/auth";

// One-shot AI grading for free-response scenes (currently: peer_teach). Reuses
// Tracy's existing non-streaming /chat endpoint with a fresh, throwaway
// sessionId so this never pollutes the student's real Tracy conversation —
// it's a scoped grading call, not a chat turn.

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

    const message =
      `You are grading a student's own-words explanation for a "peer teaching" exercise. ` +
      `Be encouraging but honest — this is for the student's learning, not a test.\n\n` +
      `Original prompt the student was explaining: ${body.prompt}\n\n` +
      (body.rubricPoints?.length
        ? `A complete answer should cover:\n${body.rubricPoints.map((p) => `- ${p}`).join('\n')}\n\n`
        : '') +
      `Student's explanation:\n"""${body.explanation}"""\n\n` +
      `Return ONLY a valid JSON object, no other text:\n` +
      `{"score": <0-100 integer>, "feedback": "<one short encouraging sentence on what to improve or confirm they nailed it>", "met_points": ["<rubric points they actually covered, verbatim from the list above>"]}`;

    const tracyRes = await fetch(`${TRACY_URL}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${jwt}`,
      },
      body: JSON.stringify({ message, sessionId: `grade-${randomUUID()}` }),
    });

    if (!tracyRes.ok) return NextResponse.json({ result: null });

    const data = await tracyRes.json();
    const raw: string = data?.reply ?? "";
    const jsonStart = raw.indexOf("{");
    const jsonEnd = raw.lastIndexOf("}");
    if (jsonStart === -1 || jsonEnd === -1) return NextResponse.json({ result: null });

    const parsed = JSON.parse(raw.slice(jsonStart, jsonEnd + 1));
    const score = Number(parsed.score);
    if (!Number.isFinite(score)) return NextResponse.json({ result: null });

    return NextResponse.json({
      result: {
        score: Math.max(0, Math.min(100, Math.round(score))),
        feedback: String(parsed.feedback ?? ""),
        met_points: Array.isArray(parsed.met_points) ? parsed.met_points.map(String) : [],
      },
    });
  } catch {
    return NextResponse.json({ result: null });
  }
}
