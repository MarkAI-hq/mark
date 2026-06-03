'use server'

import { cookies } from 'next/headers'
import { ServerActionResponse } from '@/lib/types'

interface CognitiveReportPayload {
  studentName: string
  className: string
  scores: {
    mentalEnergy: number
    learningStrategy: number
  }
  profile: {
    name: string
    description: string
  }
  selectedTools?: string[]
}

export async function generateCognitiveReport(
  payload: CognitiveReportPayload,
): Promise<ServerActionResponse<Blob>> {
  const token = (await cookies()).get('token')?.value

  if (!process.env.API_BASE_URL) {
    return {
      data: null,
      error: { message: 'API_BASE_URL is not defined' },
    }
  }

  try {
    const response = await fetch(
      `${process.env.API_BASE_URL}/api/v1/reports/cognitive-profile`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` }),
        },
        body: JSON.stringify(payload),
      },
    )

    if (!response.ok) {
      let message = 'Failed to generate PDF'
      try {
        const err = await response.json()
        message = err.message ?? message
      } catch {
        // non-json error (pdf or html)
      }
      return { data: null, error: { message } }
    }

    const blob = await response.blob()
    return { data: blob, error: null }
  } catch (err) {
    return {
      data: null,
      error: {
        message:
          err instanceof Error
            ? err.message
            : 'Unable to connect to API',
      },
    }
  }
}

