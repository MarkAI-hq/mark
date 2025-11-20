'use server'

import { cookies } from 'next/headers'
import { fetcher } from '../fetch'
import type {
  ApiResponse,
  LoginResponse,
  RegisterResponse,
  RefreshTokenResponse,
  VerifyEmailResponse,
  BackendUser,
} from '../types'

function transformUser(backendUser: BackendUser) {
  return {
    id: backendUser.user_id,
    name: `${backendUser.first_name} ${backendUser.last_name}`.trim(),
    email: backendUser.email,
    role: backendUser.roles?.[0] || 'Teacher',
    isVerified: backendUser.email_verified,
    photoUrl: backendUser.profile_image_url,
    organizationId: backendUser.organization_id,
  }
}

export async function login(email: string, password: string) {
  const cookieStore = await cookies()

  try {
    const response = await fetcher<LoginResponse>('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    if (response.error) {
      throw new Error(response.error.message)
    }
    if (!response.data) {
      throw new Error('Login failed: No data returned from API.')
    }

    const { data } = response

    cookieStore.set('token', data.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 15,
    })

    cookieStore.set('refreshToken', data.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    })

    const frontendUser = transformUser(data.user)
    cookieStore.set('user', JSON.stringify(frontendUser), {
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    })

    return { data, error: null }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'An unknown error occurred'
    return { data: null, error: { message } }
  }
}

export async function signUp(
  firstName: string,
  lastName: string,
  email: string,
  password: string,
  phone?: string,
  photo?: File,
  acceptTerms?: boolean,
) {
  const formData = new FormData()
  formData.append('firstName', firstName)
  formData.append('lastName', lastName)
  formData.append('email', email)
  formData.append('password', password)
  formData.append('acceptTerms', acceptTerms ? 'true' : 'false')

  if (phone) formData.append('phone', phone)
  if (photo) formData.append('photo', photo)

  try {
    const response = await fetcher<RegisterResponse>('/auth/register', {
      method: 'POST',
      body: formData,
    })

    if (response.error) {
      throw new Error(response.error.message)
    }

    return { data: response.data, error: null }
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Registration failed due to an API error.'
    return { data: null, error: { message } }
  }
}

export async function logout() {
  try {
    const cookieStore = await cookies()
    cookieStore.delete('token')
    cookieStore.delete('refreshToken')
    cookieStore.delete('user')

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Logout failed',
    }
  }
}

export async function refreshAccessToken() {
  const cookieStore = await cookies()
  const refreshToken = cookieStore.get('refreshToken')?.value

  if (!refreshToken) {
    return {
      data: null,
      error: { message: 'No refresh token found', status: 401 },
    }
  }

  try {
    const response = await fetcher<RefreshTokenResponse>('/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    })

    if (response.error) {
      throw new Error(response.error.message)
    }
    if (!response.data) {
      throw new Error('Refresh token failed: No data returned from API.')
    }

    const { data } = response

    cookieStore.set('token', data.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 15,
    })

    cookieStore.set('refreshToken', data.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    })

    return { data, error: null }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'An unknown error occurred'
    return { data: null, error: { message } }
  }
}

export async function verifyEmail(token: string) {
  try {
    const response = await fetcher<VerifyEmailResponse>('/auth/verify-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })

    if (response.error) {
      throw new Error(response.error.message)
    }

    return { data: response.data, error: null }
  } catch (err) {
    const message =
      err instanceof Error
        ? err.message
        : 'An unexpected error occurred during email verification.'
    return { data: null, error: { message, status: 500 } }
  }
}

export async function resendVerificationEmail(email: string) {
  try {
    const response = await fetcher<{ message: string }>('/auth/resend-verification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })

    if (response.error) {
      throw new Error(response.error.message)
    }

    return { data: response.data, error: null }
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Failed to resend verification email.'
    return { data: null, error: { message, status: 500 } }
  }
}
