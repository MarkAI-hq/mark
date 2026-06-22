'use server'

// src/lib/actions/student-onboarding.ts
// Marketplace student onboarding: diagnostic generate + submit.

import { fetcher } from '@/lib/fetch'
import type { ServerActionResponse } from '@/lib/types'

export interface DiagnosticQuestion {
  topic: string
  question: string
  options: string[]
}

export interface DiagnosticSubject {
  assessment_id: string
  subject: string
  questions: DiagnosticQuestion[]
}

export interface StartDiagnosticResult {
  diagnostics: DiagnosticSubject[]
}

export interface SubmitDiagnosticPayload {
  results: { assessment_id: string; answers: number[] }[]
}

export interface DiagnosticSubjectResult {
  subject: string
  correct: number
  total: number
  score_pct: number
  weak_topics: string[]
  starting_week: number
}

export interface SubmitDiagnosticResult {
  baseline_pct: number
  subjects: DiagnosticSubjectResult[]
  plan_status: string
}

// ── Onboarding: classes / subjects / demo (public) + request (authenticated) ──

export interface SelfEnrollClass {
  class_id: string
  name: string
  grade_level: string | null
}

export interface CatalogSubjectView {
  key: string
  label: string
}

export interface SelfEnrollSubjects {
  compulsory: CatalogSubjectView[]
  electives: CatalogSubjectView[]
  comingSoon: CatalogSubjectView[]
  electiveMin: number
  electiveMax: number
  joinNotice: string
}

export interface DemoLesson {
  subject: string
  topic: string
  level: string | null
  content: {
    lesson_type: string
    topic: string
    subject: string
    introduction: string
    explanation: string
    worked_example: string
    practice_questions: { question: string; answer: string }[]
    summary: string
    estimated_minutes: number
    scenes?: unknown[]
  }
}

export async function getSelfEnrollClasses(
  schoolCode: string,
  level?: string,
): Promise<ServerActionResponse<{ classes: SelfEnrollClass[] }>> {
  const qs = new URLSearchParams({ school_code: schoolCode })
  if (level) qs.set('level', level)
  return fetcher(`/students/self-enroll/classes?${qs.toString()}`, {
    cache: 'no-store',
  })
}

export async function getSelfEnrollSubjects(
  schoolCode: string,
  level?: string,
): Promise<ServerActionResponse<SelfEnrollSubjects>> {
  const qs = new URLSearchParams({ school_code: schoolCode })
  if (level) qs.set('level', level)
  return fetcher(`/students/self-enroll/subjects?${qs.toString()}`, {
    cache: 'no-store',
  })
}

export async function generateDemoLesson(
  schoolCode: string,
  level?: string,
  subject?: string,
): Promise<ServerActionResponse<DemoLesson>> {
  return fetcher<DemoLesson>('/study-plans/demo-lesson', {
    method: 'POST',
    body: JSON.stringify({ school_code: schoolCode, level, subject }),
    cache: 'no-store',
  })
}

export async function submitEnrollmentRequest(payload: {
  requested_class_id?: string
  elective_subjects?: string[]
}): Promise<
  ServerActionResponse<{
    enrollment_status: string
    requested_class_id: string | null
  }>
> {
  return fetcher('/students/me/enrollment-request', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function startDiagnostic(): Promise<
  ServerActionResponse<StartDiagnosticResult>
> {
  return fetcher<StartDiagnosticResult>('/onboarding/diagnostic/start', {
    method: 'POST',
    cache: 'no-store',
  })
}

export async function submitDiagnostic(
  payload: SubmitDiagnosticPayload,
): Promise<ServerActionResponse<SubmitDiagnosticResult>> {
  return fetcher<SubmitDiagnosticResult>('/onboarding/diagnostic/submit', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}
