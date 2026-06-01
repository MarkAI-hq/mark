'use server'

// src/lib/actions/learning-tools.ts
// H1: Admin CRUD for learning tools

import { fetcher } from '@/lib/fetch'
import type { ServerActionResponse } from '@/lib/types'

export interface LearningTool {
  id:             string
  name:           string
  description:    string
  how_to:         string | null
  category:       string
  research_basis: string | null
  delta_rating:   number | null
  is_active:      boolean
  createdAt:      string
  updatedAt:      string
}

export async function getLearningTools(): Promise<ServerActionResponse<LearningTool[]>> {
  try {
    const res = await fetcher<LearningTool[]>('/cognitive/tools', { cache: 'no-store' })
    if (res.error) throw new Error(res.error.message)
    return { data: res.data ?? null, error: null }
  } catch (err) {
    return { data: null, error: { message: err instanceof Error ? err.message : 'Failed to load tools.' } }
  }
}

export async function createLearningTool(body: {
  name:           string
  description:    string
  how_to?:        string
  category?:      string
  research_basis?: string
  delta_rating?:  number
}): Promise<ServerActionResponse<LearningTool>> {
  try {
    const res = await fetcher<LearningTool>('/cognitive/tools', {
      method: 'POST',
      body:   JSON.stringify(body),
    })
    if (res.error) throw new Error(res.error.message)
    return { data: res.data ?? null, error: null }
  } catch (err) {
    return { data: null, error: { message: err instanceof Error ? err.message : 'Failed to create tool.' } }
  }
}

export async function updateLearningTool(
  id: string,
  body: Partial<{ name: string; description: string; how_to: string; category: string; research_basis: string; delta_rating: number; is_active: boolean }>,
): Promise<ServerActionResponse<LearningTool>> {
  try {
    const res = await fetcher<LearningTool>(`/cognitive/tools/${id}`, {
      method: 'PATCH',
      body:   JSON.stringify(body),
    })
    if (res.error) throw new Error(res.error.message)
    return { data: res.data ?? null, error: null }
  } catch (err) {
    return { data: null, error: { message: err instanceof Error ? err.message : 'Failed to update tool.' } }
  }
}

export async function deleteLearningTool(id: string): Promise<ServerActionResponse<{ deleted: boolean }>> {
  try {
    const res = await fetcher<{ deleted: boolean }>(`/cognitive/tools/${id}`, { method: 'DELETE' })
    if (res.error) throw new Error(res.error.message)
    return { data: res.data ?? null, error: null }
  } catch (err) {
    return { data: null, error: { message: err instanceof Error ? err.message : 'Failed to delete tool.' } }
  }
}

export async function assignToolToProfile(toolId: string, profileId: string): Promise<ServerActionResponse<{ assigned: boolean }>> {
  try {
    const res = await fetcher<{ assigned: boolean }>(`/cognitive/tools/${toolId}/profiles/${profileId}`, { method: 'POST' })
    if (res.error) throw new Error(res.error.message)
    return { data: res.data ?? null, error: null }
  } catch (err) {
    return { data: null, error: { message: err instanceof Error ? err.message : 'Failed to assign tool.' } }
  }
}
