import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ assessmentId: string }> }
) {
  const { assessmentId } = await params
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value

  const res = await fetch(
    `${process.env.API_BASE_URL}/api/v1/assessments/${assessmentId}/audit/redesign-items/download`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  )

  if (!res.ok) {
    const body = await res.text()
    return NextResponse.json({ message: body }, { status: res.status })
  }

  const blob = await res.arrayBuffer()
  return new NextResponse(blob, {
    status: 200,
    headers: {
      'Content-Type': res.headers.get('Content-Type') ?? 'application/octet-stream',
      'Content-Disposition': res.headers.get('Content-Disposition') ?? 'attachment; filename="redesign-blueprint.docx"',
    },
  })
}