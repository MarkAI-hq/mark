'use server'

// src/lib/actions/assistant.ts
//
// Server-side index of Tracy-generated study artifacts (mirrors
// mark-api's assistant_artifacts table). The artifact CONTENT already
// persists server-side via plan_id/audio_url — this is the list itself,
// which previously lived only in localStorage and was lost on device
// switch or cleared storage.

import { fetcher } from '@/lib/fetch'
import type { ServerActionResponse } from '@/lib/types'

export type AssistantArtifactType = 'flashcards' | 'quiz' | 'slide_deck' | 'study_guide' | 'audio_overview'
export type AssistantArtifactStatus = 'generating' | 'ready' | 'failed'

export interface AssistantArtifact {
  id:              string
  type:            AssistantArtifactType
  title:           string
  status:          AssistantArtifactStatus
  plan_id:         string | null
  audio_url:       string | null
  source_note_ids: string[]
  source_labels:   string[]
  createdAt:       string
}

export async function listAssistantArtifacts(): Promise<ServerActionResponse<AssistantArtifact[]>> {
  return fetcher<AssistantArtifact[]>('/assistant/artifacts', { cache: 'no-store' })
}

export async function createAssistantArtifact(dto: {
  type:             AssistantArtifactType
  title:            string
  status?:          AssistantArtifactStatus
  source_note_ids?: string[]
  source_labels?:   string[]
}): Promise<ServerActionResponse<AssistantArtifact>> {
  return fetcher<AssistantArtifact>('/assistant/artifacts', {
    method: 'POST',
    body:   JSON.stringify(dto),
  })
}

export async function updateAssistantArtifact(
  id: string,
  patch: Partial<Pick<AssistantArtifact, 'status' | 'title' | 'plan_id' | 'audio_url'>>,
): Promise<ServerActionResponse<AssistantArtifact>> {
  return fetcher<AssistantArtifact>(`/assistant/artifacts/${id}`, {
    method: 'PATCH',
    body:   JSON.stringify(patch),
  })
}
