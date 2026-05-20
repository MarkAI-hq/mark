import { cookies }      from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ assessmentId: string }> }
) {
  const { assessmentId } = await params
  const cookieStore      = await cookies()
  const token            = cookieStore.get('token')?.value
  const body             = await req.json()

  const res = await fetch(
    `${process.env.API_BASE_URL}/api/v1/assessments/${assessmentId}/audit/redesign/confirm`,
    {
      method:  'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    },
  )

  if (!res.ok) {
    const text = await res.text()
    return NextResponse.json({ message: text }, { status: res.status })
  }

  return NextResponse.json({ message: 'Confirmed.' })
}