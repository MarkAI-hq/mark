import { NextRequest, NextResponse } from "next/server";

const API = process.env.MIRROR_API_URL ?? "http://localhost:4000/api/v1";

async function mirrorGet(path: string, jwt: string) {
  try {
    const res = await fetch(`${API}${path}`, {
      headers: { Authorization: `Bearer ${jwt}` },
      next: { revalidate: 0 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  const jwt = req.cookies.get("token")?.value;
  if (!jwt) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { studentId } = await params;

  // analytics/student/:id is the rich endpoint — returns avg score,
  // submissions, cognitive profile, error patterns, bloom's levels
  const [analytics, student, reteachImpact, submissions] = await Promise.all([
    mirrorGet(`/analytics/student/${studentId}`, jwt),
    mirrorGet(`/students/${studentId}`, jwt),
    mirrorGet(`/reteach/impact/student/${studentId}`, jwt),
    mirrorGet(`/submissions/student/${studentId}`, jwt),
  ]);

  return NextResponse.json({
    student,
    analytics,
    reteachImpact,
    submissions,
    generatedAt: new Date().toISOString(),
  });
}