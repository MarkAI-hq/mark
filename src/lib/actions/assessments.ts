// src/lib/actions/assessments.ts
'use server'

import { revalidatePath } from 'next/cache'
import { fetcher } from '@/lib/fetch'
import type { ServerActionResponse } from '@/lib/types'

export interface Assessment {
  assessment_id: string;
  title: string;
  description: string | null;
  subject: string;
  is_published: boolean;
  assessment_type: 'MANUAL' | 'AI_ASSISTED_GRADING';
  structure_type: 'DATABASE' | 'MARKING_SCHEME_PDF' | null;
  marking_scheme_url: string | null;
  created_by: string;
  createdAt: string;
  updatedAt: string;
  classId: string;
  className: string;
  id: string;
}

function handleMutationResponse<T>(response: ServerActionResponse<T>): T {
  if (response.error) {
    throw new Error(response.error.message);
  }
  if (response.data === null || response.data === undefined) {
    throw new Error('API returned success but no data was received.');
  }
  return response.data;
}

export async function getAssessment(
  id: string,
): Promise<ServerActionResponse<Assessment>> {
  return await fetcher<Assessment>(`/assessments/${id}`, {
    cache: 'no-store',
  });
}

export async function getAssessments(): Promise<ServerActionResponse<Assessment[]>> {
  return await fetcher<Assessment[]>('/assessments', {
    cache: 'no-store',
  });
}

export async function createAssessment(
  formData: FormData,
): Promise<ServerActionResponse<Assessment>> {
  try {
    const response = await fetcher<Assessment>('/assessments/unstructured', {
      method: 'POST',
      body: formData,
    });

    const newAssessment = handleMutationResponse(response);
    revalidatePath('/dashboard/exams');
    return { data: newAssessment, error: null };
  } catch (err) {
    const message =
      err instanceof Error
        ? err.message
        : 'An unknown error occurred while creating the assessment.';
    return { data: null, error: { message } };
  }
}

// --- NEW SERVER ACTION ---
export async function deleteAssessment(
  id: string,
): Promise<ServerActionResponse<{ message: string }>> {
  try {
    const response = await fetcher<{ message: string }>(`/assessments/${id}`, {
      method: 'DELETE',
    });

    const deleteMessage = handleMutationResponse(response);
    revalidatePath('/dashboard/exams');
    return { data: deleteMessage, error: null };
  } catch (err) {
    const message =
      err instanceof Error
        ? err.message
        : 'An unknown error occurred while deleting the assessment.';
    return { data: null, error: { message } };
  }
}
