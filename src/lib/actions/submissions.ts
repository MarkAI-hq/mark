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
