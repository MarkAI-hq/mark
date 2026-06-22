'use server'

// src/lib/actions/reteach.ts

import { fetcher } from '@/lib/fetch'
import type { ServerActionResponse, Citation } from '@/lib/types'

// ── Sub-types ──────────────────────────────────────────────────────────────

export interface ReteachExampleQuestion {
  question:        string
  expected_answer: string
  bloom_level:     string
}

export interface ReteachWorksheetQuestion {
  question:     string
  bloom_level:  string
  answer_lines: number
}

export interface ReteachMisconception {
  misconception: string
  correction:    string
}

export interface ReteachExitTicket {
  question:              string
  expected_indicators:   string[]
  time_estimate_minutes: number
}

// ── Dual-artifact structures (G1) ─────────────────────────────────────────

export interface ReteachTeacherGuide {
  scripted_explanation: {
    opening:        string
    core_concept:   string
    worked_example: string
  }
  example_questions:       ReteachExampleQuestion[]
  expected_misconceptions: ReteachMisconception[]
  cognitive_tip?:          string
  success_criteria:        string
  exit_ticket?:            ReteachExitTicket
}

export interface ReteachStudentWorksheet {
  practice_questions:         ReteachWorksheetQuestion[]
  exit_ticket_prompt:         string
  exit_ticket_response_lines: number
  diagram_template?:          string
  table_template?:            { headers: string[]; rows: number }
  decision_tree_prompt?:      string
}

// ── Main session type ──────────────────────────────────────────────────────

export type RemediationActivityType =
  | 'visual_mapping'
  | 'inquiry_based'
  | 'problem_based'
  | 'worked_example_fading'
  | 'concrete_representational_abstract'
  | 'structured_note_taking'
  | 'structured_decision_making'

// ── Etymology (J1) ────────────────────────────────────────────────────────────

export interface ReteachEtymologyNote {
  term:             string
  language_origin:  string
  root_breakdown:   string
  intuition_bridge: string
  related_terms:    string[]
}

// ── Cornell Notes (I1) ────────────────────────────────────────────────────────

export interface ReteachCornellNotes {
  cue_questions: string[]
  note_sections: Array<{ heading: string; content: string }>
  summary:       string
}

// ── Zettelkasten Notes (I2) ───────────────────────────────────────────────────

export interface ReteachZettelkastenNotes {
  atomic_notes: Array<{
    id:         string
    concept:    string
    definition: string
    links_to:   string[]
    tag:        string
  }>
  connection_prompt: string
}

// ── Main session type ──────────────────────────────────────────────────────────

export interface ReteachSession {
  // Shared metadata
  title:             string
  duration_minutes:  number
  target_error:      string
  target_bloom_level: string
  scope:             'individual' | 'class' | 'longitudinal' | 'group'
  error_priority?:   'critical' | 'moderate' | 'surface'

  // Curriculum grounding (F4)
  lo_id?:           string
  lo_text?:         string
  remediation_type?: RemediationActivityType
  strategy_source?:  'curriculum'

  // Dual artifacts (G1)
  teacher_guide:     ReteachTeacherGuide
  student_worksheet: ReteachStudentWorksheet

  // High-delta technique fields
  etymology_note?:          ReteachEtymologyNote
  cornell_notes?:           ReteachCornellNotes
  zettelkasten_notes?:      ReteachZettelkastenNotes
  self_explanation_prompts?: Array<{ after_step: string; prompt: string }>
  review_schedule?:          { day_1: string; day_3: string; day_7: string }

  // Phase 5 visual aids (added post-generation)
  visual_aids?: Array<{
    image_id:    string
    url:         string | null
    description: string
    score:       number
  }>

  // Syllabus provenance (RAG) — stored in session_data at generation time
  sources_consulted?: Citation[]
}

// ── Server actions ─────────────────────────────────────────────────────────

export async function generateSubmissionReteach(
  submissionId: string,
): Promise<ServerActionResponse<ReteachSession>> {
  try {
    const response = await fetcher<ReteachSession>(
      `/reteach/submission/${submissionId}`,
      { method: 'POST', cache: 'no-store' },
    )
    if (response.error) throw new Error(response.error.message)
    return { data: response.data ?? null, error: null }
  } catch (err) {
    return {
      data:  null,
      error: { message: err instanceof Error ? err.message : 'Failed to generate reteach session.' },
    }
  }
}

export async function generateAssessmentReteach(
  assessmentId: string,
  errorTypeId?: string,
  classId?:     string,
): Promise<ServerActionResponse<ReteachSession>> {
  try {
    const queryParams = new URLSearchParams({
      ...(errorTypeId ? { errorTypeId } : {}),
      ...(classId     ? { classId }     : {}),
    })
    const url = queryParams.toString()
      ? `/reteach/assessment/${assessmentId}?${queryParams.toString()}`
      : `/reteach/assessment/${assessmentId}`

    const response = await fetcher<ReteachSession>(url, { method: 'POST', cache: 'no-store' })
    if (response.error) throw new Error(response.error.message)
    return { data: response.data ?? null, error: null }
  } catch (err) {
    return {
      data:  null,
      error: { message: err instanceof Error ? err.message : 'Failed to generate class reteach session.' },
    }
  }
}

export async function generateStudentReteach(
  studentId: string,
): Promise<ServerActionResponse<ReteachSession>> {
  try {
    const response = await fetcher<ReteachSession>(
      `/reteach/student/${studentId}`,
      { method: 'POST', cache: 'no-store' },
    )
    if (response.error) throw new Error(response.error.message)
    return { data: response.data ?? null, error: null }
  } catch (err) {
    return {
      data:  null,
      error: { message: err instanceof Error ? err.message : 'Failed to generate student reteach session.' },
    }
  }
}

// ── E3: Pre-exam check — pending sessions for assessment topics ────────────────

export interface PreExamCheckItem {
  session_id:    string
  scope:         string
  error_type:    string
  topic?:        string
  status:        string
  created_at:    string
}

export async function getPreExamCheck(
  assessmentId: string,
): Promise<ServerActionResponse<PreExamCheckItem[]>> {
  try {
    const response = await fetcher<PreExamCheckItem[]>(
      `/reteach/preview/assessment/${assessmentId}`,
      { cache: 'no-store' },
    )
    if (response.error) throw new Error(response.error.message)
    return { data: response.data ?? null, error: null }
  } catch (err) {
    return {
      data:  null,
      error: { message: err instanceof Error ? err.message : 'Failed to load pre-exam check.' },
    }
  }
}

export async function generateGroupReteach(params: {
  studentIds:    string[]
  errorType:     string
  domain:        string
  classId:       string
  assessmentId?: string
}): Promise<ServerActionResponse<ReteachSession>> {
  try {
    const response = await fetcher<ReteachSession>(
      '/reteach/group',
      { method: 'POST', cache: 'no-store', body: JSON.stringify(params) },
    )
    if (response.error) throw new Error(response.error.message)
    return { data: response.data ?? null, error: null }
  } catch (err) {
    return {
      data:  null,
      error: { message: err instanceof Error ? err.message : 'Failed to generate group session.' },
    }
  }
}
