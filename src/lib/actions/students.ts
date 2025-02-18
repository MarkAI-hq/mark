'use server'

import { revalidatePath } from 'next/cache'

import { fetcher } from '@/lib/fetch'
import { ApiResponse, Student } from '@/lib/types'

export async function getStudents() {
	return await fetcher<ApiResponse<Student[]>>('/students', {
		cache: 'no-store'
	})
}

export async function getStudent(id: string) {
	return await fetcher<ApiResponse<Student>>(`/students/${id}`, {
		cache: 'no-store'
	})
}

export async function createStudent(data: {
	name: string
	class: string
	stream?: string
}) {
	const result = await fetcher<ApiResponse<Student>>('/students', {
		method: 'POST',
		body: JSON.stringify(data)
	})

	revalidatePath('/dashboard/students')
	return result
}

export async function updateStudent(
	id: string,
	data: {
		name?: string
		class?: string
		stream?: string
	}
) {
	const result = await fetcher<ApiResponse<Student>>(`/students/${id}`, {
		method: 'PATCH',
		body: JSON.stringify(data)
	})

	revalidatePath('/dashboard/students')
	return result
}

export async function deleteStudent(id: string) {
	const result = await fetcher<ApiResponse<{ message: string }>>(`/students/${id}`, {
		method: 'DELETE'
	})

	revalidatePath('/dashboard/students')
	return result
}