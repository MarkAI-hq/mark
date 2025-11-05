'use server'

import { revalidatePath } from 'next/cache'

// FIXED: Import the correct ServerActionResponse type and other necessary types.
import {
  ServerActionResponse,
  Exam,
  ExamStats,
  StudentResult,
  QuestionStat,
} from '@/lib/types'
import { fetcher } from '../fetch'

// NOTE: All functions now return the standardized ServerActionResponse<T> type.

export async function createExam(
  data: FormData,
): Promise<ServerActionResponse<Exam>> {
  const result = await fetcher<Exam>('/exams', {
    method: 'POST',
    body: data,
  })

  revalidatePath('/dashboard/exams')
  return result
}

export async function getExams(): Promise<ServerActionResponse<Exam[]>> {
  return await fetcher<Exam[]>('/exams')
}

export async function getExam(id: string): Promise<ServerActionResponse<Exam>> {
  return await fetcher<Exam>(`/exams/${id}`)
}

export async function updateExam(
  id: string,
  data: FormData,
): Promise<ServerActionResponse<Exam>> {
  const result = await fetcher<Exam>(`/exams/${id}`, {
    method: 'PATCH',
    body: data,
  })

  revalidatePath('/dashboard/exams')
  return result
}

export async function deleteExam(
  id: string,
): Promise<ServerActionResponse<{ message: string }>> {
  const result = await fetcher<{ message: string }>(`/exams/${id}`, {
    method: 'DELETE',
  })
  revalidatePath('/dashboard/exams')
  return result
}

export async function uploadAnswers(
  examId: string,
  data: FormData,
): Promise<ServerActionResponse<void>> {
  const result = await fetcher<void>(`/exams/${examId}/answers`, {
    method: 'POST',
    body: data,
  })

  revalidatePath('/dashboard/exams')
  return result
}

export async function uploadBatchAnswers(
  examId: string,
  data: FormData,
): Promise<ServerActionResponse<void>> {
  const result = await fetcher<void>(`/exams/${examId}/answers/batch`, {
    method: 'POST',
    body: data,
  })

  revalidatePath('/dashboard/exams')
  return result
}

export async function getExamStats(
  examId: string,
): Promise<ServerActionResponse<ExamStats>> {
  return await fetcher<ExamStats>(`/exams/${examId}/stats`)
}

export async function getStudentResults(
  examId: string,
): Promise<ServerActionResponse<StudentResult[]>> {
  return await fetcher<StudentResult[]>(`/exams/${examId}/results`)
}

export async function getQuestionStats(
  examId: string,
): Promise<ServerActionResponse<QuestionStat[]>> {
  return await fetcher<QuestionStat[]>(`/exams/${examId}/questions/stats`)
}
