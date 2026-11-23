'use server'

import { fetcher } from '@/lib/fetch'
import type { ServerActionResponse } from '@/lib/types'

export interface AssessmentSubmission {
  submission_id:   string;
  student_id:      string;
  student_name:    string;
  grading_status:  'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | null;
  total_score:     number | null;
  created_at:      string;        // used to sort multiple attempts per student
  error_message:   string | null; // populated by grading service on FAILED
}

/**
 * Fetches all student submissions for a specific assessment.
 */
export async function getSubmissionsForAssessment(
  assessmentId: string,
): Promise<ServerActionResponse<AssessmentSubmission[]>> {
  return await fetcher<AssessmentSubmission[]>(`/submissions/assessment/${assessmentId}`, {
    cache: 'no-store',
  });
}

/**
 * Retries a failed submission — resumes from cached progress
 * rather than starting the grading job from scratch.
 */
export async function retrySubmission(
  submissionId: string,
): Promise<ServerActionResponse<{ submissionId: string; status: string }>> {
  return await fetcher(`/submissions/${submissionId}/retry`, {
    method: 'POST',
  })
}

// ===== Submission Detail =====

export interface SubmissionAnswer {
  question_id:     string
  question_text:   string
  question_number: number
  student_answer:  string | null
  correct_answer:  string
  points_awarded:  number | null
  max_points:      number
  feedback:        string | null
  is_correct:      boolean
}

export interface SubmissionDetail {
  submission_id:    string
  assessment_id:    string
  assessment_title: string
  student_id:       string
  student_name:     string
  status:           'Not Started' | 'Submitted' | 'Graded'
  total_score:      number | null
  max_score:        number
  submitted_at:     string | null
  graded_at:        string | null
  answers:          SubmissionAnswer[]
}

export async function getSubmissionDetail(
  submissionId: string
): Promise<ServerActionResponse<SubmissionDetail>> {
  return await fetcher<SubmissionDetail>(`/submissions/${submissionId}`, {
    cache: 'no-store',
  })
}
// ===== Timed attempts (Focus Mode v1, spec §6) =====
// The server owns the clock: it sets deadline_at when a Pending attempt is
// created for an assessment with duration_minutes, returns the same attempt
// on reload, and refuses writes with 403 DEADLINE_PASSED after deadline + 60 s.

export interface TimedSubmission {
  submission_id: string
  assessment_id: string
  status:        'Pending' | 'Submitted' | 'Graded'
  started_at:    string | null
  deadline_at:   string | null
  submitted_at:  string | null
  server_now:    string
}

export async function startOrResumeAttempt(
  assessmentId: string,
): Promise<ServerActionResponse<TimedSubmission>> {
  return await fetcher<TimedSubmission>('/submissions', {
    method: 'POST',
    body:   JSON.stringify({ assessment_id: assessmentId }),
    cache:  'no-store',
  })
}

export async function saveAttemptResponse(
  submissionId: string,
  questionId: string,
  answer: string,
): Promise<ServerActionResponse<{ response_id: string }>> {
  return await fetcher(`/submissions/${submissionId}/responses`, {
    method: 'POST',
    body:   JSON.stringify({ question_id: questionId, student_answer: answer }),
    cache:  'no-store',
  })
}

export async function submitAttempt(
  submissionId: string,
): Promise<ServerActionResponse<TimedSubmission>> {
  return await fetcher<TimedSubmission>(`/submissions/${submissionId}/submit`, {
    method: 'POST',
    cache:  'no-store',
  })
}
