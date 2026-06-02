import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const SUPPORTED_PROVIDERS = ['google'] as const
type Provider = typeof SUPPORTED_PROVIDERS[number]

function buildGoogleUrl(clientId: string, redirectUri: string, state: string): string {
  const params = new URLSearchParams({
    client_id:     clientId,
    redirect_uri:  redirectUri,
    response_type: 'code',
    scope:         'openid email profile',
    state,
    access_type:   'offline',
    prompt:        'select_account',
  })
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> },
) {
  const { provider } = await params

  if (!SUPPORTED_PROVIDERS.includes(provider as Provider)) {
    return NextResponse.json({ error: 'Unsupported provider' }, { status: 400 })
  }

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
  if (!clientId) {
    return NextResponse.json({ error: 'SSO not configured' }, { status: 500 })
  }

  const origin = request.nextUrl.origin
  const returnUrl = request.nextUrl.searchParams.get('return_url') ?? ''
  const redirectUri = `${origin}/api/auth/${provider}/callback`

  const nonce = crypto.randomUUID()
  const statePayload = Buffer.from(JSON.stringify({ nonce, returnUrl })).toString('base64url')

  const cookieStore = await cookies()
  cookieStore.set('__oauth_state', nonce, {
    httpOnly: true,
    sameSite: 'lax',
    path:     '/',
    maxAge:   60 * 10,
    secure:   process.env.NODE_ENV === 'production',
  })

  const authUrl = buildGoogleUrl(clientId, redirectUri, statePayload)
  return NextResponse.redirect(authUrl)
}
