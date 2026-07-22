'use server'

import { fetcher } from '@/lib/fetch'
import type { ServerActionResponse } from '@/lib/types'

export interface PublicCompassQuestion {
  id: string
  section_id: string
  text: string
  order: number
  options: { a: string; b: string; c: string; d: string }
}

export interface PublicCompassSection {
  id: string
  assessment_id: string
  title: string
  description: string | null
  order: number
  questions: PublicCompassQuestion[]
}

export interface PublicCompassProfile {
  profile_id: string
  profile_name: string
  description: string | null
  focus: string | null
}

export interface PublicCompassTool {
  id: string
  name: string
  description: string
  how_to: string | null
}

export interface PublicCompassStructure {
  assessment: { id: string; title: string; sections: PublicCompassSection[] }
  profiles: PublicCompassProfile[]
  tools: PublicCompassTool[]
  profileToolLinks: { profile_id: string; tool_id: string }[]
}

export async function getPublicCompassStructure(): Promise<
  ServerActionResponse<PublicCompassStructure>
> {
  return fetcher<PublicCompassStructure>('/public/learning-compass/structure', {
    cache: 'no-store',
  })
}

export interface SubmitCompassPayload {
  answers: Record<string, 'a' | 'b' | 'c' | 'd'>
  full_name: string
  email?: string
  phone_number?: string
}

export interface SubmitCompassResult {
  lead_id: string
  profile: PublicCompassProfile | null
  tools: PublicCompassTool[]
  mental_energy_score: number
  learning_strategy_score: number
}

export async function submitPublicCompass(
  payload: SubmitCompassPayload,
): Promise<ServerActionResponse<SubmitCompassResult>> {
  return fetcher<SubmitCompassResult>('/public/learning-compass/submit', {
    method: 'POST',
    body: JSON.stringify(payload),
    cache: 'no-store',
  })
}

export interface CompassFeedbackPayload {
  wants_contact?: boolean
  contact_channel?: string
  experience_feedback?: {
    accuracy_rating: 'accurate' | 'somewhat' | 'not_really'
    biggest_challenge?: string
  }
}

export async function updateCompassFeedback(
  leadId: string,
  payload: CompassFeedbackPayload,
): Promise<ServerActionResponse<{ updated: boolean }>> {
  return fetcher(`/public/learning-compass/${leadId}/feedback`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
    cache: 'no-store',
  })
}

export async function resendCompassEmail(
  leadId: string,
): Promise<ServerActionResponse<{ sent: boolean }>> {
  return fetcher(`/public/learning-compass/${leadId}/resend-email`, {
    method: 'POST',
    cache: 'no-store',
  })
}

// ── Curriculum-grounded picker ──────────────────────────────────────────────

export interface AvailableCountry {
  school_code: string
  school_name: string
  country_code: string
}

export async function getAvailableCountries(): Promise<ServerActionResponse<AvailableCountry[]>> {
  return fetcher<AvailableCountry[]>('/public/subject-preview/countries', { cache: 'no-store' })
}

export async function getLevelsForSchool(
  schoolCode: string,
): Promise<ServerActionResponse<string[]>> {
  const qs = new URLSearchParams({ school_code: schoolCode })
  return fetcher<string[]>(`/public/subject-preview/levels?${qs.toString()}`, { cache: 'no-store' })
}

export interface CatalogSubjectOption {
  key: string
  label: string
}

export interface SubjectsForSchoolResult {
  compulsory: CatalogSubjectOption[]
  electives: CatalogSubjectOption[]
  comingSoon: CatalogSubjectOption[]
  electiveMin: number
  electiveMax: number
  joinNotice: string
}

export async function getSubjectsForSchool(
  schoolCode: string,
  level: string,
): Promise<ServerActionResponse<SubjectsForSchoolResult>> {
  const qs = new URLSearchParams({ school_code: schoolCode, level })
  return fetcher<SubjectsForSchoolResult>(`/public/subject-preview/subjects?${qs.toString()}`, {
    cache: 'no-store',
  })
}

export interface SubjectPreview {
  subject: string
  term_week_now: number
  total_weeks: number
  term_start_date: string | null
  explanation: string
  topics_covered: string[]
}

export async function getSubjectPreview(params: {
  subject: string
  school_code?: string
}): Promise<ServerActionResponse<SubjectPreview>> {
  const qs = new URLSearchParams()
  qs.set('subject', params.subject)
  if (params.school_code) qs.set('school_code', params.school_code)
  return fetcher<SubjectPreview>(`/public/subject-preview?${qs.toString()}`, {
    cache: 'no-store',
  })
}

export interface SubjectPreviewDiagnosticStart {
  assessment_id: string
  subject: string
  term_week_now: number
  total_weeks: number
  questions: { topic: string; question: string; options: string[] }[]
}

export async function startSubjectPreviewDiagnostic(params: {
  subject: string
  school_code?: string
}): Promise<ServerActionResponse<SubjectPreviewDiagnosticStart>> {
  const qs = new URLSearchParams()
  qs.set('subject', params.subject)
  if (params.school_code) qs.set('school_code', params.school_code)
  return fetcher<SubjectPreviewDiagnosticStart>(
    `/public/subject-preview/diagnostic/start?${qs.toString()}`,
    { method: 'POST', cache: 'no-store' },
  )
}

export interface SubjectPreviewDiagnosticResult {
  subject: string
  term_week_now: number
  topics_covered: string[]
  score_pct: number
  weak_topics: string[]
}

export async function submitSubjectPreviewDiagnostic(payload: {
  lead_id: string
  assessment_id: string
  answers: number[]
}): Promise<ServerActionResponse<SubjectPreviewDiagnosticResult>> {
  return fetcher<SubjectPreviewDiagnosticResult>(
    '/public/subject-preview/diagnostic/submit',
    { method: 'POST', body: JSON.stringify(payload), cache: 'no-store' },
  )
}
