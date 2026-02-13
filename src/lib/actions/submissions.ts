'use server'

import { fetcher } from '@/lib/fetch'
import type { ServerActionResponse } from '@/lib/types'

export interface AssessmentSubmission {
  submission_id: string;
  student_id: string;
  grading_status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | null;
  total_score: number | null;
  student_name: string;
}

/**
 * Fetches all student submissions for a specific assessment.
 * @param assessmentId The UUID of the assessment.
 */
export async function getSubmissionsForAssessment(
  assessmentId: string,
): Promise<ServerActionResponse<AssessmentSubmission[]>> {
  return await fetcher<AssessmentSubmission[]>(`/submissions/assessment/${assessmentId}`, {
    cache: 'no-store',
  });
}

// ===== NEW: Submission Detail Types and Function =====

export interface SubmissionAnswer {
  question_id: string
  question_text: string
  question_number: number
  student_answer: string | null
  correct_answer: string
  points_awarded: number | null
  max_points: number
  feedback: string | null
  is_correct: boolean
}

export interface SubmissionDetail {
  submission_id: string
  assessment_id: string
  assessment_title: string
  student_id: string
  student_name: string
  status: 'Not Started' | 'Submitted' | 'Graded'
  total_score: number | null
  max_score: number
  submitted_at: string | null
  graded_at: string | null
  answers: SubmissionAnswer[]
}

/**
 * Fetches detailed information about a specific submission.
 * @param submissionId The UUID of the submission.
 */
export async function getSubmissionDetail(
  submissionId: string
): Promise<ServerActionResponse<SubmissionDetail>> {
  return await fetcher<SubmissionDetail>(`/submissions/${submissionId}`, {
    cache: 'no-store',
  })
}