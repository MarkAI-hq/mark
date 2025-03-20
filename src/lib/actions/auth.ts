'use server'

import { cookies } from 'next/headers'

import { fetcher } from '../fetch'
import { ApiResponse, LoginResponse, RefreshTokenResponse } from '../types'

export async function login(email: string, password: string) {
    const cookieStore = await cookies()

    const { data, error } = await fetcher<ApiResponse<LoginResponse>>(
        '/auth/login',
        {
            method: 'POST',
            body: JSON.stringify({ email, password })
        }
    )

    // Set cookies
    if (data) {
        cookieStore.set('token', data.accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/'
        })

        cookieStore.set('refreshToken', data.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/'
        })

        // Store user data in a regular cookie
        cookieStore.set(
            'user',
            JSON.stringify({
                id: data.user.id,
                name: data.user.name,
                email: data.user.email,
                role: data.user.role,
                isVerified: data.user.isVerified
            }),
            {
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                path: '/'
            }
        )
    }

    return {
        data,
        error
    }
}

export async function signUp(name: string, email: string, password: string) {
    const cookieStore = await cookies()

    const { data, error } = await fetcher<ApiResponse<LoginResponse>>(
        '/auth/sign-up',
        {
            method: 'POST',
            body: JSON.stringify({ name, email, password })
        }
    )

    // Set cookies
    if (data) {
        cookieStore.set('token', data.accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/'
        })

        cookieStore.set('refreshToken', data.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/'
        })

        // Store user data in a regular cookie
        cookieStore.set(
            'user',
            JSON.stringify({
                id: data.user.id,
                name: data.user.name,
                email: data.user.email,
                role: data.user.role,
                isVerified: data.user.isVerified
            }),
            {
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                path: '/'
            }
        )
    }

    return {
        data,
        error
    }
}

export async function logout() {
    // TODO: Review
    try {
        // await fetcher('/auth/logout', { method: 'POST' })
        const cookieStore = await cookies()
        cookieStore.delete('token')
        cookieStore.delete('refreshToken')
        cookieStore.delete('user')

        return { success: true }
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Logout failed'
        }
    }
}

export async function refreshAccessToken() {
    const cookieStore = await cookies()
    const refreshToken = cookieStore.get('refreshToken')?.value

    if (!refreshToken) {
        return {
            error: { message: 'No refresh token found', status: 401 }
        }
    }

    const { data: tokens, error } = await fetcher<
        ApiResponse<RefreshTokenResponse>
    >('/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({
            refreshToken
        })
    })

    if (tokens) {
        // Update tokens in cookies
        cookieStore.set('token', tokens.accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/'
        })

        cookieStore.set('refreshToken', tokens.refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/'
        })
    }

    return {
        data: tokens,
        error
    }
}
