// src/lib/actions/reports.ts
'use server'

import { cookies } from 'next/headers';
import { ServerActionResponse } from '@/lib/types';

interface CognitiveReportPayload {
  studentName: string;
  className: string;
  scores: {
    mentalEnergy: number;
    learningStrategy: number;
  };
  profile: {
    name: string;
    description: string;
  };
  selectedTools?: string[];
}

export async function generateCognitiveReport(
  payload: CognitiveReportPayload
): Promise<ServerActionResponse<Blob>> {
  const token = (await cookies()).get('token')?.value;

  try {
    const response = await fetch(
      process.env.NEXT_PUBLIC_API_URL + '/reports/cognitive-profile',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      let errorMessage = 'Failed to generate PDF.';
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch { // FIX: Removed the unused 'e' variable
        // Ignore if the response is not JSON
      }
      throw new Error(errorMessage);
    }

    const blob = await response.blob();
    return { data: blob, error: null };

  } catch (err) {
    const message = err instanceof Error ? err.message : 'An unknown error occurred';
    return { data: null, error: { message } };
  }
}
