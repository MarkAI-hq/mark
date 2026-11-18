'use server'

import { fetcher } from '@/lib/fetch'
import type { ServerActionResponse } from '@/lib/types'
import type { FocusSoundId, FocusSurface, FocusSystemId } from '@/lib/focus/systems'

export interface FocusSessionRow {
  id: string
  system: FocusSystemId
  planned_focus_min: number | null
  planned_break_min: number | null
  actual_focus_sec: number
  rounds_completed: number
  breaks_taken: number
  breaks_skipped: number
  sound: FocusSoundId
  surface: FocusSurface
  goal_subject: string | null
  goal_topic: string | null
  started_at: string
  ended_at: string | null
  status: 'active' | 'completed' | 'abandoned'
  ended_reason: string | null
  self_rating: number | null
  note: string | null
  updatedAt?: string
}

export interface StartFocusBody {
  id: string
  system: FocusSystemId
  planned_focus_min?: number
  planned_break_min?: number
  sound: FocusSoundId
  surface: FocusSurface
  goal_subject?: string
  goal_topic?: string
  started_at: string
}

export interface UpdateFocusBody {
  actual_focus_sec: number
  rounds_completed: number
  breaks_taken: number
  breaks_skipped: number
  sound?: FocusSoundId
  surface?: FocusSurface
  status?: 'active' | 'completed' | 'abandoned'
  ended_reason?: 'completed' | 'user_stopped' | 'idle_timeout' | 'lid_closed'
  ended_at?: string
  self_rating?: number
  note?: string
}

export interface FocusSummary {
  days: number
  focus_minutes: number
  sessions_total: number
  sessions_completed: number
  sessions_abandoned: number
  completion_rate: number | null
  most_used_system: FocusSystemId | null
  average_self_rating: number | null
  minutes_by_day: { date: string; minutes: number }[]
}

export interface PlatformFocusSummary {
  days: number
  totals: {
    sessions: number
    learners: number
    live_learners: number
    focus_minutes: number
    completion_rate: number | null
  }
  sessions_per_day: { date: string; sessions: number; learners: number; minutes: number }[]
  by_system: { system: FocusSystemId; sessions: number; completion_rate: number | null }[]
  by_org: {
    organization_id: string
    organization_name: string | null
    sessions: number
    learners: number
    focus_minutes: number
    completion_rate: number | null
  }[]
}

export async function startFocusSession(
  body: StartFocusBody,
): Promise<ServerActionResponse<FocusSessionRow>> {
  return fetcher<FocusSessionRow>('/focus-sessions', {
    method: 'POST',
    body: JSON.stringify(body),
    cache: 'no-store',
  })
}

export async function updateFocusSession(
  id: string,
  body: UpdateFocusBody,
): Promise<ServerActionResponse<FocusSessionRow>> {
  return fetcher<FocusSessionRow>(`/focus-sessions/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
    cache: 'no-store',
  })
}

export async function getActiveFocusSession(): Promise<ServerActionResponse<FocusSessionRow | null>> {
  return fetcher<FocusSessionRow | null>('/focus-sessions/me/active', { cache: 'no-store' })
}

export async function getMyFocusSummary(days = 7): Promise<ServerActionResponse<FocusSummary>> {
  return fetcher<FocusSummary>(`/focus-sessions/me/summary?days=${days}`, { cache: 'no-store' })
}

export async function getPlatformFocusSessions(
  days = 30,
): Promise<ServerActionResponse<PlatformFocusSummary>> {
  return fetcher<PlatformFocusSummary>(`/support/focus-sessions?days=${days}`, { cache: 'no-store' })
}
