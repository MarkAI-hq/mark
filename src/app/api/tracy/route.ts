import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { refreshAccessToken } from "@/lib/actions/auth";
import type { TracyAttachmentRef } from "@/components/tracy/chat-attachments";

const TRACY_URL = process.env.TRACY_URL ?? "http://localhost:4001";
const API_BASE  = process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "";

// Shared auth helper
async function resolveJwt(): Promise<string | null> {
  const cookieStore = await cookies();
  let jwt = cookieStore.get("token")?.value;

  if (!jwt) {
    console.warn("[Tracy proxy] No token — attempting refresh...");
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
      sourceIds?: string[];
      /** The page is showing a blank chat — Tracy should not inherit earlier chats' history. */
      freshChat?: boolean;
      attachments?: TracyAttachmentRef[];
      /** Saved id of a sent message the user edited — Tracy replaces it and what followed. */
      editMessageId?: string;
    };

    let enrichedMessage = body.message;

    // Inject student note sources as context when sourceIds are provided
    if (body.sourceIds && body.sourceIds.length > 0) {
      try {
        const notesRes = await fetch(`${API_BASE}/api/v1/student-notes/my`, {
          headers: { Authorization: `Bearer ${jwt}` },
        });
        if (notesRes.ok) {
          const allNotes: Array<{ id: string; topic: string; content: string }> = await notesRes.json();
          const sourceNotes = allNotes.filter((n) => body.sourceIds!.includes(n.id));
          if (sourceNotes.length > 0) {
            const sourcesBlock = sourceNotes
              .map((n) => `[${n.topic}]\n${n.content}`)
              .join("\n\n---\n\n");
            enrichedMessage = `=== Student Study Sources ===\n${sourcesBlock}\n===\n\n${body.message}`;
          }
        }
      } catch (err) {
        console.warn("[Tracy proxy] Source injection failed:", err);
      }
    }

    // Uploaded files go to Tracy as storage paths it can open itself (it
    // validates them and reads them back with this same JWT). Anything without
    // a path (e.g. a CSV, already inlined as text by the page) is just named.
    const attachments = Array.isArray(body.attachments) ? body.attachments : [];
    const readable = attachments
      .filter((f) => typeof f?.path === "string" && f.path)
      .map((f) => ({ path: f.path, name: f.name, mime: f.type }));
    const nameOnly = attachments.filter((f) => !f?.path);
    if (nameOnly.length > 0) {
      const fileList = nameOnly.map((f) => `${f.name} (${f.type})`).join(", ");
      enrichedMessage = `${enrichedMessage}\n\n[Attached files: ${fileList}]`;
    }

    const tracyRes = await fetch(`${TRACY_URL}/chat/stream`, {
      method: "POST",
      // Stop: when the chat aborts its request, this aborts Tracy's too, so it
      // cancels the model call instead of writing a reply nobody will read.
      signal: req.signal,
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${jwt}`,
      },
      body: JSON.stringify({
        message: enrichedMessage,
        sessionId: body.sessionId,
        freshChat: body.freshChat === true,
        ...(typeof body.editMessageId === "string" && body.editMessageId ? { editMessageId: body.editMessageId } : {}),
        ...(readable.length > 0 ? { attachments: readable } : {}),
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
