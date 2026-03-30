// src/lib/actions/grading.ts
'use server'

import { fetcher } from '@/lib/fetch'
import type { ServerActionResponse } from '@/lib/types'

// ── Types ──────────────────────────────────────────────────────────────────

export interface BatchGradingResult {
  message:         string;
  batchId:         string;
  assessmentId:    string;
  submissionIds:   string[];
  submissionCount: number;
}

export interface SubmissionStatus {
  submission_id:  string;
  student_id:     string;
  grading_status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  total_score:    number | null;
  max_score:      number | null;
  graded_at:      string | null;
}

export interface BatchStatusResult {
  assessment_id: string;
  total:         number;
  pending:       number;
  processing:    number;
  completed:     number;
  failed:        number;
  is_complete:   boolean;
  submissions:   SubmissionStatus[];
}

// ── Actions ────────────────────────────────────────────────────────────────

/**
 * Submit a batch of student answer sheets for AI grading.
 * Returns immediately with batchId + submissionIds.
 * Poll getBatchGradingStatus every 3s to track progress.
 */
export async function startBatchGrading(
  assessmentId: string,
  formData: FormData,
): Promise<ServerActionResponse<BatchGradingResult>> {
  return fetcher<BatchGradingResult>(
    `/grading/assessments/${assessmentId}/grade-batch`,
    { method: 'POST', body: formData },
  );
}

/**
 * Poll grading progress for all submissions under an assessment.
 * Called every 3s by the BatchGradingDialog after submission.
 * Stop polling when is_complete === true.
 */
export async function getBatchGradingStatus(
  assessmentId: string,
): Promise<ServerActionResponse<BatchStatusResult>> {
  return fetcher<BatchStatusResult>(
    `/grading/assessments/${assessmentId}/submissions/status`,
    { cache: 'no-store' },
  );
}