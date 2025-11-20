import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { refreshAccessToken } from './lib/actions/auth'  // use your updated function name

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get('token')?.value

  // Public or allowed paths that don't require authentication
  const publicPaths = [
    '/',
    '/login',
    '/signup',
    '/forgot-password',
    '/reset-password',
    '/verify-email',
  ]

  const isPublicPath = publicPaths.includes(pathname) || pathname.startsWith('/assets')

  // Allow public paths immediately
  if (isPublicPath) {
    // If user is logged in and tries to access login or signup, redirect to dashboard
    if (token && (pathname === '/login' || pathname === '/signup')) {
      return NextResponse.redirect(new URL('/dashboard/classes', request.url))
    }
    return NextResponse.next()
  }

  // For protected routes, check tokens and user cookie
  const refreshToken = request.cookies.get('refreshToken')?.value
  const user = request.cookies.get('user')

  if (!token || !user) {
    if (refreshToken) {
      // Try to refresh token via your server action
      const { data: tokens } = await refreshAccessToken()
      if (tokens) {
        // Token refreshed, continue request
        return NextResponse.next()
      }
    }

    // Not authenticated: redirect to login with return_url
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('return_url', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Authenticated, allow request to proceed
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
