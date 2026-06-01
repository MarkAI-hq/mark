'use server'

// src/lib/actions/gap-attribution.ts
// Exposure matrix (class-level) + gap attribution (student-level)

import { fetcher } from '@/lib/fetch'
import type { ServerActionResponse } from '@/lib/types'

// ── Exposure Matrix (class view) ───────────────────────────────────────────

export type ExposureStatus = 'present' | 'absent' | 'partial' | 'no_session' | 'no_record'

export interface ExposureMatrixRow {
  sow_entry_id:     string
  topic:            string
  week_number?:     number
  session_date?:    string | null
  lesson_dates:     string[]
  student_exposure: Record<string, ExposureStatus>
}

export interface ExposureMatrixStudent {
  student_id: string
  name:       string
}

export interface ExposureMatrix {
  class_id:  string
  sow_id:    string | null
  rows:      ExposureMatrixRow[]
  students:  ExposureMatrixStudent[]
}

export async function getClassExposureMatrix(
  classId: string,
): Promise<ServerActionResponse<ExposureMatrix>> {
  try {
    const res = await fetcher<ExposureMatrix>(
      `/gap-attribution/class/${classId}/exposure-matrix`,
      { cache: 'no-store' },
    )
    if (res.error) throw new Error(res.error.message)
    return { data: res.data ?? null, error: null }
  } catch (err) {
    return {
      data:  null,
      error: { message: err instanceof Error ? err.message : 'Failed to load exposure matrix.' },
    }
  }
}

// ── Student Gap Attribution (individual view) ──────────────────────────────

export type AttributionType =
  | 'never_exposed'
  | 'taught_not_understood'
  | 'partially_exposed'
  | 'not_yet_taught'

export interface StudentGapAttribution {
  topic:          string
  subtopic?:      string
  attribution:    AttributionType
  explanation:    string
  attendance_pct: number | null
  lesson_count:   number
  intervention:   string
  sessions_count: number
}

export interface GapAttributionView {
  student_id:      string
  attributed_gaps: StudentGapAttribution[]
  summary: {
    total_gaps:            number
    taught_not_understood: number
    never_exposed:         number
    partially_exposed:     number
  }
}

export async function getStudentGapAttribution(
  studentId: string,
  classId:   string,
): Promise<ServerActionResponse<GapAttributionView>> {
  try {
    const res = await fetcher<GapAttributionView>(
      `/gap-attribution/student/${studentId}/class/${classId}`,
      { cache: 'no-store' },
    )
    if (res.error) throw new Error(res.error.message)
    return { data: res.data ?? null, error: null }
  } catch (err) {
    return {
      data:  null,
      error: { message: err instanceof Error ? err.message : 'Failed to load gap attribution.' },
    }
  }
}
