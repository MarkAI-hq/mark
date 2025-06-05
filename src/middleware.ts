import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { refreshAccessToken } from './lib/actions/auth'

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl

  // Always allow the domain root ("/")
  if (pathname === '/') {
    return NextResponse.next()
  }

  // Allow static files
  if (pathname.startsWith('/assets/images/')) {
    return NextResponse.next();
  }

  // Allow public routes that do not require authentication
  // These routes are typically for login, signup, forgot password, etc.
  if (pathname.startsWith('/login') ||
    pathname.startsWith('/signup') ||
    pathname.startsWith('/forgot-password') ||
    pathname.startsWith('/reset-password') ||
    pathname.startsWith('/verify-email')) {
    const token = request.cookies.get('token')
    const user = request.cookies.get('user')

    // If the user is already authenticated, redirect to the root (default page)
    if (token && user) {
      return NextResponse.redirect(new URL('/', request.url))
    }
    return NextResponse.next()
  }

  // Enforce authentication for all other routes
  // Check if the user is authenticated by looking for a token and user cookie
  // If not authenticated, redirect to the login page with the original URL as a return URL
  const token = request.cookies.get('token')
  const refreshToken = request.cookies.get('refreshToken')
  const user = request.cookies.get('user')

  if (!token || !user) {
    if (refreshToken) {
      // Attempt to refresh the access token
      const { data: tokens } = await refreshAccessToken()
      if (tokens) {
        // Token refreshed successfully, proceed to the requested page
        return NextResponse.next()
      }
    }

    // Not authenticated, redirect to /login with the original URL as the return URL
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('return_url', pathname + search)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)'
  ]
}
