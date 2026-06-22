// src/lib/actions/results.ts
'use server'

import { fetcher } from '@/lib/fetch'
import type { ServerActionResponse, Citation } from '@/lib/types'

// --- TYPE DEFINITIONS FOR DETAILED SUBMISSION RESULTS ---

export interface SubmissionResponse {
  response_id:           string;
  submission_id:         string;
  question_id:           string;
  student_answer:        string;
  points_earned:         number | null;
  is_correct:            boolean | null;
  blooms_level_achieved: string | null;
  identified_errors:     string[] | null;
  content_feedback:      string | null;
  cognitive_feedback:    string | null;
  teacher_feedback:      string | null;
  sources_consulted:     Citation[] | null;
}

export interface FollowUpAssignment {
  number:   number;
  question: string;
}

export interface SubmissionResult {
  // Core submission data
  submission_id: string;
  assessment_id: string;
  student_id:    string;
  submitted_at:  string | null;
  total_score:   number | null;
  max_score:     number | null;
  graded_at:     string | null;
  cognitive_profile: string | null;

  // AI Grading fields
  grading_status:          'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | null;
  original_submission_url: string | null;  // presigned URL for original script
  annotated_script_url:    string | null;  // presigned URL for marked script — null until annotation completes
  overall_feedback:        string | null;
  follow_up_assignments:   FollowUpAssignment[] | null;

  // Per-question responses
  responses: SubmissionResponse[];
}

/**
 * Fetches the detailed results for a single student submission, including all
 * per-question analysis and feedback.
 */
export async function getSubmissionResults(
  submissionId: string,
): Promise<ServerActionResponse<SubmissionResult>> {
  return await fetcher<SubmissionResult>(`/submissions/${submissionId}/details`, {
    cache: 'no-store',
  });
}