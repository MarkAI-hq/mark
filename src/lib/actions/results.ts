// src/lib/actions/results.ts
'use server'

import { fetcher } from '@/lib/fetch'
import type { ServerActionResponse } from '@/lib/types'

// --- TYPE DEFINITIONS FOR DETAILED SUBMISSION RESULTS ---

// Represents a single, detailed response to a question within a submission.
export interface SubmissionResponse {
  response_id: string;
  submission_id: string;
  question_id: string;
  student_answer: string;
  points_earned: number | null;
  is_correct: boolean | null;
  blooms_level_achieved: string | null; // UUID of the Bloom's level
  identified_errors: string[] | null; // Array of error_type UUIDs
  content_feedback: string | null;
  cognitive_feedback: string | null;
  teacher_feedback: string | null;
}

// FIXED: Define a strong type for the follow-up assignments.
// This is based on the TFollowUpAssignments type from your old schema.
export interface FollowUpAssignment {
  number: number;
  question: string;
}

// Represents the complete, detailed results for a single student submission.
export interface SubmissionResult {
  // Core submission data
  submission_id: string;
  assessment_id: string;
  student_id: string;
  submitted_at: string | null;
  total_score: number | null;
  max_score: number | null;
  graded_at: string | null;
  
  // AI Grading specific fields
  grading_status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | null;
  original_submission_url: string | null; // This will be the presigned URL for the student's script
  overall_feedback: string | null;
  // FIXED: Use the strong type instead of 'any'. This resolves the ESLint error.
  follow_up_assignments: FollowUpAssignment[] | null;

  // The detailed, per-question responses
  responses: SubmissionResponse[];
}


/**
 * Fetches the detailed results for a single student submission, including all
 * per-question analysis and feedback.
 *
 * @param submissionId The UUID of the student submission.
 * @returns A promise that resolves to the server action response containing the detailed results.
 */
export async function getSubmissionResults(
  submissionId: string,
): Promise<ServerActionResponse<SubmissionResult>> {
  return await fetcher<SubmissionResult>(`/submissions/${submissionId}/details`, {
    cache: 'no-store',
  });
}
