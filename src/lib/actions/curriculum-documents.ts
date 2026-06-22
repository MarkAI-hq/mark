'use server'

import { revalidatePath } from 'next/cache'
import { fetcher } from '@/lib/fetch'

export interface CurriculumDocument {
  id: string
  organization_id: string
  r2_key: string
  title: string
  document_type: 'past_paper' | 'teacher_notes' | 'marking_scheme' | 'resource'
  subject: string
  level: string | null
  year: string | null
  extraction_status: 'pending' | 'processing' | 'done' | 'failed'
  extraction_error: string | null
  created_by: string | null
  createdAt: string
  updatedAt: string
}

const KB_PATH = '/dashboard/knowledge-base'

export async function listDocuments() {
  return fetcher<CurriculumDocument[]>('/knowledge-base')
}

export async function uploadDocument(formData: FormData) {
  const res = await fetcher<CurriculumDocument>('/knowledge-base/upload', {
    method: 'POST',
    body: formData,
  })
  if (!res.error) revalidatePath(KB_PATH)
  return res
}

export async function deleteDocument(docId: string) {
  const res = await fetcher<{ deleted: boolean }>(`/knowledge-base/${docId}`, {
    method: 'DELETE',
  })
  if (!res.error) revalidatePath(KB_PATH)
  return res
}
