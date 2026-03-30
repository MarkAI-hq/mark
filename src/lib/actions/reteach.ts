'use server'

// src/lib/actions/reteach.ts

import { fetcher } from '@/lib/fetch'
import type { ServerActionResponse } from '@/lib/types'

export interface ReteachQuestion {
  question:        string
  expected_answer: string
  bloom_level:     string
}

export interface ReteachMisconception {
  misconception: string
  correction:    string
}

export interface ReteachSession {
  title:               string
  duration_minutes:    number
  target_error:        string
  target_bloom_level:  string
  scope:               'individual' | 'class' | 'longitudinal'
  scripted_explanation: {
    opening:        string
    core_concept:   string
    worked_example: string
  }
  example_questions:       ReteachQuestion[]
  practice_questions:      ReteachQuestion[]
  expected_misconceptions: ReteachMisconception[]
  cognitive_tip?:          string
  success_criteria:        string
}

export async function generateSubmissionReteach(
  submissionId: string,
): Promise<ServerActionResponse<ReteachSession>> {
  try {
    const response = await fetcher<ReteachSession>(
      `/reteach/submission/${submissionId}`,
      { method: 'POST', cache: 'no-store' },
    )
    if (response.error) throw new Error(response.error.message)
    return { data: response.data ?? null, error: null }
  } catch (err) {
    return {
      data:  null,
      error: { message: err instanceof Error ? err.message : 'Failed to generate reteach session.' },
    }
  }
}

export async function generateAssessmentReteach(
  assessmentId: string,
  errorTypeId?: string,
  classId?:     string,
): Promise<ServerActionResponse<ReteachSession>> {
  try {
    const queryParams = new URLSearchParams({
      ...(errorTypeId ? { errorTypeId } : {}),
      ...(classId     ? { classId }     : {}),
    })
    const url = queryParams.toString()
      ? `/reteach/assessment/${assessmentId}?${queryParams.toString()}`
      : `/reteach/assessment/${assessmentId}`

    const response = await fetcher<ReteachSession>(url, { method: 'POST', cache: 'no-store' })
    if (response.error) throw new Error(response.error.message)
    return { data: response.data ?? null, error: null }
  } catch (err) {
    return {
      data:  null,
      error: { message: err instanceof Error ? err.message : 'Failed to generate class reteach session.' },
    }
  }
}

export async function generateStudentReteach(
  studentId: string,
): Promise<ServerActionResponse<ReteachSession>> {
  try {
    const response = await fetcher<ReteachSession>(
      `/reteach/student/${studentId}`,
      { method: 'POST', cache: 'no-store' },
    )
    if (response.error) throw new Error(response.error.message)
    return { data: response.data ?? null, error: null }
  } catch (err) {
    return {
      data:  null,
      error: { message: err instanceof Error ? err.message : 'Failed to generate student reteach session.' },
    }
  }
}

export async function generateGroupReteach(params: {
  studentIds:    string[]
  errorType:     string
  domain:        string
  classId:       string
  assessmentId?: string
}): Promise<ServerActionResponse<ReteachSession>> {
  try {
    const response = await fetcher<ReteachSession>(
      '/reteach/group',
      { method: 'POST', cache: 'no-store', body: JSON.stringify(params) },
    )
    if (response.error) throw new Error(response.error.message)
    return { data: response.data ?? null, error: null }
  } catch (err) {
    return {
      data:  null,
      error: { message: err instanceof Error ? err.message : 'Failed to generate group session.' },
    }
  }
}