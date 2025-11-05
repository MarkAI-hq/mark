// src/middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token = request.cookies.get('token')?.value

  // Define paths that are considered public and do not require authentication
  const publicPaths = [
    '/',
    '/login',
    '/signup',
    '/forgot-password',
    '/reset-password',
    '/verify-email',
  ]

  // Check if the current path is a public one (or an asset)
  const isPublicPath =
    publicPaths.includes(pathname) || pathname.startsWith('/assets')

  if (token) {
    // If the user is logged in and tries to access the login or signup page,
    // redirect them to the main dashboard entry point.
    if (pathname === '/login' || pathname === '/signup') {
      return NextResponse.redirect(new URL('/dashboard/classes', request.url))
    }
    // Otherwise, allow them to proceed.
    return NextResponse.next()
  }

  if (!token && !isPublicPath) {
    // If the user is not logged in and trying to access a protected path,
    // redirect them to the login page with a return URL.
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('return_url', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // If none of the above, allow the request to proceed (for public pages).
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
