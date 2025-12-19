import { cookies } from 'next/headers'
import type { ServerActionResponse } from './types'

/**
 * Raw response shape from NestJS backend
 */
interface BackendResponse<T> {
  data?: T
  message?: string | string[]
  error?: string
}

/**
 * Central API configuration
 * Change version ONCE here
 */
const API_VERSION = 'v1'

function getApiBaseUrl(): string {
  // Server (Server Actions, Route Handlers)
  if (typeof window === 'undefined') {
    const base = process.env.API_BASE_URL
    if (!base) {
      throw new Error(
        'API_BASE_URL is not defined. Server actions cannot call the backend.',
      )
    }
    return `${base}/api/${API_VERSION}`
  }

  // Client (Browser)
  const base = process.env.NEXT_PUBLIC_API_URL
  if (!base) {
    throw new Error(
      'NEXT_PUBLIC_API_URL is not defined. Client cannot call the backend.',
    )
  }
  return `${base}/api/${API_VERSION}`
}

/**
 * Unified fetcher (server + client safe)
 */
export async function fetcher<T>(
  endpoint: string,
  init?: RequestInit,
): Promise<ServerActionResponse<T>> {
  const baseUrl = getApiBaseUrl()
  const url = `${baseUrl}${endpoint}`

  const isFormData = init?.body instanceof FormData

  let token: string | undefined

  // Cookies only exist on the server
  if (typeof window === 'undefined') {
    token = (await cookies()).get('token')?.value
  }

  const headers: HeadersInit = {
    ...(!isFormData && { 'Content-Type': 'application/json' }),
    ...(token && { Authorization: `Bearer ${token}` }),
    ...init?.headers,
  }

  try {
    const response = await fetch(url, {
      ...init,
      headers,
    })

    const text = await response.text()
    let parsed: BackendResponse<T> = {}

    if (text) {
      try {
        parsed = JSON.parse(text)
      } catch {
        return {
          data: null,
          error: {
            message: 'Invalid JSON response from API',
            status: response.status,
          },
        }
      }
    }

    if (!response.ok) {
      const message =
        Array.isArray(parsed.message)
          ? parsed.message[0]
          : parsed.message || parsed.error || 'An unknown API error occurred'

      return {
        data: null,
        error: {
          message,
          status: response.status,
        },
      }
    }

    // Backend may return { data } OR raw object
    const data =
      parsed.data !== undefined
        ? parsed.data
        : (parsed as unknown as T)

    return { data, error: null }
  } catch (err) {
    return {
      data: null,
      error: {
        message:
          err instanceof Error
            ? err.message
            : 'Failed to connect to the API',
        status: 500,
      },
    }
  }
}
