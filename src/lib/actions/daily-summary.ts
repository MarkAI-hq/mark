'use server'

import { fetcher } from '@/lib/fetch'
import type { ServerActionResponse } from '@/lib/types'

export interface DailySummary {
  date: string
  first_name: string
  minutes: number
  target_minutes: number | null
  lessons: { topic: string; subject: string; score: number | null }[]
  points_mastered: string[]
  coach_notes: { note: string; author: string }[]
  studied: boolean
}

export interface CoachNote {
  id: string
  note: string
  note_date: string
  author_first: string | null
  author_last: string | null
  created_at: string
}

/** Guardian: today's summary for one of their children. */
export async function getChildToday(studentId: string): Promise<ServerActionResponse<DailySummary>> {
  return fetcher<DailySummary>(`/guardian/children/${studentId}/today`, { cache: 'no-store' })
}

/** Teacher/admin: the same summary the guardian will see. */
export async function getStudentToday(studentId: string): Promise<ServerActionResponse<DailySummary>> {
  return fetcher<DailySummary>(`/coach-notes/students/${studentId}/today`, { cache: 'no-store' })
}

export async function getCoachNotes(studentId: string): Promise<ServerActionResponse<CoachNote[]>> {
  return fetcher<CoachNote[]>(`/coach-notes/students/${studentId}`, { cache: 'no-store' })
}

export async function addCoachNote(studentId: string, note: string): Promise<ServerActionResponse<CoachNote>> {
  return fetcher<CoachNote>(`/coach-notes/students/${studentId}`, {
    method: 'POST',
    body: JSON.stringify({ note }),
    cache: 'no-store',
  })
}
