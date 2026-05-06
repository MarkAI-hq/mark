import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('token')?.value

    const res = await fetch(`${process.env.API_BASE_URL}/api/v1/curricula`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    })

    const data = await res.json()
    return NextResponse.json(data)
  } catch (err) {
    console.error('[curricula route]', err)
    return NextResponse.json([], { status: 500 })
  }
}