'use server'

import { revalidatePath } from 'next/cache'
import { fetcher } from '@/lib/fetch'
import type { ServerActionResponse, ErrorType, BloomLevel } from '@/lib/types'

export interface AssessmentQuestion {
  id: string;
  section_id: string;
  text: string;
  order: number;
  options: { a: string; b: string; c: string; d: string; };
  points: { a: number; b: number; c: number; d: number; };
}

export interface AssessmentSection {
  id: string;
  assessment_id: string;
  title: string;
  description: string | null;
  order: number;
  questions: AssessmentQuestion[];
}

export interface LearningTool {
  id: string;
  name: string;
  description: string;
  how_to: string | null; 
}

// FIX: Explicitly exported to resolve TS2305 error in the frontend component
export interface CognitiveProfile {
  profile_id: string;
  profile_name: string;
  description: string | null;
  focus: string | null;
}

export interface StudentCognitiveProfile {
  student_profile_id: string;
  student_id: string;
  assessment_id: string;
  primary_profile_id: string;
  mental_energy_score: number;
  learning_strategy_score: number;
  assessment_date: string;
  is_current: boolean;
  notes: string | null;
  // Metadata from JOIN
  profile_name: string;
  profile_description: string;
  profile_focus: string;
  // Nested tools from the "Deep Fetch"
  tools: LearningTool[]; 
}

export interface CognitiveAssessmentStructure {
  assessment: {
    id: string;
    title: string;
    sections: AssessmentSection[];
  };
  profiles: CognitiveProfile[]; 
  tools: LearningTool[];
  profileToolLinks: { profile_id: string; tool_id: string }[];
}

export interface CognitiveAssessmentPayload {
  student_id: string;
  assessment_id: string;
  profile_scores: Record<number, 'a' | 'b' | 'c' | 'd'>;
  mental_energy_score: number;
  learning_strategy_score: number;
  notes?: string;
}

function handleMutationResponse<T>(response: ServerActionResponse<T>): T {
  if (response.error) throw new Error(response.error.message);
  if (response.data === null || response.data === undefined) throw new Error('API returned success but no data was received.');
  return response.data;
}

export async function getCognitiveAssessment(): Promise<ServerActionResponse<CognitiveAssessmentStructure>> {
  return await fetcher<CognitiveAssessmentStructure>('/cognitive/assessment/compass', {
    cache: 'no-store',
  });
}

/**
 * Saves the assessment and revalidates the specific student class path
 * FIX: Ensure this signature matches the call in your components
 */
export async function saveCognitiveAssessment(
  payload: CognitiveAssessmentPayload,
  classId: string, 
): Promise<StudentCognitiveProfile> {
  const response = await fetcher<StudentCognitiveProfile>('/cognitive/cognitive-profiles/assess', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  const savedProfile = handleMutationResponse(response);
  
  // Revalidate the student's dashboard to reflect the new profile immediately
  revalidatePath(`/dashboard/classes/${classId}/students/${payload.student_id}`);
  
  return savedProfile;
}

export async function getStudentCognitiveProfile(
  studentId: string
): Promise<ServerActionResponse<StudentCognitiveProfile[]>> {
  return await fetcher<StudentCognitiveProfile[]>(
    `/cognitive/students/${studentId}/cognitive-profile`,
    { cache: 'no-store' },
  )
}

export async function getBloomsTaxonomy(): Promise<ServerActionResponse<BloomLevel[]>> {
  return await fetcher<BloomLevel[]>('/cognitive/lookups/blooms-levels', {
    cache: 'force-cache',
  });
}

export async function getErrorTaxonomy(): Promise<ServerActionResponse<ErrorType[]>> {
  return await fetcher<ErrorType[]>('/cognitive/error-taxonomy', {
    cache: 'force-cache',
  });
}