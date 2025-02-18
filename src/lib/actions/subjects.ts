'use server'

import { revalidatePath } from 'next/cache'

import { fetcher } from '@/lib/fetch'
import { ApiResponse, Subject } from '@/lib/types'

export async function createSubject(data: {
	code: string
	title: string
	description?: string
}) {
	const result = await fetcher<ApiResponse<Subject>>('/courses', {
		method: 'POST',
		body: JSON.stringify(data)
	})

	revalidatePath('/dashboard/subjects')
	return result
}

export async function getSubjects() {
	return await fetcher<ApiResponse<Subject[]>>('/courses', {
		cache: 'no-store'
	})
}

export async function getSubject(id: string) {
	return await fetcher<ApiResponse<Subject>>(`/courses/${id}`, {
		cache: 'no-store'
	})
}

export async function updateSubject(id: string, data: Partial<Subject>) {
	const result = await fetcher<ApiResponse<Subject>>(`/courses/${id}`, {
		method: 'PATCH',
		body: JSON.stringify(data)
	})

	revalidatePath('/dashboard/subjects')
	return result
}

export async function deleteSubject(id: string) {
	const result = await fetcher<ApiResponse<{ message: string }>>(
		`/courses/${id}`,
		{
			method: 'DELETE'
		}
	)

	revalidatePath('/dashboard/subjects')
	return result
}
