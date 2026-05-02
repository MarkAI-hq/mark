import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { refreshAccessToken } from "@/lib/actions/auth";

const TRACY_URL = process.env.TRACY_URL ?? "http://localhost:4001";

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    let jwt = cookieStore.get("token")?.value;

    if (!jwt) {
      console.log("[Tracy proxy] No token — attempting refresh...");
      const { data } = await refreshAccessToken();
      if (!data) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
      jwt = data.accessToken;
    }

    if (!jwt) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    const body = await req.json() as {
      message: string;
      sessionId: string;
      attachments?: Array<{ name: string; type: string; size: number; url?: string }>;
    };

    // Build enriched message — include file URLs so Tracy can pass them to tools
    let enrichedMessage = body.message;
    if (body.attachments && body.attachments.length > 0) {
      const fileContext = body.attachments.map((f) => {
        if (f.url) {
          return `- File: "${f.name}" | Type: ${f.type} | fileUrl: ${f.url}`;
        }
        return `- File: "${f.name}" | Type: ${f.type} | STATUS: upload pending — do NOT call any tool with this file`;
      }).join("\n");
      enrichedMessage = `${body.message}\n\n[ATTACHED FILES — when calling tools, use the exact fileUrl values below:\n${fileContext}\n]`;
    }
    console.log("[Tracy proxy] enrichedMessage:", enrichedMessage);
    const tracyRes = await fetch(`${TRACY_URL}/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${jwt}`,
      },
      body: JSON.stringify({
        message: enrichedMessage,
        sessionId: body.sessionId,
      }),
    });

    if (!tracyRes.ok) {
      const errorText = await tracyRes.text();
      console.error("[Tracy proxy error]", tracyRes.status, errorText);
      return NextResponse.json(
        { error: `Tracy service error: ${tracyRes.status}` },
        { status: tracyRes.status }
      );
    }

    const data = await tracyRes.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error("[Tracy route error]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}