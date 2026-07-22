'use server'

import { fetcher } from '@/lib/fetch'
import type { ServerActionResponse } from '@/lib/types'

export interface LearningHistorySubmission {
  submission_id: string
  subject: string
  title: string
  total_score: number | null
  max_score: number | null
  graded_at: string | null
  submitted_at: string | null
}

export interface LearningHistoryMastery {
  id: string
  subject: string
  topic: string
  achieved_count: number
  attempted_count: number
  last_attempted_at: string | null
}

export interface LearningHistoryResult {
  submissions: LearningHistorySubmission[]
  mastery: LearningHistoryMastery[]
}

export async function getLearningHistory(filters: {
  subject?: string
  topic?: string
  q?: string
}): Promise<ServerActionResponse<LearningHistoryResult>> {
  const qs = new URLSearchParams()
  if (filters.subject) qs.set('subject', filters.subject)
  if (filters.topic) qs.set('topic', filters.topic)
  if (filters.q) qs.set('q', filters.q)
  const suffix = qs.toString() ? `?${qs.toString()}` : ''
  return fetcher<LearningHistoryResult>(`/students/me/learning-history${suffix}`, {
    cache: 'no-store',
  })
}
