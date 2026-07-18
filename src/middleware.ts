// src/middleware.ts

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { refreshAccessToken } from './lib/actions/auth'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token        = request.cookies.get('token')?.value
  const userCookie   = request.cookies.get('user')?.value

  const publicPaths = [
    '/',
    '/login',
    '/signup',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/verify-email',
    '/accept-invitation',
    '/student/login',
    '/student/join',
    '/onboarding',
    '/privacy',
    '/terms',
    '/certificates',
    '/enroll',
    '/schools',
    '/program',
    '/admissions',
    '/record',
    '/pay',
  ]

  const isPublicPath =
    publicPaths.some(p => pathname === p || pathname.startsWith(p + '/') || pathname.startsWith(p + '?')) ||
    pathname.startsWith('/assets')

  const getUser = (): { role: string; id: string; onboarding_complete?: boolean } | null => {
    if (!userCookie) return null
    try {
      const user   = JSON.parse(decodeURIComponent(userCookie))
      const roles: string[] = user?.roles ?? [user?.role].filter(Boolean)
      if (roles.includes('Root'))    return { role: 'Root',    id: user.id }
      if (roles.includes('Support')) return { role: 'Support', id: user.id }
      if (roles.includes('Student')) return { role: 'Student', id: user.id }
      if (roles.includes('Admin'))   return { role: 'Admin',   id: user.id, onboarding_complete: user.onboarding_complete ?? true }
      if (roles.includes('Teacher')) return { role: 'Teacher', id: user.id }
      return null
    } catch {
      return null
    }
  }

  if (isPublicPath) {
    if (token) {
      const user = getUser()
      if (pathname === '/login' || pathname === '/signup' || pathname === '/register') {
        if (user?.role === 'Root' || user?.role === 'Support') return NextResponse.redirect(new URL('/root', request.url))
        if (user?.role === 'Student') return NextResponse.redirect(new URL('/student/dashboard', request.url))
        if (user?.role === 'Teacher') return NextResponse.redirect(new URL('/dashboard/teacher', request.url))
        if (user?.role === 'Admin')   return NextResponse.redirect(new URL('/dashboard',          request.url))
      }
      if (pathname === '/student/login' && user?.role === 'Student') {
        return NextResponse.redirect(new URL('/student/dashboard', request.url))
      }
      // Authenticated admin who has already completed onboarding visiting /onboarding → dashboard
      if (pathname === '/onboarding' && user?.role === 'Admin' && user.onboarding_complete === true) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
    }
    return NextResponse.next()
  }

  const refreshToken = request.cookies.get('refreshToken')?.value

  if (!token || !userCookie) {
    if (refreshToken) {
      const { data: tokens } = await refreshAccessToken()
      if (tokens) return NextResponse.next()
    }
    const isStudentPath = pathname.startsWith('/student')
    const loginUrl      = new URL(isStudentPath ? '/student/login' : '/login', request.url)
    loginUrl.searchParams.set('return_url', pathname)
    return NextResponse.redirect(loginUrl)
  }

  const user = getUser()

  // Platform roles (Root + Support) → root dashboard only; blocked from all org routes
  if (user?.role === 'Root' || user?.role === 'Support') {
    if (!pathname.startsWith('/root')) {
      return NextResponse.redirect(new URL('/root', request.url))
    }
    return NextResponse.next()
  }

  // Non-platform roles cannot access /root
  if (pathname.startsWith('/root')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (user?.role === 'Student') {
    if (pathname.startsWith('/dashboard') || pathname === '/student') {
      return NextResponse.redirect(new URL('/student/dashboard', request.url))
    }
    return NextResponse.next()
  }

  if (pathname.startsWith('/student') && user?.role !== 'Student') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Admin hitting /dashboard before completing onboarding → back to wizard
  if (user?.role === 'Admin' && pathname === '/dashboard' && user.onboarding_complete === false) {
    return NextResponse.redirect(new URL('/onboarding', request.url))
  }

  if (user?.role === 'Teacher') {
    const teacherBlockedPrefixes = [
      '/dashboard/settings',
      '/dashboard/students/new',
      '/dashboard/students/import',
      '/dashboard/classes/new',
      '/dashboard/classes/accept-invite',
      '/dashboard/members',
      '/dashboard/invitations',
      '/dashboard/classes',
    ]

    const isInviteAcceptance = pathname.startsWith('/dashboard/classes/accept-invite')

    const isBlocked = !isInviteAcceptance &&
      teacherBlockedPrefixes.some(p => pathname.startsWith(p))

    if (isBlocked) {
      return NextResponse.redirect(new URL('/dashboard/teacher', request.url))
    }

    if (pathname === '/dashboard') {
      return NextResponse.redirect(new URL('/dashboard/teacher', request.url))
    }
  }

  if (user?.role === 'Admin' && pathname === '/dashboard/teacher') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}