import { NextRequest, NextResponse } from "next/server";

const API = process.env.MIRROR_API_URL ?? "http://localhost:4000/api/v1";
const SERVICE_TOKEN = process.env.MIRROR_SERVICE_TOKEN ?? "";

async function mirrorGet(path: string) {
  try {
    const res = await fetch(`${API}${path}`, {
      headers: { Authorization: `Bearer ${SERVICE_TOKEN}` },
      next: { revalidate: 0 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  if (!SERVICE_TOKEN) {
    return NextResponse.json({ error: "Public records not configured" }, { status: 503 });
  }

  const { studentId } = await params;

  const [student, analytics, cognitiveProfile, reteachImpact, submissions] =
    await Promise.all([
      mirrorGet(`/students/${studentId}`),
      mirrorGet(`/analytics/student/${studentId}`),
      mirrorGet(`/cognitive/students/${studentId}/cognitive-profile`),
      mirrorGet(`/reteach/impact/student/${studentId}`),
      mirrorGet(`/submissions/student/${studentId}`),
    ]);

  // Strip PII for public view — only show first name + last initial
  const safeStudent = student
    ? {
        ...student,
        lastName: student.lastName?.[0] ? `${student.lastName[0]}.` : "",
        email: undefined,
      }
    : null;

  return NextResponse.json({
    student: safeStudent,
    analytics,
    cognitiveProfile,
    reteachImpact,
    submissions,
    generatedAt: new Date().toISOString(),
    isPublic: true,
  });
}