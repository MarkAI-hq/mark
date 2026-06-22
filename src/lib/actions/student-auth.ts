// src/lib/actions/student-auth.ts
'use server'

import { cookies } from 'next/headers'

const API_BASE = process.env.API_BASE_URL

export async function studentLogin(data: {
  school_code:       string
  student_school_id: string
  pin:               string
}) {
  const res = await fetch(`${API_BASE}/api/v1/auth/student-login`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(data),
    cache:   'no-store',
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    return { error: err.message ?? 'Invalid school code, student ID, or PIN' }
  }

  const json        = await res.json()
  const cookieStore = await cookies()

  cookieStore.set('token', json.accessToken, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge:   60 * 60 * 24,
    path:     '/',
  })
  cookieStore.set('refreshToken', json.refreshToken, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge:   60 * 60 * 24 * 7,
    path:     '/',
  })
  cookieStore.set('user', encodeURIComponent(JSON.stringify(json.user)), {
    httpOnly: false, // must be readable by middleware for role routing
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge:   60 * 60 * 24,
    path:     '/',
  })

  return { data: json }
}

export async function verifyEnrolOtp(data: {
  student_id: string
  code:       string
}) {
  const res = await fetch(
    `${API_BASE}/api/v1/students/self-enroll/verify-otp`,
    {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(data),
      cache:   'no-store',
    },
  )

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    return { error: err.message ?? 'Verification failed. Check the code and try again.' }
  }

  const json        = await res.json()
  const cookieStore = await cookies()

  cookieStore.set('token', json.accessToken, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge:   60 * 60 * 24,
    path:     '/',
  })
  cookieStore.set('refreshToken', json.refreshToken, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge:   60 * 60 * 24 * 7,
    path:     '/',
  })
  cookieStore.set('user', encodeURIComponent(JSON.stringify(json.user)), {
    httpOnly: false,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge:   60 * 60 * 24,
    path:     '/',
  })

  return { data: json }
}

export async function completeWhatsappEnrol(verify_id: string) {
  const res = await fetch(
    `${API_BASE}/api/v1/students/self-enroll/complete`,
    {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ verify_id }),
      cache:   'no-store',
    },
  )

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    return { error: err.message ?? 'Could not finish sign-up. Please try again.' }
  }

  const json        = await res.json()
  const cookieStore = await cookies()

  cookieStore.set('token', json.accessToken, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge:   60 * 60 * 24,
    path:     '/',
  })
  cookieStore.set('refreshToken', json.refreshToken, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge:   60 * 60 * 24 * 7,
    path:     '/',
  })
  cookieStore.set('user', encodeURIComponent(JSON.stringify(json.user)), {
    httpOnly: false,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge:   60 * 60 * 24,
    path:     '/',
  })

  return { data: json }
}

export async function studentLogout() {
  const cookieStore = await cookies()
  cookieStore.delete('token')
  cookieStore.delete('refreshToken')
  cookieStore.delete('user')
  return { success: true }
}