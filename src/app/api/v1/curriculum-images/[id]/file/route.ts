import { cookies }                  from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id }       = await params
  const cookieStore  = await cookies()
  const token        = cookieStore.get('token')?.value

  const res = await fetch(
    `${process.env.API_BASE_URL}/api/v1/curriculum-images/${id}/file`,
    {
      headers:  { Authorization: `Bearer ${token}` },
      redirect: 'follow',
    },
  )

  if (!res.ok) {
    return NextResponse.json({ message: 'Image not found' }, { status: res.status })
  }

  const contentType = res.headers.get('Content-Type') ?? 'image/png'
  const buffer      = await res.arrayBuffer()

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type':  contentType,
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
