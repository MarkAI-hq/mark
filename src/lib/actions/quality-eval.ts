// src/lib/actions/quality-eval.ts
'use server'

import { fetcher } from '@/lib/fetch'
import type { ServerActionResponse } from '@/lib/types'

// ── Shared shapes ──────────────────────────────────────────────────────────

export interface QualityScorecard {
  curriculum_id:                  string
  total_conversations:            number
  clean_pass_rate:                number | null
  misconception_diagnosis_rate:   number | null
  withholding_narrow_rate:        number | null
  withholding_strict_rate:        number | null
  factual_accuracy_rate:          number | null
  correctness_validation_rate:    number | null
}

export interface OrgQualityScorecard extends QualityScorecard {
  subject: string
}

export interface TranscriptTurn {
  role:    'user' | 'assistant'
  content: string
}

export interface WithholdingStrict {
  points_to_evidence:         boolean
  prompts_revision:           boolean
  leaves_thinking_to_student: boolean
  overall_pass:                boolean
}

export interface QualityConversation {
  conversation_id:          string
  transcript:                TranscriptTurn[]
  turns:                     number
  created_at:                 string
  run_id:                    string
  triggered_by:               string
  tracy_model:                string
  judge_model:                string
  clean_pass:                 boolean | null
  misconception_diagnosis:    boolean | null
  withholding_narrow:         boolean | null
  withholding_strict:         WithholdingStrict | null
  factual_accuracy:           boolean | null
  correctness_validation:     boolean | null
  judge_notes:                 string | null
}

export interface FlaggedConversation {
  conversation_id: string
  curriculum_id:   string
  transcript:       TranscriptTurn[]
  judge_notes:      string | null
  created_at:       string
}

export interface QualityEvalRun {
  run_id:          string
  job_id:          string | number
  scenario_count:  number
  message:         string
}

export interface QualityEvalJobStatus {
  job_id:   string | number
  status:   'QUEUED' | 'PROCESSING' | 'COMPLETED' | 'FAILED'
  progress: number
  result?:  { runId: string; total: number; completed: number; failed: number }
  error?:   string
}

// ── Root / Support ──────────────────────────────────────────────────────────

export async function createQualityEvalRun(
  curriculumId: string,
): Promise<ServerActionResponse<QualityEvalRun>> {
  return fetcher<QualityEvalRun>('/quality-eval/runs', {
    method: 'POST',
    body: JSON.stringify({ curriculum_id: curriculumId, triggered_by: 'manual' }),
  })
}

export async function getQualityEvalRunStatus(
  jobId: string | number,
): Promise<ServerActionResponse<QualityEvalJobStatus>> {
  return fetcher<QualityEvalJobStatus>(`/quality-eval/runs/${jobId}/status`, {
    cache: 'no-store',
  })
}

export async function listQualityConversations(
  curriculumId: string,
): Promise<ServerActionResponse<QualityConversation[]>> {
  return fetcher<QualityConversation[]>(
    `/quality-eval/conversations?curriculum_id=${encodeURIComponent(curriculumId)}`,
    { cache: 'no-store' },
  )
}

export interface RetryScoreResult {
  id: string
  conversation_id: string
  clean_pass: boolean
  judge_notes: string | null
}

export async function retryQualityScore(
  conversationId: string,
): Promise<ServerActionResponse<RetryScoreResult>> {
  return fetcher<RetryScoreResult>(
    `/quality-eval/conversations/${conversationId}/retry-score`,
    { method: 'POST', cache: 'no-store' },
  )
}

// ── Admin / Guardian / Root / Support ───────────────────────────────────────

export async function getQualityScorecard(
  curriculumId: string,
): Promise<ServerActionResponse<QualityScorecard>> {
  return fetcher<QualityScorecard>(
    `/quality-eval/scorecard?curriculum_id=${encodeURIComponent(curriculumId)}`,
    { cache: 'no-store' },
  )
}

// ── Teacher / Admin ──────────────────────────────────────────────────────────

export async function getQualityReviewQueue(): Promise<
  ServerActionResponse<FlaggedConversation[]>
> {
  return fetcher<FlaggedConversation[]>('/quality-eval/review-queue', {
    cache: 'no-store',
  })
}

// ── Admin ────────────────────────────────────────────────────────────────────

export async function getOrgQualityScorecards(): Promise<
  ServerActionResponse<OrgQualityScorecard[]>
> {
  return fetcher<OrgQualityScorecard[]>('/quality-eval/org-scorecard', {
    cache: 'no-store',
  })
}
