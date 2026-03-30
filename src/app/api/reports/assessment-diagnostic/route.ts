import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
  const cookieStore = await cookies()
  const token       = cookieStore.get('token')?.value
  const baseUrl     = process.env.API_BASE_URL

  if (!baseUrl) {
    return NextResponse.json({ error: 'API not configured' }, { status: 500 })
  }

  try {
    const { assessmentId } = await req.json()

    if (!assessmentId) {
      return NextResponse.json({ error: 'Assessment ID is required' }, { status: 400 })
    }

    // Call the new NestJS endpoint we just created
    const res = await fetch(`${baseUrl}/api/v1/reports/assessment-diagnostic/${assessmentId}`, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    })

    if (!res.ok) {
      const msg = await res.text()
      return NextResponse.json({ error: msg }, { status: res.status })
    }

    const pdfBuffer = await res.arrayBuffer()

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type':        'application/pdf',
        'Content-Disposition': res.headers.get('Content-Disposition') ?? 'attachment; filename=diagnostic-report.pdf',
      },
    })
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}