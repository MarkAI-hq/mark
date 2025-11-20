import { cookies } from 'next/headers';
import type { ServerActionResponse } from './types';

// This is the raw response shape from your NestJS backend
interface BackendResponse<T> {
  data?: T;
  message?: string | string[];
  error?: string;
}

export async function fetcher<T>(
  url: string,
  init?: RequestInit,
): Promise<ServerActionResponse<T>> {
  const token = (await cookies()).get('token')?.value;
  const isFormData = init?.body instanceof FormData;

  const headers: HeadersInit = {
    ...(!isFormData && { 'Content-Type': 'application/json' }),
    ...(token && { Authorization: `Bearer ${token}` }),
    ...init?.headers,
  };

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}${url}`,
      {
        ...init,
        headers,
      },
    );

    const text = await response.text();
    let data: BackendResponse<T> = {};

    if (text) {
      try {
        data = JSON.parse(text) as BackendResponse<T>;
      } catch {
        return {
          data: null,
          error: {
            message: 'Invalid JSON response from API',
            status: response.status,
          },
        };
      }
    }

    if (!response.ok) {
      const errorMessage =
        Array.isArray(data.message)
          ? data.message[0]
          : data.message || data.error || 'An unknown API error occurred';

      return {
        data: null,
        error: {
          message: errorMessage,
          status: response.status,
        },
      };
    }

    // Safely unwrap the data: if backend sends { data: {...} } or just {...}
    const unwrapped: T | null =
      data.data && typeof data.data === 'object' ? data.data : (data as unknown as T);

    return { data: unwrapped, error: null };
  } catch (err: unknown) {
    return {
      data: null,
      error: {
        message:
          err instanceof Error ? err.message : 'Failed to connect to the API',
        status: 500,
      },
    };
  }
}
