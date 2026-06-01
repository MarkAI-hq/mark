'use server'

// src/lib/actions/reteach-history.ts

import { fetcher } from '@/lib/fetch'
import type { ServerActionResponse } from '@/lib/types'
import type { ReteachSession }       from '@/lib/actions/reteach'

// ── Types ──────────────────────────────────────────────────────────────────

export interface ReteachSessionRecord {
  id:                      string
  organization_id:         string
  generated_by:            string
  scope:                   'individual' | 'class' | 'longitudinal' | 'group'
  status:                  'generated' | 'delivered' | 'completed' | 'archived'
  error_type:              string
  session_data:            ReteachSession
  assessment_id:           string | null
  student_id:              string | null
  class_id:                string | null
  delivered_at:            string | null
  follow_up_assessment_id: string | null
  follow_up_date:          string | null
  score_before:            number | null
  error_rate_before:       number | null
  score_after:             number | null
  error_rate_after:        number | null
  improvement_delta:       number | null
  completed_at:            string | null
  delivery_mode:           'digital' | 'print' | null
  quick_score_pct:         number | null
  quick_score_notes:       string | null
  quick_score_at:          string | null
  createdAt:               string
  updatedAt:               string
}

// ── Fetch actions ──────────────────────────────────────────────────────────

export async function getStudentReteachHistory(
  studentId: string,
): Promise<ServerActionResponse<ReteachSessionRecord[]>> {
  return fetcher<ReteachSessionRecord[]>(
    `/reteach/history/student/${studentId}`,
    { cache: 'no-store' },
  )
}

export async function getClassReteachHistory(
  classId: string,
): Promise<ServerActionResponse<ReteachSessionRecord[]>> {
  return fetcher<ReteachSessionRecord[]>(
    `/reteach/history/class/${classId}`,
    { cache: 'no-store' },
  )
}

export async function getAssessmentReteachHistory(
  assessmentId: string,
): Promise<ServerActionResponse<ReteachSessionRecord[]>> {
  return fetcher<ReteachSessionRecord[]>(
    `/reteach/history/assessment/${assessmentId}`,
    { cache: 'no-store' },
  )
}

// ── Deliver action ─────────────────────────────────────────────────────────
// Note: delivery is handled directly via fetcher in the modal component
// since it needs to pass a body. This action is kept for server component use.

export async function markSessionDelivered(
  sessionId:             string,
  followUpDate?:         string,
  followUpAssessmentId?: string,
  deliveryMode?:         'digital' | 'print',
  deliveredAt?:          string,
): Promise<ServerActionResponse<ReteachSessionRecord>> {
  try {
    const response = await fetcher<ReteachSessionRecord>(
      `/reteach/sessions/${sessionId}/deliver`,
      {
        method: 'PATCH',
        body:   JSON.stringify({
          follow_up_date:          followUpDate         ?? undefined,
          follow_up_assessment_id: followUpAssessmentId ?? undefined,
          delivery_mode:           deliveryMode         ?? undefined,
          delivered_at:            deliveredAt          ?? undefined,
        }),
      },
    )
    if (response.error) throw new Error(response.error.message)
    return { data: response.data, error: null }
  } catch (err) {
    return {
      data:  null,
      error: { message: err instanceof Error ? err.message : 'Failed to mark session as delivered.' },
    }
  }
}

// ── D4: Inline session content editing ─────────────────────────────────────

export async function updateSessionContent(
  sessionId:   string,
  sessionData: ReteachSession,
): Promise<ServerActionResponse<ReteachSessionRecord>> {
  try {
    const response = await fetcher<ReteachSessionRecord>(
      `/reteach/sessions/${sessionId}/content`,
      {
        method: 'PATCH',
        body:   JSON.stringify({ session_data: sessionData }),
      },
    )
    if (response.error) throw new Error(response.error.message)
    return { data: response.data, error: null }
  } catch (err) {
    return {
      data:  null,
      error: { message: err instanceof Error ? err.message : 'Failed to update session content.' },
    }
  }
}

// ── E2: Regenerate session ──────────────────────────────────────────────────

export async function regenerateSession(
  sessionId: string,
): Promise<ServerActionResponse<ReteachSession>> {
  try {
    const response = await fetcher<ReteachSession>(
      `/reteach/sessions/${sessionId}/regenerate`,
      { method: 'POST' },
    )
    if (response.error) throw new Error(response.error.message)
    return { data: response.data, error: null }
  } catch (err) {
    return {
      data:  null,
      error: { message: err instanceof Error ? err.message : 'Failed to regenerate session.' },
    }
  }
}

// ── C3: Bulk generate individual sessions ───────────────────────────────────

export async function bulkGenerateReteach(
  assessmentId:  string,
  thresholdPct?: number,
): Promise<ServerActionResponse<{ generated: number; skipped: number; failed: number }>> {
  try {
    const url = `/reteach/bulk/assessment/${assessmentId}` +
      (thresholdPct !== undefined ? `?threshold_pct=${thresholdPct}` : '')
    const response = await fetcher<{ generated: number; skipped: number; failed: number }>(
      url,
      { method: 'POST' },
    )
    if (response.error) throw new Error(response.error.message)
    return { data: response.data, error: null }
  } catch (err) {
    return {
      data:  null,
      error: { message: err instanceof Error ? err.message : 'Failed to bulk generate sessions.' },
    }
  }
}

// ── G4: Quick score (exit ticket result after delivery) ────────────────────

export async function logExitTicketResult(
  sessionId:       string,
  understoodCount: number,
  totalCount:      number,
  notes?:          string,
): Promise<ServerActionResponse<ReteachSessionRecord>> {
  try {
    const response = await fetcher<ReteachSessionRecord>(
      `/reteach/sessions/${sessionId}/quick-score`,
      {
        method: 'POST',
        body:   JSON.stringify({ understood_count: understoodCount, total_count: totalCount, notes }),
      },
    )
    if (response.error) throw new Error(response.error.message)
    return { data: response.data, error: null }
  } catch (err) {
    return {
      data:  null,
      error: { message: err instanceof Error ? err.message : 'Failed to log exit ticket result.' },
    }
  }
}