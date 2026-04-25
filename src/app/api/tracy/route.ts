import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { refreshAccessToken } from "@/lib/actions/auth";

const TRACY_URL = process.env.TRACY_URL ?? "http://localhost:4001";

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    let jwt = cookieStore.get("token")?.value;

    // Token missing or expired — try refresh before giving up
    if (!jwt) {
      console.log("[Tracy proxy] No token — attempting refresh...");
      const { data } = await refreshAccessToken();
      if (!data) {
        console.error("[Tracy proxy] Refresh failed — user must re-login");
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
      }
      // Re-read cookie after refresh
      jwt = cookieStore.get("token")?.value;
    }

    if (!jwt) {
      console.error("[Tracy proxy] No 'token' cookie found after refresh attempt");
      return NextResponse.json({ reply: "__AUTH_PENDING__" });
    }

    const body = await req.json() as {
      message: string;
      sessionId: string;
      attachments?: Array<{ name: string; type: string; size: number }>;
    };

    let enrichedMessage = body.message;
    if (body.attachments && body.attachments.length > 0) {
      const fileList = body.attachments
        .map((f) => `${f.name} (${f.type})`)
        .join(", ");
      enrichedMessage = `${body.message}\n\n[Attached files: ${fileList}]`;
    }

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
    return NextResponse.json(
      { error: "Internal server error connecting to Tracy." },
      { status: 500 }
    );
  }
}