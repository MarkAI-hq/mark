import type { ServerActionResponse } from './types'

/**
 * Raw response shape from NestJS backend
 */
interface BackendResponse<T> {
  data?:    T
  message?: string | string[]
  error?:   string
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
 *
 * FIX: cookies is imported dynamically so this file does NOT become
 * server-only at the module level. Client components can import it safely.
 */
export async function fetcher<T>(
  endpoint: string,
  init?: RequestInit,
): Promise<ServerActionResponse<T>> {
  const baseUrl = getApiBaseUrl()
  const url     = `${baseUrl}${endpoint}`

  const isFormData = init?.body instanceof FormData

  let token: string | undefined

  // Dynamically import cookies only on the server — avoids the
  // "next/headers cannot be used in Client Components" build error
  if (typeof window === 'undefined') {
    const { cookies } = await import('next/headers')
    token = (await cookies()).get('token')?.value
  }

  const headers: HeadersInit = {
    ...(!isFormData && { 'Content-Type': 'application/json' }),
    ...(token && { Authorization: `Bearer ${token}` }),
    ...init?.headers,
  }

  try {
    const response = await fetch(url, { ...init, headers })

    const text = await response.text()
    let parsed: BackendResponse<T> = {}

    if (text) {
      try {
        parsed = JSON.parse(text)
      } catch {
        return {
          data:  null,
          error: { message: 'Invalid JSON response from API', status: response.status },
        }
      }
    }

    if (!response.ok) {
      const raw = Array.isArray(parsed.message)
        ? parsed.message[0]
        : parsed.message || parsed.error || 'An unknown API error occurred'

      // Never expose infrastructure details (OpenRouter, DB errors, etc.) for 5xx
      const message = response.status >= 500
        ? 'Something went wrong on our end. Please try again.'
        : raw

      return { data: null, error: { message, status: response.status } }
    }

    // Backend may return { data }, a raw object, OR an empty body (e.g. a
    // handler that returns null → NestJS sends no body). Treat an empty body
    // as null rather than falling through to the `{}` default, which would
    // surface as a truthy object to callers.
    const data = parsed.data !== undefined
      ? parsed.data
      : text
        ? (parsed as unknown as T)
        : (null as unknown as T)

    return { data, error: null }
  } catch (err) {
    return {
      data:  null,
      error: {
        message: err instanceof Error ? err.message : 'Failed to connect to the API',
        status:  500,
      },
    }
  }
}