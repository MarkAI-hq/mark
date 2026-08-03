'use server'

import { revalidatePath } from 'next/cache'
import { fetcher } from '@/lib/fetch'

export interface StudentNote {
  id: string
  student_id: string
  organization_id: string
  subject: string
  topic: string
  content: string
  status: 'pending' | 'approved' | 'rejected'
  source_type?: 'text' | 'pdf' | 'image'
  file_url?: string | null
  reward_points: number
  createdAt: string
  updatedAt: string
}

export interface StudentNoteStats {
  total: number
  approved: number
  total_points: number
}

export interface CreateNoteDto {
  subject: string
  topic: string
  content: string
}

// ── Student-facing ─────────────────────────────────────────────────────────

export async function uploadStudentNote(formData: FormData): Promise<{
  data: StudentNote | null
  error: { message: string } | null
}> {
  const { cookies } = await import('next/headers')
  const API = process.env.API_BASE_URL ?? process.env.NEXT_PUBLIC_API_URL ?? ''
  const cookieStore = await cookies()
  const token = cookieStore.get('token')?.value
  const subject = formData.get('subject') as string
  const topic   = formData.get('topic') as string

  if (!subject || !topic) return { data: null, error: { message: 'subject and topic are required' } }

  const url = `${API}/api/v1/student-notes/upload?subject=${encodeURIComponent(subject)}&topic=${encodeURIComponent(topic)}`
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: formData,
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Upload failed' }))
      return { data: null, error: { message: err.message ?? 'Upload failed' } }
    }
    const note = await res.json()
    revalidatePath('/student/knowledge-base')
    return { data: note, error: null }
  } catch (err: any) {
    return { data: null, error: { message: err.message ?? 'Upload failed' } }
  }
}

export async function submitStudentNote(dto: CreateNoteDto) {
  const res = await fetcher<StudentNote>('/student-notes', {
    method: 'POST',
    body: JSON.stringify(dto),
  })
  if (!res.error) {
    revalidatePath('/student/knowledge-base')
  }
  return res
}

export async function getMyNotes() {
  return fetcher<StudentNote[]>('/student-notes/my')
}

export async function updateStudentNote(noteId: string, content: string) {
  const res = await fetcher<StudentNote>(`/student-notes/${noteId}`, {
    method: 'PATCH',
    body: JSON.stringify({ content }),
  })
  if (!res.error) {
    revalidatePath('/student/knowledge-base')
  }
  return res
}

export async function getMyNoteStats() {
  return fetcher<StudentNoteStats>('/student-notes/stats')
}

export async function validateSceneNotes(dto: {
  notes: string
  modelNotes?: string
  cueQuestions?: string[]
  subject: string
  topic: string
}) {
  return fetcher<{ passed: boolean; feedback: string }>('/student-notes/validate-scene', {
    method: 'POST',
    body: JSON.stringify(dto),
  })
}

// ── Teacher / Admin-facing ──────────────────────────────────────────────────

export async function getPendingNotes() {
  return fetcher<StudentNote[]>('/student-notes/pending')
}

export async function approveNote(noteId: string) {
  const res = await fetcher<StudentNote>(`/student-notes/${noteId}/approve`, {
    method: 'PATCH',
  })
  if (!res.error) {
    revalidatePath('/dashboard/knowledge-base')
  }
  return res
}

export async function rejectNote(noteId: string) {
  const res = await fetcher<StudentNote>(`/student-notes/${noteId}/reject`, {
    method: 'PATCH',
  })
  if (!res.error) {
    revalidatePath('/dashboard/knowledge-base')
  }
  return res
}
