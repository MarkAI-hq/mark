import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { setAuthCookies } from '@/lib/actions/auth'
import { fetcher } from '@/lib/fetch'
import type { LoginResponse } from '@/lib/types'

const ROLE_REDIRECTS: Record<string, string> = {
  Root:    '/root',
  Support: '/root',
  Admin:   '/dashboard',
  Teacher: '/dashboard/teacher',
  Student: '/student/dashboard',
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> },
) {
  const { provider } = await params
  const { searchParams, origin } = request.nextUrl
  const code  = searchParams.get('code')
  const state = searchParams.get('state')

  if (!code || !state) {
    return NextResponse.redirect(new URL('/login?error=sso_failed&message=Missing+parameters', origin))
  }

  // CSRF: verify nonce
  const cookieStore = await cookies()
  const storedNonce = cookieStore.get('__oauth_state')?.value
  cookieStore.delete('__oauth_state')

  let returnUrl = ''
  try {
    const decoded = JSON.parse(Buffer.from(state, 'base64url').toString())
    if (!storedNonce || decoded.nonce !== storedNonce) {
      return NextResponse.redirect(new URL('/login?error=invalid_state', origin))
    }
    returnUrl = decoded.returnUrl ?? ''
  } catch {
    return NextResponse.redirect(new URL('/login?error=invalid_state', origin))
  }

  const redirectUri = `${origin}/api/auth/${provider}/callback`
  const response = await fetcher<LoginResponse>('/auth/sso/callback', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ code, redirectUri, provider }),
  })

  if (response.error || !response.data) {
    const msg = encodeURIComponent(response.error?.message ?? 'SSO authentication failed')
    return NextResponse.redirect(new URL(`/login?error=sso_failed&message=${msg}`, origin))
  }

  setAuthCookies(cookieStore, response.data)

  const role = response.data.user.roles?.[0] ?? 'Teacher'
  const destination = returnUrl || ROLE_REDIRECTS[role] || '/dashboard'
  return NextResponse.redirect(new URL(destination, origin))
}
