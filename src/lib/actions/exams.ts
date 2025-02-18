'use server'

import { revalidatePath } from 'next/cache'

import {
	ApiResponse,
	Exam,
	ExamStats,
	StudentResult,
	QuestionStat
} from '@/lib/types'
import { fetcher } from '../fetch'

export async function createExam(data: FormData) {
	const result = await fetcher<ApiResponse<Exam>>('/exams', {
		method: 'POST',
		body: data
	})

	revalidatePath('/dashboard/exams')
	return result
}

export async function getExams() {
	return await fetcher<ApiResponse<Exam[]>>('/exams')
}

export async function getExam(id: string) {
	return await fetcher<ApiResponse<Exam>>(`/exams/${id}`)
}

export async function updateExam(id: string, data: FormData) {
	const result = await fetcher<ApiResponse<Exam>>(`/exams/${id}`, {
		method: 'PATCH',
		body: data
	})

	revalidatePath('/dashboard/exams')
	return result
}

export async function deleteExam(id: string) {
	const result = await fetcher<ApiResponse<{ message: string }>>(
		`/exams/${id}`,
		{
			method: 'DELETE'
		}
	)
	revalidatePath('/dashboard/exams')
	return result
}

export async function uploadAnswers(examId: string, data: FormData) {
	const result = await fetcher<ApiResponse<void>>(`/exams/${examId}/answers`, {
		method: 'POST',
		body: data
	})

	revalidatePath('/dashboard/exams')
	return result
}

export async function uploadBatchAnswers(examId: string, data: FormData) {
	const result = await fetcher<ApiResponse<void>>(
		`/exams/${examId}/answers/batch`,
		{
			method: 'POST',
			body: data
		}
	)

	revalidatePath('/dashboard/exams')
	return result
}

export async function getExamStats(examId: string) {
	return await fetcher<ApiResponse<ExamStats>>(`/exams/${examId}/stats`)
}

export async function getStudentResults(examId: string) {
	return await fetcher<ApiResponse<StudentResult[]>>(`/exams/${examId}/results`)
}

export async function getQuestionStats(examId: string) {
	return await fetcher<ApiResponse<QuestionStat[]>>(
		`/exams/${examId}/questions/stats`
	)
}
