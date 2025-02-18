import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

import { refreshAccessToken } from './lib/actions/auth'

export async function middleware(request: NextRequest) {
	const token = request.cookies.get('token')
	const refreshToken = request.cookies.get('refreshToken')
	const user = request.cookies.get('user')
	const isAuthPage = request.nextUrl.pathname.startsWith('/login')

	// Allow public routes
	if (isAuthPage) {
		if (token && user) {
			// Get return URL from query or default to dashboard
			const returnUrl = request.nextUrl.searchParams.get('return_url') || '/dashboard'
			return NextResponse.redirect(new URL(returnUrl, request.url))
		}
		return NextResponse.next()
	}

	// Check for token and user data
	if (!token || !user) {
		if (refreshToken) {
			// Try to refresh the token
			const { data: tokens } = await refreshAccessToken()

			if (tokens) {
				// Token refreshed successfully, continue to requested page
				return NextResponse.next()
			}
		}

		// No token and refresh failed/not available, redirect to login with return URL
		const loginUrl = new URL('/login', request.url)
		loginUrl.searchParams.set('return_url', request.nextUrl.pathname + request.nextUrl.search)
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
