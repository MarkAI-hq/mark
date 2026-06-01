'use server'

import { fetcher } from '@/lib/fetch'
import type { ServerActionResponse } from '@/lib/types'

export type CurriculumImageStatus = 'pending' | 'active' | 'archived'

export interface CurriculumImage {
  id:               string
  image_type:       string
  description:      string
  tags:             string[] | null
  subject:          string | null
  topic:            string | null
  strand:           string | null
  image_url:        string | null
  status:           CurriculumImageStatus
  assessment_id?:   string | null
  created_at?:      string
  updated_at?:      string
}

export async function listCurriculumImages(params?: {
  subject?:    string
  image_type?: string
  status?:     CurriculumImageStatus
  limit?:      number
  offset?:     number
}): Promise<ServerActionResponse<CurriculumImage[]>> {
  const query = new URLSearchParams()
  if (params?.subject)    query.set('subject',    params.subject)
  if (params?.image_type) query.set('image_type', params.image_type)
  if (params?.status)     query.set('status',     params.status)
  if (params?.limit)      query.set('limit',      String(params.limit))
  if (params?.offset)     query.set('offset',     String(params.offset))
  const qs = query.toString()
  return fetcher(`/curriculum-images${qs ? `?${qs}` : ''}`, { cache: 'no-store' })
}

export async function updateCurriculumImage(
  id: string,
  data: Partial<Pick<CurriculumImage, 'description' | 'image_type' | 'subject' | 'topic' | 'strand'>>,
): Promise<ServerActionResponse<CurriculumImage>> {
  return fetcher(`/curriculum-images/${id}`, {
    method: 'PATCH',
    body:   JSON.stringify(data),
  })
}

export async function activateCurriculumImage(id: string): Promise<ServerActionResponse<CurriculumImage>> {
  return fetcher(`/curriculum-images/${id}/activate`, { method: 'PATCH' })
}

export async function deleteCurriculumImage(id: string): Promise<ServerActionResponse<{ message: string }>> {
  return fetcher(`/curriculum-images/${id}`, { method: 'DELETE' })
}
