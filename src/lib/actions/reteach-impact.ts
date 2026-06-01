'use server'

// src/lib/actions/reteach-impact.ts

import { fetcher } from '@/lib/fetch'
import type { ServerActionResponse } from '@/lib/types'

// ── Types ──────────────────────────────────────────────────────────────────

export type ImpactDirection = 'improved' | 'regressed' | 'no_change' | 'pending'
export type ImpactStatus    = 'awaiting_delivery' | 'awaiting_followup' | 'completed'

export interface ImpactImprovement {
  value:     number | null
  direction: ImpactDirection
  label:     string
}

export interface ImpactBaseline {
  score:      number | null
  error_rate: number | null
  label:      string
}

export interface ImpactResult {
  score:      number | null
  error_rate: number | null
  label:      string
}

export interface ImpactErrorRateChange {
  before:    number
  after:     number
  delta:     number
  direction: 'reduced' | 'increased' | 'unchanged'
}

export interface SessionImpact {
  session_id:        string
  scope:             'individual' | 'class' | 'longitudinal' | 'group'
  error_type:        string
  status:            'generated' | 'delivered' | 'completed'
  impact_status:     ImpactStatus
  student_name:      string | null
  assessment_title:  string | null
  class_name:        string | null
  generated_at:      string
  delivered_at:      string | null
  completed_at:      string | null
  follow_up_date:    string | null
  baseline:          ImpactBaseline
  result:            ImpactResult
  improvement:       ImpactImprovement
  error_rate_change: ImpactErrorRateChange | null
  // M2: Precision fields
  quick_score_pct:    number | null
  quick_score_notes:  string | null
  quick_score_at:     string | null
  time_to_impact_days: number | null
  confidence_level:   'HIGH' | 'MEDIUM' | 'LOW' | null
  pp_above_class_avg: number | null
  benchmark_label:    string | null
}

export interface ImpactSummary {
  total:                 number
  completed:             number
  awaiting_followup:     number
  awaiting_delivery:     number
  avg_improvement_delta: number | null
  overall_direction:     ImpactDirection | 'pending'
}

export interface StudentImpactView {
  student_name: string | null
  sessions:     SessionImpact[]
  summary:      ImpactSummary
}

export interface AssessmentImpactView {
  assessment_title: string | null
  sessions:         SessionImpact[]
  summary:          ImpactSummary
}

export interface OrgImpactView {
  totals: {
    total:           number
    generated:       number
    delivered:       number
    completed:       number
    completion_rate: number
  }
  impact: {
    avg_improvement_delta: number | null
    sessions_with_data:    number
    direction:             ImpactDirection | 'pending'
  }
  scope_breakdown: {
    individual:   number
    class:        number
    longitudinal: number
    group:        number
  }
  improvement_range: { min: number; max: number } | null
  outcome_breakdown: {
    improved:  number
    no_change: number
    regressed: number
  }
  error_breakdown: Array<{
    error_type:    string
    session_count: number
    avg_delta:     number
    direction:     ImpactDirection
  }>
  recent_completed: SessionImpact[]
}

export interface RecalculateResult {
  session_id:        string
  score_before:      number | null
  score_after:       number | null
  improvement_delta: number | null
  error_rate_before: number | null
  error_rate_after:  number | null
  status:            string
  recalculated_at:   string
}

// ── Actions ────────────────────────────────────────────────────────────────

export async function getSessionImpact(
  sessionId: string,
): Promise<ServerActionResponse<SessionImpact>> {
  try {
    const res = await fetcher<SessionImpact>(
      `/reteach/impact/session/${sessionId}`,
      { cache: 'no-store' },
    )
    if (res.error) throw new Error(res.error.message)
    return { data: res.data ?? null, error: null }
  } catch (err) {
    return { data: null, error: { message: err instanceof Error ? err.message : 'Failed to load session impact.' } }
  }
}

export async function getStudentImpact(
  studentId: string,
): Promise<ServerActionResponse<StudentImpactView>> {
  try {
    const res = await fetcher<StudentImpactView>(
      `/reteach/impact/student/${studentId}`,
      { cache: 'no-store' },
    )
    if (res.error) throw new Error(res.error.message)
    return { data: res.data ?? null, error: null }
  } catch (err) {
    return { data: null, error: { message: err instanceof Error ? err.message : 'Failed to load student impact.' } }
  }
}

export async function getAssessmentImpact(
  assessmentId: string,
): Promise<ServerActionResponse<AssessmentImpactView>> {
  try {
    const res = await fetcher<AssessmentImpactView>(
      `/reteach/impact/assessment/${assessmentId}`,
      { cache: 'no-store' },
    )
    if (res.error) throw new Error(res.error.message)
    return { data: res.data ?? null, error: null }
  } catch (err) {
    return { data: null, error: { message: err instanceof Error ? err.message : 'Failed to load assessment impact.' } }
  }
}

export async function getOrgImpact(): Promise<ServerActionResponse<OrgImpactView>> {
  try {
    const res = await fetcher<OrgImpactView>(
      '/reteach/impact/org',
      { cache: 'no-store' },
    )
    if (res.error) throw new Error(res.error.message)
    return { data: res.data ?? null, error: null }
  } catch (err) {
    return { data: null, error: { message: err instanceof Error ? err.message : 'Failed to load org impact.' } }
  }
}

export async function recalculateSessionImpact(
  sessionId: string,
): Promise<ServerActionResponse<RecalculateResult>> {
  try {
    const res = await fetcher<RecalculateResult>(
      `/reteach/impact/session/${sessionId}/recalculate`,
      { method: 'POST', cache: 'no-store' },
    )
    if (res.error) throw new Error(res.error.message)
    return { data: res.data ?? null, error: null }
  } catch (err) {
    return { data: null, error: { message: err instanceof Error ? err.message : 'Failed to recalculate impact.' } }
  }
}