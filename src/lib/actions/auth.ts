'use server'

// src/lib/actions/auth.ts

import { cookies }        from 'next/headers'
import { revalidatePath } from 'next/cache'
import { fetcher }        from '../fetch'
import type {
  LoginResponse,
  RegisterResponse,
  RefreshTokenResponse,
  VerifyEmailResponse,
  BackendUser,
  AcceptInvitationResponse,
  PeekInvitationResponse,
  RegisterInvitedResponse,
} from '../types'

function transformUser(backendUser: BackendUser) {
  return {
    id:                  backendUser.user_id,
    name:                `${backendUser.first_name} ${backendUser.last_name}`.trim(),
    email:               backendUser.email,
    role:                backendUser.roles?.[0] || 'Teacher',
    isVerified:          backendUser.email_verified,
    photoUrl:            backendUser.profile_image_url,
    organizationId:      backendUser.organization_id,
    onboarding_complete: backendUser.onboarding_complete,
  }
}

type CookieStore = Awaited<ReturnType<typeof cookies>>

// Shared across mirror.education and intel.mirror.education so a session
// started on one domain (e.g. an Admin logging in via the platform-sales
// site) still reaches /dashboard on the other.
const COOKIE_DOMAIN = process.env.NODE_ENV === 'production' ? '.mirror.education' : undefined

export async function setAuthCookies(cookieStore: CookieStore, data: LoginResponse) {
  const isProd = process.env.NODE_ENV === 'production'
  cookieStore.set('token', data.accessToken, {
    httpOnly: true,
    secure:   isProd,
    sameSite: 'lax',
    path:     '/',
    domain:   COOKIE_DOMAIN,
    maxAge:   60 * 15,
  })
  cookieStore.set('refreshToken', data.refreshToken, {
    httpOnly: true,
    secure:   isProd,
    sameSite: 'lax',
    path:     '/',
    domain:   COOKIE_DOMAIN,
    maxAge:   60 * 60 * 24 * 7,
  })
  cookieStore.set('user', encodeURIComponent(JSON.stringify(transformUser(data.user))), {
    secure:   isProd,
    sameSite: 'lax',
    path:     '/',
    domain:   COOKIE_DOMAIN,
    maxAge:   60 * 60 * 24 * 7,
  })
}

export async function login(email: string, password: string) {
  const cookieStore = await cookies()

  try {
    const response = await fetcher<LoginResponse>('/auth/login', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email, password }),
    })

    if (response.error) throw new Error(response.error.message)
    if (!response.data)  throw new Error('Login failed: No data returned from API.')

    setAuthCookies(cookieStore, response.data)
    return { data: response.data, error: null }
  } catch (err) {
    return { data: null, error: { message: err instanceof Error ? err.message : 'An unknown error occurred' } }
  }
}

export async function signUp(
  firstName:       string,
  lastName:        string,
  email:           string,
  password:        string,
  phone?:          string,
  photo?:          File,
  acceptTerms?:    boolean,
  orgName?:        string,
) {
  const formData = new FormData()
  formData.append('firstName',   firstName)
  formData.append('lastName',    lastName)
  formData.append('email',       email)
  formData.append('password',    password)
  formData.append('acceptTerms', acceptTerms ? 'true' : 'false')

  if (phone)   formData.append('phone',   phone)
  if (photo)   formData.append('photo',   photo)
  if (orgName) formData.append('orgName', orgName)

  try {
    const response = await fetcher<RegisterResponse>('/auth/register', {
      method: 'POST',
      body:   formData,
    })

    if (response.error) throw new Error(response.error.message)
    return { data: response.data, error: null }
  } catch (err) {
    return { data: null, error: { message: err instanceof Error ? err.message : 'Registration failed due to an API error.' } }
  }
}

export async function logout() {
  try {
    const cookieStore = await cookies()
    cookieStore.delete({ name: 'token',        path: '/', domain: COOKIE_DOMAIN })
    cookieStore.delete({ name: 'refreshToken', path: '/', domain: COOKIE_DOMAIN })
    cookieStore.delete({ name: 'user',         path: '/', domain: COOKIE_DOMAIN })
    return { success: true }
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Logout failed' }
  }
}

export async function refreshAccessToken() {
  const cookieStore  = await cookies()
  const refreshToken = cookieStore.get('refreshToken')?.value

  if (!refreshToken) {
    return { data: null, error: { message: 'No refresh token found', status: 401 } }
  }

  try {
    const response = await fetcher<RefreshTokenResponse>('/auth/refresh', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ refreshToken }),
    })

    if (response.error) throw new Error(response.error.message)
    if (!response.data)  throw new Error('Refresh token failed: No data returned from API.')

    const { data } = response

    cookieStore.set('token', data.accessToken, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path:     '/',
      domain:   COOKIE_DOMAIN,
      maxAge:   60 * 15,
    })
    cookieStore.set('refreshToken', data.refreshToken, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path:     '/',
      domain:   COOKIE_DOMAIN,
      maxAge:   60 * 60 * 24 * 7,
    })

    return { data, error: null }
  } catch (err) {
    return { data: null, error: { message: err instanceof Error ? err.message : 'An unknown error occurred' } }
  }
}

export async function verifyEmail(token: string) {
  const cookieStore = await cookies()

  try {
    const response = await fetcher<VerifyEmailResponse>('/auth/verify-email', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ token }),
    })

    if (response.error) throw new Error(response.error.message)
    if (!response.data)  throw new Error('Verification failed: No data returned.')

    const { data } = response

    if (data.accessToken && data.refreshToken && data.user) {
      cookieStore.set('token', data.accessToken, {
        httpOnly: true,
        secure:   process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path:     '/',
        domain:   COOKIE_DOMAIN,
        maxAge:   60 * 15,
      })
      cookieStore.set('refreshToken', data.refreshToken, {
        httpOnly: true,
        secure:   process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path:     '/',
        domain:   COOKIE_DOMAIN,
        maxAge:   60 * 60 * 24 * 7,
      })
      cookieStore.set('user', encodeURIComponent(JSON.stringify(transformUser(data.user))), {
        secure:   process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path:     '/',
        domain:   COOKIE_DOMAIN,
        maxAge:   60 * 60 * 24 * 7,
      })
    }

    revalidatePath('/dashboard/settings/members')
    return { data, error: null }
  } catch (err) {
    return {
      data:  null,
      error: {
        message: err instanceof Error ? err.message : 'An unexpected error occurred during email verification.',
        status:  500,
      },
    }
  }
}

export async function resendVerificationEmail(email: string) {
  try {
    const response = await fetcher<{ message: string }>('/auth/resend-verification', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ email }),
    })

    if (response.error) throw new Error(response.error.message)
    return { data: response.data, error: null }
  } catch (err) {
    return { data: null, error: { message: err instanceof Error ? err.message : 'Failed to resend verification email.', status: 500 } }
  }
}

export async function peekInvitation(token: string) {
  try {
    const response = await fetcher<PeekInvitationResponse>(`/auth/invitation/${token}`, {
      method:  'GET',
      headers: { 'Content-Type': 'application/json' },
    })

    if (response.error) throw new Error(response.error.message)
    return { data: response.data, error: null }
  } catch (err) {
    return {
      data:  null,
      error: {
        message: err instanceof Error ? err.message : 'Failed to validate invitation.',
        status:  500,
      },
    }
  }
}

export async function acceptInvitation(token: string) {
  try {
    const response = await fetcher<AcceptInvitationResponse>('/auth/accept-invitation', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ token }),
    })

    if (response.error) throw new Error(response.error.message)
    return { data: response.data, error: null }
  } catch (err) {
    return {
      data:  null,
      error: {
        message: err instanceof Error ? err.message : 'Failed to accept invitation.',
        status:  500,
      },
    }
  }
}

export async function exportAccountData() {
  return fetcher<Record<string, unknown>>('/auth/export-data')
}

export async function deleteAccount() {
  return fetcher<{ message: string }>('/auth/account', { method: 'DELETE' })
}

export async function registerInvited(payload: {
  token:       string
  firstName:   string
  lastName:    string
  email:       string
  password:    string
  phone?:      string
  acceptTerms: boolean
}) {
  try {
    const response = await fetcher<RegisterInvitedResponse>('/auth/register-invited', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    })

    if (response.error) throw new Error(response.error.message)
    return { data: response.data, error: null }
  } catch (err) {
    return {
      data:  null,
      error: {
        message: err instanceof Error ? err.message : 'Registration failed.',
        status:  500,
      },
    }
  }
}