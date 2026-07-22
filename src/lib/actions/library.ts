'use server'

import { fetcher } from '@/lib/fetch'
import type { ServerActionResponse } from '@/lib/types'

export interface LibraryResource {
  id: string
  organization_id: string | null
  curriculum_id: string | null
  subject_key: string | null
  class_key: string | null
  country: string | null
  title: string
  description: string | null
  resource_type: 'book' | 'pdf' | 'video' | 'link'
  file_url: string | null
  external_url: string | null
  is_published: boolean
  createdAt: string
}

export async function getLibraryResources(filters: {
  subject?: string
  grade_level?: string
  country?: string
  q?: string
}): Promise<ServerActionResponse<LibraryResource[]>> {
  const qs = new URLSearchParams()
  if (filters.subject) qs.set('subject', filters.subject)
  if (filters.grade_level) qs.set('grade_level', filters.grade_level)
  if (filters.country) qs.set('country', filters.country)
  if (filters.q) qs.set('q', filters.q)
  const suffix = qs.toString() ? `?${qs.toString()}` : ''
  return fetcher<LibraryResource[]>(`/library${suffix}`, { cache: 'no-store' })
}

export async function getLibraryResourcesAdmin(): Promise<ServerActionResponse<LibraryResource[]>> {
  return fetcher<LibraryResource[]>('/library/admin', { cache: 'no-store' })
}

export interface CreateLibraryResourceInput {
  title: string
  description?: string
  resource_type: 'book' | 'pdf' | 'video' | 'link'
  external_url?: string
  subject?: string
  grade_level?: string
  country?: string
  is_published?: boolean
  platform_wide?: boolean
}

export async function createLibraryResource(
  data: CreateLibraryResourceInput,
): Promise<ServerActionResponse<LibraryResource>> {
  return fetcher<LibraryResource>('/library', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function deleteLibraryResource(id: string): Promise<ServerActionResponse<{ deleted: boolean }>> {
  return fetcher(`/library/${id}`, { method: 'DELETE' })
}
