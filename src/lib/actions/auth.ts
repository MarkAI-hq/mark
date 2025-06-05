'use server'

import { cookies } from 'next/headers'

import { fetcher } from '../fetch'
import { ApiResponse, LoginResponse, RefreshTokenResponse, RegisterResponse } from '../types'


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

export async function signUp({ name, email, password, phone, photo }: { name: string, email: string, password: string, phone: string, photo?: File }) {
    const cookieStore = await cookies()

    const formData = new FormData();
    formData.append('name', name);
    formData.append('email', email);
    formData.append('password', password);
    formData.append('phone', phone);

    // Only append the photo if it exists (i.e., not undefined)
    if (photo) {
        formData.append('photo', photo);
    }

    const { data, error } = await fetcher<ApiResponse<RegisterResponse>>(
        '/auth/register',
        {
            method: 'POST',
            body: formData,
        }
    )

    // Set user cookie
    if (data) {
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
        body: JSON.stringify({ refreshToken }),
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

/**
 * Sends the verification token to the backend to verify the user's email.
 * This is a server action, called from the client-side verification page.
 * @param token The verification token extracted from the URL query parameters.
 */
export async function verifyEmail(
    token: string
) {
    const { data, error } = await fetcher<ApiResponse<{ message: string; }>>(
        '/auth/verify-email',
        {
            method: 'POST',
            body: JSON.stringify({ token }),
        }
    );

    return { data, error };
}



