import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { refreshAccessToken } from "@/lib/actions/auth";

const TRACY_URL = process.env.TRACY_URL ?? "http://localhost:4001";

// Shared auth helper
async function resolveJwt(): Promise<string | null> {
  const cookieStore = await cookies();
  let jwt = cookieStore.get("token")?.value;

  if (!jwt) {
    console.log("[Tracy proxy] No token — attempting refresh...");
    const { data } = await refreshAccessToken();
    if (!data) return null;
    jwt = cookieStore.get("token")?.value;
  }

  return jwt ?? null;
}

// ─── Streaming endpoint: POST /api/tracy/stream ───────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const jwt = await resolveJwt();

    if (!jwt) {
      // Return a minimal SSE stream with the auth-pending signal
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(
            new TextEncoder().encode(
              `data: ${JSON.stringify({ type: "error", message: "__AUTH_PENDING__" })}\n\n`
            )
          );
          controller.close();
        },
      });
      return new Response(stream, {
        headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
      });
    }

    const body = await req.json() as {
      message: string;
      sessionId: string;
      attachments?: Array<{ name: string; type: string; size: number }>;
    };

    let enrichedMessage = body.message;
    if (body.attachments && body.attachments.length > 0) {
      const fileList = body.attachments.map((f) => `${f.name} (${f.type})`).join(", ");
      enrichedMessage = `${body.message}\n\n[Attached files: ${fileList}]`;
    }

    const tracyRes = await fetch(`${TRACY_URL}/chat/stream`, {
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

    if (!tracyRes.ok || !tracyRes.body) {
      const errorText = await tracyRes.text();
      console.error("[Tracy stream proxy error]", tracyRes.status, errorText);
      const errStream = new ReadableStream({
        start(controller) {
          controller.enqueue(
            new TextEncoder().encode(
              `data: ${JSON.stringify({ type: "error", message: "Tracy service error" })}\n\n`
            )
          );
          controller.close();
        },
      });
      return new Response(errStream, {
        headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
      });
    }

    // Pipe the SSE stream directly to the client
    return new Response(tracyRes.body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "X-Accel-Buffering": "no",
      },
    });

  } catch (err) {
    console.error("[Tracy route error]", err);
    const errStream = new ReadableStream({
      start(controller) {
        controller.enqueue(
          new TextEncoder().encode(
            `data: ${JSON.stringify({ type: "error", message: "Internal server error connecting to Tracy." })}\n\n`
          )
        );
        controller.close();
      },
    });
    return new Response(errStream, {
      headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
    });
  }
}
