'use server'

import { cookies } from 'next/headers'

import { fetcher } from '../fetch'
import { ApiResponse, LoginResponse, RefreshTokenResponse, VerifyEmailSuccessPayload} from '../types'


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

export async function signUp(name: string, email: string, password: string, phone: string, photo?: File) {
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

    const { data, error } = await fetcher<ApiResponse<LoginResponse>>(
        '/auth/register',
        {
            method: 'POST',
            body: formData,
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

        // Set a cookie to indicate it's the first login
        cookieStore.set('isFirstLogin', 'true', {
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24, // 1 day
        });
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
        body: JSON.stringify({
            refreshToken
        }),
        headers: { // Explicitly set Content-Type for JSON body
            'Content-Type': 'application/json',
        },
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
): Promise<{ data?: ApiResponse<VerifyEmailSuccessPayload>; error?: { message: string; status?: number } }> {
    try {
        const { data, error } = await fetcher<ApiResponse<VerifyEmailSuccessPayload>>(
            '/auth/verify-email', 
            {
                method: 'POST', 
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ token }), // Send the token in the request body
            }
        );

        // Return the data or error received from the fetcher
        return { data, error };

    } catch (err: unknown) { // Use unknown for caught errors
        let errorMessage = 'An unexpected error occurred during email verification.';
        let errorStatus: number | undefined = 500; 

        if (err instanceof Error) {
            errorMessage = err.message;
        } else if (typeof err === 'object' && err !== null && 'message' in err) {
            // Attempt to extract message and status from a generic object error
            errorMessage = (err as { message: string }).message;
            if ('status' in (err as { status?: number })) { // Check for status if present
                errorStatus = (err as { status?: number }).status;
            }
        }

        return {
            error: {
                message: errorMessage,
                status: errorStatus,
            },
        };
    }
}

export async function fetchNewTokens(refreshToken: string) {
  const { data, error } = await fetcher<ApiResponse<RefreshTokenResponse>>(
    '/auth/refresh',
    {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
      headers: { 'Content-Type': 'application/json' },
    }
  );

  if (error) return { error };
  return { tokens: data };
}


