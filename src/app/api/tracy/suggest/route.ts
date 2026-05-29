import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { refreshAccessToken } from "@/lib/actions/auth";

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

export async function POST(_req: NextRequest) {
  try {
    const jwt = await resolveJwt();
    if (!jwt) return NextResponse.json({ suggestions: null });

    const tracyRes = await fetch(`${TRACY_URL}/suggest`, {
      method: "POST",
      headers: { Authorization: `Bearer ${jwt}` },
    });

    if (!tracyRes.ok) return NextResponse.json({ suggestions: null });

    const data = await tracyRes.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ suggestions: null });
  }
}
