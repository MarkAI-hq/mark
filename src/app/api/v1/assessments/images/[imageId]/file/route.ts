import { cookies }                   from 'next/headers'
import { NextRequest, NextResponse }  from 'next/server'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ imageId: string }> }
) {
  const { imageId }  = await params
  const cookieStore  = await cookies()
  const token        = cookieStore.get('token')?.value

  const res = await fetch(
    `${process.env.API_BASE_URL}/api/v1/assessments/images/${imageId}/file`,
    { headers: { Authorization: `Bearer ${token}` } },
  )

  if (!res.ok) {
    return NextResponse.json({ message: 'Image not found' }, { status: res.status })
  }

  const buffer = await res.arrayBuffer()
  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type':  'image/png',
      'Cache-Control': 'public, max-age=86400',
    },
  })
}