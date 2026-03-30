// src/lib/actions/student-details.ts
'use server'

import { fetcher } from '@/lib/fetch'
import type { ServerActionResponse } from '@/lib/types'

export type StudentCognitiveProfile = {
  student_profile_id:    string
  student_id:            string
  assessment_id:         string
  primary_profile_id:    string
  profile_scores:        Record<string, number> | null
  mental_energy_score:   number | null
  learning_strategy_score: number | null
  assessment_date:       string | null
  assessed_by:           string | null
  is_current:            boolean
  notes:                 string | null
  createdAt:             string
  updatedAt:             string
  profile_name?:         string
  profile_description?:  string
  profile_focus?:        string
}

export type StudentSubmission = {
  submission_id:    string
  assessment_id:    string
  student_id:       string
  // Backend sends grading_status: 'COMPLETED' | 'PENDING' | 'PROCESSING' | 'FAILED'
  grading_status:   string
  total_score:      number | null
  max_score:        number | null
  submitted_at:     string | null
  graded_at:        string | null
  createdAt:        string
  updatedAt:        string
  assessment_title: string | null
}

export type StudentEnrollment = {
  enrollment_id:     string
  class_id:          string
  class_name:        string
  class_description: string | null
  enrollment_date:   string
  status:            'active' | 'dropped' | 'completed'
}

export async function getStudentCognitiveProfiles(
  studentId: string,
): Promise<ServerActionResponse<StudentCognitiveProfile[]>> {
  return fetcher<StudentCognitiveProfile[]>(
    `/cognitive/students/${studentId}/cognitive-profile`,
    { cache: 'no-store', next: { tags: [`cognitive-profile-${studentId}`] } },
  )
}

export async function getStudentSubmissions(
  studentId: string,
): Promise<ServerActionResponse<StudentSubmission[]>> {
  return fetcher<StudentSubmission[]>(
    `/submissions/student/${studentId}`,
    { cache: 'no-store', next: { tags: [`submissions-${studentId}`] } },
  )
}

export async function getStudentEnrollments(
  studentId: string,
): Promise<ServerActionResponse<StudentEnrollment[]>> {
  return fetcher<StudentEnrollment[]>(
    `/enrollments/students/${studentId}/classes`,
    { cache: 'no-store' },
  )
}