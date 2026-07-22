'use server'

import { fetcher } from '@/lib/fetch'
import type { ServerActionResponse } from '@/lib/types'

export interface SchoolNotice {
  id: string
  organization_id: string
  title: string
  body: string
  category: 'event' | 'notice' | 'holiday'
  event_date: string | null
  is_pinned: boolean
  published_at: string | null
  createdAt: string
}

export async function getSchoolNotices(): Promise<ServerActionResponse<SchoolNotice[]>> {
  return fetcher<SchoolNotice[]>('/school-notices', { cache: 'no-store' })
}

export interface CreateSchoolNoticeInput {
  title: string
  body: string
  category?: 'event' | 'notice' | 'holiday'
  event_date?: string
  is_pinned?: boolean
}

export async function createSchoolNotice(
  data: CreateSchoolNoticeInput,
): Promise<ServerActionResponse<SchoolNotice>> {
  return fetcher<SchoolNotice>('/school-notices', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function deleteSchoolNotice(id: string): Promise<ServerActionResponse<{ deleted: boolean }>> {
  return fetcher(`/school-notices/${id}`, { method: 'DELETE' })
}
