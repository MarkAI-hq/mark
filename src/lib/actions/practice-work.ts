'use server'

import { cookies } from 'next/headers'

const API = process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'

export interface WorkGradeResult {
  is_relevant: boolean
  transcription: string
  score: number
  max_score: number
  correct: boolean
  steps: { step: string; ok: boolean; note: string }[]
  first_error_step: number | null
  misconception: string | null
  feedback: string
  authenticity: { looks_like_own_work: boolean; signals: string[] }
  saved?: { recorded: boolean; mastered?: boolean } | null
}

/**
 * Send a photo/PDF of the student's worked solution to the grading engine.
 * `form` carries: file, question, answer_key, marking_points (JSON), marks,
 * subject, topic, outcome_id.
 */
export async function submitPracticeWork(
  form: FormData,
): Promise<{ data: WorkGradeResult | null; error: { message: string } | null }> {
  try {
    const token = (await cookies()).get('token')?.value
    const res = await fetch(`${API}/api/v1/study-plans/practice-work`, {
      method: 'POST',
      // No Content-Type: fetch sets the multipart boundary itself.
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
      cache: 'no-store',
    })
    const body = await res.json().catch(() => null)
    if (!res.ok) {
      return { data: null, error: { message: body?.message ?? "We couldn't mark that upload. Try again." } }
    }
    return { data: (body?.data ?? body) as WorkGradeResult, error: null }
  } catch (err: any) {
    return { data: null, error: { message: err?.message ?? "We couldn't mark that upload. Try again." } }
  }
}
