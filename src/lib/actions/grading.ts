// src/lib/actions/grading.ts
'use server'

import { revalidatePath } from 'next/cache'
import { fetcher } from '@/lib/fetch' // Uses your existing configured fetcher
import { ServerActionResponse } from '@/lib/types'

// This type defines the expected successful response from our NestJS endpoint.
interface BatchGradingResponse {
  message: string;
  batchId: string;
  assessmentId: string;
  submissionIds: string[];
  submissionCount: number;
}

/**
 * Initiates the asynchronous batch grading process for an assessment.
 * This action sends a multipart/form-data request to the backend.
 *
 * @param assessmentId The ID of the assessment to be graded.
 * @param formData The FormData object containing the files and the submissions JSON string.
 * @returns A promise that resolves to the server action response.
 */
export async function startBatchGrading(
  assessmentId: string,
  formData: FormData,
): Promise<ServerActionResponse<BatchGradingResponse>> {
  try {
    // The fetcher function should automatically handle sending the auth cookies.
    // We pass the FormData directly as the body.
    const response = await fetcher<BatchGradingResponse>(
      `/grading/assessments/${assessmentId}/grade-batch`,
      {
        method: 'POST',
        // IMPORTANT: Do NOT set the 'Content-Type' header.
        // The browser will automatically set it to 'multipart/form-data'
        // with the correct boundary when a FormData object is used as the body.
        body: formData,
      },
    );

    if (response.error) {
      // If the fetcher returns a structured error, we throw it to be caught below.
      throw new Error(response.error.message);
    }

    if (!response.data) {
      throw new Error('API returned success but no data was received.');
    }

    // On success, revalidate the path for the assessment's grading page.
    // This will allow the frontend to fetch the new 'PENDING' statuses.
    revalidatePath(`/dashboard/assessments/${assessmentId}/grading`);

    return { data: response.data, error: null };
  } catch (err) {
    // This follows the error handling pattern in your auth.ts file.
    const message =
      err instanceof Error
        ? err.message
        : 'An unknown error occurred during the batch grading request.';
    return { data: null, error: { message } };
  }
}
