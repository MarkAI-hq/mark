import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { refreshAccessToken } from "@/lib/actions/auth";

const MIRROR_API_URL = process.env.MIRROR_API_URL ?? "http://localhost:8000/api/v1";

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    let jwt = cookieStore.get("token")?.value;

    if (!jwt) {
      const { data } = await refreshAccessToken();
      if (!data) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
      jwt = data.accessToken;
    }

    if (!jwt) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

    // Forward the multipart form data directly to NestJS
    const formData = await req.formData();

    const res = await fetch(`${MIRROR_API_URL}/upload`, {
      method: "POST",
      headers: { Authorization: `Bearer ${jwt}` },
      body: formData,
    });

    if (!res.ok) {
      const error = await res.text();
      return NextResponse.json({ error }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error("[Upload proxy error]", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}