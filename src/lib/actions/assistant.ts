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
  /** List responses only: whether the artifact has in-chat content to open. */
  has_content?:    boolean
  /** Single-artifact responses only (see getAssistantArtifact). */
  content?:        StudioContent | null
}

export type StudioType = 'flashcards' | 'quiz' | 'slide_deck' | 'study_guide'

export type StudioContent =
  | { cards: { front: string; back: string }[] }
  | { questions: { question: string; options: string[]; correct: number; explanation: string }[] }
  | { slides: { title: string; bullets: string[]; note?: string }[] }
  | { summary: string; sections: { heading: string; points: string[] }[]; key_terms?: { term: string; meaning: string }[] }

/** Build a studio artifact from the student's own notes; the content is stored
 *  on the artifact and opened inside the chat (no lesson, no review queue). */
export async function generateStudioArtifact(dto: {
  type:            StudioType
  subject:         string
  topic:           string
  title:           string
  source_note_ids: string[]
  source_labels?:  string[]
  artifact_id?:    string
}): Promise<ServerActionResponse<AssistantArtifact>> {
  return fetcher<AssistantArtifact>('/assistant/artifacts/generate', {
    method: 'POST',
    body: JSON.stringify(dto),
    cache: 'no-store',
  })
}

export async function getAssistantArtifact(id: string): Promise<ServerActionResponse<AssistantArtifact>> {
  return fetcher<AssistantArtifact>(`/assistant/artifacts/${id}`, { cache: 'no-store' })
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
