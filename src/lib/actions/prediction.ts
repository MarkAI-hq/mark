'use server'

// src/lib/actions/prediction.ts

import { fetcher } from '@/lib/fetch'
import type { ServerActionResponse } from '@/lib/types'

// ── Types ──────────────────────────────────────────────────────────────────

export interface TopicPerformance {
  topic:             string
  curriculum_weight: number
  student_mastery:   number
  national_average:  number
  gap:               number
  status:            'strong' | 'developing' | 'at_risk' | 'critical'
  reteach_session_id?: string
}

export interface PathwayAction {
  rank:             number
  action:           string
  action_type:      'complete_reteach' | 'generate_reteach' | 'complete_study_plan' | 'focus_topic'
  expected_gain_pp: number
  linked_id?:       string
  topic:            string
  urgency:          'high' | 'medium' | 'low'
}

export interface StudentNationalExamPrediction {
  student_id:           string
  curriculum_id:        string
  subject:              string
  exam_body:            string
  exam_level:           string
  predicted_score:      number
  predicted_range:      [number, number]
  predicted_grade:      string
  predicted_label:      string
  is_passing:           boolean
  confidence:           number
  trajectory:           'improving' | 'steady' | 'declining'
  trajectory_delta:     number
  weeks_to_exam?:       number
  gap_to_next_grade:    number
  next_grade:           string
  next_grade_label:     string
  topic_performance:    TopicPerformance[]
  pathway:              PathwayAction[]
  motivational_message: string
  based_on_submissions:    number
  last_calculated:         string
  initial_predicted_score?: number
  // The assessment milestone this prediction targets (end-of-term / national exam).
  milestone_type?:         string
  milestone_label?:        string
}

// ── Actions ────────────────────────────────────────────────────────────────

export async function getStudentPrediction(
  studentId:    string,
  curriculumId: string,
): Promise<ServerActionResponse<StudentNationalExamPrediction>> {
  try {
    const res = await fetcher<StudentNationalExamPrediction>(
      `/prediction/students/${studentId}?curriculumId=${encodeURIComponent(curriculumId)}`,
      { cache: 'no-store' },
    )
    if (res.error) throw new Error(res.error.message)
    return { data: res.data ?? null, error: null }
  } catch (err) {
    return {
      data:  null,
      error: { message: err instanceof Error ? err.message : 'Failed to load prediction.' },
    }
  }
}

export async function calibratePrediction(
  curriculumId:      string,
  bloomsSensitivity: number,
  topicSensitivity:  number,
): Promise<ServerActionResponse<{ curriculum_id: string; blooms_sensitivity: number; topic_sensitivity: number }>> {
  try {
    const res = await fetcher<{ curriculum_id: string; blooms_sensitivity: number; topic_sensitivity: number }>(
      '/prediction/calibrate',
      {
        method: 'POST',
        cache:  'no-store',
        body:   JSON.stringify({ curriculumId, bloomsSensitivity, topicSensitivity }),
      },
    )
    if (res.error) throw new Error(res.error.message)
    return { data: res.data ?? null, error: null }
  } catch (err) {
    return {
      data:  null,
      error: { message: err instanceof Error ? err.message : 'Failed to update calibration.' },
    }
  }
}

export async function recalculatePrediction(
  studentId:    string,
  curriculumId: string,
): Promise<ServerActionResponse<StudentNationalExamPrediction>> {
  try {
    const res = await fetcher<StudentNationalExamPrediction>(
      `/prediction/students/${studentId}/recalculate?curriculumId=${encodeURIComponent(curriculumId)}`,
      { method: 'POST', cache: 'no-store' },
    )
    if (res.error) throw new Error(res.error.message)
    return { data: res.data ?? null, error: null }
  } catch (err) {
    return {
      data:  null,
      error: { message: err instanceof Error ? err.message : 'Failed to recalculate prediction.' },
    }
  }
}
