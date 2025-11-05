// src/lib/actions/student-details.ts
'use server'

import { fetcher } from '@/lib/fetch'
import type { ServerActionResponse } from '@/lib/types'

// --- TYPE DEFINITIONS FOR STUDENT DETAIL DATA ---

// Represents a student's cognitive profile history entry
export type StudentCognitiveProfile = {
  student_profile_id: string;
  student_id: string;
  assessment_id: string;
  primary_profile_id: string;
  profile_scores: Record<string, number> | null;
  mental_energy_score: number | null;
  learning_strategy_score: number | null;
  assessment_date: string | null;
  assessed_by: string | null;
  is_current: boolean;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

// Represents a student's submission for an assessment
export type StudentSubmission = {
  submission_id: string;
  assessment_id: string;
  student_id: string;
  status: 'Pending' | 'Submitted' | 'Graded';
  total_score: number | null;
  max_score: number | null;
  submitted_at: string | null;
  graded_at: string | null;
  createdAt: string;
  updatedAt: string;
  assessment_title: string | null; // Joined from the assessments table
};

// Represents a class a student is enrolled in
export type StudentEnrollment = {
  enrollment_id: string;
  class_id: string;
  class_name: string;
  class_description: string | null;
  enrollment_date: string;
  status: 'active' | 'dropped' | 'completed';
};


// --- SERVER ACTIONS ---

/**
 * Fetches the cognitive profile history for a specific student.
 * @param studentId The UUID of the student.
 * @returns A promise that resolves to the server action response containing the profile history.
 */
export async function getStudentCognitiveProfiles(
  studentId: string,
): Promise<ServerActionResponse<StudentCognitiveProfile[]>> {
  return await fetcher<StudentCognitiveProfile[]>(
    `/students/${studentId}/cognitive-profile`,
    {
      cache: 'no-store',
    },
  );
}

/**
 * Fetches all assessment submissions for a specific student.
 * @param studentId The UUID of the student.
 * @returns A promise that resolves to the server action response containing the submissions.
 */
export async function getStudentSubmissions(
  studentId: string,
): Promise<ServerActionResponse<StudentSubmission[]>> {
  return await fetcher<StudentSubmission[]>(
    `/submissions/student/${studentId}`,
    {
      cache: 'no-store',
    },
  );
}

/**
 * Fetches all class enrollments for a specific student.
 * @param studentId The UUID of the student.
 * @returns A promise that resolves to the server action response containing the enrollments.
 */
export async function getStudentEnrollments(
  studentId: string,
): Promise<ServerActionResponse<StudentEnrollment[]>> {
  return await fetcher<StudentEnrollment[]>(
    `/enrollments/students/${studentId}/classes`,
    {
      cache: 'no-store',
    },
  );
}
