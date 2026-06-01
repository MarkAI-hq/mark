'use server'

import { revalidatePath } from 'next/cache'
import { fetcher } from '@/lib/fetch'
import type { StudyPlan } from '@/lib/actions/student-dashboard'

// ── Student-facing actions ─────────────────────────────────────────────────

export async function getMyStudyPlans(status?: string) {
  const params = status ? `?status=${status}` : ''
  return fetcher<StudyPlan[]>(`/study-plans/my${params}`)
}

export async function getStudyPlan(planId: string) {
  return fetcher<StudyPlan>(`/study-plans/${planId}`)
}

export async function markStudyPlanComplete(planId: string, scoreAfter?: number) {
  const body: Record<string, unknown> = {}
  if (scoreAfter !== undefined) body.score_after = scoreAfter

  const res = await fetcher<StudyPlan>(`/study-plans/${planId}/complete`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
  if (!res.error) {
    revalidatePath('/student/study-plans')
    revalidatePath('/student/dashboard')
  }
  return res
}

// ── Teacher / Admin actions ────────────────────────────────────────────────

export async function dispatchStudyPlans(classId: string, studentId?: string) {
  return fetcher<{ queued: boolean; type: string; class_id?: string; student_id?: string }>(
    '/study-plans/dispatch',
    {
      method: 'POST',
      body: JSON.stringify({ class_id: classId, ...(studentId ? { student_id: studentId } : {}) }),
    },
  )
}

export async function getClassStudyPlanSummary(classId: string) {
  return fetcher<{
    students: {
      student_id: string
      name: string
      pending_count: number
      completed_count: number
      total_plans: number
      last_dispatched: string | null
    }[]
  }>(`/study-plans/class/${classId}/summary`)
}

export async function getStudentStudyPlansTeacher(studentId: string, status?: string) {
  const params = status ? `?status=${status}` : ''
  return fetcher<StudyPlan[]>(`/study-plans/student/${studentId}${params}`)
}
