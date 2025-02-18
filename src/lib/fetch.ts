import { cookies } from 'next/headers'

export async function fetcher<T>(url: string, init?: RequestInit): Promise<T> {
	const token = (await cookies()).get('token')?.value
	const isFormData = init?.body instanceof FormData

	const headers: HeadersInit = {
		// Only set Content-Type for non-FormData requests
		...(!isFormData && { 'Content-Type': 'application/json' }),
		...(token && { Authorization: `Bearer ${token}` }),
		...init?.headers
	}

	try {
		const response = await fetch(process.env.NEXT_PUBLIC_API_URL + url, {
			...init,
			headers
		})

		const data = await response.json()

		if (!response.ok) {
			return {
				error: {
					message: Array.isArray(data.message)
						? data.message[0]
						: data.message || data.error || 'An error occurred',
					status: response.status
				}
			} as T
		}

		// NestJS typically returns { data: T } or { data: T, message: string }
		return { data: data.data || data } as T
	} catch (err: unknown) {
		let status = 500
		if (err && typeof err === 'object' && 'status' in err) {
			status = (err as { status: number }).status
		}
		return {
			error: {
				message: err instanceof Error ? err.message : 'Failed to fetch data',
				status
			}
		} as T
	}
}
