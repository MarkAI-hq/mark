// src/app/api/analytics/student/[id]/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value

  const baseUrl = process.env.API_BASE_URL
  if (!baseUrl) {
    return NextResponse.json({ error: 'API_BASE_URL not configured' }, { status: 500 })
  }

  try {
    const res = await fetch(`${baseUrl}/api/v1/analytics/student/${id}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      cache: 'no-store',
    })

    const data = await res.json()

    if (!res.ok) {
      return NextResponse.json(data, { status: res.status })
    }

    // Backend may wrap in { data: ... } or return raw object
    return NextResponse.json(data.data ?? data)
  } catch (err) {
    return NextResponse.json({ error: 'Failed to reach backend' }, { status: 500 })
  }
}