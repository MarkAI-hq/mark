'use server'

import { revalidatePath } from 'next/cache'
import { fetcher } from '@/lib/fetch'

// ── Types ──────────────────────────────────────────────────────────────────

export interface SchemeOfWorkEntry {
  id: string
  scheme_id: string
  week_number: number
  topic: string
  subtopics: string[] | null
  learning_objectives: string[] | null
  curriculum_refs: string[] | null
  duration_lessons: number
  notes: string | null
  resources: Record<string, unknown> | null
  is_delivered: boolean
  actual_delivery_date: string | null
  planned_week_start: string | null
}

export interface AssignedClass {
  class_id: string
  name: string
  grade_level: string | null
}

export interface SchemeOfWork {
  id: string
  organization_id: string
  subject_id: string | null
  subject: string
  grade_level: string
  title: string
  academic_year: string
  term: string
  term_start_date: string
  total_weeks: number
  status: 'draft' | 'active' | 'archived'
  curriculum_id: string | null
  created_by: string
  createdAt: string
  updatedAt: string
  entries?: SchemeOfWorkEntry[]
  assignedClasses?: AssignedClass[]
}

// ── Queries ────────────────────────────────────────────────────────────────

export async function listSchemeOfWork(filters?: {
  grade_level?: string
  subject?: string
  status?: string
}) {
  const params = new URLSearchParams()
  if (filters?.grade_level) params.set('grade_level', filters.grade_level)
  if (filters?.subject)     params.set('subject',     filters.subject)
  if (filters?.status)      params.set('status',      filters.status)
  const qs = params.toString()
  return fetcher<SchemeOfWork[]>(`/scheme-of-work${qs ? `?${qs}` : ''}`)
}

export async function getSchemeOfWork(id: string) {
  return fetcher<SchemeOfWork>(`/scheme-of-work/${id}`)
}

export interface SowSummary extends SchemeOfWork {
  entries_total: number
  entries_delivered: number
}

export async function getAllSchemesForClass(classId: string) {
  return fetcher<SowSummary[]>(`/scheme-of-work/class/${classId}/all`)
}

export async function getActiveSchemeForClass(classId: string) {
  return fetcher<SchemeOfWork>(`/scheme-of-work/class/${classId}/active`)
}

// ── Mutations ──────────────────────────────────────────────────────────────

export async function createSchemeOfWork(data: {
  subject: string
  grade_level: string
  title: string
  academic_year: string
  term: string
  term_start_date: string
  total_weeks?: number
  subject_id?: string
  curriculum_id?: string
}) {
  const res = await fetcher<SchemeOfWork>('/scheme-of-work', {
    method: 'POST',
    body: JSON.stringify(data),
  })
  if (!res.error) revalidatePath('/dashboard/teacher/classes')
  return res
}

export async function generateSchemeOfWork(data: {
  curriculum_id: string
  grade_level: string
  term: string
  academic_year: string
  term_start_date: string
  total_weeks?: number
  subject?: string
  subject_id?: string
}) {
  const res = await fetcher<SchemeOfWork>('/scheme-of-work/generate', {
    method: 'POST',
    body: JSON.stringify(data),
  })
  if (!res.error) revalidatePath('/dashboard/teacher/classes')
  return res
}

export async function generateSchemeFromNotes(data: {
  subject: string
  grade_level: string
  term: string
  academic_year: string
  term_start_date: string
  notes: string
  total_weeks?: number
  subject_id?: string
}) {
  const res = await fetcher<SchemeOfWork>('/scheme-of-work/from-notes', {
    method: 'POST',
    body: JSON.stringify(data),
  })
  if (!res.error) revalidatePath('/dashboard/teacher/classes')
  return res
}

export async function importSchemeFromCsv(data: {
  subject: string
  grade_level: string
  term: string
  academic_year: string
  term_start_date: string
  csv: string
  total_weeks?: number
  subject_id?: string
}) {
  const res = await fetcher<SchemeOfWork>('/scheme-of-work/from-csv', {
    method: 'POST',
    body: JSON.stringify(data),
  })
  if (!res.error) revalidatePath('/dashboard/teacher/classes')
  return res
}

export async function importSchemeFromPdf(formData: FormData) {
  const res = await fetcher<SchemeOfWork>('/scheme-of-work/from-pdf', {
    method: 'POST',
    body: formData,
  })
  if (!res.error) revalidatePath('/dashboard/teacher/classes')
  return res
}

export async function updateSchemeOfWork(
  id: string,
  data: Partial<{
    status: 'draft' | 'active' | 'archived'
    title: string
    term_start_date: string
    total_weeks: number
  }>,
  classId?: string,
) {
  const res = await fetcher<SchemeOfWork>(`/scheme-of-work/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
  if (!res.error) {
    if (classId) revalidatePath(`/dashboard/teacher/classes/${classId}/scheme-of-work`)
    revalidatePath('/dashboard/teacher/classes')
  }
  return res
}

export async function assignSchemeToClass(sowId: string, classId: string) {
  const res = await fetcher<{ assigned: true }>(`/scheme-of-work/${sowId}/assign`, {
    method: 'POST',
    body: JSON.stringify({ class_id: classId }),
  })
  if (!res.error) {
    revalidatePath(`/dashboard/teacher/classes/${classId}/scheme-of-work`)
    revalidatePath(`/dashboard/classes/${classId}`)
  }
  return res
}

export async function updateSchemeEntry(
  sowId: string,
  entryId: string,
  classId: string,
  data: Partial<{
    topic: string
    subtopics: string[]
    learning_objectives: string[]
    notes: string
    is_delivered: boolean
    actual_delivery_date: string
    duration_lessons: number
  }>,
) {
  const res = await fetcher<SchemeOfWorkEntry>(`/scheme-of-work/${sowId}/entries/${entryId}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
  if (!res.error) {
    revalidatePath(`/dashboard/teacher/classes/${classId}/scheme-of-work`)
  }
  return res
}

export async function addSchemeEntry(
  sowId: string,
  classId: string,
  data: {
    week_number: number
    topic: string
    subtopics?: string[]
    learning_objectives?: string[]
    duration_lessons?: number
    notes?: string
  },
) {
  const res = await fetcher<SchemeOfWorkEntry>(`/scheme-of-work/${sowId}/entries`, {
    method: 'POST',
    body: JSON.stringify(data),
  })
  if (!res.error) {
    revalidatePath(`/dashboard/teacher/classes/${classId}/scheme-of-work`)
  }
  return res
}
