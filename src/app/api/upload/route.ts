import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { refreshAccessToken } from "@/lib/actions/auth";

const MIRROR_API_URL = process.env.MIRROR_API_URL ?? "http://localhost:4000/api/v1";

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    let jwt = cookieStore.get("token")?.value;

    if (!jwt) {
      const { data } = await refreshAccessToken();
      if (!data) {
        return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
      }
      jwt = cookieStore.get("token")?.value;
    }

    if (!jwt) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const formData = await req.formData();

    const uploadRes = await fetch(`${MIRROR_API_URL}/upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
      body: formData,
    });

    if (!uploadRes.ok) {
      const errorText = await uploadRes.text();
      console.error("[Upload proxy error]", uploadRes.status, errorText);
      return NextResponse.json({ error: "Upload failed" }, { status: uploadRes.status });
    }

    const data = await uploadRes.json();
    return NextResponse.json(data);

  } catch (err) {
    console.error("[Upload route error]", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
