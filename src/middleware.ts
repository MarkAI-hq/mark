// src/middleware.ts

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { refreshAccessToken } from './lib/actions/auth'
import { SCHOOL_DOMAIN_HOSTS } from './config/site-domains'

// A Student who hasn't finished onboarding belongs back in that flow, not the
// dashboard — mirrors the Admin `onboarding_complete` → /onboarding redirect
// below. Which flow depends on how they got here: a teacher/admin-added
// ('direct') student already has a class and a vetted identity, so they get
// the short /student/finish-setup (pledge + diagnostic only) instead of the
// full public self-enrol wizard at /student/join.
function studentDestination(user: {
  onboarding_complete?: boolean
  school_code?: string
  enrollment_source?: string
}): string {
  if (user.onboarding_complete === false) {
    if (user.enrollment_source === 'direct') return '/student/finish-setup'
    return user.school_code ? `/student/join?school=${user.school_code}` : '/student/join'
  }
  return '/student/dashboard'
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const token        = request.cookies.get('token')?.value
  const userCookie   = request.cookies.get('user')?.value

  // mirror.education is the flagship school's own front door — "/" shows the
  // program page (what the school is), not the platform pitch that lives
  // there on intel.mirror.education. Rewrite, not redirect, so the URL bar
  // stays clean.
  const host = request.headers.get('host') || ''
  if (pathname === '/' && SCHOOL_DOMAIN_HOSTS.includes(host)) {
    const url = request.nextUrl.clone()
    url.pathname = '/program'
    return NextResponse.rewrite(url)
  }

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
    '/student/payment-complete',
    '/onboarding',
    '/privacy',
    '/terms',
    '/certificates',
    '/schools',
    '/program',
    '/founders-academy',
    '/record',
    '/pay',
    '/learning-compass',
  ]

  const isPublicPath =
    publicPaths.some(p => pathname === p || pathname.startsWith(p + '/') || pathname.startsWith(p + '?')) ||
    pathname.startsWith('/assets')

  const getUser = (): { role: string; id: string; onboarding_complete?: boolean; school_code?: string; enrollment_source?: string } | null => {
    if (!userCookie) return null
    try {
      const user   = JSON.parse(decodeURIComponent(userCookie))
      const roles: string[] = user?.roles ?? [user?.role].filter(Boolean)
      if (roles.includes('Root'))    return { role: 'Root',    id: user.id }
      if (roles.includes('Support')) return { role: 'Support', id: user.id }
      if (roles.includes('Student')) return { role: 'Student', id: user.id, onboarding_complete: user.onboarding_complete ?? true, school_code: user.school_code, enrollment_source: user.enrollment_source }
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
        if (user?.role === 'Student') return NextResponse.redirect(new URL(studentDestination(user), request.url))
        if (user?.role === 'Teacher') return NextResponse.redirect(new URL('/dashboard/teacher', request.url))
        if (user?.role === 'Admin')   return NextResponse.redirect(new URL('/dashboard',          request.url))
      }
      // An authenticated Student hitting /student/login (e.g. the "Sign in" link
      // shown mid-signup) must not be bounced straight to the dashboard if they
      // haven't finished the /student/join wizard (pledge, class pick, etc.) —
      // send them back to resume it instead of silently skipping those steps.
      if (pathname === '/student/login' && user?.role === 'Student') {
        return NextResponse.redirect(new URL(studentDestination(user), request.url))
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
      return NextResponse.redirect(new URL(studentDestination(user), request.url))
    }
    // Mid-signup student (no pledge/class pick yet, or pledge/diagnostic not
    // done for a staff-added student) hitting a portal route directly (e.g. a
    // stale bookmark or the browser's back/forward cache) → back into
    // whichever onboarding flow applies, which resumes from its own saved
    // progress.
    if (
      user.onboarding_complete === false &&
      pathname.startsWith('/student') &&
      !pathname.startsWith('/student/join') &&
      !pathname.startsWith('/student/finish-setup')
    ) {
      return NextResponse.redirect(new URL(studentDestination(user), request.url))
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
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|sw\\.js|workbox-.*\\.js|swe-worker-.*\\.js|manifest\\.json|icons/).*)'],
}