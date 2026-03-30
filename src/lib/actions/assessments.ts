'use server'

import { revalidatePath } from 'next/cache'
import { fetcher } from '@/lib/fetch'
import type { ServerActionResponse } from '@/lib/types'

export interface Assessment {
  assessment_id:      string
  title:              string
  description:        string | null
  subject:            string
  is_published:       boolean
  assessment_type:    'MANUAL' | 'AI_ASSISTED_GRADING'
  structure_type:     'DATABASE' | 'MARKING_SCHEME_PDF' | null
  marking_scheme_url: string | null
  created_by:         string
  createdAt:          string
  updatedAt:          string
  classId:            string | null
  className:          string | null
  id:                 string
  curriculum_id?:     string | null
  audit_status?:      'not_audited' | 'passed' | 'flagged' | 'overridden'
}

function handleMutationResponse<T>(response: ServerActionResponse<T>): T {
  if (response.error) throw new Error(response.error.message)
  if (response.data === null || response.data === undefined)
    throw new Error('API returned success but no data was received.')
  return response.data
}

export async function getAssessment(id: string): Promise<ServerActionResponse<Assessment>> {
  return fetcher<Assessment>(`/assessments/${id}`, { cache: 'no-store' })
}

export async function getAssessments(): Promise<ServerActionResponse<Assessment[]>> {
  return fetcher<Assessment[]>('/assessments', { cache: 'no-store' })
}

export async function getClassAssessments(classId: string): Promise<ServerActionResponse<Assessment[]>> {
  return fetcher<Assessment[]>(`/classes/${classId}/assessments`, { cache: 'no-store' })
}

export async function createAssessment(formData: FormData): Promise<ServerActionResponse<Assessment>> {
  try {
    // The backend endpoint is /assessments/unstructured for PDF-based assessments
    const response  = await fetcher<Assessment>('/assessments/unstructured', { method: 'POST', body: formData })
    const newItem   = handleMutationResponse(response)
    revalidatePath('/dashboard/exams')
    return { data: newItem, error: null }
  } catch (err) {
    return { data: null, error: { message: err instanceof Error ? err.message : 'Unknown error' } }
  }
}

export async function deleteAssessment(id: string): Promise<ServerActionResponse<{ message: string }>> {
  try {
    const response = await fetcher<{ message: string }>(`/assessments/${id}`, { method: 'DELETE' })
    const result   = handleMutationResponse(response)
    revalidatePath('/dashboard/exams')
    return { data: result, error: null }
  } catch (err) {
    return { data: null, error: { message: err instanceof Error ? err.message : 'Unknown error' } }
  }
}

export async function publishAssessment(id: string): Promise<ServerActionResponse<Assessment>> {
  try {
    const response  = await fetcher<Assessment>(`/assessments/${id}/publish`, { method: 'POST' })
    const published = handleMutationResponse(response)
    revalidatePath('/dashboard/exams')
    return { data: published, error: null }
  } catch (err) {
    return { data: null, error: { message: err instanceof Error ? err.message : 'Unknown error' } }
  }
}

export async function assignAssessmentToStudent({
  studentId, assessmentId, classId,
}: {
  studentId:    string
  assessmentId: string
  classId:      string
}): Promise<ServerActionResponse<{ message: string }>> {
  try {
    const response = await fetcher<{ message: string }>(
      `/assessments/${assessmentId}/assign`,
      { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ studentId, assessmentId, classId }) },
    )
    return { data: handleMutationResponse(response), error: null }
  } catch (err) {
    return { data: null, error: { message: err instanceof Error ? err.message : 'Unknown error' } }
  }
}